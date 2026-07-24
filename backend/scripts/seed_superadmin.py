"""Crea el primer usuario SuperAdmin.

Uso (desde la carpeta backend/, con el entorno y .env configurados):
    python -m scripts.seed_superadmin --email admin@one.com --password "TuClaveSegura" \
        --nombre Super --apellido Admin
"""
from __future__ import annotations

import argparse
import asyncio

from sqlalchemy import select

from app.core.db import SessionLocal, apply_rls_context
from app.core.security import hash_password
from app.models.enums import RolUsuario
from app.models.user import Usuario


async def crear_superadmin(email: str, password: str, nombre: str, apellido: str) -> None:
    email = email.lower().strip()
    async with SessionLocal() as db:
        await apply_rls_context(db, tenant_id=None, is_superadmin=True)
        existe = await db.execute(select(Usuario).where(Usuario.email == email))
        if existe.scalar_one_or_none() is not None:
            print(f"Ya existe un usuario con el email {email}. No se creó nada.")
            return
        usuario = Usuario(
            email=email,
            password_hash=hash_password(password),
            nombre=nombre,
            apellido=apellido,
            rol=RolUsuario.SUPERADMIN,
            tenant_id=None,
            activo=True,
        )
        db.add(usuario)
        await db.commit()
        print(f"✓ SuperAdmin creado: {email}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Crear el primer SuperAdmin")
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--nombre", default="Super")
    parser.add_argument("--apellido", default="Admin")
    args = parser.parse_args()
    asyncio.run(crear_superadmin(args.email, args.password, args.nombre, args.apellido))


if __name__ == "__main__":
    main()
