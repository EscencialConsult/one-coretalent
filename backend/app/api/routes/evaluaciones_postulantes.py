"""Evaluación psicométrica de postulantes con progreso, reutilización y auditoría."""
from __future__ import annotations

import datetime as dt
import uuid
from html import escape
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_persona, get_current_tenant_id
from app.core import engine
from app.core.config import settings
from app.core.db import apply_rls_context, engine as db_engine, get_db
from app.core.outbox import procesar_evento_outbox
from app.models.asignacion import Asignacion
from app.models.empresa_test import EmpresaTest
from app.models.evaluacion_postulante import AccesoResultado, EventoEvaluacion, OutboxEvento
from app.models.evaluado import Evaluado
from app.models.persona import Persona
from app.models.postulacion import Postulacion
from app.models.resultado import Resultado
from app.models.tenant import Empresa
from app.models.vacante import Vacante
from app.schemas.evaluacion_postulante import (
    EvaluacionPostulanteCreate,
    EvaluacionResumenOut,
    FinalizarEvaluacionIn,
    IniciarEvaluacionIn,
    ProgresoOut,
    RespuestasProgresoIn,
    ResultadoResumenOut,
)

router = APIRouter(tags=["evaluaciones de postulantes"])


def _ahora() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def _catalogo() -> dict[str, dict[str, Any]]:
    return {item["slug"]: item for item in engine.listar_catalogo()}


async def _postulacion_propia(
    vacante_id: uuid.UUID,
    postulacion_id: uuid.UUID,
    tenant_id: uuid.UUID,
    db: AsyncSession,
) -> tuple[Vacante, Postulacion, Persona]:
    fila = (
        await db.execute(
            select(Vacante, Postulacion, Persona)
            .join(Postulacion, Postulacion.vacante_id == Vacante.id)
            .join(Persona, Persona.id == Postulacion.persona_id)
            .where(
                Vacante.id == vacante_id,
                Vacante.tenant_id == tenant_id,
                Postulacion.id == postulacion_id,
                Postulacion.tenant_id == tenant_id,
            )
        )
    ).one_or_none()
    if fila is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Postulación no encontrada para esa vacante")
    return fila


async def _resultado_global(persona_id: uuid.UUID, slug: str) -> Resultado | None:
    """Lectura elevada, acotada a identidad+test; nunca expone el resultado al caller."""
    async with AsyncSession(db_engine, expire_on_commit=False) as db:
        await apply_rls_context(db, is_superadmin=True)
        return (
            await db.execute(
                select(Resultado)
                .where(Resultado.persona_id == persona_id, Resultado.test_slug == slug)
                .order_by(Resultado.created_at.desc())
                .limit(1)
            )
        ).scalar_one_or_none()


async def _evaluado_para_persona(
    persona: Persona, tenant_id: uuid.UUID, db: AsyncSession
) -> Evaluado:
    evaluado = (
        await db.execute(
            select(Evaluado).where(
                Evaluado.tenant_id == tenant_id,
                Evaluado.persona_id == persona.id,
            )
        )
    ).scalar_one_or_none()
    if evaluado:
        return evaluado
    por_email = (
        await db.execute(
            select(Evaluado).where(Evaluado.tenant_id == tenant_id, Evaluado.email == persona.email)
        )
    ).scalar_one_or_none()
    if por_email:
        if por_email.persona_id not in (None, persona.id):
            raise HTTPException(status.HTTP_409_CONFLICT, "El email ya pertenece a otro evaluado")
        por_email.persona_id = persona.id
        por_email.tipo = "postulante"
        return por_email
    evaluado = Evaluado(
        tenant_id=tenant_id,
        persona_id=persona.id,
        tipo="postulante",
        nombre=persona.nombre,
        apellido=persona.apellido,
        email=persona.email,
    )
    db.add(evaluado)
    await db.flush()
    return evaluado


async def _acceso_de_asignacion(asignacion_id: uuid.UUID, db: AsyncSession) -> AccesoResultado | None:
    return (
        await db.execute(select(AccesoResultado).where(AccesoResultado.asignacion_id == asignacion_id))
    ).scalar_one_or_none()


_SIN_PRECARGAR = object()


async def _resumen(
    asignacion: Asignacion,
    db: AsyncSession,
    *,
    acceso: AccesoResultado | None = _SIN_PRECARGAR,  # type: ignore[assignment]
    empresa: Empresa | None = _SIN_PRECARGAR,  # type: ignore[assignment]
) -> EvaluacionResumenOut:
    if acceso is _SIN_PRECARGAR:
        acceso = await _acceso_de_asignacion(asignacion.id, db)
    if empresa is _SIN_PRECARGAR:
        empresa = await db.get(Empresa, asignacion.tenant_id)
    meta = _catalogo().get(asignacion.test_slug, {})
    resultado_id = None if acceso and acceso.revocado_at else (
        asignacion.resultado_reutilizado_id or (acceso.resultado_id if acceso else None)
    )
    return EvaluacionResumenOut(
        id=asignacion.id,
        test_slug=asignacion.test_slug,
        test_nombre=meta.get("nombre", asignacion.test_slug),
        estado=asignacion.estado,
        reutilizada=asignacion.resultado_reutilizado_id is not None,
        resultado_id=resultado_id,
        acceso_resultado_id=acceso.id if acceso else None,
        acceso_revocado=bool(acceso and acceso.revocado_at),
        iniciada_at=asignacion.iniciada_at,
        progreso_guardado_at=asignacion.progreso_guardado_at,
        finalizada_at=asignacion.finalizada_at,
        created_at=asignacion.created_at,
        empresa_nombre=empresa.razon_social if empresa else None,
        empresa_logo_url=empresa.logo_url if empresa else None,
        empresa_color_acento=empresa.color_acento if empresa else None,
        empresa_color_secundario=empresa.color_secundario if empresa else None,
    )


async def _resumenes(asignaciones: list[Asignacion], db: AsyncSession) -> list[EvaluacionResumenOut]:
    """Versión en lote de `_resumen`: evita 1 query de AccesoResultado + 1 de Empresa por fila."""
    if not asignaciones:
        return []
    ids = [a.id for a in asignaciones]
    accesos = (
        await db.execute(select(AccesoResultado).where(AccesoResultado.asignacion_id.in_(ids)))
    ).scalars().all()
    acceso_por_asignacion = {a.asignacion_id: a for a in accesos}
    tenant_ids = {a.tenant_id for a in asignaciones}
    empresas = (await db.execute(select(Empresa).where(Empresa.id.in_(tenant_ids)))).scalars().all()
    empresa_por_id = {e.id: e for e in empresas}
    return [
        await _resumen(
            a, db,
            acceso=acceso_por_asignacion.get(a.id),
            empresa=empresa_por_id.get(a.tenant_id),
        )
        for a in asignaciones
    ]


def _auditar(
    *,
    tenant_id: uuid.UUID,
    persona_id: uuid.UUID,
    actor_tipo: str,
    actor_id: uuid.UUID,
    accion: str,
    asignacion_id: uuid.UUID | None = None,
    resultado_id: uuid.UUID | None = None,
    acceso_id: uuid.UUID | None = None,
    detalle: dict | None = None,
) -> EventoEvaluacion:
    return EventoEvaluacion(
        tenant_id=tenant_id,
        persona_id=persona_id,
        actor_tipo=actor_tipo,
        actor_id=actor_id,
        accion=accion,
        asignacion_id=asignacion_id,
        resultado_id=resultado_id,
        acceso_id=acceso_id,
        detalle=detalle,
    )


def _outbox_asignacion(
    tenant_id: uuid.UUID, persona: Persona, empresa: Empresa | None, test_nombre: str
) -> OutboxEvento:
    razon = empresa.razon_social if empresa else "una empresa"
    link = f"{settings.PUBLIC_BASE_URL.rstrip('/')}/login-candidato"
    html = (
        f"<p>Hola {escape(persona.nombre)}, <b>{escape(razon)}</b> te asignó "
        f"la evaluación <b>{escape(test_nombre)}</b>.</p>"
        f'<p><a href="{escape(link)}">Ingresar a mis evaluaciones</a></p>'
    )
    return OutboxEvento(
        tenant_id=tenant_id,
        persona_id=persona.id,
        tipo="evaluacion_asignada",
        payload={
            "email": persona.email,
            "asunto": f"Nueva evaluación · {razon}",
            "html": html,
            "remitente": razon,
        },
    )


@router.post(
    "/vacantes/{vacante_id}/postulaciones/{postulacion_id}/evaluaciones",
    response_model=EvaluacionResumenOut,
    status_code=status.HTTP_201_CREATED,
)
async def asignar_evaluacion_postulante(
    vacante_id: uuid.UUID,
    postulacion_id: uuid.UUID,
    data: EvaluacionPostulanteCreate,
    background: BackgroundTasks,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> EvaluacionResumenOut:
    _, postulacion, persona = await _postulacion_propia(
        vacante_id, postulacion_id, tenant_id, db
    )
    catalogo = _catalogo()
    meta = catalogo.get(data.test_slug)
    if meta is None or not meta.get("tomable") or not meta.get("disponible"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "El test no está disponible en el catálogo")
    licencia = (
        await db.execute(
            select(EmpresaTest).where(
                EmpresaTest.tenant_id == tenant_id,
                EmpresaTest.test_slug == data.test_slug,
                EmpresaTest.habilitado.is_(True),
            )
        )
    ).scalar_one_or_none()
    if licencia is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "La empresa no tiene habilitado ese test")

    evaluado = await _evaluado_para_persona(persona, tenant_id, db)
    duplicada = (
        await db.execute(
            select(Asignacion).where(
                Asignacion.evaluado_id == evaluado.id,
                Asignacion.test_slug == data.test_slug,
            )
        )
    ).scalar_one_or_none()
    if duplicada:
        raise HTTPException(status.HTTP_409_CONFLICT, "La evaluación ya fue asignada")

    catalogo_version, algoritmo_version = engine.versiones(data.test_slug)
    existente = await _resultado_global(postulacion.persona_id, data.test_slug)
    ahora = _ahora()
    asignacion = Asignacion(
        tenant_id=tenant_id,
        evaluado_id=evaluado.id,
        persona_id=postulacion.persona_id,
        postulacion_id=postulacion.id,
        test_slug=data.test_slug,
        estado="completado" if existente else "pendiente",
        finalizada_at=ahora if existente else None,
        catalogo_version=catalogo_version,
        algoritmo_version=algoritmo_version,
        resultado_reutilizado_id=existente.id if existente else None,
    )
    db.add(asignacion)
    await db.flush()

    acceso = None
    if existente:
        acceso = AccesoResultado(
            tenant_id=tenant_id,
            resultado_id=existente.id,
            persona_id=postulacion.persona_id,
            postulacion_id=postulacion.id,
            asignacion_id=asignacion.id,
        )
        db.add(acceso)
        await db.flush()

    accion = "resultado_reutilizado" if existente else "asignacion_creada"
    db.add(_auditar(
        tenant_id=tenant_id,
        persona_id=postulacion.persona_id,
        actor_tipo="empresa",
        actor_id=tenant_id,
        accion=accion,
        asignacion_id=asignacion.id,
        resultado_id=existente.id if existente else None,
        acceso_id=acceso.id if acceso else None,
        detalle={"test_slug": data.test_slug, "vacante_id": str(vacante_id)},
    ))
    empresa = await db.get(Empresa, tenant_id)
    evento_outbox = _outbox_asignacion(tenant_id, persona, empresa, meta["nombre"])
    db.add(evento_outbox)
    await db.flush()
    resumen = await _resumen(asignacion, db)
    await db.commit()
    background.add_task(procesar_evento_outbox, evento_outbox.id, tenant_id)
    return resumen


@router.get(
    "/vacantes/{vacante_id}/postulaciones/{postulacion_id}/evaluaciones",
    response_model=list[EvaluacionResumenOut],
)
async def listar_evaluaciones_postulante(
    vacante_id: uuid.UUID,
    postulacion_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> list[EvaluacionResumenOut]:
    _, postulacion, _ = await _postulacion_propia(vacante_id, postulacion_id, tenant_id, db)
    asignaciones = (
        await db.execute(
            select(Asignacion)
            .where(
                Asignacion.postulacion_id == postulacion.id,
                Asignacion.tenant_id == tenant_id,
            )
            .order_by(Asignacion.created_at.desc())
        )
    ).scalars().all()
    return await _resumenes(list(asignaciones), db)


@router.get("/personas/me/evaluaciones", response_model=list[EvaluacionResumenOut])
async def mis_evaluaciones(
    persona: Persona = Depends(get_current_persona),
    db: AsyncSession = Depends(get_db),
) -> list[EvaluacionResumenOut]:
    asignaciones = (
        await db.execute(
            select(Asignacion)
            .where(Asignacion.persona_id == persona.id)
            .order_by(Asignacion.created_at.desc())
        )
    ).scalars().all()
    return await _resumenes(list(asignaciones), db)


@router.get("/personas/me/resultados", response_model=list[ResultadoResumenOut])
async def mis_resultados(
    persona: Persona = Depends(get_current_persona),
    db: AsyncSession = Depends(get_db),
) -> list[ResultadoResumenOut]:
    resultados = (
        await db.execute(
            select(Resultado)
            .where(Resultado.persona_id == persona.id)
            .order_by(Resultado.created_at.desc())
        )
    ).scalars().all()
    catalogo = _catalogo()
    return [
        ResultadoResumenOut(
            id=item.id,
            test_slug=item.test_slug,
            test_nombre=catalogo.get(item.test_slug, {}).get("nombre", item.test_slug),
            catalogo_version=item.catalogo_version,
            algoritmo_version=item.algoritmo_version,
            created_at=item.created_at,
        )
        for item in resultados
    ]


async def _asignacion_persona(
    asignacion_id: uuid.UUID, persona: Persona, db: AsyncSession, *, bloquear: bool = False
) -> Asignacion:
    consulta = select(Asignacion).where(
        Asignacion.id == asignacion_id, Asignacion.persona_id == persona.id
    )
    if bloquear:
        consulta = consulta.with_for_update()
    asignacion = (await db.execute(consulta)).scalar_one_or_none()
    if asignacion is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Asignación no encontrada")
    return asignacion


@router.post("/asignaciones/{asignacion_id}/iniciar", response_model=ProgresoOut)
async def iniciar_evaluacion(
    asignacion_id: uuid.UUID,
    data: IniciarEvaluacionIn,
    persona: Persona = Depends(get_current_persona),
    db: AsyncSession = Depends(get_db),
) -> ProgresoOut:
    asignacion = await _asignacion_persona(asignacion_id, persona, db, bloquear=True)
    if asignacion.estado == "completado":
        raise HTTPException(status.HTTP_409_CONFLICT, "La evaluación ya fue finalizada")
    if not data.acepta_consentimiento:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Debés aceptar el consentimiento para iniciar")
    if asignacion.iniciada_at is None:
        asignacion.iniciada_at = _ahora()
        asignacion.consentida_at = asignacion.iniciada_at
        asignacion.estado = "en_progreso"
        db.add(_auditar(
            tenant_id=asignacion.tenant_id, persona_id=persona.id, actor_tipo="persona",
            actor_id=persona.id, accion="evaluacion_iniciada", asignacion_id=asignacion.id,
        ))
        await db.commit()
    return ProgresoOut(
        id=asignacion.id,
        estado=asignacion.estado,
        respuestas=asignacion.respuestas_parciales or {},
        progreso_guardado_at=asignacion.progreso_guardado_at,
    )


@router.post("/asignaciones/{asignacion_id}/respuestas", response_model=ProgresoOut)
async def guardar_respuestas(
    asignacion_id: uuid.UUID,
    data: RespuestasProgresoIn,
    persona: Persona = Depends(get_current_persona),
    db: AsyncSession = Depends(get_db),
) -> ProgresoOut:
    asignacion = await _asignacion_persona(asignacion_id, persona, db, bloquear=True)
    if asignacion.estado == "completado":
        raise HTTPException(status.HTTP_409_CONFLICT, "La evaluación ya fue finalizada")
    ahora = _ahora()
    if asignacion.iniciada_at is None:
        asignacion.iniciada_at = ahora
    asignacion.estado = "en_progreso"
    asignacion.respuestas_parciales = data.respuestas
    asignacion.progreso_guardado_at = ahora
    db.add(_auditar(
        tenant_id=asignacion.tenant_id, persona_id=persona.id, actor_tipo="persona",
        actor_id=persona.id, accion="progreso_guardado", asignacion_id=asignacion.id,
        detalle={"cantidad_respuestas": len(data.respuestas)},
    ))
    await db.commit()
    return ProgresoOut(
        id=asignacion.id,
        estado=asignacion.estado,
        respuestas=asignacion.respuestas_parciales,
        progreso_guardado_at=asignacion.progreso_guardado_at,
    )


@router.post("/asignaciones/{asignacion_id}/finalizar", response_model=EvaluacionResumenOut)
async def finalizar_evaluacion(
    asignacion_id: uuid.UUID,
    background: BackgroundTasks,
    data: FinalizarEvaluacionIn | None = None,
    persona: Persona = Depends(get_current_persona),
    db: AsyncSession = Depends(get_db),
) -> EvaluacionResumenOut:
    asignacion = await _asignacion_persona(asignacion_id, persona, db, bloquear=True)
    if asignacion.estado == "completado":
        # Un reintento por doble clic, timeout o pérdida de la respuesta HTTP
        # devuelve el resultado persistido sin volver a ejecutar el scoring.
        return await _resumen(asignacion, db)
    respuestas = data.respuestas if data and data.respuestas is not None else asignacion.respuestas_parciales
    if not respuestas:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No hay respuestas guardadas para finalizar")

    # Serializa finalizaciones concurrentes de la misma Persona+test incluso entre tenants.
    await db.execute(
        text("SELECT pg_advisory_xact_lock(hashtext(:clave))"),
        {"clave": f"{persona.id}:{asignacion.test_slug}"},
    )
    existente = (
        await db.execute(
            select(Resultado)
            .where(
                Resultado.persona_id == persona.id,
                Resultado.test_slug == asignacion.test_slug,
            )
            .order_by(Resultado.created_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    ahora = _ahora()
    if existente:
        resultado = existente
        asignacion.resultado_reutilizado_id = resultado.id
        accion = "resultado_reutilizado"
    else:
        try:
            datos = engine.calcular(asignacion.test_slug, respuestas)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Respuestas inválidas: {exc}")
        catalogo_version, algoritmo_version = engine.versiones(asignacion.test_slug)
        resultado = Resultado(
            tenant_id=asignacion.tenant_id,
            evaluado_id=asignacion.evaluado_id,
            persona_id=persona.id,
            test_slug=asignacion.test_slug,
            datos=datos,
            catalogo_version=catalogo_version,
            algoritmo_version=algoritmo_version,
        )
        db.add(resultado)
        await db.flush()
        accion = "evaluacion_finalizada"

    asignacion.estado = "completado"
    asignacion.respuestas_parciales = None
    asignacion.progreso_guardado_at = ahora
    asignacion.finalizada_at = ahora
    acceso = AccesoResultado(
        tenant_id=asignacion.tenant_id,
        resultado_id=resultado.id,
        persona_id=persona.id,
        postulacion_id=asignacion.postulacion_id,
        asignacion_id=asignacion.id,
    )
    db.add(acceso)
    await db.flush()
    db.add(_auditar(
        tenant_id=asignacion.tenant_id, persona_id=persona.id, actor_tipo="persona",
        actor_id=persona.id, accion=accion, asignacion_id=asignacion.id,
        resultado_id=resultado.id, acceso_id=acceso.id,
        detalle={
            "test_slug": asignacion.test_slug,
            "catalogo_version": resultado.catalogo_version,
            "algoritmo_version": resultado.algoritmo_version,
        },
    ))
    evento_outbox = OutboxEvento(
        tenant_id=asignacion.tenant_id,
        persona_id=persona.id,
        tipo="resultado_completado",
        payload={
            "mensaje": f"{persona.nombre} {persona.apellido} completó "
            f"{_catalogo().get(asignacion.test_slug, {}).get('nombre', asignacion.test_slug)}",
            "link": f"/empresa/informe/{resultado.id}",
        },
    )
    db.add(evento_outbox)
    await db.flush()
    resumen = await _resumen(asignacion, db)
    await db.commit()
    background.add_task(procesar_evento_outbox, evento_outbox.id, asignacion.tenant_id)
    return resumen


@router.post("/accesos-resultados/{acceso_id}/revocar", response_model=EvaluacionResumenOut)
async def revocar_acceso_resultado(
    acceso_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> EvaluacionResumenOut:
    acceso = (
        await db.execute(
            select(AccesoResultado)
            .where(AccesoResultado.id == acceso_id, AccesoResultado.tenant_id == tenant_id)
            .with_for_update()
        )
    ).scalar_one_or_none()
    if acceso is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Acceso no encontrado")
    if acceso.revocado_at is None:
        acceso.revocado_at = _ahora()
        db.add(_auditar(
            tenant_id=tenant_id, persona_id=acceso.persona_id, actor_tipo="empresa",
            actor_id=tenant_id, accion="acceso_revocado", asignacion_id=acceso.asignacion_id,
            resultado_id=acceso.resultado_id, acceso_id=acceso.id,
        ))
    asignacion = await db.get(Asignacion, acceso.asignacion_id)
    resumen = await _resumen(asignacion, db)
    await db.commit()
    return resumen
