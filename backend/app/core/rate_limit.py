"""Rate limiting en memoria (por proceso) para endpoints públicos sensibles a fuerza bruta.

Nota: al ser en memoria, cada worker/instancia lleva su propio contador. Alcanza para
un solo proceso (como hoy). Si en Etapa 11 se escala a múltiples workers/instancias,
hay que migrar el storage de slowapi a Redis para que el límite sea compartido.
"""
from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
