from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from models import RegistroSalida, MateriaPrima, ProductoTerminado, SalidaEnum
from schemas import RegistroSalidaCreate, RegistroSalidaResponse
from database import get_db
from auth import get_current_user
from typing import List, Optional

router = APIRouter(prefix="/api/salidas", tags=["salidas"])

MOTIVOS_VALIDOS = [
    "Venta",
    "Entrega de muestras",
    "Rechazo de control de calidad",
    "Pruebas de control de calidad"
]

@router.post("/registrar", response_model=RegistroSalidaResponse)
async def registrar_salida(
    salida: RegistroSalidaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Registrar una salida de materias primas o productos terminados"""
    
    # Validar motivo
    if salida.motivo_salida not in MOTIVOS_VALIDOS:
        raise HTTPException(status_code=400, detail="Motivo de salida inválido")
    
    # Validar tipo de item
    if salida.tipo_item not in ["materia_prima", "producto_terminado"]:
        raise HTTPException(status_code=400, detail="Tipo de item inválido")
    
    if salida.tipo_item == "materia_prima":
        # Buscar materia prima
        if not salida.materia_prima_id:
            raise HTTPException(status_code=400, detail="materia_prima_id requerido")
        
        materia_prima = db.query(MateriaPrima).filter(
            MateriaPrima.id == salida.materia_prima_id
        ).first()
        
        if not materia_prima:
            raise HTTPException(status_code=404, detail="Materia prima no encontrada")
        
        if materia_prima.lote != salida.lote:
            raise HTTPException(status_code=400, detail="Lote no coincide")
        
        if materia_prima.cantidad_actual < salida.cantidad_salida:
            raise HTTPException(status_code=400, detail="Cantidad insuficiente en inventario")
        
        # Registrar salida
        saldo_anterior = materia_prima.cantidad_actual
        materia_prima.cantidad_actual -= salida.cantidad_salida
        saldo_actual = materia_prima.cantidad_actual
        
        registro = RegistroSalida(
            tipo_item="materia_prima",
            materia_prima_id=salida.materia_prima_id,
            codigo_item=materia_prima.codigo,
            nombre_item=materia_prima.nombre,
            lote=salida.lote,
            cantidad_salida=salida.cantidad_salida,
            unidad_medida=materia_prima.unidad_medida,
            motivo_salida=salida.motivo_salida,
            saldo_anterior=saldo_anterior,
            saldo_actual=saldo_actual,
            observaciones=salida.observaciones,
            created_by=current_user.id
        )
        
    else:  # producto_terminado
        # Buscar producto terminado
        if not salida.producto_terminado_id:
            raise HTTPException(status_code=400, detail="producto_terminado_id requerido")
        
        producto_terminado = db.query(ProductoTerminado).filter(
            ProductoTerminado.id == salida.producto_terminado_id
        ).first()
        
        if not producto_terminado:
            raise HTTPException(status_code=404, detail="Producto terminado no encontrado")
        
        if producto_terminado.lote != salida.lote:
            raise HTTPException(status_code=400, detail="Lote no coincide")
        
        if producto_terminado.cantidad_actual < salida.cantidad_salida:
            raise HTTPException(status_code=400, detail="Cantidad insuficiente en inventario")
        
        # Registrar salida
        saldo_anterior = producto_terminado.cantidad_actual
        producto_terminado.cantidad_actual -= salida.cantidad_salida
        saldo_actual = producto_terminado.cantidad_actual
        
        registro = RegistroSalida(
            tipo_item="producto_terminado",
            producto_terminado_id=salida.producto_terminado_id,
            codigo_item=producto_terminado.codigo,
            nombre_item=producto_terminado.nombre,
            lote=salida.lote,
            cantidad_salida=salida.cantidad_salida,
            unidad_medida=producto_terminado.unidad_medida,
            motivo_salida=salida.motivo_salida,
            saldo_anterior=saldo_anterior,
            saldo_actual=saldo_actual,
            observaciones=salida.observaciones,
            created_by=current_user.id
        )
    
    db.add(registro)
    db.commit()
    db.refresh(registro)
    
    return registro


@router.get("/historial", response_model=List[RegistroSalidaResponse])
async def obtener_historial_salidas(
    tipo_item: Optional[str] = Query(None),
    motivo: Optional[str] = Query(None),
    fecha_inicio: Optional[str] = Query(None),
    fecha_fin: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtener historial de salidas con filtros opcionales"""
    
    query = db.query(RegistroSalida).order_by(RegistroSalida.created_at.desc())
    
    if tipo_item:
        query = query.filter(RegistroSalida.tipo_item == tipo_item)
    
    if motivo:
        query = query.filter(RegistroSalida.motivo_salida == motivo)
    
    if fecha_inicio:
        fecha_inicio_obj = datetime.fromisoformat(fecha_inicio)
        query = query.filter(RegistroSalida.created_at >= fecha_inicio_obj)
    
    if fecha_fin:
        fecha_fin_obj = datetime.fromisoformat(fecha_fin)
        query = query.filter(RegistroSalida.created_at <= fecha_fin_obj)
    
    return query.all()


@router.get("/codigo/{codigo}", response_model=dict)
async def buscar_item_por_codigo(
    codigo: str,
    tipo_item: str = Query(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Buscar materia prima o producto terminado por código"""
    
    if tipo_item == "materia_prima":
        item = db.query(MateriaPrima).filter(MateriaPrima.codigo == codigo).first()
        if not item:
            raise HTTPException(status_code=404, detail="Materia prima no encontrada")
        
        return {
            "id": item.id,
            "codigo": item.codigo,
            "nombre": item.nombre,
            "lote": item.lote,
            "cantidad_actual": item.cantidad_actual,
            "unidad_medida": item.unidad_medida,
            "tipo_item": "materia_prima"
        }
    
    elif tipo_item == "producto_terminado":
        item = db.query(ProductoTerminado).filter(ProductoTerminado.codigo == codigo).first()
        if not item:
            raise HTTPException(status_code=404, detail="Producto terminado no encontrado")
        
        return {
            "id": item.id,
            "codigo": item.codigo,
            "nombre": item.nombre,
            "lote": item.lote,
            "cantidad_actual": item.cantidad_actual,
            "unidad_medida": item.unidad_medida,
            "tipo_item": "producto_terminado"
        }
    
    else:
        raise HTTPException(status_code=400, detail="Tipo de item inválido")


@router.get("/lotes/{codigo}")
async def obtener_lotes_por_codigo(
    codigo: str,
    tipo_item: str = Query(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtener lotes disponibles para un código específico"""
    
    if tipo_item == "materia_prima":
        items = db.query(MateriaPrima).filter(
            MateriaPrima.codigo == codigo,
            MateriaPrima.cantidad_actual > 0
        ).all()
    
    elif tipo_item == "producto_terminado":
        items = db.query(ProductoTerminado).filter(
            ProductoTerminado.codigo == codigo,
            ProductoTerminado.cantidad_actual > 0
        ).all()
    
    else:
        raise HTTPException(status_code=400, detail="Tipo de item inválido")
    
    if not items:
        raise HTTPException(status_code=404, detail="No hay items disponibles")
    
    return [
        {
            "id": item.id,
            "lote": item.lote,
            "cantidad_disponible": item.cantidad_actual,
            "unidad_medida": item.unidad_medida,
            "fecha_produccion": item.fecha_produccion if hasattr(item, 'fecha_produccion') else None
        }
        for item in items
    ]


@router.get("/motivos")
async def obtener_motivos_salida(
    current_user = Depends(get_current_user)
):
    """Obtener lista de motivos de salida disponibles"""
    
    return {
        "motivos": MOTIVOS_VALIDOS
    }
