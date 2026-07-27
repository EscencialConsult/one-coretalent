"""Módulo de Evaluaciones — Fase A/2: formularios (constructor).

Dos routers:
  · SuperAdmin → plantillas GLOBALES (tenant_id NULL, es_plantilla=True).
  · Admin Empresa → formularios PROPIOS + ver plantillas globales para clonar.
"""
from __future__ import annotations

import secrets
import uuid
from collections import defaultdict
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant_id, require_superadmin
from app.core.config import settings
from app.core.db import apply_rls_context, apply_rls_pre_auth, get_db
from app.core.email import enviar_invitacion_evaluador360
from app.models.evaluacion import (
    ESCALA_LIKERT,
    ESCALA_SINO,
    TIPO_360,
    TIPO_CLIENTES,
    EvalCampania,
    EvalCompetencia,
    EvalEvaluador,
    EvalFormulario,
    EvalPregunta,
)
from app.models.tenant import Empresa
from app.schemas.evaluacion import (
    ESCALAS_VALIDAS,
    RELACION_OBSERVADOR,
    RELACIONES_360,
    TIPOS_VALIDOS,
    CampaniaIn,
    CampaniaPatch,
    CompetenciaIn,
    EvaluadorIn,
    FormularioIn,
    RespuestaPublicaIn,
)

TIPO_TEXTO = {
    "personas_360": "evaluación 360°",
    "areas": "evaluación de área/departamento",
    "procesos": "evaluación de proceso",
    "clientes": "encuesta de satisfacción de clientes",
}


def _marca(emp: Empresa) -> dict:
    return {
        "razon_social": emp.razon_social,
        "logo_url": emp.logo_url,
        "color_acento": emp.color_acento,
        "color_secundario": emp.color_secundario,
    }


async def _formulario_dict(db: AsyncSession, form: EvalFormulario, full: bool = True) -> dict:
    comps = list(
        (
            await db.execute(
                select(EvalCompetencia)
                .where(EvalCompetencia.formulario_id == form.id)
                .order_by(EvalCompetencia.orden)
            )
        ).scalars().all()
    )
    out_comps = []
    n_preg = 0
    for c in comps:
        pregs = list(
            (
                await db.execute(
                    select(EvalPregunta)
                    .where(EvalPregunta.competencia_id == c.id)
                    .order_by(EvalPregunta.orden)
                )
            ).scalars().all()
        )
        n_preg += len(pregs)
        if full:
            out_comps.append({
                "id": str(c.id), "nombre": c.nombre, "descripcion": c.descripcion, "orden": c.orden,
                "preguntas": [{"id": str(p.id), "texto": p.texto, "orden": p.orden} for p in pregs],
            })
    base = {
        "id": str(form.id),
        "tenant_id": str(form.tenant_id) if form.tenant_id else None,
        "nombre": form.nombre,
        "descripcion": form.descripcion,
        "tipo": form.tipo,
        "escala": form.escala,
        "es_plantilla": form.es_plantilla,
        "n_competencias": len(comps),
        "n_preguntas": n_preg,
    }
    if full:
        base["competencias"] = out_comps
    return base


def _validar(data: FormularioIn) -> None:
    if data.tipo not in TIPOS_VALIDOS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tipo de formulario inválido")
    if data.escala not in ESCALAS_VALIDAS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Escala inválida")


async def _set_estructura(db: AsyncSession, form: EvalFormulario, competencias: List[CompetenciaIn]) -> None:
    """Reemplaza competencias+preguntas del formulario (full replace, ideal para un builder)."""
    existentes = list(
        (await db.execute(select(EvalCompetencia).where(EvalCompetencia.formulario_id == form.id))).scalars().all()
    )
    for c in existentes:
        await db.delete(c)  # el FK ondelete=CASCADE borra sus preguntas
    await db.flush()
    for ci, comp in enumerate(competencias):
        c = EvalCompetencia(
            formulario_id=form.id, nombre=comp.nombre, descripcion=comp.descripcion, orden=comp.orden or ci
        )
        db.add(c)
        await db.flush()
        for pi, preg in enumerate(comp.preguntas):
            db.add(EvalPregunta(competencia_id=c.id, texto=preg.texto, orden=preg.orden or pi))


# ══════════════════════ SuperAdmin — plantillas globales ══════════════════════
router_admin = APIRouter(
    prefix="/admin/eval-formularios",
    tags=["evaluaciones (superadmin)"],
    dependencies=[Depends(require_superadmin)],
)


async def _get_plantilla(form_id: uuid.UUID, db: AsyncSession) -> EvalFormulario:
    form = await db.get(EvalFormulario, form_id)
    if form is None or form.tenant_id is not None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Plantilla no encontrada")
    return form


@router_admin.get("")
async def listar_plantillas(db: AsyncSession = Depends(get_db)) -> List[dict]:
    forms = list(
        (
            await db.execute(
                select(EvalFormulario)
                .where(EvalFormulario.tenant_id.is_(None))
                .order_by(EvalFormulario.created_at.desc())
            )
        ).scalars().all()
    )
    return [await _formulario_dict(db, f, full=False) for f in forms]


@router_admin.post("", status_code=status.HTTP_201_CREATED)
async def crear_plantilla(data: FormularioIn, db: AsyncSession = Depends(get_db)) -> dict:
    _validar(data)
    form = EvalFormulario(
        tenant_id=None, nombre=data.nombre, descripcion=data.descripcion,
        tipo=data.tipo, escala=data.escala, es_plantilla=True,
    )
    db.add(form)
    await db.flush()
    await _set_estructura(db, form, data.competencias)
    await db.commit()
    return await _formulario_dict(db, form)


@router_admin.get("/{form_id}")
async def obtener_plantilla(form_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> dict:
    return await _formulario_dict(db, await _get_plantilla(form_id, db))


@router_admin.put("/{form_id}")
async def actualizar_plantilla(form_id: uuid.UUID, data: FormularioIn, db: AsyncSession = Depends(get_db)) -> dict:
    _validar(data)
    form = await _get_plantilla(form_id, db)
    form.nombre = data.nombre
    form.descripcion = data.descripcion
    form.tipo = data.tipo
    form.escala = data.escala
    await _set_estructura(db, form, data.competencias)
    await db.commit()
    return await _formulario_dict(db, form)


@router_admin.delete("/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_plantilla(form_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    form = await _get_plantilla(form_id, db)
    await db.delete(form)
    await db.commit()


# ══════════════════════ Admin Empresa — formularios propios ═══════════════════
router_emp = APIRouter(prefix="/empresa", tags=["evaluaciones (empresa)"])


async def _get_form_empresa(form_id: uuid.UUID, tenant_id: uuid.UUID, db: AsyncSession) -> EvalFormulario:
    form = await db.get(EvalFormulario, form_id)
    if form is None or form.tenant_id != tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Formulario no encontrado")
    return form


@router_emp.get("/eval-plantillas")
async def plantillas_disponibles(
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> List[dict]:
    """Plantillas globales del SuperAdmin, para usar o clonar (incluye la estructura)."""
    forms = list(
        (
            await db.execute(
                select(EvalFormulario)
                .where(EvalFormulario.tenant_id.is_(None))
                .order_by(EvalFormulario.nombre)
            )
        ).scalars().all()
    )
    return [await _formulario_dict(db, f) for f in forms]


@router_emp.get("/eval-formularios")
async def mis_formularios(
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> List[dict]:
    forms = list(
        (
            await db.execute(
                select(EvalFormulario)
                .where(EvalFormulario.tenant_id == tenant_id)
                .order_by(EvalFormulario.created_at.desc())
            )
        ).scalars().all()
    )
    return [await _formulario_dict(db, f, full=False) for f in forms]


@router_emp.post("/eval-formularios", status_code=status.HTTP_201_CREATED)
async def crear_formulario(
    data: FormularioIn,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    _validar(data)
    form = EvalFormulario(
        tenant_id=tenant_id, nombre=data.nombre, descripcion=data.descripcion,
        tipo=data.tipo, escala=data.escala, es_plantilla=False,
    )
    db.add(form)
    await db.flush()
    await _set_estructura(db, form, data.competencias)
    await db.commit()
    return await _formulario_dict(db, form)


@router_emp.get("/eval-formularios/{form_id}")
async def obtener_formulario(
    form_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await _formulario_dict(db, await _get_form_empresa(form_id, tenant_id, db))


@router_emp.put("/eval-formularios/{form_id}")
async def actualizar_formulario(
    form_id: uuid.UUID,
    data: FormularioIn,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    _validar(data)
    form = await _get_form_empresa(form_id, tenant_id, db)
    form.nombre = data.nombre
    form.descripcion = data.descripcion
    form.tipo = data.tipo
    form.escala = data.escala
    await _set_estructura(db, form, data.competencias)
    await db.commit()
    return await _formulario_dict(db, form)


@router_emp.delete("/eval-formularios/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_formulario(
    form_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    form = await _get_form_empresa(form_id, tenant_id, db)
    await db.delete(form)
    await db.commit()


# ══════════════════════ Campañas (Admin Empresa) ═════════════════════════════
def _evaluador_dict(e: EvalEvaluador) -> dict:
    return {
        "id": str(e.id),
        "relacion": e.relacion,
        "nombre": e.nombre,
        "email": e.email,
        "estado": e.estado,
        "fecha_respuesta": e.fecha_respuesta.isoformat() if e.fecha_respuesta else None,
        "link": settings.url_eval(e.token),
    }


async def _campania_dict(
    db: AsyncSession, camp: EvalCampania, full: bool = False, conteos: tuple[int, int] | None = None
) -> dict:
    if conteos is not None:
        tot, comp = conteos
    else:
        tot = (
            await db.execute(select(func.count()).select_from(EvalEvaluador).where(EvalEvaluador.campania_id == camp.id))
        ).scalar() or 0
        comp = (
            await db.execute(
                select(func.count()).select_from(EvalEvaluador).where(
                    EvalEvaluador.campania_id == camp.id, EvalEvaluador.estado == "completado"
                )
            )
        ).scalar() or 0
    base = {
        "id": str(camp.id),
        "nombre": camp.nombre,
        "tipo": camp.tipo,
        "escala": camp.escala,
        "estado": camp.estado,
        "sujeto_nombre": camp.sujeto_nombre,
        "anonimato_min": camp.anonimato_min,
        "n_evaluadores": tot,
        "n_completados": comp,
        "created_at": camp.created_at.isoformat(),
    }
    if full:
        base["estructura"] = camp.estructura
        evs = list(
            (
                await db.execute(
                    select(EvalEvaluador).where(EvalEvaluador.campania_id == camp.id).order_by(EvalEvaluador.created_at)
                )
            ).scalars().all()
        )
        base["evaluadores"] = [_evaluador_dict(e) for e in evs]
    return base


async def _get_campania(cid: uuid.UUID, tenant_id: uuid.UUID, db: AsyncSession) -> EvalCampania:
    camp = await db.get(EvalCampania, cid)
    if camp is None or camp.tenant_id != tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Campaña no encontrada")
    return camp


def _rel_valida(tipo: str, relacion: str) -> str:
    if tipo == TIPO_360:
        if relacion not in RELACIONES_360:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Relación inválida para 360°")
        return relacion
    if tipo == TIPO_CLIENTES:
        return "cliente"
    return RELACION_OBSERVADOR


def _uuid_opt(v):
    if not v:
        return None
    try:
        return uuid.UUID(v)
    except (ValueError, TypeError):
        return None


@router_emp.get("/eval-campanias")
async def listar_campanias(
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> List[dict]:
    camps = list(
        (
            await db.execute(
                select(EvalCampania).where(EvalCampania.tenant_id == tenant_id).order_by(EvalCampania.created_at.desc())
            )
        ).scalars().all()
    )
    if not camps:
        return []
    ids = [c.id for c in camps]
    filas = (
        await db.execute(
            select(
                EvalEvaluador.campania_id,
                func.count(),
                func.count().filter(EvalEvaluador.estado == "completado"),
            )
            .where(EvalEvaluador.campania_id.in_(ids))
            .group_by(EvalEvaluador.campania_id)
        )
    ).all()
    conteos = {cid: (tot, comp) for cid, tot, comp in filas}
    return [await _campania_dict(db, c, conteos=conteos.get(c.id, (0, 0))) for c in camps]


@router_emp.post("/eval-campanias", status_code=status.HTTP_201_CREATED)
async def crear_campania(
    data: CampaniaIn,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    form_id = _uuid_opt(data.formulario_id)
    if form_id is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Formulario inválido")
    form = await _get_form_empresa(form_id, tenant_id, db)
    fdict = await _formulario_dict(db, form)
    if not fdict["competencias"]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "El formulario no tiene preguntas")

    camp = EvalCampania(
        tenant_id=tenant_id,
        nombre=data.nombre,
        tipo=form.tipo,
        escala=form.escala,
        estructura={"competencias": fdict["competencias"]},
        formulario_id=form.id,
        sujeto_nombre=data.sujeto_nombre,
        sujeto_evaluado_id=_uuid_opt(data.sujeto_evaluado_id),
        estado="borrador",
        anonimato_min=max(1, data.anonimato_min),
    )
    db.add(camp)
    await db.flush()
    for ev in data.evaluadores:
        db.add(
            EvalEvaluador(
                tenant_id=tenant_id,
                campania_id=camp.id,
                relacion=_rel_valida(form.tipo, ev.relacion),
                nombre=ev.nombre,
                email=str(ev.email).lower(),
                evaluado_id=_uuid_opt(ev.evaluado_id),
                token=secrets.token_urlsafe(24),
                estado="pendiente",
            )
        )
    await db.commit()
    return await _campania_dict(db, camp, full=True)


@router_emp.get("/eval-campanias/{cid}")
async def obtener_campania(
    cid: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await _campania_dict(db, await _get_campania(cid, tenant_id, db), full=True)


@router_emp.post("/eval-campanias/{cid}/lanzar")
async def lanzar_campania(
    cid: uuid.UUID,
    background: BackgroundTasks,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    camp = await _get_campania(cid, tenant_id, db)
    evs = list(
        (
            await db.execute(
                select(EvalEvaluador).where(
                    EvalEvaluador.campania_id == camp.id, EvalEvaluador.estado == "pendiente"
                )
            )
        ).scalars().all()
    )
    total = (
        await db.execute(select(func.count()).select_from(EvalEvaluador).where(EvalEvaluador.campania_id == camp.id))
    ).scalar() or 0
    if total == 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Agregá al menos un evaluador antes de lanzar")

    emp = await db.get(Empresa, tenant_id)
    marca = _marca(emp) if emp else {}
    tipo_texto = TIPO_TEXTO.get(camp.tipo, "evaluación")
    for e in evs:
        background.add_task(
            enviar_invitacion_evaluador360, marca, e.email, e.nombre, camp.sujeto_nombre,
            tipo_texto, settings.url_eval(e.token),
        )
    camp.estado = "abierta"
    await db.commit()
    return {"email_habilitado": settings.email_habilitado, "enviados": len(evs)}


@router_emp.patch("/eval-campanias/{cid}")
async def actualizar_campania(
    cid: uuid.UUID,
    data: CampaniaPatch,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    camp = await _get_campania(cid, tenant_id, db)
    if data.nombre is not None:
        camp.nombre = data.nombre
    if data.anonimato_min is not None:
        camp.anonimato_min = max(1, data.anonimato_min)
    await db.commit()
    return await _campania_dict(db, camp, full=True)


@router_emp.post("/eval-campanias/{cid}/cerrar")
async def cerrar_campania(
    cid: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    camp = await _get_campania(cid, tenant_id, db)
    camp.estado = "cerrada"
    await db.commit()
    return {"ok": True}


@router_emp.post("/eval-campanias/{cid}/reabrir")
async def reabrir_campania(
    cid: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Reabre una campaña cerrada: los pendientes/nuevos pueden responder. Quienes ya
    respondieron NO la repiten (el endpoint público bloquea a los completados)."""
    camp = await _get_campania(cid, tenant_id, db)
    camp.estado = "abierta"
    await db.commit()
    return {"ok": True}


@router_emp.delete("/eval-campanias/{cid}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_campania(
    cid: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    camp = await _get_campania(cid, tenant_id, db)
    await db.delete(camp)
    await db.commit()


@router_emp.post("/eval-campanias/{cid}/evaluadores", status_code=status.HTTP_201_CREATED)
async def agregar_evaluador(
    cid: uuid.UUID,
    data: EvaluadorIn,
    background: BackgroundTasks,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    camp = await _get_campania(cid, tenant_id, db)
    e = EvalEvaluador(
        tenant_id=tenant_id,
        campania_id=camp.id,
        relacion=_rel_valida(camp.tipo, data.relacion),
        nombre=data.nombre,
        email=str(data.email).lower(),
        evaluado_id=_uuid_opt(data.evaluado_id),
        token=secrets.token_urlsafe(24),
        estado="pendiente",
    )
    db.add(e)
    await db.flush()  # popula id/created_at vía RETURNING, dentro de la transacción con contexto RLS
    await db.commit()
    # Si la campaña ya está abierta, se le envía el correo al toque.
    if camp.estado == "abierta":
        emp = await db.get(Empresa, tenant_id)
        if emp:
            background.add_task(
                enviar_invitacion_evaluador360, _marca(emp), e.email, e.nombre, camp.sujeto_nombre,
                TIPO_TEXTO.get(camp.tipo, "evaluación"), settings.url_eval(e.token),
            )
    return _evaluador_dict(e)


async def _get_evaluador(eid: uuid.UUID, tenant_id: uuid.UUID, db: AsyncSession) -> EvalEvaluador:
    e = await db.get(EvalEvaluador, eid)
    if e is None or e.tenant_id != tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Evaluador no encontrado")
    return e


@router_emp.delete("/eval-evaluadores/{eid}", status_code=status.HTTP_204_NO_CONTENT)
async def quitar_evaluador(
    eid: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    e = await _get_evaluador(eid, tenant_id, db)
    await db.delete(e)
    await db.commit()


@router_emp.post("/eval-evaluadores/{eid}/reenviar")
async def reenviar_evaluador(
    eid: uuid.UUID,
    background: BackgroundTasks,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    e = await _get_evaluador(eid, tenant_id, db)
    camp = await db.get(EvalCampania, e.campania_id)
    emp = await db.get(Empresa, tenant_id)
    if emp and camp:
        background.add_task(
            enviar_invitacion_evaluador360, _marca(emp), e.email, e.nombre, camp.sujeto_nombre,
            TIPO_TEXTO.get(camp.tipo, "evaluación"), settings.url_eval(e.token),
        )
    return {"email_habilitado": settings.email_habilitado}


REL_LABEL = {"auto": "Autoevaluación", "supervisor": "Supervisor", "par": "Pares", "reporte": "Reportes", "observador": "Observadores", "cliente": "Clientes"}


def _informe(camp: EvalCampania, evs: list) -> dict:
    """Agregación DETERMINISTA (promedios / % de cumplimiento), respetando el anonimato."""
    comps = (camp.estructura or {}).get("competencias", [])
    completos = [e for e in evs if e.estado == "completado" and e.respuestas]
    por_rel: dict[str, list] = defaultdict(list)
    for e in completos:
        por_rel[e.relacion].append(e)

    min_anon = max(1, camp.anonimato_min or 3)
    es360 = camp.tipo == TIPO_360
    es_sino = camp.escala == ESCALA_SINO  # solo Sí/No usa % de cumplimiento; likert y satisfacción son numéricas 1-5

    def mostrado(rel: str, n: int) -> bool:
        # auto y supervisor siempre se muestran; el resto requiere N mínimo (anonimato).
        return rel in ("auto", "supervisor") or n >= min_anon

    def promedio(comp: dict, lst: list):
        pids = [p["id"] for p in comp.get("preguntas", [])]
        vals = [
            v for e in lst for pid in pids
            if isinstance((v := (e.respuestas or {}).get(pid)), (int, float))
        ]
        return round(sum(vals) / len(vals), 2) if vals else None

    grupos = [
        {"relacion": rel, "label": REL_LABEL.get(rel, rel), "n": len(lst), "mostrado": mostrado(rel, len(lst))}
        for rel, lst in por_rel.items()
    ]

    comps_out = []
    for comp in comps:
        row = {"nombre": comp.get("nombre", ""), "por_grupo": {}}
        for rel, lst in por_rel.items():
            if mostrado(rel, len(lst)):
                a = promedio(comp, lst)
                if a is not None:
                    row["por_grupo"][rel] = round(a * 100) if es_sino else a
        if es360:
            auto = promedio(comp, por_rel.get("auto", []))
            otros_lst = por_rel.get("supervisor", []) + por_rel.get("par", []) + por_rel.get("reporte", [])
            otros = promedio(comp, otros_lst) if len(otros_lst) >= min_anon else None
            row["auto"] = auto
            row["otros"] = otros
            row["gap"] = round(auto - otros, 2) if (auto is not None and otros is not None) else None
            row["promedio"] = otros if otros is not None else auto
        else:
            # No-360 (áreas / procesos / clientes): un solo grupo (observador o cliente).
            prom = promedio(comp, completos) if len(completos) >= min_anon else None
            row["promedio"] = round(prom * 100) if (es_sino and prom is not None) else prom
        comps_out.append(row)

    # Detalle por pregunta (procesos / Sí-No): % de cumplimiento por ítem.
    preguntas_out = []
    if es_sino:
        obs = completos
        if len(obs) >= min_anon:
            for comp in comps:
                for p in comp.get("preguntas", []):
                    vals = [
                        v for e in obs
                        if isinstance((v := (e.respuestas or {}).get(p["id"])), (int, float))
                    ]
                    if vals:
                        preguntas_out.append({
                            "competencia": comp.get("nombre", ""), "texto": p.get("texto", ""),
                            "cumplimiento": round(sum(vals) / len(vals) * 100), "n": len(vals),
                        })

    return {
        "campania": {
            "nombre": camp.nombre, "tipo": camp.tipo, "escala": camp.escala,
            "sujeto_nombre": camp.sujeto_nombre, "estado": camp.estado,
            "n_completados": len(completos), "n_evaluadores": len(evs), "anonimato_min": min_anon,
        },
        "es360": es360,
        "escala": camp.escala,
        "grupos": grupos,
        "competencias": comps_out,
        "preguntas": preguntas_out,
    }


@router_emp.get("/eval-campanias/{cid}/informe")
async def informe_campania(
    cid: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    camp = await _get_campania(cid, tenant_id, db)
    evs = list(
        (await db.execute(select(EvalEvaluador).where(EvalEvaluador.campania_id == camp.id))).scalars().all()
    )
    emp = await db.get(Empresa, tenant_id)
    data = _informe(camp, evs)
    data["marca"] = _marca(emp) if emp else None
    return data


# ══════════════════════ Responder (público, por token) ═══════════════════════
router_pub = APIRouter(prefix="/publico", tags=["evaluaciones (público)"])


async def _evaluador_por_token(token: str, db: AsyncSession) -> EvalEvaluador:
    # Búsqueda pública por token: todavía no sabemos el tenant (por eso el bypass acotado).
    # Apenas se resuelve, se fija el tenant real para el resto del request (campaña, guardado, etc.).
    await apply_rls_pre_auth(db)
    e = (
        await db.execute(select(EvalEvaluador).where(EvalEvaluador.token == token))
    ).scalar_one_or_none()
    if e is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Enlace inválido o vencido")
    await apply_rls_context(db, tenant_id=e.tenant_id, is_superadmin=False)
    return e


@router_pub.get("/eval/{token}")
async def responder_info(token: str, db: AsyncSession = Depends(get_db)) -> dict:
    e = await _evaluador_por_token(token, db)
    camp = await db.get(EvalCampania, e.campania_id)
    emp = await db.get(Empresa, e.tenant_id)
    return {
        "estado_campania": camp.estado if camp else "cerrada",
        "ya_respondido": e.estado == "completado",
        "evaluador_nombre": e.nombre,
        "relacion": e.relacion,
        "sujeto_nombre": camp.sujeto_nombre if camp else "",
        "tipo": camp.tipo if camp else "",
        "escala": camp.escala if camp else ESCALA_LIKERT,
        "estructura": camp.estructura if camp else {"competencias": []},
        "marca": _marca(emp) if emp else None,
    }


@router_pub.post("/eval/{token}")
async def responder_enviar(
    token: str, data: RespuestaPublicaIn, db: AsyncSession = Depends(get_db)
) -> dict:
    e = await _evaluador_por_token(token, db)
    camp = await db.get(EvalCampania, e.campania_id)
    if camp is None or camp.estado != "abierta":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Esta evaluación no está disponible")
    if e.estado == "completado":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ya enviaste tus respuestas")

    ids = [p["id"] for c in camp.estructura.get("competencias", []) for p in c.get("preguntas", [])]
    lo, hi = (0, 1) if camp.escala == ESCALA_SINO else (1, 5)  # sino: 0-1 · likert/satisfacción: 1-5
    limpio: dict = {}
    for pid in ids:
        v = data.respuestas.get(pid)
        if not isinstance(v, int) or v < lo or v > hi:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Faltan respuestas o hay un valor inválido")
        limpio[pid] = v

    e.respuestas = limpio
    e.estado = "completado"
    e.fecha_respuesta = datetime.now(timezone.utc)
    await db.commit()
    return {"ok": True}
