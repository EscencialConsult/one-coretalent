"""Dependencias compartidas: usuario actual y guardas por rol."""
from __future__ import annotations

import uuid
from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import apply_rls_context, get_db
from app.core.security import decode_access_token
from app.models.enums import RolUsuario
from app.models.evaluado import Evaluado
from app.models.persona import Persona
from app.models.user import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
oauth2_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/persona/login", auto_error=False)

_credentials_exc = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Credenciales inválidas",
    headers={"WWW-Authenticate": "Bearer"},
)


@dataclass(frozen=True)
class ActorActual:
    tipo: str
    id: uuid.UUID
    tenant_id: uuid.UUID | None = None
    usuario: Usuario | None = None
    persona: Persona | None = None


async def get_current_actor(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> ActorActual:
    """Identidad polimórfica para recursos compartidos por empresa y Persona."""
    try:
        payload = decode_access_token(token)
        actor_id = uuid.UUID(payload.get("sub", ""))
        rol = payload.get("rol")
    except (jwt.PyJWTError, ValueError):
        raise _credentials_exc

    if rol == "persona":
        await apply_rls_context(db, persona_id=actor_id)
        persona = await db.get(Persona, actor_id)
        if persona is None or not persona.activo:
            raise _credentials_exc
        return ActorActual(tipo="persona", id=actor_id, persona=persona)

    if rol in (RolUsuario.ADMIN_EMPRESA.value, RolUsuario.SUPERADMIN.value):
        tenant_claim = payload.get("tenant_id")
        tenant_id = uuid.UUID(tenant_claim) if tenant_claim else None
        await apply_rls_context(
            db,
            tenant_id=tenant_id,
            is_superadmin=rol == RolUsuario.SUPERADMIN.value,
        )
        usuario = await db.get(Usuario, actor_id)
        if usuario is None or not usuario.activo:
            raise _credentials_exc
        return ActorActual(tipo="empresa", id=actor_id, tenant_id=tenant_id, usuario=usuario)

    raise _credentials_exc


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    try:
        payload = decode_access_token(token)
        sub = payload.get("sub")
        if not sub:
            raise _credentials_exc
        user_id = uuid.UUID(sub)
        claim_tenant = payload.get("tenant_id")
        tenant_uuid = uuid.UUID(claim_tenant) if claim_tenant else None
        is_superadmin = payload.get("rol") == RolUsuario.SUPERADMIN.value
    except (jwt.PyJWTError, ValueError):
        raise _credentials_exc

    # El JWT ya está verificado (firmado con SECRET_KEY) — sus claims son confiables.
    # Se fija el contexto de RLS ANTES de leer la fila, si no, la política la bloquearía
    # (todavía no sabríamos su tenant_id sin haberla leído: sería el mismo problema del huevo y la gallina).
    await apply_rls_context(db, tenant_id=tenant_uuid, is_superadmin=is_superadmin)
    user = await db.get(Usuario, user_id)
    if user is None or not user.activo:
        raise _credentials_exc
    return user


def require_superadmin(user: Usuario = Depends(get_current_user)) -> Usuario:
    if user.rol != RolUsuario.SUPERADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requiere rol SuperAdmin")
    return user


def require_admin_empresa(user: Usuario = Depends(get_current_user)) -> Usuario:
    if user.rol != RolUsuario.ADMIN_EMPRESA:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requiere rol Admin de Empresa")
    return user


def get_current_tenant_id(user: Usuario = Depends(require_admin_empresa)) -> uuid.UUID:
    """Empresa (tenant) del admin logueado. Garantiza el aislamiento por empresa."""
    if user.tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El administrador no tiene una empresa asociada",
        )
    return user.tenant_id


async def get_current_evaluado(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Evaluado:
    """Evaluado autenticado (token con rol 'evaluado')."""
    try:
        payload = decode_access_token(token)
        if payload.get("rol") != "evaluado":
            raise _credentials_exc
        evaluado_id = uuid.UUID(payload.get("sub", ""))
        claim_tenant = payload.get("tenant_id")
        tenant_uuid = uuid.UUID(claim_tenant) if claim_tenant else None
    except (jwt.PyJWTError, ValueError):
        raise _credentials_exc

    await apply_rls_context(db, tenant_id=tenant_uuid, is_superadmin=False)
    evaluado = await db.get(Evaluado, evaluado_id)
    if evaluado is None or not evaluado.activo:
        raise _credentials_exc
    return evaluado


async def get_current_persona(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Persona:
    """Persona autenticada (portal self-service del postulante, token con rol 'persona')."""
    try:
        payload = decode_access_token(token)
        if payload.get("rol") != "persona":
            raise _credentials_exc
        persona_id = uuid.UUID(payload.get("sub", ""))
    except (jwt.PyJWTError, ValueError):
        raise _credentials_exc

    await apply_rls_context(db, persona_id=persona_id)
    persona = await db.get(Persona, persona_id)
    if persona is None or not persona.activo:
        raise _credentials_exc
    return persona


async def get_optional_current_persona(
    token: str | None = Depends(oauth2_optional),
    db: AsyncSession = Depends(get_db),
) -> Persona | None:
    """Devuelve la Persona autenticada o None cuando la solicitud es pública."""
    if token is None:
        return None
    try:
        payload = decode_access_token(token)
        if payload.get("rol") != "persona":
            raise _credentials_exc
        persona_id = uuid.UUID(payload.get("sub", ""))
    except (jwt.PyJWTError, ValueError):
        raise _credentials_exc

    await apply_rls_context(db, persona_id=persona_id)
    persona = await db.get(Persona, persona_id)
    if persona is None or not persona.activo:
        raise _credentials_exc
    return persona
