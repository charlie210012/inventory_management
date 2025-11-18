"""
Router para endpoints de AI/Chat con Deepseek
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from models import User, MateriaPrima, ProductoTerminado, Gasto
from deepseek_service import chat_with_deepseek, clear_conversation, get_conversation_context
from sqlalchemy import func

router = APIRouter()

class ChatMessage(BaseModel):
    """Modelo para mensajes de chat"""
    message: str
    clear_history: Optional[bool] = False

class ChatResponse(BaseModel):
    """Modelo para respuestas del chat"""
    response: str
    timestamp: str

class ProductionData(BaseModel):
    """Datos de producción para contexto"""
    total_materias_primas: int
    total_productos_terminados: int
    total_gastos: float
    promedio_precio_materias: float
    promedio_precio_productos: float

def get_production_data(db: Session) -> Optional[Dict]:
    """Obtiene datos agregados de producción del sistema"""
    try:
        # Contar materias primas
        total_mp = db.query(func.count(MateriaPrima.id)).scalar() or 0
        
        # Contar productos terminados
        total_pt = db.query(func.count(ProductoTerminado.id)).scalar() or 0
        
        # Sumar gastos totales
        total_gastos = db.query(func.sum(Gasto.cantidad)).scalar() or 0
        
        # Promedio precio materias primas
        avg_precio_mp = db.query(func.avg(MateriaPrima.precio_unitario)).scalar() or 0
        
        # Promedio precio productos terminados
        avg_precio_pt = db.query(func.avg(ProductoTerminado.precio_venta)).scalar() or 0
        
        data = {
            "total_materias_primas": total_mp,
            "total_productos_terminados": total_pt,
            "total_gastos": float(total_gastos),
            "promedio_precio_materias": float(avg_precio_mp),
            "promedio_precio_productos": float(avg_precio_pt)
        }
        
        return data
    except Exception as e:
        print(f"Error al obtener datos de producción: {e}")
        return None

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    chat_input: ChatMessage,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Endpoint para chat con Deepseek
    
    Recibe un mensaje del usuario y retorna una respuesta basada en:
    - Contexto de datos de producción del sistema
    - Historial de conversación
    - Expertise en análisis de producción
    """
    try:
        # Obtener datos de producción para contexto
        production_data = get_production_data(db)
        
        # Convertir a string para el prompt
        production_context = str(production_data) if production_data else None
        
        # Obtener respuesta de Deepseek
        response = await chat_with_deepseek(
            user_message=chat_input.message,
            production_data=production_context,
            clear_history=chat_input.clear_history
        )
        
        from datetime import datetime
        
        return ChatResponse(
            response=response,
            timestamp=datetime.utcnow().isoformat()
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar el mensaje: {str(e)}"
        )

@router.get("/chat/history")
async def get_chat_history(current_user: User = Depends(get_current_user)):
    """Obtiene el historial de conversación actual"""
    history = get_conversation_context()
    return {"history": history}

@router.post("/chat/clear")
async def clear_chat_history(current_user: User = Depends(get_current_user)):
    """Limpia el historial de conversación"""
    clear_conversation()
    return {"status": "Historial de conversación limpiado"}
