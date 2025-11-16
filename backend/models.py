from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import enum

class RoleEnum(str, enum.Enum):
    GERENTE = "gerente"
    OPERARIO = "operario"
    JEFE_PLANTA = "jefe_planta"
    DIRECTOR_TECNICO = "director_tecnico"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(Enum(RoleEnum), nullable=False)
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
    nombre = Column(String(100), nullable=False, index=True)
    descripcion = Column(Text)
    unidad_medida = Column(String(20), nullable=False)  # kg, litros, unidades, etc.
    cantidad_actual = Column(Float, nullable=False, default=0)
    cantidad_minima = Column(Float, nullable=False, default=0)
    precio_unitario = Column(Float, nullable=False)
    proveedor = Column(String(100))
    ubicacion = Column(String(100))
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
