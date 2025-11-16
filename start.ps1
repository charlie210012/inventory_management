# Script de inicio para Windows PowerShell

Write-Host "🚀 Iniciando Sistema de Inventario..." -ForegroundColor Green

# Verificar que Docker está corriendo
try {
    docker info | Out-Null
    Write-Host "✅ Docker está corriendo" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Docker no está corriendo" -ForegroundColor Red
    Write-Host "Por favor inicia Docker Desktop y vuelve a intentar" -ForegroundColor Yellow
    exit 1
}

# Verificar si existen archivos .env
if (-not (Test-Path "backend\.env")) {
    Write-Host "📝 Creando archivo backend\.env desde ejemplo..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
}

if (-not (Test-Path "frontend\.env")) {
    Write-Host "📝 Creando archivo frontend\.env desde ejemplo..." -ForegroundColor Yellow
    Copy-Item "frontend\.env.example" "frontend\.env"
}

# Preguntar modo de ejecución
Write-Host ""
Write-Host "Selecciona el modo de ejecución:" -ForegroundColor Cyan
Write-Host "1) Producción (recomendado)"
Write-Host "2) Desarrollo"
$mode = Read-Host "Opción (1 o 2)"

if ($mode -eq "2") {
    Write-Host "🔧 Iniciando en modo DESARROLLO..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml up -d --build
    Write-Host ""
    Write-Host "✅ Sistema iniciado en modo desarrollo" -ForegroundColor Green
    Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "🔧 Backend API: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "📚 Documentación API: http://localhost:8000/docs" -ForegroundColor Cyan
} else {
    Write-Host "🏭 Iniciando en modo PRODUCCIÓN..." -ForegroundColor Yellow
    docker-compose down
    docker-compose up -d --build
    Write-Host ""
    Write-Host "✅ Sistema iniciado en modo producción" -ForegroundColor Green
    Write-Host "📱 Frontend: http://localhost" -ForegroundColor Cyan
    Write-Host "🔧 Backend API: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "📚 Documentación API: http://localhost:8000/docs" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "⏳ Esperando a que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "🎉 ¡Sistema listo!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 IMPORTANTE: Crea un usuario gerente inicial usando la API:" -ForegroundColor Yellow
Write-Host "POST http://localhost:8000/api/auth/register"
Write-Host ""
Write-Host "Ejemplo con PowerShell:" -ForegroundColor Cyan
Write-Host '$headers = @{"Content-Type" = "application/json"}' -ForegroundColor Gray
Write-Host '$body = @{username="admin"; email="admin@example.com"; password="admin123"; full_name="Administrador"; role="gerente"} | ConvertTo-Json' -ForegroundColor Gray
Write-Host 'Invoke-RestMethod -Uri "http://localhost:8000/api/auth/register" -Method POST -Headers $headers -Body $body' -ForegroundColor Gray
Write-Host ""
Write-Host "Para ver los logs: docker-compose logs -f" -ForegroundColor Cyan
Write-Host "Para detener: docker-compose down" -ForegroundColor Cyan
