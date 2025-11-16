#!/bin/bash

echo "🚀 Iniciando Sistema de Inventario..."

# Verificar que Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está corriendo"
    echo "Por favor inicia Docker Desktop y vuelve a intentar"
    exit 1
fi

echo "✅ Docker está corriendo"

# Verificar si existen archivos .env
if [ ! -f "backend/.env" ]; then
    echo "📝 Creando archivo backend/.env desde ejemplo..."
    cp backend/.env.example backend/.env
fi

if [ ! -f "frontend/.env" ]; then
    echo "📝 Creando archivo frontend/.env desde ejemplo..."
    cp frontend/.env.example frontend/.env
fi

# Preguntar modo de ejecución
echo ""
echo "Selecciona el modo de ejecución:"
echo "1) Producción (recomendado)"
echo "2) Desarrollo"
read -p "Opción (1 o 2): " mode

if [ "$mode" = "2" ]; then
    echo "🔧 Iniciando en modo DESARROLLO..."
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml up -d --build
    echo ""
    echo "✅ Sistema iniciado en modo desarrollo"
    echo "📱 Frontend: http://localhost:5173"
    echo "🔧 Backend API: http://localhost:8000"
    echo "📚 Documentación API: http://localhost:8000/docs"
else
    echo "🏭 Iniciando en modo PRODUCCIÓN..."
    docker-compose down
    docker-compose up -d --build
    echo ""
    echo "✅ Sistema iniciado en modo producción"
    echo "📱 Frontend: http://localhost"
    echo "🔧 Backend API: http://localhost:8000"
    echo "📚 Documentación API: http://localhost:8000/docs"
fi

echo ""
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

echo ""
echo "🎉 ¡Sistema listo!"
echo ""
echo "📝 IMPORTANTE: Crea un usuario gerente inicial usando la API:"
echo "POST http://localhost:8000/api/auth/register"
echo ""
echo "Body ejemplo:"
echo '{'
echo '  "username": "admin",'
echo '  "email": "admin@example.com",'
echo '  "password": "admin123",'
echo '  "full_name": "Administrador",'
echo '  "role": "gerente"'
echo '}'
echo ""
echo "Para ver los logs: docker-compose logs -f"
echo "Para detener: docker-compose down"
