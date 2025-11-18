from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, users, materias_primas, gastos, productos_terminados, ai, productos, salidas

# Crear tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema de Inventario",
    description="API para gestión de inventario de producción",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:80",
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticación"])
app.include_router(users.router, prefix="/api/users", tags=["Usuarios"])
app.include_router(materias_primas.router, prefix="/api/materias-primas", tags=["Materias Primas"])
app.include_router(gastos.router, prefix="/api/gastos", tags=["Gastos de Producción"])
app.include_router(productos_terminados.router, prefix="/api/productos-terminados", tags=["Productos Terminados"])
app.include_router(productos.router, prefix="/api", tags=["Productos"])
app.include_router(salidas.router, tags=["Salidas"])
app.include_router(ai.router, prefix="/api/ai", tags=["Inteligencia Artificial"])

@app.get("/")
def read_root():
    return {"message": "API Sistema de Inventario", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
