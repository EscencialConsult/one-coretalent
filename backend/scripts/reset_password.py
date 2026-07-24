"""Resetea la contraseña (y reactiva) un usuario existente por email.

Uso (desde backend/, con el mismo entorno que corre uvicorn):
    python -m scripts.reset_password --email admin@one.com --password "NuevaClave123"
"""
from __future__ import annotations

import argparse
import asyncio

from sqlalchemy import select

from app.core.db import SessionLocal, apply_rls_context
from app.core.security import hash_password
from app.models.user import Usuario


async def resetear(email: str, password: str) -> None:
    email = email.lower().strip()
    async with SessionLocal() as db:
        # Script de operador humano (fuera del pipeline de requests): no hay JWT del
        # que sacar el tenant, así que se declara explícitamente como acción administrativa.
        await apply_rls_context(db, tenant_id=None, is_superadmin=True)
        res = await db.execute(select(Usuario).where(Usuario.email == email))
        u = res.scalar_one_or_none()
        if u is None:
            print(f"No existe un usuario con el email {email}. (Usá seed_superadmin para crearlo.)")
            return
        u.password_hash = hash_password(password)
        u.activo = True
        await db.commit()
        print(f"✓ Contraseña actualizada para {email} (rol {u.rol.value}).")


def main() -> None:
    parser = argparse.ArgumentParser(description="Resetear contraseña de un usuario")
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    args = parser.parse_args()
    asyncio.run(resetear(args.email, args.password))


if __name__ == "__main__":
    main()
