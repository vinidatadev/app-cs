from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, usuarios, posicoes, atribuicoes, indicadores

app = FastAPI(
    title="Organograma API",
    description="API para sistema de organograma corporativo",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas
app.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
app.include_router(usuarios.router, prefix="/api/usuarios", tags=["Usuários"])
app.include_router(posicoes.router, prefix="/api/posicoes", tags=["Posições"])
app.include_router(atribuicoes.router, prefix="/api/atribuicoes", tags=["Atribuições"])
app.include_router(indicadores.router, prefix="/api/indicadores", tags=["Indicadores"])

@app.get("/")
def read_root():
    return {"message": "Organograma API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
