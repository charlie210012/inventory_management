# Sistema de Inventario para Producción

Sistema completo de gestión de inventario dockerizado con control de roles, diseñado para flujos de producción. Permite gestionar materias primas, gastos de producción y productos terminados con diferentes niveles de acceso.

## 🚀 Características

- **Gestión de Materias Primas**: Control de stock, alertas de nivel mínimo, movimientos de entrada/salida
- **Gastos de Producción**: Registro y categorización de gastos (mano de obra, servicios, mantenimiento, otros)
- **Productos Terminados**: Seguimiento de inventario, lotes, fechas de producción y vencimiento
- **Sistema de Roles**:
  - **Gerente**: Acceso total, gestión de usuarios
  - **Jefe de Planta**: Modificación de inventarios y visualización
  - **Director Técnico**: Gestión de gastos y modificación de inventarios
  - **Operario**: Solo visualización

## 🛠️ Tecnologías

### Backend
- Python 3.11
- FastAPI (API REST)
- SQLAlchemy (ORM)
- PostgreSQL (Base de datos)
- JWT (Autenticación)
- Pydantic (Validación)

### Frontend
- React 18
- Vite
- React Router v6
- Zustand (State Management)
- Tailwind CSS
- Axios
- Lucide Icons

### Infraestructura
- Docker
- Docker Compose
- Nginx

## 📋 Requisitos Previos

- Docker Desktop instalado
- Docker Compose
- Git (opcional)

## 🚀 Instalación y Ejecución

### 1. Clonar o descargar el proyecto

```powershell
cd c:\laragon\www\personal_projects\weed
```

### 2. Configurar variables de entorno

**Backend:**
```powershell
Copy-Item backend\.env.example backend\.env
```

**Frontend:**
```powershell
Copy-Item frontend\.env.example frontend\.env
```

### 3. Ejecutar con Docker Compose

**Modo Producción:**
```powershell
docker-compose up -d --build
```

**Modo Desarrollo:**
```powershell
docker-compose -f docker-compose.dev.yml up -d --build
```

### 4. Acceder a la aplicación

- **Frontend**: http://localhost (producción) o http://localhost:5173 (desarrollo)
- **Backend API**: http://localhost:8000
- **Documentación API**: http://localhost:8000/docs

## 👥 Usuarios de Prueba

Para comenzar a usar el sistema, primero debes crear usuarios. Puedes usar la API directamente o crear un usuario gerente inicial:

### Crear usuario gerente inicial (usar Postman o curl):

```powershell
$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    username = "admin"
    email = "admin@example.com"
    password = "admin123"
    full_name = "Administrador"
    role = "gerente"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/auth/register" -Method POST -Headers $headers -Body $body
```

### Roles disponibles:
- `gerente` - Acceso total
- `jefe_planta` - Gestión de inventarios
- `director_tecnico` - Gestión de gastos e inventarios
- `operario` - Solo lectura

## 📁 Estructura del Proyecto

```
weed/
├── backend/
│   ├── routers/
│   │   ├── auth.py              # Autenticación y registro
│   │   ├── users.py             # Gestión de usuarios
│   │   ├── materias_primas.py   # CRUD materias primas
│   │   ├── gastos.py            # CRUD gastos
│   │   └── productos_terminados.py # CRUD productos
│   ├── main.py                  # Aplicación FastAPI
│   ├── database.py              # Configuración DB
│   ├── models.py                # Modelos SQLAlchemy
│   ├── schemas.py               # Schemas Pydantic
│   ├── auth.py                  # Utilidades de autenticación
│   ├── requirements.txt         # Dependencias Python
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/              # Páginas principales
│   │   ├── components/         # Componentes reutilizables
│   │   ├── services/           # API calls
│   │   ├── store/              # Estado global
│   │   └── utils/              # Utilidades
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml           # Producción
├── docker-compose.dev.yml       # Desarrollo
└── README.md
```

## 🔐 Sistema de Permisos

### Permisos por Rol

| Acción | Gerente | Jefe Planta | Director Técnico | Operario |
|--------|---------|-------------|------------------|----------|
| Ver inventario | ✅ | ✅ | ✅ | ✅ |
| Modificar inventario | ✅ | ✅ | ✅ | ❌ |
| Gestionar gastos | ✅ | ❌ | ✅ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ | ❌ |

## 📊 Funcionalidades Principales

### Materias Primas
- Registro de materias primas con unidad de medida
- Control de stock actual vs stock mínimo
- Alertas automáticas de stock bajo
- Registro de movimientos (entradas/salidas)
- Información de proveedores y ubicación

### Gastos de Producción
- Categorización de gastos
- Vinculación a órdenes de producción
- Registro de comprobantes
- Reportes por categoría
- Historial completo

### Productos Terminados
- Código único por producto
- Control de lotes y fechas
- Precio de producción y venta
- Movimientos con destinos
- Alertas de stock bajo

## 🔧 Comandos Útiles

### Ver logs
```powershell
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend
```

### Reiniciar servicios
```powershell
docker-compose restart
```

### Detener servicios
```powershell
docker-compose down
```

### Detener y eliminar volúmenes (⚠️ elimina datos)
```powershell
docker-compose down -v
```

### Acceder al contenedor backend
```powershell
docker exec -it inventario_backend bash
```

### Acceder a la base de datos
```powershell
docker exec -it inventario_db psql -U postgres -d inventario_db
```

## 🗄️ Base de Datos

La base de datos PostgreSQL se ejecuta en un contenedor y persiste los datos en un volumen Docker. Las tablas se crean automáticamente al iniciar el backend.

### Tablas principales:
- `users` - Usuarios del sistema
- `materias_primas` - Inventario de materias primas
- `movimientos_materia_prima` - Historial de movimientos
- `gastos` - Gastos de producción
- `productos_terminados` - Inventario de productos finales
- `movimientos_productos` - Historial de movimientos de productos

## 🔄 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión

### Usuarios
- `GET /api/users/me` - Usuario actual
- `GET /api/users` - Listar usuarios (solo gerente)
- `PUT /api/users/{id}` - Actualizar usuario (solo gerente)
- `DELETE /api/users/{id}` - Eliminar usuario (solo gerente)

### Materias Primas
- `GET /api/materias-primas` - Listar
- `POST /api/materias-primas` - Crear
- `PUT /api/materias-primas/{id}` - Actualizar
- `DELETE /api/materias-primas/{id}` - Eliminar
- `POST /api/materias-primas/movimientos` - Registrar movimiento
- `GET /api/materias-primas/alertas/stock-bajo` - Stock bajo

### Gastos
- `GET /api/gastos` - Listar
- `POST /api/gastos` - Crear
- `PUT /api/gastos/{id}` - Actualizar
- `DELETE /api/gastos/{id}` - Eliminar
- `GET /api/gastos/reportes/por-categoria` - Reporte

### Productos Terminados
- `GET /api/productos-terminados` - Listar
- `POST /api/productos-terminados` - Crear
- `PUT /api/productos-terminados/{id}` - Actualizar
- `DELETE /api/productos-terminados/{id}` - Eliminar
- `POST /api/productos-terminados/movimientos` - Registrar movimiento
- `GET /api/productos-terminados/alertas/stock-bajo` - Stock bajo

## 🐛 Solución de Problemas

### Puerto 80 ocupado
Si el puerto 80 está ocupado, modifica el `docker-compose.yml`:
```yaml
frontend:
  ports:
    - "8080:80"  # Cambiar 80 por 8080
```

### Puerto 5432 ocupado (PostgreSQL)
```yaml
db:
  ports:
    - "5433:5432"  # Cambiar 5432 por 5433
```

### Reiniciar desde cero
```powershell
docker-compose down -v
docker-compose up -d --build
```

### Ver estado de contenedores
```powershell
docker ps -a
```

## 📝 Notas de Desarrollo

- El backend se recarga automáticamente al detectar cambios
- El frontend en modo dev tiene hot-reload habilitado
- Las credenciales por defecto son para desarrollo, cámbialas en producción
- Los volúmenes de Docker persisten los datos entre reinicios

## 🔒 Seguridad

Para producción, asegúrate de:
1. Cambiar `SECRET_KEY` en el backend
2. Usar contraseñas seguras para PostgreSQL
3. Configurar CORS apropiadamente
4. Usar HTTPS
5. Implementar rate limiting
6. Validar todas las entradas de usuario

## 📄 Licencia

Este proyecto es de código abierto y está disponible para uso libre.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

## 📞 Soporte

Para problemas o preguntas, abre un issue en el repositorio del proyecto.
