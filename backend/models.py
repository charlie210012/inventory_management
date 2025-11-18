from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Enum, ForeignKey, Boolean, Text, Table
from sqlalchemy.orm import relationship
from datetime import datetime, date
from database import Base
import enum

class RoleEnum(str, enum.Enum):
    GERENTE = "gerente"
    OPERARIO = "operario"
    JEFE_PLANTA = "jefe_planta"
    DIRECTOR_TECNICO = "director_tecnico"

class TipoInventarioEnum(str, enum.Enum):
    MAGISTRAL = "BPE - Magistrales"
    FABRICACION = "Fabricación de derivados"

class UnidadNegocioEnum(str, enum.Enum):
    MAGISTRALES = "BPE - Magistrales"
    DROGUERIA = "Droguería"
    FABRICACION = "Fabricación de derivados"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(Enum(RoleEnum, native_enum=False), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    materias_primas_creadas = relationship("MateriaPrima", back_populates="created_by_user")
    gastos_creados = relationship("Gasto", back_populates="created_by_user")
    productos_creados = relationship("ProductoTerminado", back_populates="created_by_user")

class MateriaPrima(Base):
    __tablename__ = "materias_primas"
    
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, nullable=False, index=True)
    nombre = Column(String(100), nullable=False, index=True)
    descripcion = Column(Text)
    unidad_medida = Column(String(20), nullable=False)  # kg, litros, unidades, etc.
    cantidad_actual = Column(Float, nullable=False, default=0)
    cantidad_minima = Column(Float, nullable=False, default=0)
    lote = Column(String(50))
    proveedor = Column(String(100))
    fecha_ingreso = Column(Date)
    ubicacion = Column(String(100))
    tipo_inventario = Column(String(50), nullable=False)  # "BPE - Magistrales" o "Fabricación de derivados"
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    created_by_user = relationship("User", back_populates="materias_primas_creadas")
    movimientos = relationship("MovimientoMateriaPrima", back_populates="materia_prima")

class MovimientoMateriaPrima(Base):
    __tablename__ = "movimientos_materia_prima"
    
    id = Column(Integer, primary_key=True, index=True)
    materia_prima_id = Column(Integer, ForeignKey("materias_primas.id"), nullable=False)
    tipo = Column(String(20), nullable=False)  # entrada, salida
    cantidad = Column(Float, nullable=False)
    motivo = Column(String(200))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    materia_prima = relationship("MateriaPrima", back_populates="movimientos")

class Gasto(Base):
    __tablename__ = "gastos"
    
    id = Column(Integer, primary_key=True, index=True)
    concepto = Column(String(100), nullable=False)
    descripcion = Column(Text)
    categoria = Column(String(50), nullable=False)  # mano_obra, servicios, mantenimiento, otros
    monto = Column(Float, nullable=False)
    fecha_gasto = Column(DateTime, nullable=False)
    orden_produccion = Column(String(50))
    comprobante = Column(String(100))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    created_by_user = relationship("User", back_populates="gastos_creados")

class ProductoTerminado(Base):
    __tablename__ = "productos_terminados"
    
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, nullable=False, index=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    unidad_medida = Column(String(20), nullable=False)
    cantidad_actual = Column(Float, nullable=False, default=0)
    cantidad_minima = Column(Float, nullable=False, default=0)
    precio_produccion = Column(Float, nullable=False)
    precio_venta = Column(Float)
    lote = Column(String(50))
    fecha_produccion = Column(DateTime)
    fecha_vencimiento = Column(DateTime)
    ubicacion = Column(String(100))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    created_by_user = relationship("User", back_populates="productos_creados")
    movimientos = relationship("MovimientoProducto", back_populates="producto")

class MovimientoProducto(Base):
    __tablename__ = "movimientos_productos"
    
    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos_terminados.id"), nullable=False)
    tipo = Column(String(20), nullable=False)  # entrada, salida
    cantidad = Column(Float, nullable=False)
    motivo = Column(String(200))
    destino = Column(String(100))  # cliente, almacén, etc.
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    producto = relationship("ProductoTerminado", back_populates="movimientos")

# Tabla de asociación Many-to-Many para Inventarios y Productos
producto_inventario = Table(
    'producto_inventario',
    Base.metadata,
    Column('producto_id', Integer, ForeignKey('productos.id'), primary_key=True),
    Column('inventario_id', Integer, ForeignKey('inventarios.id'), primary_key=True)
)

# Tabla de asociación Many-to-Many para Productos y Materias Primas con concentración
producto_materia_prima = Table(
    'producto_materia_prima',
    Base.metadata,
    Column('producto_id', Integer, ForeignKey('productos.id'), primary_key=True),
    Column('materia_prima_id', Integer, ForeignKey('materias_primas.id'), primary_key=True),
    Column('concentracion', Float, nullable=False)  # Porcentaje de concentración
)

class Inventario(Base):
    __tablename__ = "inventarios"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False, index=True)
    descripcion = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    productos = relationship("Producto", secondary=producto_inventario, back_populates="inventarios")

class Producto(Base):
    __tablename__ = "productos"
    
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, nullable=False, index=True)
    nombre = Column(String(100), nullable=False, index=True)
    descripcion = Column(Text)
    precio_produccion = Column(Float, nullable=False, default=0)
    precio_venta = Column(Float)
    unidad_negocio = Column(String(50), nullable=False)  # "BPE - Magistrales", "Droguería", "Fabricación de derivados"
    meses_vencimiento = Column(Integer, default=6, nullable=False)  # Meses de vencimiento después de fabricación
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    created_by_user = relationship("User")  # Sin back_populates para evitar conflicto
    inventarios = relationship("Inventario", secondary=producto_inventario, back_populates="productos")
    materias_primas = relationship("MateriaPrima", secondary=producto_materia_prima)

class HistorialDescuentoMateriaPrima(Base):
    __tablename__ = "historial_descuentos_materias_primas"
    
    id = Column(Integer, primary_key=True, index=True)
    materia_prima_id = Column(Integer, ForeignKey("materias_primas.id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    producto_nombre = Column(String(100), nullable=False)
    cantidad_descontada = Column(Float, nullable=False)  # En gramos
    concentracion = Column(Float, nullable=False)  # %P/V
    volumen_producido = Column(Float, nullable=False)
    unidad_volumen = Column(String(20), nullable=False)  # mL, unidades, etc.
    fecha_produccion = Column(DateTime, nullable=False)
    fecha_descuento = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    materia_prima = relationship("MateriaPrima")
    producto = relationship("Producto")

class SalidaEnum(str, enum.Enum):
    VENTA = "Venta"
    MUESTRAS = "Entrega de muestras"
    RECHAZO_QA = "Rechazo de control de calidad"
    PRUEBAS_QA = "Pruebas de control de calidad"

class RegistroSalida(Base):
    __tablename__ = "registros_salidas"
    
    id = Column(Integer, primary_key=True, index=True)
    tipo_item = Column(String(50), nullable=False)  # "materia_prima" o "producto_terminado"
    materia_prima_id = Column(Integer, ForeignKey("materias_primas.id"), nullable=True)
    producto_terminado_id = Column(Integer, ForeignKey("productos_terminados.id"), nullable=True)
    codigo_item = Column(String(50), nullable=False)
    nombre_item = Column(String(100), nullable=False)
    lote = Column(String(50), nullable=False)
    cantidad_salida = Column(Float, nullable=False)
    unidad_medida = Column(String(20), nullable=False)
    motivo_salida = Column(Enum(SalidaEnum, native_enum=False), nullable=False)
    saldo_anterior = Column(Float, nullable=False)
    saldo_actual = Column(Float, nullable=False)
    observaciones = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    materia_prima = relationship("MateriaPrima")
    producto_terminado = relationship("ProductoTerminado")
    usuario = relationship("User")

