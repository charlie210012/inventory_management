# API del Sistema de Inventario

## Autenticación

Todas las rutas (excepto login y register) requieren autenticación mediante Bearer Token.

**Header requerido:**
```
Authorization: Bearer {token}
```

## Endpoints

### Autenticación

#### Registrar Usuario
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "user@example.com",
  "password": "string",
  "full_name": "string",
  "role": "gerente|operario|jefe_planta|director_tecnico"
}
```

#### Iniciar Sesión
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}

Response:
{
  "access_token": "string",
  "token_type": "bearer"
}
```

### Usuarios

#### Obtener Usuario Actual
```http
GET /api/users/me
```

#### Listar Usuarios (Solo Gerente)
```http
GET /api/users?skip=0&limit=100
```

#### Actualizar Usuario (Solo Gerente)
```http
PUT /api/users/{user_id}
Content-Type: application/json

{
  "email": "newemail@example.com",
  "full_name": "Nuevo Nombre",
  "role": "jefe_planta",
  "is_active": true
}
```

#### Eliminar Usuario (Solo Gerente)
```http
DELETE /api/users/{user_id}
```

### Materias Primas

#### Listar Materias Primas
```http
GET /api/materias-primas?skip=0&limit=100
```

#### Obtener Materia Prima
```http
GET /api/materias-primas/{id}
```

#### Crear Materia Prima
```http
POST /api/materias-primas
Content-Type: application/json

{
  "nombre": "string",
  "descripcion": "string",
  "unidad_medida": "kg",
  "cantidad_actual": 100.0,
  "cantidad_minima": 10.0,
  "precio_unitario": 50.0,
  "proveedor": "Proveedor XYZ",
  "ubicacion": "Bodega A"
}
```

#### Actualizar Materia Prima
```http
PUT /api/materias-primas/{id}
Content-Type: application/json

{
  "cantidad_actual": 150.0,
  "precio_unitario": 55.0
}
```

#### Eliminar Materia Prima
```http
DELETE /api/materias-primas/{id}
```

#### Registrar Movimiento
```http
POST /api/materias-primas/movimientos
Content-Type: application/json

{
  "materia_prima_id": 1,
  "tipo": "entrada|salida",
  "cantidad": 50.0,
  "motivo": "Descripción del movimiento"
}
```

#### Listar Movimientos
```http
GET /api/materias-primas/movimientos/{materia_prima_id}?skip=0&limit=100
```

#### Alertas de Stock Bajo
```http
GET /api/materias-primas/alertas/stock-bajo
```

### Gastos de Producción

#### Listar Gastos
```http
GET /api/gastos?skip=0&limit=100&categoria=mano_obra
```

#### Crear Gasto
```http
POST /api/gastos
Content-Type: application/json

{
  "concepto": "Salario operarios",
  "descripcion": "Pago mensual",
  "categoria": "mano_obra",
  "monto": 5000000.0,
  "fecha_gasto": "2024-01-15T10:30:00",
  "orden_produccion": "OP-001",
  "comprobante": "COMP-001"
}
```

**Categorías disponibles:**
- `mano_obra`
- `servicios`
- `mantenimiento`
- `otros`

#### Actualizar Gasto
```http
PUT /api/gastos/{id}
Content-Type: application/json

{
  "monto": 5500000.0
}
```

#### Eliminar Gasto
```http
DELETE /api/gastos/{id}
```

#### Reporte por Categoría
```http
GET /api/gastos/reportes/por-categoria?fecha_inicio=2024-01-01T00:00:00&fecha_fin=2024-12-31T23:59:59
```

### Productos Terminados

#### Listar Productos
```http
GET /api/productos-terminados?skip=0&limit=100
```

#### Crear Producto
```http
POST /api/productos-terminados
Content-Type: application/json

{
  "codigo": "PROD-001",
  "nombre": "Producto Terminado A",
  "descripcion": "Descripción del producto",
  "unidad_medida": "unidades",
  "cantidad_actual": 100.0,
  "cantidad_minima": 20.0,
  "precio_produccion": 10000.0,
  "precio_venta": 15000.0,
  "lote": "LOTE-2024-01",
  "fecha_produccion": "2024-01-15T00:00:00",
  "fecha_vencimiento": "2024-12-31T00:00:00",
  "ubicacion": "Almacén Central"
}
```

#### Actualizar Producto
```http
PUT /api/productos-terminados/{id}
Content-Type: application/json

{
  "precio_venta": 16000.0,
  "cantidad_actual": 150.0
}
```

#### Eliminar Producto
```http
DELETE /api/productos-terminados/{id}
```

#### Registrar Movimiento
```http
POST /api/productos-terminados/movimientos
Content-Type: application/json

{
  "producto_id": 1,
  "tipo": "entrada|salida",
  "cantidad": 50.0,
  "motivo": "Venta a cliente",
  "destino": "Cliente XYZ"
}
```

#### Listar Movimientos
```http
GET /api/productos-terminados/movimientos/{producto_id}?skip=0&limit=100
```

#### Alertas de Stock Bajo
```http
GET /api/productos-terminados/alertas/stock-bajo
```

## Códigos de Estado HTTP

- `200` - OK
- `201` - Created
- `204` - No Content (eliminación exitosa)
- `400` - Bad Request (validación fallida)
- `401` - Unauthorized (no autenticado)
- `403` - Forbidden (sin permisos)
- `404` - Not Found
- `422` - Unprocessable Entity (error de validación)
- `500` - Internal Server Error

## Permisos por Rol

| Endpoint | Gerente | Jefe Planta | Director Técnico | Operario |
|----------|---------|-------------|------------------|----------|
| Ver inventario | ✅ | ✅ | ✅ | ✅ |
| Modificar inventario | ✅ | ✅ | ✅ | ❌ |
| Gestionar gastos | ✅ | ❌ | ✅ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ | ❌ |

## Ejemplos con PowerShell

### Registrar Usuario
```powershell
$headers = @{"Content-Type" = "application/json"}
$body = @{
    username = "admin"
    email = "admin@example.com"
    password = "admin123"
    full_name = "Administrador"
    role = "gerente"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/auth/register" -Method POST -Headers $headers -Body $body
```

### Login
```powershell
$body = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" -Method POST -Headers $headers -Body $body
$token = $response.access_token
```

### Crear Materia Prima
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

$body = @{
    nombre = "Harina de Trigo"
    unidad_medida = "kg"
    cantidad_actual = 500
    cantidad_minima = 50
    precio_unitario = 2500
    proveedor = "Molinos SA"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/materias-primas" -Method POST -Headers $headers -Body $body
```
