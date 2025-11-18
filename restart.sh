#!/bin/bash
# Script para reiniciar el sistema de inventario
cd /root/apps/inventario
echo "🔄 Iniciando contenedores..."
docker-compose up -d
echo "⏳ Esperando 10 segundos..."
sleep 10
echo "📊 Estado de los contenedores:"
docker-compose ps
echo ""
echo "✅ Sistema reiniciado"
echo "🌐 Accede en: http://72.60.116.133:3003"
