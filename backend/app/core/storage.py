"""Cliente mínimo para Supabase Storage (reemplaza Google Drive del legacy de Talent Hub).

Los buckets son PRIVADOS (a diferencia de Drive con "cualquiera con el link", que fue
señalado como debilidad al analizar Talent Hub) — el backend sube con la service_role
key (server-side únicamente) y genera URLs firmadas de corta duración cuando alguien
autorizado necesita ver un archivo.
"""
from __future__ import annotations

import uuid

import httpx
from fastapi import HTTPException, status

from app.core.config import settings

_TIMEOUT = 30.0

# Cliente compartido con keep-alive: crear un httpx.AsyncClient por llamada repetía el
# handshake TLS con Supabase en cada request (era la causa real de que /postulaciones
# tardara varios segundos en responder solo por firmar la URL del CV).
_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=_TIMEOUT)
    return _client


class StorageNoConfigurado(RuntimeError):
    pass


def _base_url() -> str:
    if not settings.storage_habilitado:
        raise StorageNoConfigurado("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no están configurados")
    return f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1"


def _headers(content_type: str | None = None) -> dict[str, str]:
    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
    }
    if content_type:
        headers["Content-Type"] = content_type
    return headers


async def subir_archivo(bucket: str, contenido: bytes, content_type: str, nombre_original: str = "") -> str:
    """Sube un archivo con un nombre aleatorio (evita colisiones y que se pueda adivinar
    la ruta de otra persona). Devuelve la ruta interna "bucket/archivo.ext", no una URL
    pública — hay que pedir una url_firmada() para verlo."""
    ext = ""
    if "." in nombre_original:
        ext = "." + nombre_original.rsplit(".", 1)[-1].lower()[:10]
    path = f"{uuid.uuid4().hex}{ext}"
    client = _get_client()
    try:
        resp = await client.post(
            f"{_base_url()}/object/{bucket}/{path}",
            headers=_headers(content_type),
            content=contenido,
        )
        resp.raise_for_status()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY, f"No se pudo subir el archivo a Storage: {e.response.text}"
        ) from e
    except httpx.HTTPError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "No se pudo conectar con Storage") from e
    return f"{bucket}/{path}"


async def url_firmada(ruta: str, expira_segundos: int = 3600) -> str:
    """URL temporal para ver un archivo privado (ej. el admin de empresa revisando un CV)."""
    bucket, _, path = ruta.partition("/")
    client = _get_client()
    try:
        resp = await client.post(
            f"{_base_url()}/object/sign/{bucket}/{path}",
            headers=_headers(),
            json={"expiresIn": expira_segundos},
        )
        resp.raise_for_status()
    except httpx.HTTPError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "No se pudo generar el link del archivo") from e
    signed_path = resp.json()["signedURL"]
    return f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1{signed_path}"
