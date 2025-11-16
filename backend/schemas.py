from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional
from models import RoleEnum

# Schemas de Usuario
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = None
    role: RoleEnum

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[RoleEnum] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Schemas de Autenticación
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

# Schemas de Materia Prima
class MateriaPrimaBase(BaseModel):
    nombre: str = Field(..., max_length=100)
    descripcion: Optional[str] = None
    unidad_medida: str = Field(..., max_length=20)
    cantidad_actual: float = Field(..., ge=0)
    cantidad_minima: float = Field(..., ge=0)
    precio_unitario: float = Field(..., ge=0)
    proveedor: Optional[str] = None
    ubicacion: Optional[str] = None

class MateriaPrimaCreate(MateriaPrimaBase):
    pass

class MateriaPrimaUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    unidad_medida: Optional[str] = None
    cantidad_actual: Optional[float] = Field(None, ge=0)
    cantidad_minima: Optional[float] = Field(None, ge=0)
    precio_unitario: Optional[float] = Field(None, ge=0)
    proveedor: Optional[str] = None
    ubicacion: Optional[str] = None

class MateriaPrimaResponse(MateriaPrimaBase):
    id: int
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Schemas de Movimiento Materia Prima
class MovimientoMateriaPrimaCreate(BaseModel):
    materia_prima_id: int
    tipo: str = Field(..., pattern="^(entrada|salida)$")
    cantidad: float = Field(..., gt=0)
    motivo: Optional[str] = None

class MovimientoMateriaPrimaResponse(BaseModel):
    id: int
    materia_prima_id: int
    tipo: str
    cantidad: float
    motivo: Optional[str]
    created_by: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Schemas de Gasto
class GastoBase(BaseModel):
    concepto: str = Field(..., max_length=100)
    descripcion: Optional[str] = None
    categoria: str = Field(..., max_length=50)
    monto: float = Field(..., gt=0)
    fecha_gasto: datetime
    orden_produccion: Optional[str] = None
    comprobante: Optional[str] = None

class GastoCreate(GastoBase):
    pass

class GastoUpdate(BaseModel):
    concepto: Optional[str] = None
    descripcion: Optional[str] = None
    categoria: Optional[str] = None
    monto: Optional[float] = Field(None, gt=0)
    fecha_gasto: Optional[datetime] = None
    orden_produccion: Optional[str] = None
    comprobante: Optional[str] = None

class GastoResponse(GastoBase):
    id: int
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Schemas de Producto Terminado
class ProductoTerminadoBase(BaseModel):
    codigo: str = Field(..., max_length=50)
    nombre: str = Field(..., max_length=100)
    descripcion: Optional[str] = None
    unidad_medida: str = Field(..., max_length=20)
    cantidad_actual: float = Field(..., ge=0)
    cantidad_minima: float = Field(..., ge=0)
    precio_produccion: float = Field(..., ge=0)
    precio_venta: Optional[float] = Field(None, ge=0)
    lote: Optional[str] = None
    fecha_produccion: Optional[datetime] = None
    fecha_vencimiento: Optional[datetime] = None
    ubicacion: Optional[str] = None

class ProductoTerminadoCreate(ProductoTerminadoBase):
    pass

class ProductoTerminadoUpdate(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    unidad_medida: Optional[str] = None
    cantidad_actual: Optional[float] = Field(None, ge=0)
    cantidad_minima: Optional[float] = Field(None, ge=0)
    precio_produccion: Optional[float] = Field(None, ge=0)
    precio_venta: Optional[float] = Field(None, ge=0)
    lote: Optional[str] = None
    fecha_produccion: Optional[datetime] = None
    fecha_vencimiento: Optional[datetime] = None
    ubicacion: Optional[str] = None

class ProductoTerminadoResponse(ProductoTerminadoBase):
    id: int
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Schemas de Movimiento Producto
class MovimientoProductoCreate(BaseModel):
    producto_id: int
    tipo: str = Field(..., pattern="^(entrada|salida)$")
    cantidad: float = Field(..., gt=0)
    motivo: Optional[str] = None
    destino: Optional[str] = None

class MovimientoProductoResponse(BaseModel):
    id: int
    producto_id: int
    tipo: str
    cantidad: float
    motivo: Optional[str]
    destino: Optional[str]
    created_by: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True
