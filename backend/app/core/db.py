"""Motor de base de datos asíncrono y sesión por request."""
from __future__ import annotations

import ssl
import uuid
from pathlib import Path
from typing import AsyncGenerator, Optional
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings

# Render/Neon/Supabase (y la mayoría de Postgres gestionados) exigen SSL para conexiones externas.
# statement_cache_size=0 → compatibilidad con poolers tipo pgbouncer (Supabase Session/Transaction pooler).
#
# El pooler de Supabase (Supavisor) firma su certificado con una CA propia ("Supabase Root 2021 CA"),
# que no está en las listas de autoridades públicas que trae Python por defecto. Sin este archivo,
# create_default_context() rechaza la conexión con CERTIFICATE_VERIFY_FAILED aunque el certificado
# sea legítimo. Se agrega como CA adicional (no reemplaza la verificación por defecto) para mantener
# la validación real de identidad del servidor.
_SUPABASE_CA_BUNDLE = Path(__file__).parent / "certs" / "supabase-ca-bundle.pem"

_connect_args: dict = {
    "statement_cache_size": 0,
    # SQLAlchemy mantiene además una caché propia de sentencias preparadas para asyncpg.
    # El pooler transaccional de Supabase puede entregar la conexión física a otra sesión
    # entre transacciones, por lo que un nombre preparado previamente deja de existir.
    "prepared_statement_cache_size": 0,
    "prepared_statement_name_func": lambda: f"__asyncpg_{uuid4()}__",
}
if settings.DB_SSL:
    _ssl_context = ssl.create_default_context()
    if _SUPABASE_CA_BUNDLE.exists():
        _ssl_context.load_verify_locations(cafile=str(_SUPABASE_CA_BUNDLE))
    _connect_args["ssl"] = _ssl_context

engine = create_async_engine(
    settings.async_database_url,
    # Supavisor ya administra el pool en el servidor. Mantener otro pool persistente en
    # la aplicación reintroduce estado de sesión y sentencias preparadas entre requests.
    poolclass=NullPool,
    echo=(settings.ENV == "dev"),
    connect_args=_connect_args,
)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependencia FastAPI: entrega una sesión y la cierra al terminar."""
    async with SessionLocal() as session:
        yield session


async def apply_rls_context(
    db: AsyncSession,
    *,
    tenant_id: Optional[uuid.UUID] = None,
    is_superadmin: bool = False,
    persona_id: Optional[uuid.UUID] = None,
) -> None:
    """Le dice a Postgres qué tenant (y/o qué Persona) es el dueño de esta conexión,
    para que las políticas de Row Level Security filtren solo. Se llama una vez por
    request, apenas se conoce la identidad (desde los claims del JWT, ya verificados).
    persona_id es un eje aparte de tenant_id: Persona es global (sin tenant_id propio),
    así que su propia RLS se resuelve por "soy yo mismo" (persona_id) o por tener una
    Postulacion real con el tenant actual (ver migración de RLS de Persona).
    set_config(..., true) = alcance de la transacción actual (equivalente a SET LOCAL,
    pero parametrizable de forma segura, sin interpolar strings en el SQL)."""
    await db.execute(
        text(
            "SELECT set_config('app.tenant_id', :tid, true), "
            "set_config('app.is_superadmin', :sa, true), "
            "set_config('app.persona_id', :pid, true)"
        ),
        {
            "tid": str(tenant_id) if tenant_id else "",
            "sa": "true" if is_superadmin else "false",
            "pid": str(persona_id) if persona_id else "",
        },
    )


async def apply_rls_pre_auth(db: AsyncSession) -> None:
    """Bypass acotado y explícito para las 2-3 búsquedas que, por diseño, tienen que
    mirar cruzando tenants ANTES de saber a qué tenant pertenecen (login por email,
    respuesta de evaluación 360° por token público). Nunca cubre escrituras (WITH CHECK
    de las políticas no lo incluye) — solo lecturas puntuales, siempre seguidas de un
    apply_rls_context() con el tenant real apenas se resuelve la identidad."""
    await db.execute(text("SELECT set_config('app.rls_pre_auth', 'on', true)"))
