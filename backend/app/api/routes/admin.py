"""Métricas globales para el panel SuperAdmin (dashboard) + aprobación de empresas
auto-registradas (ver publico.py:registro_empresa)."""
from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_superadmin
from app.core import engine
from app.core.config import settings
from app.core.db import get_db
from app.core.email import enviar_empresa_aprobada, enviar_empresa_rechazada
from app.core.storage import url_firmada
from app.models.empresa_test import EmpresaTest  # noqa: F401 (asegura metadata)
from app.models.enums import EstadoEmpresa
from app.models.evaluacion_postulante import EventoEvaluacion
from app.models.evaluado import Evaluado
from app.models.persona import Persona
from app.models.postulacion import Postulacion
from app.models.resultado import Resultado
from app.models.tenant import Empresa
from app.models.vacante import Vacante

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_superadmin)])


@router.get("/resumen")
async def resumen(db: AsyncSession = Depends(get_db)) -> dict:
    empresas = (await db.execute(select(func.count()).select_from(Empresa))).scalar() or 0
    activas = (
        await db.execute(
            select(func.count()).select_from(Empresa).where(Empresa.estado == EstadoEmpresa.ACTIVO)
        )
    ).scalar() or 0
    evaluados = (await db.execute(select(func.count()).select_from(Evaluado))).scalar() or 0
    resultados = (await db.execute(select(func.count()).select_from(Resultado))).scalar() or 0

    cat = engine.listar_catalogo()
    catmap = {t["slug"]: t["nombre"] for t in cat}
    rows = (
        await db.execute(
            select(Resultado.test_slug, func.count().label("n"))
            .group_by(Resultado.test_slug)
            .order_by(func.count().desc())
            .limit(5)
        )
    ).all()
    top = [{"slug": s, "nombre": catmap.get(s, s), "n": n} for s, n in rows]

    return {
        "empresas": empresas,
        "empresas_activas": activas,
        "evaluados": evaluados,
        "resultados": resultados,
        "tests_catalogo": len(cat),
        "tests_tomables": sum(1 for t in cat if t.get("tomable")),
        "tests_mas_usados": top,
    }


# ── Aprobación de empresas auto-registradas (ver publico.py:registro_empresa) ─────────────
async def _get_empresa_pendiente(empresa_id: uuid.UUID, db: AsyncSession) -> Empresa:
    empresa = await db.get(Empresa, empresa_id)
    if empresa is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa no encontrada")
    if empresa.estado != EstadoEmpresa.PENDIENTE_VERIFICACION:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Esta empresa no está pendiente de verificación")
    return empresa


@router.get("/empresas-pendientes")
async def listar_empresas_pendientes(db: AsyncSession = Depends(get_db)) -> List[dict]:
    """Empresas auto-registradas esperando revisión manual — igual que admin.html legacy,
    la verificación automática solo chequea formato (DNI de 8 dígitos, archivos presentes),
    la aprobación real la hace siempre una persona."""
    res = await db.execute(
        select(Empresa)
        .where(Empresa.estado == EstadoEmpresa.PENDIENTE_VERIFICACION)
        .order_by(Empresa.created_at)
    )
    empresas = list(res.scalars().all())
    salida = []
    for e in empresas:
        salida.append(
            {
                "id": str(e.id),
                "razon_social": e.razon_social,
                "subdominio": e.subdominio,
                "email_admin": e.email_admin,
                "cuit": e.cuit,
                "rubro": e.rubro,
                "dni": e.dni,
                "selfie_url": await url_firmada(e.selfie_url) if e.selfie_url else None,
                "firma_legal_url": await url_firmada(e.firma_legal_url) if e.firma_legal_url else None,
                "dni_frente_url": await url_firmada(e.dni_frente_url) if e.dni_frente_url else None,
                "dni_dorso_url": await url_firmada(e.dni_dorso_url) if e.dni_dorso_url else None,
                "created_at": e.created_at.isoformat(),
            }
        )
    return salida


@router.post("/empresas-pendientes/{empresa_id}/aprobar")
async def aprobar_empresa(
    empresa_id: uuid.UUID, background: BackgroundTasks, db: AsyncSession = Depends(get_db)
) -> dict:
    empresa = await _get_empresa_pendiente(empresa_id, db)
    empresa.nombre_verificado = empresa.razon_social
    empresa.estado = EstadoEmpresa.ACTIVO
    await db.commit()
    background.add_task(
        enviar_empresa_aprobada, empresa.email_admin, empresa.razon_social, settings.url_empresa(empresa.subdominio)
    )
    return {"ok": True, "estado": empresa.estado.value}


@router.post("/empresas-pendientes/{empresa_id}/rechazar")
async def rechazar_empresa(
    empresa_id: uuid.UUID, background: BackgroundTasks, db: AsyncSession = Depends(get_db)
) -> dict:
    empresa = await _get_empresa_pendiente(empresa_id, db)
    empresa.estado = EstadoEmpresa.RECHAZADA
    await db.commit()
    background.add_task(enviar_empresa_rechazada, empresa.email_admin, empresa.razon_social)
    return {"ok": True, "estado": empresa.estado.value}


# ── Postulantes (Persona), global — equivalente a la pestaña "Postulantes" de admin.html legacy ──
@router.get("/postulantes")
async def listar_postulantes_global(q: str | None = None, db: AsyncSession = Depends(get_db)) -> List[dict]:
    consulta = select(Persona).order_by(Persona.created_at.desc())
    if q:
        patron = f"%{q.strip()}%"
        consulta = consulta.where(
            (Persona.nombre.ilike(patron))
            | (Persona.apellido.ilike(patron))
            | (Persona.email.ilike(patron))
            | (Persona.puesto_deseado.ilike(patron))
        )
    personas = list((await db.execute(consulta)).scalars().all())

    conteo = dict(
        (
            await db.execute(
                select(Postulacion.persona_id, func.count())
                .where(Postulacion.persona_id.in_([p.id for p in personas]))
                .group_by(Postulacion.persona_id)
            )
        ).all()
    ) if personas else {}

    return [
        {
            "id": str(p.id),
            "nombre": p.nombre,
            "apellido": p.apellido,
            "email": p.email,
            "telefono": p.telefono,
            "puesto_deseado": p.puesto_deseado,
            "provincia": p.provincia,
            "postulaciones": conteo.get(p.id, 0),
            "activo": p.activo,
            "created_at": p.created_at.isoformat(),
        }
        for p in personas
    ]


# ── Búsquedas (Vacante), global — equivalente a la pestaña "Búsquedas" de admin.html legacy ──
@router.get("/vacantes")
async def listar_vacantes_global(q: str | None = None, db: AsyncSession = Depends(get_db)) -> List[dict]:
    consulta = (
        select(Vacante, Empresa.razon_social)
        .join(Empresa, Empresa.id == Vacante.tenant_id)
        .order_by(Vacante.created_at.desc())
    )
    if q:
        patron = f"%{q.strip()}%"
        consulta = consulta.where((Vacante.puesto.ilike(patron)) | (Empresa.razon_social.ilike(patron)))
    filas = (await db.execute(consulta)).all()

    ids = [v.id for v, _ in filas]
    conteo = dict(
        (
            await db.execute(
                select(Postulacion.vacante_id, func.count())
                .where(Postulacion.vacante_id.in_(ids))
                .group_by(Postulacion.vacante_id)
            )
        ).all()
    ) if ids else {}

    return [
        {
            "id": str(v.id),
            "puesto": v.puesto,
            "empresa": razon_social,
            "estado": v.estado,
            "modalidad": v.modalidad,
            "provincia": v.provincia,
            "localidad": v.localidad,
            "vacantes": v.vacantes,
            "postulaciones": conteo.get(v.id, 0),
            "created_at": v.created_at.isoformat(),
        }
        for v, razon_social in filas
    ]


# ── Auditoría, global — reusa evento_evaluacion (ya registra quién hizo qué sobre
# evaluaciones/resultados); es la única traza de auditoría que existe hoy en el backend ──
@router.get("/auditoria")
async def listar_auditoria(db: AsyncSession = Depends(get_db)) -> List[dict]:
    consulta = (
        select(EventoEvaluacion, Empresa.razon_social, Persona.nombre, Persona.apellido)
        .outerjoin(Empresa, Empresa.id == EventoEvaluacion.tenant_id)
        .outerjoin(Persona, Persona.id == EventoEvaluacion.persona_id)
        .order_by(EventoEvaluacion.created_at.desc())
        .limit(500)
    )
    filas = (await db.execute(consulta)).all()
    return [
        {
            "id": str(evento.id),
            "accion": evento.accion,
            "actor_tipo": evento.actor_tipo,
            "actor_id": str(evento.actor_id) if evento.actor_id else None,
            "empresa": razon_social,
            "persona": f"{nombre} {apellido}".strip() if nombre else None,
            "detalle": evento.detalle,
            "created_at": evento.created_at.isoformat(),
        }
        for evento, razon_social, nombre, apellido in filas
    ]
