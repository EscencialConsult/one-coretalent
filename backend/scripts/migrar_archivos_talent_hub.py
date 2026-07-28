"""Fase 2 de la migración del Talent Hub: baja los archivos (CVs, firmas) que
todavía viven en Google Drive y los sube a Supabase Storage, actualizando
Persona.cv_url / firma_*_url y Postulacion.firma_*_url con la ruta nueva.

Requiere que la fase 1 (migrar_talent_hub.py --commit) ya haya corrido.

Uso:
    python -m scripts.migrar_archivos_talent_hub --dir <carpeta con los csv>              (dry-run)
    python -m scripts.migrar_archivos_talent_hub --dir <carpeta con los csv> --commit     (sube de verdad)
"""
from __future__ import annotations

import argparse
import asyncio
import csv
import re
import sys
import time
from pathlib import Path

import httpx
from sqlalchemy import select

from app.core.db import SessionLocal, apply_rls_context
from app.core.storage import subir_archivo
from app.models.persona import Persona
from app.models.postulacion import Postulacion
from app.models.vacante import Vacante

sys.stdout.reconfigure(encoding="utf-8")

_INVISIBLES = re.compile(r"[​‌‍﻿]")


def limpiar_email(valor: str | None) -> str:
    return _INVISIBLES.sub("", (valor or "")).strip().lower()


def leer_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


_RE_DRIVE_FILE = re.compile(r"drive\.google\.com/file/d/([\w-]+)")
_RE_DOCS = re.compile(r"docs\.google\.com/(document|spreadsheets|presentation)/d/([\w-]+)")

_EXPORT_FORMATO = {"document": "pdf", "spreadsheets": "pdf", "presentation": "pdf"}
_CONTENT_TYPE = {"pdf": "application/pdf"}


def _url_descarga(url: str) -> tuple[str, str] | None:
    """Devuelve (url_descarga, content_type) o None si no reconoce el link."""
    m = _RE_DRIVE_FILE.search(url)
    if m:
        return f"https://drive.google.com/uc?export=download&id={m.group(1)}", ""  # content-type lo da la respuesta
    m = _RE_DOCS.search(url)
    if m:
        tipo, file_id = m.group(1), m.group(2)
        fmt = _EXPORT_FORMATO[tipo]
        return f"https://docs.google.com/{tipo}/d/{file_id}/export?format={fmt}", _CONTENT_TYPE[fmt]
    return None


async def _descargar(client: httpx.AsyncClient, url: str) -> tuple[bytes, str] | None:
    info = _url_descarga(url)
    if info is None:
        return None
    descarga_url, content_type_forzado = info
    try:
        resp = await client.get(descarga_url, timeout=30.0, follow_redirects=True)
        resp.raise_for_status()
    except httpx.HTTPError:
        return None
    if not resp.content or len(resp.content) < 50:
        return None
    content_type = content_type_forzado or resp.headers.get("content-type", "application/octet-stream").split(";")[0]
    return resp.content, content_type


async def migrar(directorio: Path, commit: bool) -> None:
    perfiles_csv = leer_csv(directorio / "Perfiles.csv")
    postulantes_csv = leer_csv(directorio / "Postulantes.csv")

    resumen = {"personas_ok": [], "personas_error": [], "postulaciones_ok": [], "postulaciones_error": []}

    async with httpx.AsyncClient() as client, SessionLocal() as db:
        await apply_rls_context(db, tenant_id=None, is_superadmin=True)

        # ── Personas: CV + firma consentimiento + firma conformidad ──────────
        for fila in perfiles_csv:
            email = limpiar_email(fila.get("Email"))
            if not email or (fila.get("Apellido") or "").strip().lower() == "prueba":
                continue
            persona = (
                await db.execute(select(Persona).where(Persona.email == email))
            ).scalar_one_or_none()
            if persona is None:
                resumen["personas_error"].append(f"{email} (no existe en la base — ¿corriste la fase 1?)")
                continue

            cambios = []
            pares = [
                ("CVUrl", "cvs", fila.get("CVNombre") or "cv", "cv_url"),
                ("FirmaConsentimientoUrl", "firmas", "consentimiento.png", "firma_consentimiento_url"),
                ("FirmaConformidadUrl", "firmas", "conformidad.png", "firma_conformidad_url"),
            ]
            for columna, bucket, nombre, campo_modelo in pares:
                url_legacy = (fila.get(columna) or "").strip()
                if not url_legacy or getattr(persona, campo_modelo):
                    continue  # sin link, o ya migrado antes
                descarga = await _descargar(client, url_legacy)
                if descarga is None:
                    resumen["personas_error"].append(f"{email} -> {columna} (no se pudo bajar de Drive)")
                    continue
                contenido, content_type = descarga
                cambios.append((campo_modelo, bucket, contenido, content_type, nombre))

            if not cambios:
                continue
            resumen["personas_ok"].append(f"{email} ({len(cambios)} archivo(s))")
            if commit:
                for campo_modelo, bucket, contenido, content_type, nombre in cambios:
                    ruta = await subir_archivo(bucket, contenido, content_type, nombre)
                    setattr(persona, campo_modelo, ruta)
                await db.flush()
            time.sleep(0.3)  # no golpear Drive muy rápido

        # ── Postulaciones: firma consentimiento + firma conformidad ─────────
        for fila in postulantes_csv:
            email = limpiar_email(fila.get("Email"))
            legacy_busqueda_id = (fila.get("BusquedaID") or "").strip()
            if not email or not legacy_busqueda_id:
                continue
            persona = (
                await db.execute(select(Persona).where(Persona.email == email))
            ).scalar_one_or_none()
            try:
                import uuid as _uuid
                vac_uuid = _uuid.UUID(legacy_busqueda_id)
            except ValueError:
                continue
            vacante = await db.get(Vacante, vac_uuid)
            if persona is None or vacante is None:
                continue
            postulacion = (
                await db.execute(
                    select(Postulacion).where(
                        Postulacion.persona_id == persona.id, Postulacion.vacante_id == vac_uuid
                    )
                )
            ).scalar_one_or_none()
            if postulacion is None:
                continue

            cambios = []
            pares = [
                ("FirmaConsentimientoUrl", "consentimiento.png", "firma_consentimiento_url"),
                ("FirmaConformidadUrl", "conformidad.png", "firma_conformidad_url"),
            ]
            for columna, nombre, campo_modelo in pares:
                url_legacy = (fila.get(columna) or "").strip()
                if not url_legacy or getattr(postulacion, campo_modelo):
                    continue
                descarga = await _descargar(client, url_legacy)
                if descarga is None:
                    resumen["postulaciones_error"].append(f"{email} -> {columna} (no se pudo bajar de Drive)")
                    continue
                contenido, content_type = descarga
                cambios.append((campo_modelo, contenido, content_type, nombre))

            if not cambios:
                continue
            resumen["postulaciones_ok"].append(f"{email} -> {fila.get('BusquedaPuesto')} ({len(cambios)} archivo(s))")
            if commit:
                for campo_modelo, contenido, content_type, nombre in cambios:
                    ruta = await subir_archivo("firmas", contenido, content_type, nombre)
                    setattr(postulacion, campo_modelo, ruta)
                await db.flush()
            time.sleep(0.3)

        if commit:
            await db.commit()
            print("=== COMMIT REALIZADO ===\n")
        else:
            await db.rollback()
            print("=== DRY-RUN (no se escribió nada) ===\n")

    for clave, items in resumen.items():
        print(f"--- {clave} ({len(items)}) ---")
        for item in items:
            print(f"  {item}")
        print()


def main() -> None:
    parser = argparse.ArgumentParser(description="Migra los archivos (CVs/firmas) del Talent Hub legacy")
    parser.add_argument("--dir", required=True, type=Path)
    parser.add_argument("--commit", action="store_true")
    args = parser.parse_args()
    asyncio.run(migrar(args.dir, args.commit))


if __name__ == "__main__":
    main()
