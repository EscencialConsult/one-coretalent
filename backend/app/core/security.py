"""Hashing de contraseñas (irreversible) y tokens de acceso (JWT)."""
from __future__ import annotations

import datetime as dt
import secrets
import string
from typing import Any, Optional

import bcrypt
import jwt

from app.core.config import settings

# Sin caracteres ambiguos (0/O, 1/l/I) para que sea fácil de leer/tipear.
_ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"


def generar_password(largo: int = 10) -> str:
    """Contraseña temporal legible (para enviar por correo al crear el usuario)."""
    return "".join(secrets.choice(_ALFABETO) for _ in range(largo))


def hash_password(password: str) -> str:
    """Hash irreversible con bcrypt (incluye salt)."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(subject: str, claims: Optional[dict[str, Any]] = None) -> str:
    """Genera un JWT firmado. `subject` = id del usuario; `claims` = datos extra (rol, tenant)."""
    now = dt.datetime.now(dt.timezone.utc)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "iat": now,
        "exp": now + dt.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    if claims:
        payload.update(claims)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """Decodifica y valida el JWT. Lanza jwt.PyJWTError si es inválido/expirado."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
