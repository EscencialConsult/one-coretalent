"""Diagnóstico de conexión a la base. Uso (desde backend/, mismo entorno que uvicorn):
    python -m scripts.check_db
"""
from __future__ import annotations

import asyncio
from urllib.parse import urlsplit

from sqlalchemy import text

from app.core.config import settings
from app.core.db import engine


async def main() -> None:
    p = urlsplit(settings.async_database_url)
    print(f"Host: {p.hostname} | Puerto: {p.port} | Base: {p.path.lstrip('/')} | SSL: {settings.DB_SSL}")
    try:
        async with engine.connect() as conn:
            valor = (await conn.execute(text("select 1"))).scalar()
            print(f"✓ Conexión OK (select 1 -> {valor}). La base está viva.")
    except Exception as e:  # noqa: BLE001
        print(f"✗ No se pudo conectar: {type(e).__name__}: {e}")
        print("  → Si el host NO termina en algo como '.oregon-postgres.render.com', estás usando la URL interna (no sirve fuera de Render).")
        print("  → Si el host es correcto, lo más probable es que la base de Render esté suspendida o expirada (las free se borran ~30 días).")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
