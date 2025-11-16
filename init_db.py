"""
Script para inicializar la base de datos con datos de ejemplo
Ejecutar después de que el backend esté corriendo
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api"

def create_user(username, email, password, full_name, role):
    """Crear un usuario"""
    data = {
        "username": username,
        "email": email,
        "password": password,
        "full_name": full_name,
        "role": role
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=data)
        if response.status_code == 201:
            print(f"✅ Usuario creado: {username} ({role})")
            return response.json()
        else:
            print(f"⚠️  Error creando {username}: {response.json().get('detail', 'Error desconocido')}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def login(username, password):
    """Iniciar sesión y obtener token"""
    data = {
        "username": username,
        "password": password
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=data)
        if response.status_code == 200:
            token = response.json()["access_token"]
            print(f"✅ Login exitoso: {username}")
            return token
        else:
            print(f"❌ Error en login: {response.json().get('detail', 'Error desconocido')}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def create_materia_prima(token, data):
    """Crear materia prima"""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.post(f"{BASE_URL}/materias-primas", json=data, headers=headers)
        if response.status_code == 201:
            print(f"✅ Materia prima creada: {data['nombre']}")
            return response.json()
        else:
            print(f"⚠️  Error: {response.json().get('detail', 'Error desconocido')}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def create_gasto(token, data):
    """Crear gasto"""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.post(f"{BASE_URL}/gastos", json=data, headers=headers)
        if response.status_code == 201:
            print(f"✅ Gasto creado: {data['concepto']}")
            return response.json()
        else:
            print(f"⚠️  Error: {response.json().get('detail', 'Error desconocido')}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def create_producto(token, data):
    """Crear producto terminado"""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.post(f"{BASE_URL}/productos-terminados", json=data, headers=headers)
        if response.status_code == 201:
            print(f"✅ Producto creado: {data['nombre']}")
            return response.json()
        else:
            print(f"⚠️  Error: {response.json().get('detail', 'Error desconocido')}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def main():
    print("🚀 Inicializando base de datos con datos de ejemplo...\n")
    
    # Crear usuarios
    print("👥 Creando usuarios...")
    users = [
        ("admin", "admin@example.com", "admin123", "Administrador General", "gerente"),
        ("jefe_planta", "jefe@example.com", "jefe123", "Juan Pérez - Jefe de Planta", "jefe_planta"),
        ("director", "director@example.com", "director123", "María García - Director Técnico", "director_tecnico"),
        ("operario", "operario@example.com", "operario123", "Carlos López - Operario", "operario"),
    ]
    
    for username, email, password, full_name, role in users:
        create_user(username, email, password, full_name, role)
    
    print("\n🔐 Iniciando sesión como admin...")
    token = login("admin", "admin123")
    
    if not token:
        print("❌ No se pudo obtener el token. Abortando.")
        return
    
    # Crear materias primas
    print("\n📦 Creando materias primas...")
    materias_primas = [
        {
            "nombre": "Harina de Trigo",
            "descripcion": "Harina tipo 00 para producción",
            "unidad_medida": "kg",
            "cantidad_actual": 500.0,
            "cantidad_minima": 100.0,
            "precio_unitario": 2500.0,
            "proveedor": "Molinos del Valle SA",
            "ubicacion": "Bodega A - Estante 1"
        },
        {
            "nombre": "Azúcar Refinada",
            "descripcion": "Azúcar blanca refinada",
            "unidad_medida": "kg",
            "cantidad_actual": 300.0,
            "cantidad_minima": 50.0,
            "precio_unitario": 3200.0,
            "proveedor": "Ingenio La Cabaña",
            "ubicacion": "Bodega A - Estante 2"
        },
        {
            "nombre": "Levadura Seca",
            "descripcion": "Levadura instantánea para panadería",
            "unidad_medida": "kg",
            "cantidad_actual": 25.0,
            "cantidad_minima": 5.0,
            "precio_unitario": 15000.0,
            "proveedor": "Insumos Panaderos",
            "ubicacion": "Refrigerador 1"
        },
        {
            "nombre": "Sal Industrial",
            "descripcion": "Sal para procesamiento industrial",
            "unidad_medida": "kg",
            "cantidad_actual": 100.0,
            "cantidad_minima": 20.0,
            "precio_unitario": 800.0,
            "proveedor": "Sal Marina Ltda",
            "ubicacion": "Bodega B"
        }
    ]
    
    for materia in materias_primas:
        create_materia_prima(token, materia)
    
    # Crear gastos
    print("\n💰 Creando gastos de producción...")
    now = datetime.now()
    gastos = [
        {
            "concepto": "Salarios mensuales operarios",
            "descripcion": "Pago de nómina mes actual",
            "categoria": "mano_obra",
            "monto": 8500000.0,
            "fecha_gasto": (now - timedelta(days=5)).isoformat(),
            "orden_produccion": "OP-2024-001",
            "comprobante": "COMP-001"
        },
        {
            "concepto": "Energía eléctrica",
            "descripcion": "Factura mensual de electricidad",
            "categoria": "servicios",
            "monto": 2300000.0,
            "fecha_gasto": (now - timedelta(days=3)).isoformat(),
            "orden_produccion": None,
            "comprobante": "FACT-ELECT-001"
        },
        {
            "concepto": "Mantenimiento horno industrial",
            "descripcion": "Reparación y calibración",
            "categoria": "mantenimiento",
            "monto": 1500000.0,
            "fecha_gasto": (now - timedelta(days=7)).isoformat(),
            "orden_produccion": None,
            "comprobante": "COMP-MANT-001"
        },
        {
            "concepto": "Agua y gas",
            "descripcion": "Servicios públicos mes actual",
            "categoria": "servicios",
            "monto": 850000.0,
            "fecha_gasto": (now - timedelta(days=2)).isoformat(),
            "orden_produccion": None,
            "comprobante": "FACT-SERV-001"
        }
    ]
    
    for gasto in gastos:
        create_gasto(token, gasto)
    
    # Crear productos terminados
    print("\n🎁 Creando productos terminados...")
    productos = [
        {
            "codigo": "PROD-001",
            "nombre": "Pan Tajado Integral",
            "descripcion": "Pan tajado integral 500g",
            "unidad_medida": "unidades",
            "cantidad_actual": 150.0,
            "cantidad_minima": 30.0,
            "precio_produccion": 2800.0,
            "precio_venta": 4500.0,
            "lote": "LOTE-2024-001",
            "fecha_produccion": (now - timedelta(days=2)).isoformat(),
            "fecha_vencimiento": (now + timedelta(days=5)).isoformat(),
            "ubicacion": "Almacén Principal - Zona Refrigerada"
        },
        {
            "codigo": "PROD-002",
            "nombre": "Galletas de Mantequilla",
            "descripcion": "Galletas de mantequilla paquete 300g",
            "unidad_medida": "paquetes",
            "cantidad_actual": 200.0,
            "cantidad_minima": 50.0,
            "precio_produccion": 3500.0,
            "precio_venta": 5800.0,
            "lote": "LOTE-2024-002",
            "fecha_produccion": (now - timedelta(days=1)).isoformat(),
            "fecha_vencimiento": (now + timedelta(days=30)).isoformat(),
            "ubicacion": "Almacén Principal - Estantería A"
        },
        {
            "codigo": "PROD-003",
            "nombre": "Torta Chocolate",
            "descripcion": "Torta de chocolate 1kg",
            "unidad_medida": "unidades",
            "cantidad_actual": 25.0,
            "cantidad_minima": 10.0,
            "precio_produccion": 15000.0,
            "precio_venta": 25000.0,
            "lote": "LOTE-2024-003",
            "fecha_produccion": now.isoformat(),
            "fecha_vencimiento": (now + timedelta(days=3)).isoformat(),
            "ubicacion": "Almacén Principal - Zona Refrigerada"
        }
    ]
    
    for producto in productos:
        create_producto(token, producto)
    
    print("\n✅ ¡Base de datos inicializada con éxito!")
    print("\n📝 Credenciales de acceso:")
    print("=" * 50)
    for username, _, password, full_name, role in users:
        print(f"Usuario: {username} | Password: {password} | Rol: {role}")
    print("=" * 50)
    print("\n🌐 Accede a la aplicación en: http://localhost")
    print("📚 Documentación API: http://localhost:8000/docs")

if __name__ == "__main__":
    main()
