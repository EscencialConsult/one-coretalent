"""Procesador reintentable de notificaciones persistidas en el outbox."""
from __future__ import annotations

import datetime as dt
import asyncio
import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import apply_rls_context, engine
from app.core.email import enviar_email
from app.models.evaluacion_postulante import OutboxEvento
from app.models.notificacion import Notificacion

logger = logging.getLogger("app.outbox")
MAX_INTENTOS = 5


async def procesar_evento_outbox(evento_id: uuid.UUID, tenant_id: uuid.UUID) -> None:
    async with AsyncSession(engine, expire_on_commit=False) as db:
        await apply_rls_context(db, tenant_id=tenant_id)
        evento = await db.get(OutboxEvento, evento_id, with_for_update=True)
        if evento is None or evento.estado == "procesado" or evento.intentos >= MAX_INTENTOS:
            return
        if evento.disponible_at > dt.datetime.now(dt.timezone.utc):
            return

        evento.intentos += 1
        payload = evento.payload
        try:
            if evento.tipo == "resultado_completado":
                db.add(
                    Notificacion(
                        tenant_id=tenant_id,
                        tipo="resultado_completado",
                        mensaje=payload["mensaje"],
                        link=payload["link"],
                    )
                )
                evento.estado = "procesado"
                evento.procesado_at = dt.datetime.now(dt.timezone.utc)
                evento.ultimo_error = None
            else:
                enviado = await enviar_email(
                    payload["email"],
                    payload["asunto"],
                    payload["html"],
                    payload.get("remitente"),
                )
                if not enviado:
                    raise RuntimeError("SMTP deshabilitado o envío rechazado")
                evento.estado = "procesado"
                evento.procesado_at = dt.datetime.now(dt.timezone.utc)
                evento.ultimo_error = None
        except Exception as exc:  # noqa: BLE001
            evento.estado = "pendiente" if evento.intentos < MAX_INTENTOS else "fallido"
            evento.ultimo_error = str(exc)[:2000]
            evento.disponible_at = dt.datetime.now(dt.timezone.utc) + dt.timedelta(
                minutes=2 ** min(evento.intentos, 5)
            )
            logger.warning("Outbox %s pendiente tras intento %s: %s", evento.id, evento.intentos, exc)
        await db.commit()


async def procesar_outbox_pendiente() -> int:
    """Toma un lote durable; puede invocarse múltiples veces sin duplicar procesados."""
    ahora = dt.datetime.now(dt.timezone.utc)
    async with AsyncSession(engine, expire_on_commit=False) as db:
        await apply_rls_context(db, is_superadmin=True)
        pendientes = (
            await db.execute(
                select(OutboxEvento.id, OutboxEvento.tenant_id)
                .where(
                    OutboxEvento.estado == "pendiente",
                    OutboxEvento.disponible_at <= ahora,
                    OutboxEvento.intentos < MAX_INTENTOS,
                )
                .order_by(OutboxEvento.created_at)
                .limit(25)
            )
        ).all()
    for evento_id, tenant_id in pendientes:
        await procesar_evento_outbox(evento_id, tenant_id)
    return len(pendientes)


async def ejecutar_worker_outbox() -> None:
    """Worker liviano; el estado persistido permite reinicios y reintentos con backoff."""
    while True:
        await asyncio.sleep(30)
        try:
            await procesar_outbox_pendiente()
        except asyncio.CancelledError:
            raise
        except Exception as exc:  # noqa: BLE001
            logger.error("Error en worker de outbox: %s", exc)
