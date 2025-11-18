from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, ProductoTerminado, MovimientoProducto, MateriaPrima
from schemas import (
    ProductoTerminadoResponse, 
    ProductoTerminadoCreate, 
    ProductoTerminadoUpdate,
    MovimientoProductoCreate,
    MovimientoProductoResponse
)
from auth import can_view_inventory, can_modify_inventory

router = APIRouter()

@router.get("/", response_model=List[ProductoTerminadoResponse])
def list_productos(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(can_view_inventory),
    db: Session = Depends(get_db)
):
    """Listar todos los productos terminados"""
    productos = db.query(ProductoTerminado).offset(skip).limit(limit).all()
    return productos

@router.get("/{producto_id}", response_model=ProductoTerminadoResponse)
def get_producto(
    producto_id: int,
    current_user: User = Depends(can_view_inventory),
    db: Session = Depends(get_db)
):
    """Obtener un producto terminado por ID"""
    producto = db.query(ProductoTerminado).filter(ProductoTerminado.id == producto_id).first()
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    return producto

@router.post("/", response_model=ProductoTerminadoResponse, status_code=status.HTTP_201_CREATED)
def create_producto(
    producto: ProductoTerminadoCreate,
    current_user: User = Depends(can_modify_inventory),
    db: Session = Depends(get_db)
):
    """Crear un nuevo producto terminado"""
    # Verificar si el código ya existe
    existing = db.query(ProductoTerminado).filter(ProductoTerminado.codigo == producto.codigo).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código de producto ya existe"
        )
    
    # Preparar datos para crear el producto
    producto_data = producto.model_dump(exclude=['presentaciones', 'materiales', 'volumen_total', 'tipo_inventario'])
    
    db_producto = ProductoTerminado(**producto_data, created_by=current_user.id)
    db.add(db_producto)
    db.flush()  # Flush para obtener el ID sin hacer commit
    
    # Si es unidades, descontar materiales
    if producto.unidad_medida == 'unidades' and producto.materiales and producto.presentaciones:
        cantidad_total = sum(int(v) if v else 0 for v in producto.presentaciones.values())
        
        # Descontar envase
        if producto.materiales.get('envase'):
            envase = db.query(MateriaPrima).filter(
                MateriaPrima.codigo == producto.materiales['envase']
            ).first()
            if not envase:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Envase no encontrado"
                )
            if envase.cantidad_actual < cantidad_total:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cantidad insuficiente de envase: disponible {envase.cantidad_actual}, requerido {cantidad_total}"
                )
            envase.cantidad_actual -= cantidad_total
        
        # Descontar gotero
        if producto.materiales.get('gotero'):
            gotero = db.query(MateriaPrima).filter(
                MateriaPrima.codigo == producto.materiales['gotero']
            ).first()
            if not gotero:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Gotero no encontrado"
                )
            if gotero.cantidad_actual < cantidad_total:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cantidad insuficiente de gotero: disponible {gotero.cantidad_actual}, requerido {cantidad_total}"
                )
            gotero.cantidad_actual -= cantidad_total
        
        # Descontar caja
        if producto.materiales.get('caja'):
            caja = db.query(MateriaPrima).filter(
                MateriaPrima.codigo == producto.materiales['caja']
            ).first()
            if not caja:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Caja no encontrada"
                )
            if caja.cantidad_actual < cantidad_total:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cantidad insuficiente de caja: disponible {caja.cantidad_actual}, requerido {cantidad_total}"
                )
            caja.cantidad_actual -= cantidad_total
    
    db.commit()
    db.refresh(db_producto)
    return db_producto

@router.put("/{producto_id}", response_model=ProductoTerminadoResponse)
def update_producto(
    producto_id: int,
    producto_update: ProductoTerminadoUpdate,
    current_user: User = Depends(can_modify_inventory),
    db: Session = Depends(get_db)
):
    """Actualizar un producto terminado"""
    producto = db.query(ProductoTerminado).filter(ProductoTerminado.id == producto_id).first()
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    update_data = producto_update.model_dump(exclude_unset=True)
    
    # Verificar código único si se está actualizando
    if "codigo" in update_data:
        existing = db.query(ProductoTerminado).filter(
            ProductoTerminado.codigo == update_data["codigo"],
            ProductoTerminado.id != producto_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El código de producto ya existe"
            )
    
    for field, value in update_data.items():
        setattr(producto, field, value)
    
    db.commit()
    db.refresh(producto)
    return producto

@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_producto(
    producto_id: int,
    current_user: User = Depends(can_modify_inventory),
    db: Session = Depends(get_db)
):
    """Eliminar un producto terminado"""
    producto = db.query(ProductoTerminado).filter(ProductoTerminado.id == producto_id).first()
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    db.delete(producto)
    db.commit()
    return None

@router.post("/movimientos", response_model=MovimientoProductoResponse, status_code=status.HTTP_201_CREATED)
def create_movimiento(
    movimiento: MovimientoProductoCreate,
    current_user: User = Depends(can_modify_inventory),
    db: Session = Depends(get_db)
):
    """Registrar un movimiento de producto (entrada/salida)"""
    producto = db.query(ProductoTerminado).filter(ProductoTerminado.id == movimiento.producto_id).first()
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    # Actualizar cantidad según el tipo de movimiento
    if movimiento.tipo == "entrada":
        producto.cantidad_actual += movimiento.cantidad
    elif movimiento.tipo == "salida":
        if producto.cantidad_actual < movimiento.cantidad:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cantidad insuficiente en inventario"
            )
        producto.cantidad_actual -= movimiento.cantidad
    
    # Crear el registro de movimiento
    db_movimiento = MovimientoProducto(
        **movimiento.model_dump(),
        created_by=current_user.id
    )
    db.add(db_movimiento)
    db.commit()
    db.refresh(db_movimiento)
    
    return db_movimiento

@router.get("/movimientos/{producto_id}", response_model=List[MovimientoProductoResponse])
def list_movimientos(
    producto_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(can_view_inventory),
    db: Session = Depends(get_db)
):
    """Listar movimientos de un producto"""
    movimientos = db.query(MovimientoProducto).filter(
        MovimientoProducto.producto_id == producto_id
    ).offset(skip).limit(limit).all()
    return movimientos

@router.get("/alertas/stock-bajo", response_model=List[ProductoTerminadoResponse])
def get_stock_bajo(
    current_user: User = Depends(can_view_inventory),
    db: Session = Depends(get_db)
):
    """Obtener productos con stock bajo"""
    productos = db.query(ProductoTerminado).filter(
        ProductoTerminado.cantidad_actual <= ProductoTerminado.cantidad_minima
    ).all()
    return productos
