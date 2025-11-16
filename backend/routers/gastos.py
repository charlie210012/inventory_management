from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from models import User, Gasto
from schemas import GastoResponse, GastoCreate, GastoUpdate
from auth import can_view_inventory, can_manage_expenses

router = APIRouter()

@router.get("/", response_model=List[GastoResponse])
def list_gastos(
    skip: int = 0,
    limit: int = 100,
    categoria: str = None,
    current_user: User = Depends(can_view_inventory),
    db: Session = Depends(get_db)
):
    """Listar todos los gastos de producción"""
    query = db.query(Gasto)
    
    if categoria:
        query = query.filter(Gasto.categoria == categoria)
    
    gastos = query.offset(skip).limit(limit).all()
    return gastos

@router.get("/{gasto_id}", response_model=GastoResponse)
def get_gasto(
    gasto_id: int,
    current_user: User = Depends(can_view_inventory),
    db: Session = Depends(get_db)
):
    """Obtener un gasto por ID"""
    gasto = db.query(Gasto).filter(Gasto.id == gasto_id).first()
    if not gasto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gasto no encontrado"
        )
    return gasto

@router.post("/", response_model=GastoResponse, status_code=status.HTTP_201_CREATED)
def create_gasto(
    gasto: GastoCreate,
    current_user: User = Depends(can_manage_expenses),
    db: Session = Depends(get_db)
):
    """Crear un nuevo gasto de producción"""
    db_gasto = Gasto(**gasto.model_dump(), created_by=current_user.id)
    db.add(db_gasto)
    db.commit()
    db.refresh(db_gasto)
    return db_gasto

@router.put("/{gasto_id}", response_model=GastoResponse)
def update_gasto(
    gasto_id: int,
    gasto_update: GastoUpdate,
    current_user: User = Depends(can_manage_expenses),
    db: Session = Depends(get_db)
):
    """Actualizar un gasto"""
    gasto = db.query(Gasto).filter(Gasto.id == gasto_id).first()
    if not gasto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gasto no encontrado"
        )
    
    update_data = gasto_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(gasto, field, value)
    
    db.commit()
    db.refresh(gasto)
    return gasto

@router.delete("/{gasto_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gasto(
    gasto_id: int,
    current_user: User = Depends(can_manage_expenses),
    db: Session = Depends(get_db)
):
    """Eliminar un gasto"""
    gasto = db.query(Gasto).filter(Gasto.id == gasto_id).first()
    if not gasto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gasto no encontrado"
        )
    
    db.delete(gasto)
    db.commit()
    return None

@router.get("/reportes/por-categoria", response_model=dict)
def reporte_por_categoria(
    fecha_inicio: datetime = None,
    fecha_fin: datetime = None,
    current_user: User = Depends(can_view_inventory),
    db: Session = Depends(get_db)
):
    """Obtener reporte de gastos agrupados por categoría"""
    query = db.query(Gasto)
    
    if fecha_inicio:
        query = query.filter(Gasto.fecha_gasto >= fecha_inicio)
    if fecha_fin:
        query = query.filter(Gasto.fecha_gasto <= fecha_fin)
    
    gastos = query.all()
    
    # Agrupar por categoría
    reporte = {}
    for gasto in gastos:
        if gasto.categoria not in reporte:
            reporte[gasto.categoria] = {
                "total": 0,
                "cantidad": 0,
                "gastos": []
            }
        reporte[gasto.categoria]["total"] += gasto.monto
        reporte[gasto.categoria]["cantidad"] += 1
        reporte[gasto.categoria]["gastos"].append({
            "id": gasto.id,
            "concepto": gasto.concepto,
            "monto": gasto.monto,
            "fecha": gasto.fecha_gasto
        })
    
    return reporte
