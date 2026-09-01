# Imagen del backend de ONE Core-Talent (FastAPI).
#
# IMPORTANTE — build context: este Dockerfile se arma para correr desde la RAÍZ del repo,
# no desde adentro de backend/. Necesita ver también catalogo/, que vive como carpeta
# hermana de backend/ (backend/app/core/engine.py resuelve la ruta al catálogo subiendo
# 3 niveles desde su propia ubicación — ver _ROOT en ese archivo). Si el catálogo no viaja
# con la imagen, el backend arranca sin errores pero /empresas/{id}/tests y todo lo que
# depende de listar_catalogo() devuelve vacío en silencio (bug real que ya pasó una vez
# en Railway por tener el root directory apuntando solo a backend/).
#
# Build (desde la raíz del repo, NO desde backend/):
#   docker build -f backend/Dockerfile -t core-talent-backend .
#
# Con docker-compose (docker-compose.yml en la raíz ya apunta el context bien) alcanza con:
#   docker compose up -d --build

FROM python:3.12-slim

# build-essential: por si alguna dependencia no trae wheel prearmado para la arquitectura
# del host (la mayoría de las libs de requirements.txt sí traen — psycopg[binary], bcrypt —
# pero dejarlo evita sorpresas silenciosas en un ARM u otra arch rara). Se limpia el cache
# de apt en la misma capa para no inflar la imagen.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /srv/app/backend

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY catalogo/ /srv/app/catalogo/

# $PORT lo inyectaba Railway en runtime; acá no hay quien lo inyecte, así que se fija un
# default. Se puede pisar con -e PORT=xxxx si hace falta otro puerto en el host.
ENV PORT=8000
EXPOSE 8000

# Mismo comando que usaba Railway (Procfile/railway.json): migra y recién después levanta
# uvicorn, para no servir tráfico contra un esquema desactualizado.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
