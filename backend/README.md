# Backend — Plataforma ONE (ONE Core Analytics)

API en **FastAPI + PostgreSQL (Render)**, multi-tenant. Esta es la base (fundamentos):
configuración, conexión a BD, modelo de datos, autenticación (JWT) y migraciones.

## Estructura
```
backend/
├── app/
│   ├── main.py            # App FastAPI + routers
│   ├── core/              # config, db, security
│   ├── models/            # Empresa(tenant), Usuario, Perfil, Evaluado
│   ├── schemas/           # Esquemas Pydantic (entrada/salida)
│   └── api/               # deps + rutas (auth, health)
├── alembic/               # migraciones de BD
├── scripts/               # utilidades (crear SuperAdmin)
├── requirements.txt
├── render.yaml            # blueprint de deploy en Render
└── .env.example
```

## Puesta en marcha local

1. **Crear entorno e instalar dependencias** (se recomienda Python 3.11+):
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate        # Windows
   pip install -r requirements.txt
   ```
2. **Configurar variables**: copiá `.env.example` a `.env` y completá `DATABASE_URL`
   (la *External Database URL* de tu Postgres en Render) y `SECRET_KEY`.
3. **Crear las tablas** (genera y aplica la primera migración):
   ```bash
   alembic revision --autogenerate -m "init"
   alembic upgrade head
   ```
4. **Crear el primer SuperAdmin**:
   ```bash
   python -m scripts.seed_superadmin --email admin@one.com --password "ClaveSegura123"
   ```
5. **Levantar el servidor**:
   ```bash
   uvicorn app.main:app --reload
   ```
   - API: http://localhost:8000  ·  Docs interactivas: http://localhost:8000/docs
   - Probar salud: `GET /api/health` y `GET /api/health/db`
   - Login: `POST /api/auth/login` (form: username=email, password) → token

## Deploy en Render

1. Subí el repo a GitHub.
2. En Render: **New → Blueprint**, apuntando a este repo (detecta `backend/render.yaml`).
   Crea la base de datos PostgreSQL y el servicio web, e inyecta `DATABASE_URL` y `SECRET_KEY`.
3. El `buildCommand` corre las migraciones (`alembic upgrade head`) en cada deploy.
4. Crear el SuperAdmin una vez (desde el *Shell* del servicio en Render):
   `python -m scripts.seed_superadmin --email ... --password ...`

## Modelo de datos (base)
- **Empresa** = tenant (razón social, subdominio único, logo, color, estado).
- **Usuario** = SuperAdmin (global, `tenant_id` nulo) o Admin de Empresa (con `tenant_id`).
- **Perfil** = etiqueta de evaluados por empresa (puesto/grupo).
- **Evaluado** = candidato/colaborador, aislado por empresa.

Las tablas con `tenant_id` están preparadas para **Row-Level Security (RLS)**, que se
habilitará en una migración dedicada en el siguiente paso (aislamiento estricto por empresa).
