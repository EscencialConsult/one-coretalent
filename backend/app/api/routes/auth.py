"""Autenticación: login (JWT) y datos del usuario actual."""

import datetime as dt

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_persona, get_current_user
from app.core.config import settings
from app.core.db import apply_rls_pre_auth, get_db
from app.core.email import enviar_recuperacion_password
from app.core.rate_limit import limiter
from app.core.security import create_access_token, generar_token_recuperacion, hash_password, verify_password
from app.models.evaluado import Evaluado
from app.models.persona import Persona
from app.models.tenant import Empresa
from app.models.user import Usuario
from app.schemas.auth import PersonaAuthOut, Token, UsuarioOut

router = APIRouter(prefix="/auth", tags=["auth"])

RECUPERACION_VIGENCIA = dt.timedelta(hours=1)
_MENSAJE_RECUPERACION_GENERICO = {
    "ok": True,
    "detail": "Si el email existe en nuestro sistema, vas a recibir un enlace para restablecer tu contraseña.",
}


class CambiarPasswordIn(BaseModel):
    password_actual: str
    password_nueva: str = Field(min_length=8)


class RecuperarPasswordIn(BaseModel):
    email: EmailStr


class RestablecerPasswordIn(BaseModel):
    token: str
    password: str = Field(min_length=8)


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(
    request: Request,
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Token:
    await apply_rls_pre_auth(db)
    result = await db.execute(select(Usuario).where(Usuario.email == form.username.lower()))
    user = result.scalar_one_or_none()
    if user is None or not user.activo or not verify_password(form.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )
    claims = {
        "rol": user.rol.value,
        "tenant_id": str(user.tenant_id) if user.tenant_id else None,
    }
    return Token(access_token=create_access_token(str(user.id), claims))


@router.get("/me", response_model=UsuarioOut)
async def me(user: Usuario = Depends(get_current_user)) -> Usuario:
    return user


@router.post("/cambiar-password")
async def cambiar_password(
    data: CambiarPasswordIn,
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Cambio de contraseña del usuario logueado (admin de empresa o superadmin)."""
    if not verify_password(data.password_actual, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La contraseña actual no es correcta")
    if data.password_nueva == data.password_actual:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La nueva contraseña debe ser distinta de la actual")
    user.password_hash = hash_password(data.password_nueva)
    await db.commit()
    return {"ok": True}


@router.post("/evaluado/login", response_model=Token)
@limiter.limit("10/minute")
async def login_evaluado(
    request: Request,
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Token:
    """Login del evaluado (email + contraseña que definió su empresa)."""
    email = form.username.lower().strip()
    await apply_rls_pre_auth(db)
    result = await db.execute(select(Evaluado).where(Evaluado.email == email, Evaluado.activo.is_(True)))
    for ev in result.scalars().all():
        if ev.password_hash and verify_password(form.password, ev.password_hash):
            claims = {"rol": "evaluado", "tenant_id": str(ev.tenant_id)}
            return Token(access_token=create_access_token(str(ev.id), claims))
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Email o contraseña incorrectos",
    )


@router.post("/persona/login", response_model=Token)
@limiter.limit("10/minute")
async def login_persona(
    request: Request,
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Token:
    """Login self-service del postulante (cuenta global, no por empresa)."""
    email = form.username.lower().strip()
    await apply_rls_pre_auth(db)
    result = await db.execute(select(Persona).where(Persona.email == email, Persona.activo.is_(True)))
    persona = result.scalar_one_or_none()
    if persona is None or not persona.password_hash or not verify_password(form.password, persona.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )
    return Token(access_token=create_access_token(str(persona.id), {"rol": "persona"}))


@router.get("/persona/me", response_model=PersonaAuthOut)
async def me_persona(persona: Persona = Depends(get_current_persona)) -> Persona:
    """Perfil mínimo usado para validar y restaurar la sesión global del candidato."""
    return persona


# ── Recuperación de contraseña — Usuario (admin de empresa / superadmin) ────────
@router.post("/recuperar")
@limiter.limit("5/hour")
async def recuperar_password_usuario(
    request: Request,
    data: RecuperarPasswordIn,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Solicita el link de recuperación. Respuesta genérica siempre (no revela si el email existe).

    Punto de entrada único desde el login unificado: no sabemos de antemano si quien pide la
    recuperación es un Usuario (admin de empresa) o una Persona (candidato), así que se prueba
    Usuario primero y, si no hay match, se cae a Persona — mismo patrón que el login unificado
    en Login.jsx (intenta admin, si falla prueba persona)."""
    await apply_rls_pre_auth(db)
    email = data.email.lower().strip()
    result = await db.execute(select(Usuario).where(Usuario.email == email, Usuario.activo.is_(True)))
    user = result.scalar_one_or_none()
    if user is not None:
        user.reset_token = generar_token_recuperacion()
        user.reset_expira = dt.datetime.now(dt.timezone.utc) + RECUPERACION_VIGENCIA
        marca = None
        if user.tenant_id:
            empresa = await db.get(Empresa, user.tenant_id)
            if empresa is not None:
                marca = {
                    "razon_social": empresa.razon_social,
                    "color_acento": empresa.color_acento,
                    "color_secundario": empresa.color_secundario,
                    "logo_url": empresa.logo_url,
                }
        link = f"{settings.PUBLIC_BASE_URL.rstrip('/')}/restablecer-password?token={user.reset_token}&tipo=usuario"
        await db.commit()
        background.add_task(enviar_recuperacion_password, user.email, link, marca)
        return _MENSAJE_RECUPERACION_GENERICO

    persona = (
        await db.execute(select(Persona).where(Persona.email == email, Persona.activo.is_(True)))
    ).scalar_one_or_none()
    if persona is not None and persona.password_hash:
        persona.reset_token = generar_token_recuperacion()
        persona.reset_expira = dt.datetime.now(dt.timezone.utc) + RECUPERACION_VIGENCIA
        link = f"{settings.PUBLIC_BASE_URL.rstrip('/')}/restablecer-password?token={persona.reset_token}&tipo=persona"
        await db.commit()
        background.add_task(enviar_recuperacion_password, persona.email, link, None)
    return _MENSAJE_RECUPERACION_GENERICO


@router.post("/restablecer")
@limiter.limit("10/minute")
async def restablecer_password_usuario(
    request: Request,
    data: RestablecerPasswordIn,
    db: AsyncSession = Depends(get_db),
) -> dict:
    await apply_rls_pre_auth(db)
    result = await db.execute(select(Usuario).where(Usuario.reset_token == data.token))
    user = result.scalar_one_or_none()
    if (
        user is None
        or user.reset_expira is None
        or user.reset_expira < dt.datetime.now(dt.timezone.utc)
    ):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "El enlace no es válido o ya expiró")
    user.password_hash = hash_password(data.password)
    user.reset_token = None
    user.reset_expira = None
    await db.commit()
    return {"ok": True}


# ── Recuperación de contraseña — Persona (candidato) ─────────────────────────────
@router.post("/persona/recuperar")
@limiter.limit("5/hour")
async def recuperar_password_persona(
    request: Request,
    data: RecuperarPasswordIn,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> dict:
    await apply_rls_pre_auth(db)
    email = data.email.lower().strip()
    result = await db.execute(select(Persona).where(Persona.email == email, Persona.activo.is_(True)))
    persona = result.scalar_one_or_none()
    if persona is not None and persona.password_hash:
        persona.reset_token = generar_token_recuperacion()
        persona.reset_expira = dt.datetime.now(dt.timezone.utc) + RECUPERACION_VIGENCIA
        link = f"{settings.PUBLIC_BASE_URL.rstrip('/')}/restablecer-password?token={persona.reset_token}&tipo=persona"
        await db.commit()
        background.add_task(enviar_recuperacion_password, persona.email, link, None)
    return _MENSAJE_RECUPERACION_GENERICO


@router.post("/persona/restablecer")
@limiter.limit("10/minute")
async def restablecer_password_persona(
    request: Request,
    data: RestablecerPasswordIn,
    db: AsyncSession = Depends(get_db),
) -> dict:
    await apply_rls_pre_auth(db)
    result = await db.execute(select(Persona).where(Persona.reset_token == data.token))
    persona = result.scalar_one_or_none()
    if (
        persona is None
        or persona.reset_expira is None
        or persona.reset_expira < dt.datetime.now(dt.timezone.utc)
    ):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "El enlace no es válido o ya expiró")
    persona.password_hash = hash_password(data.password)
    persona.reset_token = None
    persona.reset_expira = None
    await db.commit()
    return {"ok": True}
