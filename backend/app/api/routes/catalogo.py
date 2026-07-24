"""Catálogo de tests disponibles (lectura desde catalogo/). Solo SuperAdmin."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends

from app.api.deps import require_superadmin
from app.core import engine

router = APIRouter(
    prefix="/catalogo",
    tags=["catalogo"],
    dependencies=[Depends(require_superadmin)],
)


@router.get("")
async def listar_catalogo() -> List[dict]:
    """Lista todos los tests del catálogo con sus metadatos."""
    return engine.listar_catalogo()
