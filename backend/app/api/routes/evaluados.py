"""Endpoints del Admin de Empresa: gestión de Evaluados (aislados por empresa)."""
from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant_id
from app.core.config import settings
from app.core.db import get_db
from app.core.email import enviar_invitacion_evaluado
from app.core.security import generar_password, hash_password
from app.models.area import Area
from app.models.evaluado import Evaluado
from app.models.perfil import Perfil
from app.models.tenant import Empresa
from app.schemas.evaluado import (
    TIPOS_EVALUADO,
    EvaluadoCreate,
    EvaluadoImport,
    EvaluadoOut,
    EvaluadoUpdate,
)


def _norm_tipo(tipo: str | None) -> str:
    return tipo if tipo in TIPOS_EVALUADO else "colaborador"


def _marca(emp: Empresa) -> dict:
    return {
        "razon_social": emp.razon_social,
        "logo_url": emp.logo_url,
        "color_acento": emp.color_acento,
        "color_secundario": emp.color_secundario,
    }

router = APIRouter(prefix="/evaluados", tags=["evaluados (empresa)"])


async def _validar_perfil(perfil_id: uuid.UUID, tenant_id: uuid.UUID, db: AsyncSession) -> None:
    """El perfil debe existir y pertenecer a la misma empresa."""
    perfil = await db.get(Perfil, perfil_id)
    if perfil is None or perfil.tenant_id != tenant_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "El perfil indicado no es válido para tu empresa")


async def _validar_area(area_id: uuid.UUID, tenant_id: uuid.UUID, db: AsyncSession) -> None:
    area = await db.get(Area, area_id)
    if area is None or area.tenant_id != tenant_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "El área indicada no es válida para tu empresa")


@router.get("", response_model=List[EvaluadoOut])
async def listar_evaluados(
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> List[Evaluado]:
    result = await db.execute(
        select(Evaluado).where(Evaluado.tenant_id == tenant_id).order_by(Evaluado.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("", response_model=EvaluadoOut, status_code=status.HTTP_201_CREATED)
async def crear_evaluado(
    data: EvaluadoCreate,
    background: BackgroundTasks,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> Evaluado:
    email = str(data.email).lower()
    dup = await db.execute(
        select(Evaluado).where(Evaluado.tenant_id == tenant_id, Evaluado.email == email)
    )
    if dup.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ya existe un evaluado con ese email en tu empresa")

    if data.perfil_id is not None:
        await _validar_perfil(data.perfil_id, tenant_id, db)
    if data.area_id is not None:
        await _validar_area(data.area_id, tenant_id, db)

    # Siempre tiene contraseña (para poder ingresar). Si no vino, se genera y se envía por correo.
    password_plano = data.password or generar_password()
    evaluado = Evaluado(
        tenant_id=tenant_id,
        nombre=data.nombre,
        apellido=data.apellido,
        email=email,
        tipo=_norm_tipo(data.tipo),
        perfil_id=data.perfil_id,
        area_id=data.area_id,
        password_hash=hash_password(password_plano),
        activo=True,
    )
    db.add(evaluado)
    await db.flush()  # popula id/created_at vía RETURNING, dentro de la transacción con contexto RLS
    await db.commit()

    # Invitación por correo con link + credenciales (segundo plano, best-effort).
    emp = await db.get(Empresa, tenant_id)
    if emp:
        background.add_task(
            enviar_invitacion_evaluado, _marca(emp), evaluado.nombre, email, password_plano,
            settings.url_evaluado(emp.subdominio),
        )
    return evaluado


@router.post("/{evaluado_id}/reenviar-credenciales")
async def reenviar_credenciales(
    evaluado_id: uuid.UUID,
    background: BackgroundTasks,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Genera una NUEVA contraseña temporal y reenvía la invitación por correo.

    (No se puede recuperar la contraseña anterior porque se guarda hasheada.)
    """
    evaluado = await db.get(Evaluado, evaluado_id)
    if evaluado is None or evaluado.tenant_id != tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Evaluado no encontrado")

    nueva = generar_password()
    evaluado.password_hash = hash_password(nueva)
    await db.commit()

    emp = await db.get(Empresa, tenant_id)
    if emp:
        background.add_task(
            enviar_invitacion_evaluado, _marca(emp), evaluado.nombre, evaluado.email, nueva,
            settings.url_evaluado(emp.subdominio),
        )
    return {"email_enviado": settings.email_habilitado}


@router.post("/importar")
async def importar_evaluados(
    data: EvaluadoImport,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Alta masiva de miembros. Crea el área/puesto por nombre si no existe.

    No genera contraseñas ni envía correos (son entradas de directorio; sirven como
    evaluadores de campañas). Omite los emails que ya existen.
    """
    # Índices por nombre (para reutilizar/crear áreas y perfiles).
    areas = {
        a.nombre.lower(): a
        for a in (await db.execute(select(Area).where(Area.tenant_id == tenant_id))).scalars().all()
    }
    perfiles = {
        p.nombre.lower(): p
        for p in (await db.execute(select(Perfil).where(Perfil.tenant_id == tenant_id))).scalars().all()
    }
    existentes = {
        e.lower()
        for e in (
            await db.execute(select(Evaluado.email).where(Evaluado.tenant_id == tenant_id))
        ).scalars().all()
    }

    creados, omitidos, errores = 0, 0, []
    vistos: set[str] = set()

    async def _get_area(nombre: str) -> Area:
        k = nombre.lower()
        if k not in areas:
            a = Area(tenant_id=tenant_id, nombre=nombre)
            db.add(a)
            await db.flush()
            areas[k] = a
        return areas[k]

    async def _get_perfil(nombre: str) -> Perfil:
        k = nombre.lower()
        if k not in perfiles:
            p = Perfil(tenant_id=tenant_id, nombre=nombre)
            db.add(p)
            await db.flush()
            perfiles[k] = p
        return perfiles[k]

    for item in data.items:
        email = str(item.email).lower().strip()
        if not email or not item.nombre.strip():
            errores.append({"email": email, "motivo": "Nombre o email vacío"})
            continue
        if email in existentes or email in vistos:
            omitidos += 1
            continue
        vistos.add(email)
        area = await _get_area(item.area.strip()) if (item.area and item.area.strip()) else None
        perfil = await _get_perfil(item.puesto.strip()) if (item.puesto and item.puesto.strip()) else None
        db.add(
            Evaluado(
                tenant_id=tenant_id,
                nombre=item.nombre.strip(),
                apellido=item.apellido.strip(),
                email=email,
                tipo=_norm_tipo(item.tipo),
                perfil_id=perfil.id if perfil else None,
                area_id=area.id if area else None,
                password_hash=None,
                activo=True,
            )
        )
        creados += 1

    await db.commit()
    return {"creados": creados, "omitidos": omitidos, "errores": errores}


@router.get("/{evaluado_id}", response_model=EvaluadoOut)
async def obtener_evaluado(
    evaluado_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> Evaluado:
    evaluado = await db.get(Evaluado, evaluado_id)
    if evaluado is None or evaluado.tenant_id != tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Evaluado no encontrado")
    return evaluado


@router.patch("/{evaluado_id}", response_model=EvaluadoOut)
async def actualizar_evaluado(
    evaluado_id: uuid.UUID,
    data: EvaluadoUpdate,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> Evaluado:
    evaluado = await db.get(Evaluado, evaluado_id)
    if evaluado is None or evaluado.tenant_id != tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Evaluado no encontrado")
    cambios = data.model_dump(exclude_unset=True)
    if cambios.get("perfil_id") is not None:
        await _validar_perfil(cambios["perfil_id"], tenant_id, db)
    if cambios.get("area_id") is not None:
        await _validar_area(cambios["area_id"], tenant_id, db)
    if "tipo" in cambios:
        cambios["tipo"] = _norm_tipo(cambios["tipo"])
    for campo, valor in cambios.items():
        setattr(evaluado, campo, valor)
    await db.flush()
    await db.commit()
    return evaluado


@router.delete("/{evaluado_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_evaluado(
    evaluado_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    evaluado = await db.get(Evaluado, evaluado_id)
    if evaluado is None or evaluado.tenant_id != tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Evaluado no encontrado")
    await db.delete(evaluado)
    await db.commit()
