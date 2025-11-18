"""
Servicio de integración con Deepseek AI
Permite consultas sobre datos de producción a través de chat
"""
import os
from typing import List, Dict, Optional
import requests
from dotenv import load_dotenv

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "sk-6837a6c1b9614f39997f1617fb58cbb0")
DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

class ConversationHistory:
    """Mantiene historial de conversación para contexto"""
    def __init__(self):
        self.messages: List[Dict[str, str]] = []
    
    def add_message(self, role: str, content: str):
        """Agregar mensaje al historial"""
        self.messages.append({"role": role, "content": content})
    
    def get_messages(self) -> List[Dict[str, str]]:
        """Obtener historial de mensajes"""
        return self.messages
    
    def clear(self):
        """Limpiar historial"""
        self.messages = []

# Instancia global de historial
conversation_history = ConversationHistory()

def get_system_prompt(production_data: Optional[Dict] = None) -> str:
    """
    Genera el prompt del sistema con contexto de producción
    """
    base_prompt = """Eres un asistente inteligente especializado en gestión de producción y manufactura.
Tu rol es ayudar a los usuarios del sistema de inventario BiofarmaGreen a:

1. Analizar datos de producción (tiempos, rendimientos, cantidades)
2. Proporcionar recomendaciones sobre:
   - Tiempos de producción óptimos
   - Proyecciones de rendimiento
   - Cantidades a fabricar basado en demanda y recursos
   - Análisis de materias primas necesarias
   - Optimización de procesos

3. Responder preguntas sobre:
   - Materias primas disponibles
   - Productos terminados
   - Gastos de producción
   - Eficiencia operativa

Responde de manera clara, concisa y con datos concretos cuando sea posible.
Si necesitas más información, pregunta específicamente qué datos necesitas.
Siempre proporciona recomendaciones prácticas y ejecutables."""
    
    if production_data:
        data_context = f"\n\nContexto actual de producción:\n{production_data}"
        return base_prompt + data_context
    
    return base_prompt

async def chat_with_deepseek(
    user_message: str,
    production_data: Optional[Dict] = None,
    clear_history: bool = False
) -> str:
    """
    Envía un mensaje a Deepseek y recibe una respuesta
    
    Args:
        user_message: Mensaje del usuario
        production_data: Datos de producción para contexto
        clear_history: Si True, limpia el historial antes de procesar
    
    Returns:
        Respuesta de Deepseek
    """
    if clear_history:
        conversation_history.clear()
    
    # Agregar mensaje del usuario al historial
    conversation_history.add_message("user", user_message)
    
    # Preparar payload para Deepseek
    messages = [
        {"role": "system", "content": get_system_prompt(production_data)}
    ] + conversation_history.get_messages()
    
    payload = {
        "model": "deepseek-chat",
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 2048,
        "top_p": 1.0
    }
    
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(DEEPSEEK_API_URL, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        assistant_message = result['choices'][0]['message']['content']
        
        # Agregar respuesta al historial
        conversation_history.add_message("assistant", assistant_message)
        
        return assistant_message
    
    except requests.exceptions.RequestException as e:
        error_msg = f"Error al conectar con Deepseek: {str(e)}"
        print(error_msg)
        return error_msg
    except (KeyError, IndexError) as e:
        error_msg = f"Error al procesar respuesta de Deepseek: {str(e)}"
        print(error_msg)
        return error_msg

def clear_conversation():
    """Limpia el historial de conversación"""
    conversation_history.clear()

def get_conversation_context() -> List[Dict[str, str]]:
    """Obtiene el contexto actual de la conversación"""
    return conversation_history.get_messages()
