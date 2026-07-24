# ONE Core-Talent

Plataforma unificada de Escencial Consultora: tests psicométricos (Plataforma ONE) + postulaciones y búsquedas laborales (ONE Talent Hub), en un solo sistema.

**Empezá por [`PLATAFORMA.md`](./PLATAFORMA.md)** — ahí está la explicación completa: arquitectura, qué está hecho, qué falta, y cómo levantar el proyecto.

## Estructura

- `backend/` — API (FastAPI + Supabase Postgres, multi-tenant con Row Level Security)
- `catalogo/` — los tests psicométricos (preguntas + scoring), los usa el backend
- `src/` — frontend (React + Vite + Tailwind)

## Estado

En desarrollo activo. Ver [`PLATAFORMA.md`](./PLATAFORMA.md) para el detalle etapa por etapa.
