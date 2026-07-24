"""Endpoints del SuperAdmin para gestionar empresas (tenants) — Módulo 01."""
from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_superadmin
from app.core import engine
from app.core.config import settings
from app.core.db import get_db
from app.core.email import enviar_bienvenida_empresa, enviar_nuevas_credenciales_empresa
from app.core.security import generar_password, hash_password
from app.models.empresa_test import EmpresaTest
from app.models.enums import RolUsuario
from app.models.evaluado import Evaluado
from app.models.tenant import Empresa
from app.models.user import Usuario
from app.schemas.empresa import EmpresaCreate, EmpresaOut, EmpresaUpdate

# Todas las rutas requieren rol SuperAdmin.
router = APIRouter(
    prefix="/empresas",
    tags=["empresas (superadmin)"],
    dependencies=[Depends(require_superadmin)],
)


@router.get("")
async def listar_empresas(db: AsyncSession = Depends(get_db)) -> List[dict]:
    result = await db.execute(select(Empresa).order_by(Empresa.created_at.desc()))
    empresas = list(result.scalars().all())

    ev = dict(
        (
            await db.execute(
                select(Evaluado.tenant_id, func.count()).group_by(Evaluado.tenant_id)
            )
        ).all()
    )
    tt = dict(
        (
            await db.execute(
                select(EmpresaTest.tenant_id, func.count())
                .where(EmpresaTest.habilitado.is_(True))
                .group_by(EmpresaTest.tenant_id)
            )
        ).all()
    )
    return [
        {
            "id": str(e.id),
            "razon_social": e.razon_social,
            "subdominio": e.subdominio,
            "email_admin": e.email_admin,
            "color_acento": e.color_acento,
            "estado": e.estado.value if hasattr(e.estado, "value") else e.estado,
            "evaluados": ev.get(e.id, 0),
            "tests_habilitados": tt.get(e.id, 0),
        }
        for e in empresas
    ]


@router.post("", response_model=EmpresaOut, status_code=status.HTTP_201_CREATED)
async def crear_empresa(
    data: EmpresaCreate,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> Empresa:
    # Subdominio único.
    existe = await db.execute(select(Empresa).where(Empresa.subdominio == data.subdominio))
    if existe.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ya existe una empresa con ese subdominio")

    # El correo del admin no debe estar en uso por otro usuario.
    email = str(data.email_admin).lower()
    ya_usuario = await db.execute(select(Usuario).where(Usuario.email == email))
    if ya_usuario.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ya existe un usuario con ese email")

    empresa = Empresa(
        razon_social=data.razon_social,
        subdominio=data.subdominio,
        email_admin=str(data.email_admin),
        color_acento=data.color_acento,
        color_secundario=data.color_secundario,
        logo_url=data.logo_url,
    )
    db.add(empresa)
    await db.flush()  # asigna empresa.id sin cerrar la transacción

    # Siempre se crea el Admin de Empresa (para que tenga acceso). Si no vino
    # contraseña, se genera una temporal que se envía por correo.
    password_plano = data.admin_password or generar_password()
    db.add(
        Usuario(
            email=email,
            password_hash=hash_password(password_plano),
            nombre=data.admin_nombre,
            apellido=data.admin_apellido,
            rol=RolUsuario.ADMIN_EMPRESA,
            tenant_id=empresa.id,
            activo=True,
        )
    )

    await db.commit()
    await db.refresh(empresa)

    # Correo de bienvenida con link + credenciales (en segundo plano, best-effort).
    marca = {
        "razon_social": empresa.razon_social,
        "logo_url": empresa.logo_url,
        "color_acento": empresa.color_acento,
        "color_secundario": empresa.color_secundario,
    }
    background.add_task(
        enviar_bienvenida_empresa, marca, email, password_plano, settings.url_empresa(empresa.subdominio)
    )
    return empresa


@router.get("/{empresa_id}", response_model=EmpresaOut)
async def obtener_empresa(empresa_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Empresa:
    empresa = await db.get(Empresa, empresa_id)
    if empresa is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa no encontrada")
    return empresa


@router.patch("/{empresa_id}", response_model=EmpresaOut)
async def actualizar_empresa(
    empresa_id: uuid.UUID, data: EmpresaUpdate, db: AsyncSession = Depends(get_db)
) -> Empresa:
    empresa = await db.get(Empresa, empresa_id)
    if empresa is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa no encontrada")
    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(empresa, campo, valor)
    await db.commit()
    await db.refresh(empresa)
    return empresa


# ── Tests por empresa ─────────────────────────────────────────────────────────
# Modelo: la fila EmpresaTest = el test está EN ALCANCE de la empresa.
#   `habilitado` True/False = pausar sin sacarlo del alcance.
#   Quitar del alcance = borrar la fila (DELETE).
class TestToggle(BaseModel):
    habilitado: bool


async def _get_empresa(empresa_id: uuid.UUID, db: AsyncSession) -> Empresa:
    empresa = await db.get(Empresa, empresa_id)
    if empresa is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa no encontrada")
    return empresa


@router.post("/{empresa_id}/reenviar-credenciales")
async def reenviar_credenciales_empresa(
    empresa_id: uuid.UUID,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Genera una NUEVA contraseña para el admin de la empresa y se la envía por correo.
    No cambia el usuario ni el link de acceso (solo la contraseña)."""
    empresa = await _get_empresa(empresa_id, db)
    email = (empresa.email_admin or "").lower()
    res = await db.execute(
        select(Usuario).where(
            Usuario.tenant_id == empresa_id, Usuario.rol == RolUsuario.ADMIN_EMPRESA
        )
    )
    admins = list(res.scalars().all())
    admin = next((u for u in admins if u.email == email), admins[0] if admins else None)
    if admin is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "La empresa no tiene un administrador")

    nueva = generar_password()
    admin.password_hash = hash_password(nueva)
    await db.commit()

    background.add_task(
        enviar_nuevas_credenciales_empresa, admin.email, nueva, settings.url_empresa(empresa.subdominio)
    )
    return {"email_habilitado": settings.email_habilitado, "email": admin.email}


@router.get("/{empresa_id}/tests")
async def listar_tests_empresa(
    empresa_id: uuid.UUID, db: AsyncSession = Depends(get_db)
) -> List[dict]:
    """Catálogo completo, marcando alcance y estado por empresa.

    Cada item: `en_alcance` (fue añadido) y `habilitado` (activo para la empresa).
    """
    await _get_empresa(empresa_id, db)
    res = await db.execute(
        select(EmpresaTest.test_slug, EmpresaTest.habilitado).where(
            EmpresaTest.tenant_id == empresa_id
        )
    )
    estado = {slug: hab for slug, hab in res.all()}
    catalogo = engine.listar_catalogo()
    for t in catalogo:
        t["en_alcance"] = t["slug"] in estado
        t["habilitado"] = bool(estado.get(t["slug"], False))
    return catalogo


@router.put("/{empresa_id}/tests/{slug}")
async def upsert_test_empresa(
    empresa_id: uuid.UUID,
    slug: str,
    data: TestToggle,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Añade el test al alcance (si no estaba) y fija su estado habilitado."""
    await _get_empresa(empresa_id, db)
    cat = {t["slug"]: t for t in engine.listar_catalogo()}
    if slug not in cat:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "El test no existe en el catálogo")
    if not cat[slug].get("disponible", True):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ese test todavía no está disponible para asignar a empresas")

    res = await db.execute(
        select(EmpresaTest).where(
            EmpresaTest.tenant_id == empresa_id, EmpresaTest.test_slug == slug
        )
    )
    fila = res.scalar_one_or_none()
    if fila is None:
        db.add(EmpresaTest(tenant_id=empresa_id, test_slug=slug, habilitado=data.habilitado))
    else:
        fila.habilitado = data.habilitado
    await db.commit()
    return {"slug": slug, "en_alcance": True, "habilitado": data.habilitado}


@router.delete("/{empresa_id}/tests/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def quitar_test_empresa(
    empresa_id: uuid.UUID, slug: str, db: AsyncSession = Depends(get_db)
):
    """Saca el test del alcance de la empresa (borra la fila)."""
    await _get_empresa(empresa_id, db)
    res = await db.execute(
        select(EmpresaTest).where(
            EmpresaTest.tenant_id == empresa_id, EmpresaTest.test_slug == slug
        )
    )
    fila = res.scalar_one_or_none()
    if fila is not None:
        await db.delete(fila)
        await db.commit()
