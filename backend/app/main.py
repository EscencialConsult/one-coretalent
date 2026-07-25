"""Punto de entrada de la API de Plataforma ONE (ONE Core Analytics)."""
from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
import uuid

from fastapi import FastAPI, Request
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
    evaluaciones_postulantes,
    evaluados,
    health,
    informes_ia,
    perfiles,
    personas,
    postulaciones,
    publico,
    resultados,
    tests,
    vacantes,
    yo,
)
from app.core.config import settings
from app.core.outbox import ejecutar_worker_outbox


@asynccontextmanager
async def lifespan(_: FastAPI):
    worker = asyncio.create_task(ejecutar_worker_outbox())
    try:
        yield
    finally:
        worker.cancel()
        await asyncio.gather(worker, return_exceptions=True)

app = FastAPI(
    title="Plataforma ONE — API",
    description="Backend de ONE Core Analytics: evaluaciones psicométricas multi-tenant.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """Identificador de correlación para soporte, logs y errores reportados por el frontend."""
    recibido = request.headers.get("X-Request-ID", "")
    request_id = recibido if 0 < len(recibido) <= 128 else uuid.uuid4().hex
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    if request.headers.get("Authorization"):
        response.headers["Cache-Control"] = "no-store, private"
        response.headers["Pragma"] = "no-cache"
    if settings.ENV.lower() == "prod" and request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

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
app.include_router(evaluaciones_postulantes.router, prefix="/api")
app.include_router(personas.router, prefix="/api")


@app.get("/", tags=["root"])
async def root() -> dict:
    return {"name": "Plataforma ONE API", "version": app.version, "docs": "/docs"}
