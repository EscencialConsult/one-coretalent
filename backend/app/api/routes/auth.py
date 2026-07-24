"""Autenticación: login (JWT) y datos del usuario actual."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.db import apply_rls_pre_auth, get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.evaluado import Evaluado
from app.models.persona import Persona
from app.models.user import Usuario
from app.schemas.auth import Token, UsuarioOut

router = APIRouter(prefix="/auth", tags=["auth"])


class CambiarPasswordIn(BaseModel):
    password_actual: str
    password_nueva: str = Field(min_length=8)


@router.post("/login", response_model=Token)
async def login(
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
async def login_evaluado(
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
async def login_persona(
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
