from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, date
from typing import Optional, List
from models import RoleEnum, TipoInventarioEnum, UnidadNegocioEnum

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
    codigo: str = Field(..., max_length=50)
    nombre: str = Field(..., max_length=100)
    descripcion: Optional[str] = None
    unidad_medida: str = Field(..., max_length=20)
    cantidad_actual: float = Field(..., ge=0)
    cantidad_minima: float = Field(..., ge=0)
    lote: Optional[str] = None
    proveedor: Optional[str] = None
    fecha_ingreso: Optional[date] = None
    tipo_inventario: str  # "BPE - Magistrales" o "Fabricación de derivados"

class MateriaPrimaCreate(MateriaPrimaBase):
    pass

class MateriaPrimaUpdate(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    unidad_medida: Optional[str] = None
    cantidad_actual: Optional[float] = Field(None, ge=0)
    cantidad_minima: Optional[float] = Field(None, ge=0)
    lote: Optional[str] = None
    proveedor: Optional[str] = None
    fecha_ingreso: Optional[date] = None
    tipo_inventario: Optional[str] = None

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
    volumen_total: Optional[float] = None  # Para unidades (sum de presentaciones * volumen)
    presentaciones: Optional[dict] = None  # {"3mL": 5, "10mL": 3, ...}
    materiales: Optional[dict] = None  # {"envase": "codigo", "gotero": "codigo", "caja": "codigo"}
    tipo_inventario: Optional[str] = None

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

# Schemas de Inventario
class InventarioBase(BaseModel):
    nombre: str = Field(..., max_length=50)
    descripcion: Optional[str] = None

class InventarioCreate(InventarioBase):
    pass

class InventarioResponse(InventarioBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Schemas de Materia Prima para relación en Producto
class MateriaPrimaParaProducto(BaseModel):
    id: int
    codigo: Optional[str] = None
    nombre: str
    unidad_medida: str
    
    class Config:
        from_attributes = True

# Schemas de Producto
class ProductoMateriaPrimaInput(BaseModel):
    materia_prima_id: int
    concentracion: float = Field(..., gt=0, le=100)

class ProductoBase(BaseModel):
    codigo: str = Field(..., max_length=50)
    nombre: str = Field(..., max_length=100)
    descripcion: Optional[str] = None
    precio_produccion: float = Field(default=0, ge=0)
    precio_venta: Optional[float] = Field(None, ge=0)
    unidad_negocio: str  # "BPE - Magistrales", "Droguería", "Fabricación de derivados"
    meses_vencimiento: int = Field(default=6, ge=0, le=12)  # Meses de vencimiento

class ProductoCreate(ProductoBase):
    materias_primas: List[ProductoMateriaPrimaInput] = []
    inventarios: List[int] = []  # IDs de inventarios

class ProductoUpdate(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio_produccion: Optional[float] = Field(None, ge=0)
    precio_venta: Optional[float] = Field(None, ge=0)
    unidad_negocio: Optional[str] = None
    meses_vencimiento: Optional[int] = Field(None, ge=0, le=12)
    materias_primas: Optional[List[ProductoMateriaPrimaInput]] = None
    inventarios: Optional[List[int]] = None

class ProductoResponse(ProductoBase):
    id: int
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    inventarios: List[InventarioResponse] = []
    materias_primas: List[dict] = []
    
    class Config:
        from_attributes = True

# Schema para registrar producción de productos
class RegistrarProduccionInput(BaseModel):
    producto_id: int
    cantidad: float = Field(..., gt=0)
    lote: Optional[str] = None
    fecha_produccion: Optional[datetime] = None
    fecha_vencimiento: Optional[datetime] = None
    ubicacion: Optional[str] = None

# Schemas para Historial de Descuentos
class HistorialDescuentoResponse(BaseModel):
    id: int
    materia_prima_id: int
    producto_id: int
    producto_nombre: str
    cantidad_descontada: float  # En gramos
    concentracion: float  # %P/V
    volumen_producido: float
    unidad_volumen: str
    fecha_produccion: datetime
    fecha_descuento: datetime
    
    class Config:
        from_attributes = True

# Schemas para Registro de Salidas
class RegistroSalidaBase(BaseModel):
    tipo_item: str  # "materia_prima" o "producto_terminado"
    codigo_item: str
    lote: str
    cantidad_salida: float = Field(..., gt=0)
    motivo_salida: str
    observaciones: Optional[str] = None

class RegistroSalidaCreate(RegistroSalidaBase):
    materia_prima_id: Optional[int] = None
    producto_terminado_id: Optional[int] = None

class RegistroSalidaResponse(BaseModel):
    id: int
    tipo_item: str
    codigo_item: str
    nombre_item: str
    lote: str
    cantidad_salida: float
    unidad_medida: str
    motivo_salida: str
    saldo_anterior: float
    saldo_actual: float
    observaciones: Optional[str]
    created_by: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True


