# Arquitectura del Sistema de Inventario

## Visión General

Sistema de gestión de inventario basado en arquitectura de microservicios con separación clara entre frontend, backend y base de datos, todo orquestado con Docker.

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                                                          │
│  ┌──────────────┐      ┌──────────────┐   ┌─────────┐ │
│  │   Frontend   │◄────►│   Backend    │◄─►│   DB    │ │
│  │    React     │      │   FastAPI    │   │Postgres │ │
│  │    Nginx     │      │   Python     │   │         │ │
│  └──────────────┘      └──────────────┘   └─────────┘ │
│       :80                   :8000              :5432    │
└─────────────────────────────────────────────────────────┘
```

## Componentes

### 1. Frontend (React + Vite + Nginx)

**Tecnologías:**
- React 18 con hooks
- Vite como bundler
- React Router para navegación
- Zustand para estado global
- Tailwind CSS para estilos
- Nginx como servidor web en producción

**Estructura:**
```
frontend/src/
├── pages/           # Páginas principales (Dashboard, Login, etc.)
├── components/      # Componentes reutilizables (Layout)
├── services/        # Cliente API (axios)
├── store/          # Estado global (zustand)
├── utils/          # Utilidades (permisos, formatters)
└── main.jsx        # Punto de entrada
```

**Flujo de Autenticación:**
1. Usuario ingresa credenciales
2. Frontend envía POST a `/api/auth/login`
3. Backend valida y retorna JWT
4. JWT se guarda en localStorage
5. Todas las peticiones incluyen JWT en header

**Gestión de Estado:**
- `authStore`: Usuario, token, estado de autenticación
- Persistencia en localStorage
- Interceptores axios para agregar token automáticamente

### 2. Backend (FastAPI + SQLAlchemy)

**Tecnologías:**
- FastAPI (framework web asíncrono)
- SQLAlchemy (ORM)
- Pydantic (validación de datos)
- JWT (autenticación)
- PostgreSQL driver

**Estructura:**
```
backend/
├── routers/
│   ├── auth.py              # Login, registro
│   ├── users.py             # CRUD usuarios
│   ├── materias_primas.py   # CRUD materias primas
│   ├── gastos.py            # CRUD gastos
│   └── productos_terminados.py
├── models.py                # Modelos de BD (SQLAlchemy)
├── schemas.py               # Schemas de validación (Pydantic)
├── auth.py                  # Utilidades JWT y permisos
├── database.py              # Configuración BD
└── main.py                  # Aplicación principal
```

**Arquitectura por Capas:**

```
┌─────────────────────────────┐
│      Routers (API)          │  ← Endpoints HTTP
├─────────────────────────────┤
│      Schemas (Pydantic)     │  ← Validación de datos
├─────────────────────────────┤
│      Business Logic         │  ← Lógica de negocio
├─────────────────────────────┤
│      Models (SQLAlchemy)    │  ← Definición de modelos
├─────────────────────────────┤
│      Database Session       │  ← Conexión a BD
└─────────────────────────────┘
```

**Sistema de Permisos:**

```python
# Decoradores de dependencia para control de acceso
@router.get("/")
async def list_items(user: User = Depends(can_view_inventory)):
    # Solo usuarios con permiso de visualización

@router.post("/")
async def create_item(user: User = Depends(can_modify_inventory)):
    # Solo usuarios con permiso de modificación
```

**Roles y Jerarquía:**
```
Gerente (mayor privilegio)
  ├── Gestionar usuarios
  ├── Gestionar gastos
  └── Modificar inventario

Jefe de Planta
  └── Modificar inventario

Director Técnico
  ├── Gestionar gastos
  └── Modificar inventario

Operario (menor privilegio)
  └── Ver inventario (solo lectura)
```

### 3. Base de Datos (PostgreSQL)

**Esquema de Base de Datos:**

```sql
users
├── id (PK)
├── username (unique)
├── email (unique)
├── hashed_password
├── full_name
├── role (enum)
├── is_active
└── timestamps

materias_primas
├── id (PK)
├── nombre
├── descripcion
├── unidad_medida
├── cantidad_actual
├── cantidad_minima
├── precio_unitario
├── proveedor
├── ubicacion
├── created_by (FK → users)
└── timestamps

movimientos_materia_prima
├── id (PK)
├── materia_prima_id (FK)
├── tipo (entrada/salida)
├── cantidad
├── motivo
├── created_by (FK → users)
└── created_at

gastos
├── id (PK)
├── concepto
├── descripcion
├── categoria
├── monto
├── fecha_gasto
├── orden_produccion
├── comprobante
├── created_by (FK → users)
└── timestamps

productos_terminados
├── id (PK)
├── codigo (unique)
├── nombre
├── descripcion
├── unidad_medida
├── cantidad_actual
├── cantidad_minima
├── precio_produccion
├── precio_venta
├── lote
├── fecha_produccion
├── fecha_vencimiento
├── ubicacion
├── created_by (FK → users)
└── timestamps

movimientos_productos
├── id (PK)
├── producto_id (FK)
├── tipo (entrada/salida)
├── cantidad
├── motivo
├── destino
├── created_by (FK → users)
└── created_at
```

**Relaciones:**
- Usuario 1:N Materias Primas creadas
- Usuario 1:N Gastos creados
- Usuario 1:N Productos creados
- Materia Prima 1:N Movimientos
- Producto 1:N Movimientos

### 4. Docker & Orquestación

**Contenedores:**

1. **db** (postgres:15-alpine)
   - Base de datos PostgreSQL
   - Volumen persistente para datos
   - Health check para disponibilidad

2. **backend** (Python 3.11)
   - API FastAPI
   - Dependiente de db (espera health check)
   - Hot-reload en desarrollo

3. **frontend** (Node 18 → Nginx)
   - Build multi-stage
   - Nginx para servir archivos estáticos
   - Proxy reverso hacia backend

**Redes:**
- Red bridge privada `inventario_network`
- Comunicación interna entre contenedores
- Solo frontend y backend exponen puertos al host

**Volúmenes:**
- `postgres_data`: Persistencia de base de datos
- Bind mounts para hot-reload en desarrollo

## Flujos de Trabajo

### Flujo de Registro de Movimiento

```
Usuario Frontend
    │
    ├─► POST /api/materias-primas/movimientos
    │   {materia_prima_id, tipo, cantidad, motivo}
    │
    ▼
Backend API
    │
    ├─► Validar JWT (auth middleware)
    ├─► Verificar permisos (can_modify_inventory)
    ├─► Validar datos (Pydantic schema)
    │
    ▼
Business Logic
    │
    ├─► Buscar materia prima en BD
    ├─► Validar cantidad disponible (si es salida)
    ├─► Actualizar cantidad_actual
    ├─► Crear registro de movimiento
    │
    ▼
Database
    │
    ├─► UPDATE materias_primas SET cantidad_actual...
    ├─► INSERT INTO movimientos_materia_prima...
    ├─► COMMIT transacción
    │
    ▼
Respuesta
    └─► 201 Created + datos del movimiento
```

### Flujo de Alertas de Stock

```
Dashboard Mount
    │
    ├─► GET /api/materias-primas/alertas/stock-bajo
    ├─► GET /api/productos-terminados/alertas/stock-bajo
    │
    ▼
Backend Query
    │
    ├─► SELECT * FROM materias_primas 
    │   WHERE cantidad_actual <= cantidad_minima
    │
    ├─► SELECT * FROM productos_terminados
    │   WHERE cantidad_actual <= cantidad_minima
    │
    ▼
Frontend Display
    │
    └─► Renderizar tabla de alertas en Dashboard
```

## Seguridad

### Autenticación JWT

```
Componentes:
1. SECRET_KEY: Clave secreta para firmar tokens
2. ALGORITHM: HS256
3. Expiración: 30 minutos (configurable)

Token contiene:
- sub: username
- role: rol del usuario
- exp: timestamp de expiración
```

### Validación de Entrada

```
Request → Pydantic Schema → Validación → Business Logic
          ↓
    Si falla → 422 Unprocessable Entity
```

### CORS

```python
# Configuración en main.py
allow_origins = ["http://localhost:3000", "http://localhost:5173"]
allow_methods = ["*"]
allow_headers = ["*"]
allow_credentials = True
```

## Escalabilidad

### Optimizaciones Implementadas

1. **Database Indexing**
   - Índices en columnas de búsqueda frecuente
   - Username, email (unique indexes)

2. **Conexión Pool**
   - SQLAlchemy maneja pool de conexiones
   - Reuso de conexiones a PostgreSQL

3. **Async/Await**
   - FastAPI soporta operaciones asíncronas
   - Mejor manejo de concurrencia

### Posibles Mejoras

1. **Cache Layer**
   - Redis para datos frecuentes (dashboard stats)
   - Reducir carga en BD

2. **Load Balancing**
   - Múltiples instancias de backend
   - Nginx como balanceador

3. **CDN**
   - Servir assets estáticos desde CDN
   - Reducir latencia

4. **Background Jobs**
   - Celery para tareas asíncronas
   - Reportes, notificaciones por email

## Monitoreo y Logs

### Logs Actuales

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Logs específicos
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Posibles Mejoras

1. **Structured Logging**
   - JSON logs
   - Mejor parseo y búsqueda

2. **Log Aggregation**
   - ELK Stack (Elasticsearch, Logstash, Kibana)
   - Centralized logging

3. **Metrics & Monitoring**
   - Prometheus + Grafana
   - Métricas de rendimiento

4. **Error Tracking**
   - Sentry para tracking de errores
   - Alertas automáticas

## Testing

### Estrategia Recomendada

```
Backend:
├── Unit Tests (pytest)
│   ├── Test models
│   ├── Test schemas
│   └── Test business logic
│
├── Integration Tests
│   ├── Test API endpoints
│   └── Test database operations
│
└── Load Tests (locust)
    └── Test rendimiento bajo carga

Frontend:
├── Component Tests (Jest + React Testing Library)
├── Integration Tests (Cypress/Playwright)
└── E2E Tests
```

## Mantenimiento

### Backups

```bash
# Backup de base de datos
docker exec inventario_db pg_dump -U postgres inventario_db > backup.sql

# Restore
docker exec -i inventario_db psql -U postgres inventario_db < backup.sql
```

### Actualizaciones

```bash
# Actualizar dependencias Python
pip list --outdated
pip install -r requirements.txt --upgrade

# Actualizar dependencias Node
npm outdated
npm update
```

### Migraciones de BD

```bash
# Con Alembic (recomendado para producción)
alembic revision --autogenerate -m "descripción"
alembic upgrade head
```

---

**Documentación completa del sistema**. Para más detalles, revisa los archivos individuales en cada componente.
