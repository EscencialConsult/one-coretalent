"""Punto de entrada de la API de Plataforma ONE (ONE Core Analytics)."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    admin,
    areas,
    asignaciones,
    auth,
    catalogo,
    empresa,
    empresas,
    evaluaciones,
    evaluados,
    health,
    informes_ia,
    perfiles,
    postulaciones,
    publico,
    resultados,
    tests,
    vacantes,
    yo,
)
from app.core.config import settings

app = FastAPI(
    title="Plataforma ONE — API",
    description="Backend de ONE Core Analytics: evaluaciones psicométricas multi-tenant.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(empresas.router, prefix="/api")
app.include_router(catalogo.router, prefix="/api")
app.include_router(empresa.router, prefix="/api")
app.include_router(perfiles.router, prefix="/api")
app.include_router(publico.router, prefix="/api")
app.include_router(areas.router, prefix="/api")
app.include_router(evaluados.router, prefix="/api")
app.include_router(asignaciones.router, prefix="/api")
app.include_router(resultados.router, prefix="/api")
app.include_router(informes_ia.router, prefix="/api")
app.include_router(evaluaciones.router_admin, prefix="/api")
app.include_router(evaluaciones.router_emp, prefix="/api")
app.include_router(evaluaciones.router_pub, prefix="/api")
app.include_router(yo.router, prefix="/api")
app.include_router(tests.router, prefix="/api")
app.include_router(vacantes.router, prefix="/api")
app.include_router(postulaciones.router, prefix="/api")


@app.get("/", tags=["root"])
async def root() -> dict:
    return {"name": "Plataforma ONE API", "version": app.version, "docs": "/docs"}
