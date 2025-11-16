from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, MateriaPrima, MovimientoMateriaPrima
from schemas import (
    MateriaPrimaResponse, 
    MateriaPrimaCreate, 
    MateriaPrimaUpdate,
    MovimientoMateriaPrimaCreate,
    MovimientoMateriaPrimaResponse
)
from auth import can_view_inventory, can_modify_inventory

router = APIRouter()

@router.get("/", response_model=List[MateriaPrimaResponse])
def list_materias_primas(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(can_view_inventory),
    db: Session = Depends(get_db)
):
    """Listar todas las materias primas"""
    materias = db.query(MateriaPrima).offset(skip).limit(limit).all()
    return materias

@router.get("/{materia_id}", response_model=MateriaPrimaResponse)
def get_materia_prima(
    materia_id: int,
    current_user: User = Depends(can_view_inventory),
    db: Session = Depends(get_db)
):
    """Obtener una materia prima por ID"""
    materia = db.query(MateriaPrima).filter(MateriaPrima.id == materia_id).first()
    if not materia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Materia prima no encontrada"
        )
    return materia

@router.post("/", response_model=MateriaPrimaResponse, status_code=status.HTTP_201_CREATED)
def create_materia_prima(
    materia: MateriaPrimaCreate,
    current_user: User = Depends(can_modify_inventory),
    db: Session = Depends(get_db)
):
    """Crear una nueva materia prima"""
    db_materia = MateriaPrima(**materia.model_dump(), created_by=current_user.id)
    db.add(db_materia)
    db.commit()
    db.refresh(db_materia)
    return db_materia

@router.put("/{materia_id}", response_model=MateriaPrimaResponse)
def update_materia_prima(
    materia_id: int,
    materia_update: MateriaPrimaUpdate,
    current_user: User = Depends(can_modify_inventory),
    db: Session = Depends(get_db)
):
    """Actualizar una materia prima"""
    materia = db.query(MateriaPrima).filter(MateriaPrima.id == materia_id).first()
    if not materia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Materia prima no encontrada"
        )
    
    update_data = materia_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(materia, field, value)
    
    db.commit()
    db.refresh(materia)
    return materia

@router.delete("/{materia_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_materia_prima(
    materia_id: int,
    current_user: User = Depends(can_modify_inventory),
    db: Session = Depends(get_db)
):
    """Eliminar una materia prima"""
    materia = db.query(MateriaPrima).filter(MateriaPrima.id == materia_id).first()
    if not materia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Materia prima no encontrada"
        )
    
    db.delete(materia)
    db.commit()
    return None

@router.post("/movimientos", response_model=MovimientoMateriaPrimaResponse, status_code=status.HTTP_201_CREATED)
def create_movimiento(
    movimiento: MovimientoMateriaPrimaCreate,
    current_user: User = Depends(can_modify_inventory),
    db: Session = Depends(get_db)
):
    """Registrar un movimiento de materia prima (entrada/salida)"""
    materia = db.query(MateriaPrima).filter(MateriaPrima.id == movimiento.materia_prima_id).first()
    if not materia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Materia prima no encontrada"
        )
    
    # Actualizar cantidad según el tipo de movimiento
    if movimiento.tipo == "entrada":
        materia.cantidad_actual += movimiento.cantidad
    elif movimiento.tipo == "salida":
        if materia.cantidad_actual < movimiento.cantidad:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cantidad insuficiente en inventario"
            )
        materia.cantidad_actual -= movimiento.cantidad
    
    # Crear el registro de movimiento
    db_movimiento = MovimientoMateriaPrima(
        **movimiento.model_dump(),
        created_by=current_user.id
    )
    db.add(db_movimiento)
    db.commit()
    db.refresh(db_movimiento)
    
    return db_movimiento

@router.get("/movimientos/{materia_id}", response_model=List[MovimientoMateriaPrimaResponse])
def list_movimientos(
    materia_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(can_view_inventory),
    db: Session = Depends(get_db)
):
    """Listar movimientos de una materia prima"""
    movimientos = db.query(MovimientoMateriaPrima).filter(
        MovimientoMateriaPrima.materia_prima_id == materia_id
    ).offset(skip).limit(limit).all()
    return movimientos

@router.get("/alertas/stock-bajo", response_model=List[MateriaPrimaResponse])
def get_stock_bajo(
    current_user: User = Depends(can_view_inventory),
    db: Session = Depends(get_db)
):
    """Obtener materias primas con stock bajo"""
    materias = db.query(MateriaPrima).filter(
        MateriaPrima.cantidad_actual <= MateriaPrima.cantidad_minima
    ).all()
    return materias
