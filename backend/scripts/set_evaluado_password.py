"""Define/resetea la contraseña de un EVALUADO por email (y lo reactiva).

Uso (desde backend/, mismo entorno que uvicorn):
    python -m scripts.set_evaluado_password --email lucia.f@techsur.com --password "Clave1234"
"""
from __future__ import annotations

import argparse
import asyncio

from sqlalchemy import select

from app.core.db import SessionLocal
from app.core.security import hash_password
from app.models.evaluado import Evaluado


async def set_pass(email: str, password: str) -> None:
    email = email.lower().strip()
    async with SessionLocal() as db:
        res = await db.execute(select(Evaluado).where(Evaluado.email == email))
        evaluados = list(res.scalars().all())
        if not evaluados:
            print(f"No existe un evaluado con el email {email}.")
            return
        for ev in evaluados:
            ev.password_hash = hash_password(password)
            ev.activo = True
        await db.commit()
        print(f"✓ Contraseña definida para {len(evaluados)} evaluado(s) con email {email}.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Definir contraseña de un evaluado")
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    args = parser.parse_args()
    asyncio.run(set_pass(args.email, args.password))


if __name__ == "__main__":
    main()
