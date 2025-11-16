# Guía de Inicio Rápido - Sistema de Inventario

## Inicio Rápido en 5 Minutos

### 1️⃣ Iniciar Docker Desktop
Asegúrate de que Docker Desktop esté corriendo.

### 2️⃣ Ejecutar el sistema

**Windows (PowerShell):**
```powershell
cd c:\laragon\www\personal_projects\weed
.\start.ps1
```

**Linux/Mac:**
```bash
cd /path/to/weed
chmod +x start.sh
./start.sh
```

### 3️⃣ Inicializar con datos de ejemplo

Espera 30 segundos a que los servicios estén listos, luego:

```powershell
# Instalar requests si no lo tienes
pip install requests

# Ejecutar script de inicialización
python init_db.py
```

### 4️⃣ Acceder al sistema

Abre tu navegador en: **http://localhost**

## 👤 Usuarios de Prueba

| Usuario | Contraseña | Rol | Permisos |
|---------|-----------|-----|----------|
| admin | admin123 | Gerente | Todos los permisos |
| jefe_planta | jefe123 | Jefe de Planta | Gestión de inventarios |
| director | director123 | Director Técnico | Gestión de gastos e inventarios |
| operario | operario123 | Operario | Solo lectura |

## 🎯 Primeros Pasos

### 1. Iniciar sesión
- Abre http://localhost
- Usa uno de los usuarios de prueba
- Inicia sesión

### 2. Explorar el Dashboard
- Verás estadísticas generales
- Alertas de stock bajo
- Resumen del inventario

### 3. Gestionar Inventario

**Materias Primas:**
- Click en "Materias Primas" en el menú
- Verás materias primas de ejemplo
- Puedes agregar, editar o registrar movimientos (entrada/salida)

**Productos Terminados:**
- Click en "Productos Terminados"
- Gestiona productos finales
- Registra movimientos y ventas

**Gastos:**
- Click en "Gastos"
- Registra gastos de producción
- Visualiza reportes por categoría

### 4. Gestionar Usuarios (Solo Gerente)
- Click en "Usuarios"
- Crea, edita o elimina usuarios
- Asigna roles y permisos

## 🔍 Funcionalidades Principales

### Alertas Automáticas
El sistema te alertará cuando:
- Stock de materias primas esté bajo
- Productos terminados alcancen el mínimo

### Movimientos
Registra entradas y salidas de:
- Materias primas (compras, uso en producción)
- Productos terminados (producción, ventas)

### Reportes
- Gastos por categoría
- Estado de inventario
- Histórico de movimientos

## 🛠️ Comandos Útiles

### Ver logs en tiempo real
```powershell
docker-compose logs -f
```

### Reiniciar servicios
```powershell
docker-compose restart
```

### Detener sistema
```powershell
docker-compose down
```

### Reiniciar desde cero
```powershell
docker-compose down -v
docker-compose up -d --build
python init_db.py
```

## 📱 URLs Importantes

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **Documentación API**: http://localhost:8000/docs
- **Base de datos**: localhost:5432

## 🆘 Solución de Problemas

### El puerto 80 está ocupado
Edita `docker-compose.yml` y cambia:
```yaml
frontend:
  ports:
    - "8080:80"  # Usar 8080 en vez de 80
```
Luego accede en http://localhost:8080

### Error de conexión a la base de datos
Espera unos segundos más, la base de datos tarda en iniciar.

### No puedo crear usuarios
Verifica que el backend esté corriendo:
```powershell
docker ps
```
Debe aparecer `inventario_backend` con estado "Up"

### Los cambios no se reflejan
Recarga la página con Ctrl + F5 (recarga forzada)

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs: `docker-compose logs -f`
2. Verifica el estado: `docker ps -a`
3. Reinicia los servicios: `docker-compose restart`

## 🎓 Siguientes Pasos

1. **Personaliza los datos**: Elimina los datos de ejemplo y agrega los tuyos
2. **Cambia las credenciales**: Actualiza las contraseñas por defecto
3. **Configura respaldos**: Establece una estrategia de backup de la base de datos
4. **Adapta categorías**: Modifica las categorías de gastos según tu negocio
5. **Ajusta permisos**: Personaliza los roles según tu organización

## 🔒 Seguridad en Producción

⚠️ **IMPORTANTE**: Antes de usar en producción:

1. Cambia `SECRET_KEY` en `backend/.env`
2. Usa contraseñas seguras para PostgreSQL
3. Configura HTTPS
4. Restringe CORS apropiadamente
5. Actualiza las contraseñas de todos los usuarios

---

**¿Todo funcionando?** ¡Excelente! Ya puedes empezar a usar el sistema de inventario. 🎉
