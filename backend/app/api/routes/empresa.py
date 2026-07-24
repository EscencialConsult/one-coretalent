"""Endpoints del propio Admin de Empresa: su empresa (white-label) y sus tests habilitados."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant_id
from app.core import engine
from app.core.db import get_db
from app.models.area import Area
from app.models.asignacion import Asignacion
from app.models.empresa_test import EmpresaTest
from app.models.evaluado import Evaluado
from app.models.notificacion import Notificacion
from app.models.perfil import Perfil
from app.models.resultado import Resultado
from app.models.tenant import Empresa
from app.schemas.empresa import EmpresaOut

router = APIRouter(prefix="/empresa", tags=["empresa (admin)"])


@router.get("/me", response_model=EmpresaOut)
async def mi_empresa(
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> Empresa:
    empresa = await db.get(Empresa, tenant_id)
    if empresa is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa no encontrada")
    return empresa


@router.get("/tests")
async def mis_tests(
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> List[dict]:
    """Tests habilitados (en alcance y activos) para la empresa del admin logueado."""
    res = await db.execute(
        select(EmpresaTest.test_slug).where(
            EmpresaTest.tenant_id == tenant_id, EmpresaTest.habilitado.is_(True)
        )
    )
    habilitados = set(res.scalars().all())
    return [t for t in engine.listar_catalogo() if t["slug"] in habilitados]


def _estado_evaluado(asignadas: int, completadas: int) -> str:
    if asignadas == 0:
        return "sin_asignar"
    if completadas >= asignadas:
        return "completado"
    if completadas > 0:
        return "en_curso"
    return "sin_iniciar"


@router.get("/evaluados")
async def evaluados_resumen(
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> List[dict]:
    """Evaluados de la empresa con su perfil y el avance de sus pruebas."""
    evs = list(
        (
            await db.execute(
                select(Evaluado).where(Evaluado.tenant_id == tenant_id).order_by(Evaluado.created_at.desc())
            )
        ).scalars().all()
    )
    perfiles = dict(
        (await db.execute(select(Perfil.id, Perfil.nombre).where(Perfil.tenant_id == tenant_id))).all()
    )
    areas = dict(
        (await db.execute(select(Area.id, Area.nombre).where(Area.tenant_id == tenant_id))).all()
    )
    asig = dict(
        (
            await db.execute(
                select(Asignacion.evaluado_id, func.count())
                .where(Asignacion.tenant_id == tenant_id)
                .group_by(Asignacion.evaluado_id)
            )
        ).all()
    )
    comp = dict(
        (
            await db.execute(
                select(Asignacion.evaluado_id, func.count())
                .where(Asignacion.tenant_id == tenant_id, Asignacion.estado == "completado")
                .group_by(Asignacion.evaluado_id)
            )
        ).all()
    )
    out = []
    for e in evs:
        a = asig.get(e.id, 0)
        c = comp.get(e.id, 0)
        out.append(
            {
                "id": str(e.id),
                "nombre": e.nombre,
                "apellido": e.apellido,
                "email": e.email,
                "activo": e.activo,
                "tipo": e.tipo,
                "perfil_id": str(e.perfil_id) if e.perfil_id else None,
                "perfil_nombre": perfiles.get(e.perfil_id) if e.perfil_id else None,
                "area_id": str(e.area_id) if e.area_id else None,
                "area_nombre": areas.get(e.area_id) if e.area_id else None,
                "asignadas": a,
                "completadas": c,
                "estado": _estado_evaluado(a, c),
            }
        )
    return out


_MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]


@router.get("/resumen")
async def resumen(
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    # Estado por evaluado (mismo criterio que la tabla de Evaluados).
    ev_ids = list(
        (await db.execute(select(Evaluado.id).where(Evaluado.tenant_id == tenant_id))).scalars().all()
    )
    evaluados = len(ev_ids)
    asig_por_ev = dict(
        (
            await db.execute(
                select(Asignacion.evaluado_id, func.count())
                .where(Asignacion.tenant_id == tenant_id)
                .group_by(Asignacion.evaluado_id)
            )
        ).all()
    )
    comp_por_ev = dict(
        (
            await db.execute(
                select(Asignacion.evaluado_id, func.count())
                .where(Asignacion.tenant_id == tenant_id, Asignacion.estado == "completado")
                .group_by(Asignacion.evaluado_id)
            )
        ).all()
    )
    por_estado = {"sin_iniciar": 0, "en_curso": 0, "completado": 0, "sin_asignar": 0}
    for eid in ev_ids:
        por_estado[_estado_evaluado(asig_por_ev.get(eid, 0), comp_por_ev.get(eid, 0))] += 1

    asignadas = sum(asig_por_ev.values())
    completadas = sum(comp_por_ev.values())

    cat = {t["slug"]: t["nombre"] for t in engine.listar_catalogo()}
    top_rows = (
        await db.execute(
            select(Asignacion.test_slug, func.count().label("n"))
            .where(Asignacion.tenant_id == tenant_id)
            .group_by(Asignacion.test_slug)
            .order_by(func.count().desc())
            .limit(5)
        )
    ).all()
    mas_asignadas = [{"slug": s, "nombre": cat.get(s, s), "n": n} for s, n in top_rows]

    rec_rows = (
        await db.execute(
            select(Resultado, Evaluado)
            .join(Evaluado, Resultado.evaluado_id == Evaluado.id)
            .where(Resultado.tenant_id == tenant_id)
            .order_by(Resultado.created_at.desc())
            .limit(6)
        )
    ).all()
    actividad = [
        {
            "resultado_id": str(r.id),
            "evaluado": f"{ev.nombre} {ev.apellido}",
            "test_nombre": cat.get(r.test_slug, r.test_slug),
            "fecha": r.created_at.isoformat(),
        }
        for r, ev in rec_rows
    ]

    # Evaluaciones completadas por mes (últimos 7 meses, datos reales).
    fechas = list(
        (
            await db.execute(select(Resultado.created_at).where(Resultado.tenant_id == tenant_id))
        ).scalars().all()
    )
    hoy = datetime.now(timezone.utc)
    meses: list[dict] = []
    conteo: dict[tuple[int, int], int] = {}
    y, m = hoy.year, hoy.month
    claves: list[tuple[int, int]] = []
    for _ in range(7):
        claves.append((y, m))
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    claves.reverse()
    for f in fechas:
        conteo[(f.year, f.month)] = conteo.get((f.year, f.month), 0) + 1
    for (yy, mm) in claves:
        meses.append({"label": _MESES[mm - 1], "n": conteo.get((yy, mm), 0)})

    return {
        "evaluados": evaluados,
        "por_estado": por_estado,
        "asignadas": asignadas,
        "completadas": completadas,
        "pendientes": asignadas - completadas,
        "mas_asignadas": mas_asignadas,
        "actividad_reciente": actividad,
        "completadas_por_mes": meses,
    }


@router.get("/notificaciones")
async def listar_notificaciones(
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Avisos in-app de la empresa (30 más recientes) + cantidad sin leer."""
    filas = list(
        (
            await db.execute(
                select(Notificacion)
                .where(Notificacion.tenant_id == tenant_id)
                .order_by(Notificacion.created_at.desc())
                .limit(30)
            )
        ).scalars().all()
    )
    no_leidas = (
        await db.execute(
            select(func.count())
            .select_from(Notificacion)
            .where(Notificacion.tenant_id == tenant_id, Notificacion.leido.is_(False))
        )
    ).scalar() or 0
    return {
        "no_leidas": no_leidas,
        "items": [
            {
                "id": str(n.id),
                "tipo": n.tipo,
                "mensaje": n.mensaje,
                "link": n.link,
                "leido": n.leido,
                "fecha": n.created_at.isoformat(),
            }
            for n in filas
        ],
    }


@router.post("/notificaciones/marcar-leidas")
async def marcar_notificaciones_leidas(
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await db.execute(
        update(Notificacion)
        .where(Notificacion.tenant_id == tenant_id, Notificacion.leido.is_(False))
        .values(leido=True)
    )
    await db.commit()
    return {"ok": True}
