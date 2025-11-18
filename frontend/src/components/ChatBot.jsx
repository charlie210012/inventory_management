import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { token } = useAuthStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cargar historial al abrir el chat
  useEffect(() => {
    if (isOpen && messages.length === 0 && token) {
      loadChatHistory();
    }
  }, [isOpen, token]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch('/api/ai/chat/history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.history || []);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!inputValue.trim() || !token) return;

    // Agregar mensaje del usuario
    const userMessage = {
      role: 'user',
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          clear_history: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage = {
          role: 'assistant',
          content: data.response,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorData = await response.json();
        console.error('Error:', errorData);
        const errorMessage = {
          role: 'assistant',
          content: `Error: ${errorData.detail || 'Error al procesar la solicitud'}`,
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Error de conexión. Por favor intenta de nuevo.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await fetch('/api/ai/chat/clear', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setMessages([]);
    } catch (error) {
      console.error('Error al limpiar chat:', error);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
          title="Chat con IA"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl flex flex-col w-96 h-96 md:w-96 md:h-96">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <h3 className="font-semibold">Asistente de Producción</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg
                  className="w-12 h-12 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <p className="text-center text-sm">
                  ¡Hola! Soy tu asistente de IA. Pregúntame sobre:
                  <br />
                  • Tiempos de producción
                  <br />
                  • Rendimientos
                  <br />
                  • Cantidades a fabricar
                </p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-300 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4 space-y-2">
            <form onSubmit={sendMessage} className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Escribe tu pregunta..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </form>
            <button
              onClick={clearChat}
              className="w-full text-gray-600 hover:text-gray-800 text-xs py-1 transition-colors"
            >
              Limpiar chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
