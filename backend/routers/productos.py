"""
Router para endpoints de Productos
Gestiona la creación, lectura, actualización y eliminación de productos
con sus relaciones a materias primas e inventarios
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, select
from typing import List
from database import get_db
from auth import get_current_user
from models import User, Producto, Inventario, MateriaPrima, producto_materia_prima, HistorialDescuentoMateriaPrima
from schemas import ProductoCreate, ProductoUpdate, ProductoResponse, InventarioResponse, RegistrarProduccionInput

router = APIRouter()

# Inicializar inventarios por defecto
def init_inventarios(db: Session):
    """Crea los tres inventarios por defecto si no existen"""
    inventarios_nombres = ["Magistral", "Droguería", "Brasil"]
    
    for nombre in inventarios_nombres:
        inv_existente = db.query(Inventario).filter(Inventario.nombre == nombre).first()
        if not inv_existente:
            nuevo_inv = Inventario(nombre=nombre, descripcion=f"Inventario {nombre}")
            db.add(nuevo_inv)
    
    db.commit()

@router.post("/products", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
def crear_producto(
    producto: ProductoCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear un nuevo producto"""
    # Verificar si ya existe un producto con el mismo código
    db_producto = db.query(Producto).filter(Producto.codigo == producto.codigo).first()
    if db_producto:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un producto con este código"
        )
    
    # Crear producto
    nuevo_producto = Producto(
        codigo=producto.codigo,
        nombre=producto.nombre,
        descripcion=producto.descripcion,
        precio_produccion=producto.precio_produccion,
        precio_venta=producto.precio_venta,
        unidad_negocio=producto.unidad_negocio,
        meses_vencimiento=producto.meses_vencimiento,
        created_by=current_user.id
    )
    
    db.add(nuevo_producto)
    db.flush()  # Flush para obtener el ID sin hacer commit
    
    # Agregar materias primas
    if producto.materias_primas:
        for mp_input in producto.materias_primas:
            mp = db.query(MateriaPrima).filter(MateriaPrima.id == mp_input.materia_prima_id).first()
            if not mp:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Materia prima con ID {mp_input.materia_prima_id} no existe"
                )
            nuevo_producto.materias_primas.append(mp)
            
            # Insertar la concentración en la tabla de asociación
            stmt = producto_materia_prima.insert().values(
                producto_id=nuevo_producto.id,
                materia_prima_id=mp.id,
                concentracion=mp_input.concentracion
            )
            db.execute(stmt)
    
    # Agregar inventarios
    if producto.inventarios:
        for inv_id in producto.inventarios:
            inv = db.query(Inventario).filter(Inventario.id == inv_id).first()
            if not inv:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Inventario con ID {inv_id} no existe"
                )
            nuevo_producto.inventarios.append(inv)
    
    db.commit()
    db.refresh(nuevo_producto)
    return nuevo_producto

@router.get("/products", response_model=List[ProductoResponse])
def listar_productos(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Listar todos los productos"""
    productos = db.query(Producto).offset(skip).limit(limit).all()
    return productos

@router.get("/products/{producto_id}", response_model=ProductoResponse)
def obtener_producto(
    producto_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener un producto específico"""
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    return producto

@router.put("/products/{producto_id}", response_model=ProductoResponse)
def actualizar_producto(
    producto_id: int,
    producto_update: ProductoUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualizar un producto existente"""
    db_producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not db_producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    # Actualizar campos básicos
    if producto_update.codigo is not None:
        # Verificar que el código no exista en otro producto
        codigo_existente = db.query(Producto).filter(
            and_(Producto.codigo == producto_update.codigo, Producto.id != producto_id)
        ).first()
        if codigo_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe otro producto con este código"
            )
        db_producto.codigo = producto_update.codigo
    
    if producto_update.nombre is not None:
        db_producto.nombre = producto_update.nombre
    if producto_update.descripcion is not None:
        db_producto.descripcion = producto_update.descripcion
    if producto_update.precio_produccion is not None:
        db_producto.precio_produccion = producto_update.precio_produccion
    if producto_update.precio_venta is not None:
        db_producto.precio_venta = producto_update.precio_venta
    if producto_update.unidad_negocio is not None:
        db_producto.unidad_negocio = producto_update.unidad_negocio
    if producto_update.meses_vencimiento is not None:
        db_producto.meses_vencimiento = producto_update.meses_vencimiento
    
    # Actualizar materias primas si se proporciona
    if producto_update.materias_primas is not None:
        # Limpiar materias primas existentes
        db.execute(
            producto_materia_prima.delete().where(
                producto_materia_prima.c.producto_id == producto_id
            )
        )
        db_producto.materias_primas.clear()
        
        # Agregar nuevas materias primas
        for mp_input in producto_update.materias_primas:
            mp = db.query(MateriaPrima).filter(MateriaPrima.id == mp_input.materia_prima_id).first()
            if not mp:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Materia prima con ID {mp_input.materia_prima_id} no existe"
                )
            db_producto.materias_primas.append(mp)
            
            # Insertar concentración
            stmt = producto_materia_prima.insert().values(
                producto_id=producto_id,
                materia_prima_id=mp.id,
                concentracion=mp_input.concentracion
            )
            db.execute(stmt)
    
    # Actualizar inventarios si se proporciona
    if producto_update.inventarios is not None:
        db_producto.inventarios.clear()
        for inv_id in producto_update.inventarios:
            inv = db.query(Inventario).filter(Inventario.id == inv_id).first()
            if not inv:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Inventario con ID {inv_id} no existe"
                )
            db_producto.inventarios.append(inv)
    
    db.commit()
    db.refresh(db_producto)
    return db_producto

@router.delete("/products/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(
    producto_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Eliminar un producto"""
    db_producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not db_producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    # Limpiar relaciones
    db.execute(
        producto_materia_prima.delete().where(
            producto_materia_prima.c.producto_id == producto_id
        )
    )
    db_producto.inventarios.clear()
    
    db.delete(db_producto)
    db.commit()

@router.get("/inventarios", response_model=List[InventarioResponse])
def listar_inventarios(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Listar todos los inventarios"""
    init_inventarios(db)
    inventarios = db.query(Inventario).all()
    return inventarios

@router.post("/products/{producto_id}/registrar-produccion", status_code=status.HTTP_200_OK)
def registrar_produccion(
    producto_id: int,
    produccion: RegistrarProduccionInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Registrar la producción de un producto y descontar materias primas del inventario
    Fórmula de descuento: concentración (%P/V) * volumen_producido * 1.05 (factor corrección 5%)
    """
    from datetime import datetime
    
    # Obtener el producto
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    # Determinar el inventario de destino basado en la unidad de negocio
    if producto.unidad_negocio == "BPE - Magistrales":
        inventario_destino = "BPE - Magistrales"
    else:  # "Droguería" o "Fabricación de derivados"
        inventario_destino = "Fabricación de derivados"
    
    # Descontar las materias primas del inventario correspondiente
    if producto.materias_primas:
        for materia in producto.materias_primas:
            # Obtener la concentración de la tabla de asociación
            stmt = select(producto_materia_prima.c.concentracion).where(
                and_(
                    producto_materia_prima.c.producto_id == producto_id,
                    producto_materia_prima.c.materia_prima_id == materia.id
                )
            )
            concentracion_result = db.execute(stmt).first()
            
            if concentracion_result:
                concentracion = concentracion_result[0]  # %P/V
                
                # Fórmula: concentración (%P/V) * volumen_producido * 1.05
                # Resultado en unidades de concentración, necesita conversión a gramos
                cantidad_a_descontar = (concentracion / 100) * produccion.cantidad * 1.05
                
                # Buscar la materia prima con el tipo de inventario correspondiente
                materia_a_descontar = db.query(MateriaPrima).filter(
                    and_(
                        MateriaPrima.nombre == materia.nombre,
                        MateriaPrima.tipo_inventario == inventario_destino
                    )
                ).first()
                
                if materia_a_descontar:
                    # Verificar que hay suficiente cantidad
                    if materia_a_descontar.cantidad_actual < cantidad_a_descontar:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Cantidad insuficiente de {materia_a_descontar.nombre} en {inventario_destino}"
                        )
                    
                    # Descontar la cantidad
                    materia_a_descontar.cantidad_actual -= cantidad_a_descontar
                    
                    # Registrar en el historial de descuentos
                    descuento = HistorialDescuentoMateriaPrima(
                        materia_prima_id=materia_a_descontar.id,
                        producto_id=producto_id,
                        producto_nombre=producto.nombre,
                        cantidad_descontada=cantidad_a_descontar,  # En gramos
                        concentracion=concentracion,  # %P/V
                        volumen_producido=produccion.cantidad,
                        unidad_volumen="mL",  # Asumiendo que es mL por defecto
                        fecha_produccion=produccion.fecha_produccion or datetime.utcnow()
                    )
                    db.add(descuento)
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Producción de {produccion.cantidad} unidades registrada exitosamente",
        "inventario_utilizado": inventario_destino
    }

