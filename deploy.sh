#!/bin/bash

# Script de despliegue para el sistema de inventario
# Ejecutar en el servidor: bash deploy.sh

echo "🚀 Iniciando despliegue del sistema de inventario..."

# Navegar al directorio del proyecto
cd /root/apps/inventario

echo "🧹 Limpiando contenedores anteriores (si existen)..."
docker-compose down 2>/dev/null || true

echo "📦 Construyendo imágenes Docker..."
docker-compose build --no-cache

echo "🔄 Iniciando contenedores..."
docker-compose up -d

echo "⏳ Esperando a que los servicios estén listos..."
sleep 15

echo ""
echo "📊 Estado de los contenedores:"
docker-compose ps

echo ""
echo "📋 Logs del backend (últimas 10 líneas):"
docker-compose logs backend --tail 10

echo ""
echo "✅ Despliegue completado!"
echo ""
echo "🌐 URLs de acceso:"
echo "   - Frontend: http://72.60.116.133:3003"
echo "   - Backend API: http://72.60.116.133:8002"
echo "   - Documentación: http://72.60.116.133:8002/docs"
echo ""
echo "👥 Usuarios disponibles:"
echo "   - admin / admin123 (Gerente)"
echo "   - jefe_planta / jefe123 (Jefe de Planta)"
echo "   - director / director123 (Director Técnico)"
echo "   - operario / operario123 (Operario)"
echo ""
echo "📝 Para verificar logs:"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f frontend"
echo ""
echo "🔄 Para reiniciar:"
echo "   docker-compose restart"

