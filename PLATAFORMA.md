# ONE Core-Talent — Documento de traspaso

> Para Santiago. Si es tu primera vez en este proyecto, leé esto entero antes de tocar código.
> Última actualización: 2026-07-24, por Facundo.

---

## 1. Qué es esto

Escencial Consultora tiene dos plataformas separadas bajo la marca "ONE":

1. **Plataforma ONE** — tests psicométricos, multi-empresa. Vive en `../one-test/` (repo aparte, sigue en producción).
2. **ONE Talent Hub** — postulaciones y búsquedas laborales, hoy en Google Sheets + Apps Script. Vive en `../postulaciones-empresas/` (repo aparte, sigue en producción).

**Este repo (`ONE Core-Talent`) es la fusión de las dos** en una sola plataforma: una empresa publica una vacante → un candidato se postula → la empresa opcionalmente le hace rendir un test psicométrico → todo queda en el mismo perfil de esa persona.

Los repos originales (`one-test`, `postulaciones-empresas`) **siguen funcionando en producción sin tocarse** durante toda la migración — son el respaldo hasta que este proyecto nuevo esté probado y listo para el cutover.

### Lo que NO incluye este proyecto (decisión de Facundo, confirmá si tenés dudas)

- **Módulo de informes con IA** (`informes_ia.py` en el backend, usa OpenAI para redactar informes gerenciales). El código sigue existiendo porque vino con el resto de Plataforma ONE, pero **no hay que construirle UI ni exponerlo** en esta plataforma.
- **Módulo de "planilla"** — interpreté esto como los tests de Excel del catálogo (`excel-inicial`, `excel-intermedio`, `excel-avanzado`). Mismo criterio: el código queda, pero no se expone. **Si esto no es lo que quiso decir Facundo, confirmar con él** antes de asumir que está bien.

---

## 2. Arquitectura

```
sistema mixto core-talent/          ← este repo
├── backend/                        ← FastAPI (Python), copiado de one-test/backend + Etapas 1-3 nuevas
├── catalogo/                       ← los 22 tests psicométricos (preguntas + scoring), lo usa el backend
├── src/                            ← frontend (React + Vite + Tailwind 2.2.1)
├── PLATAFORMA.md                   ← este archivo
└── INSTRUCCIONES.md                ← el contexto original completo de la fusión (leer si falta algo acá)
```

- **Backend**: FastAPI + SQLAlchemy async + Alembic. Base de datos: **Supabase Postgres** (ya no Render). Multi-tenant con **Row Level Security real** activado a nivel de base de datos (no solo por código).
- **Frontend**: React 18 + Vite + Tailwind CSS **2.2.1** (versión vieja a propósito, pedida por Facundo — no actualizar a v3/v4 sin confirmar). Un solo archivo de marca (`src/theme/brand.json`) define colores/tipografía; el white-label por empresa se aplica en runtime pisando variables CSS (`src/theme/ThemeProvider.jsx`), no hay que tocar Tailwind para eso.
- **Storage de archivos** (CVs, selfies, firmas): Supabase Storage, buckets privados con URLs firmadas — reemplaza Google Drive del sistema viejo.

---

## 3. Estado actual (qué está hecho, probado en navegador contra datos reales)

| Etapa | Contenido | Estado |
|---|---|---|
| 1 | Base movida a Supabase, RLS activado, rol de runtime sin privilegios de superusuario | ✅ hecho y probado |
| 2 | Modelo de datos nuevo: `Persona` (candidato global), `Vacante`, `Postulacion`, `NotificacionVacante`, `EventoComercial` | ✅ hecho y probado |
| 3 | Backend: motor de matching, Supabase Storage, registro público de empresa, login de candidato, postulación pública | ✅ hecho y probado |
| 4 | Frontend nuevo (React+Tailwind) para todo lo de Talent Hub + panel de empresa/SuperAdmin rediseñado con la identidad visual real de Plataforma ONE | ✅ hecho y probado |

### Lo que falta (pendiente para vos, Santiago)

1. **Portar las pantallas que YA existen en Plataforma ONE** (`../one-test/frontend/`) a este frontend nuevo: los 17 runners de tests, los informes por test, el portal del evaluado, el módulo de evaluaciones 360°. Es trabajo mecánico (convertir su CSS a Tailwind usando `src/index.css` como base) — no hay decisiones de diseño nuevas, ya está resuelto en el original.
2. **El flujo de "empresa evalúa a un postulante"** — ver sección 4, está diseñado pero no implementado.
3. Revisar los 3 tests del catálogo que siguen bloqueados (`dat`, `dnla-perfil-comercial`, `ebp` — incompletos, requieren al psicólogo a cargo, no es tema de código).
4. Decisión pendiente de Facundo: hosting del backend (¿se queda en Render o se migra, p. ej. a Vercel?) y dominio final.

---

## 4. Flujo de negocio: empresa evalúa a un postulante (IMPLEMENTADO — Fase 3)

> Actualización de Santiago, 2026-07-24: el backend, la migración, RLS, progreso parcial,
> reutilización, accesos revocables, auditoría y outbox ya fueron implementados. La migración
> todavía debe aplicarse y probarse E2E en Supabase cuando estén disponibles las credenciales.

Confirmado con Facundo el 2026-07-24:

> La empresa habilita/asigna el test a los candidatos que ella elija (no es automático). Los **datos del test se guardan en la Persona** (candidato), no en la empresa — aunque tanto el candidato como la empresa pueden ver el informe. **Si la empresa quiere evaluar a alguien que ya rindió ese mismo test antes** (para cualquier empresa, o por su cuenta), **se reusa el resultado existente** — no lo tiene que rendir de nuevo.

### Por qué esto ya es posible con el modelo actual

- `Evaluado.persona_id` (FK, ver `backend/app/models/evaluado.py`) ya vincula un evaluado con su `Persona` global — esto se agregó en la Etapa 2 pensando exactamente en este flujo.
- `Resultado` está atado a `evaluado_id` + `tenant_id` (aislado por empresa hoy).

### Implementación realizada

**Backend — endpoints implementados:**

- `POST /vacantes/{vacante_id}/postulaciones/{postulacion_id}/evaluaciones`
- `GET /vacantes/{vacante_id}/postulaciones/{postulacion_id}/evaluaciones`
- `GET /personas/me/evaluaciones`
- `GET /personas/me/resultados`
- `GET /resultados/{resultado_id}`
- `POST /asignaciones/{asignacion_id}/iniciar`
- `POST /asignaciones/{asignacion_id}/respuestas`
- `POST /asignaciones/{asignacion_id}/finalizar`
- `POST /accesos-resultados/{id}/revocar`

Flujo:
1. Recibe `test_slug` + `persona_id` (de la postulación).
2. Busca si ya existe un `Evaluado` para esa `Persona` en el tenant actual (por `persona_id`). Si no existe, lo crea (con `tipo="postulante"`, vinculado por `persona_id`).
3. **Antes de asignar el test**, busca si YA existe un `Resultado` para esa `Persona` en ese `test_slug`, **en cualquier tenant** (join por `evaluado.persona_id`).
   - Si existe: no crea una `Asignacion` nueva pendiente — directamente expone/vincula ese resultado ya calculado a este evaluado/tenant (decidir si se copia la fila o se referencia; referenciar es más simple pero hay que revisar el modelo de `Resultado` para eso).
   - Si no existe: crea la `Asignacion` normal (flujo actual, sin cambios) y el candidato la rinde como cualquier evaluado.

**RLS:**
La migración `d5e6f7a8b9c0` amplía las políticas mediante `persona_id` y
`acceso_resultado`. Una empresa solamente puede leer un resultado externo mientras posea un
acceso activo; la revocación elimina ese permiso sin borrar el resultado canónico. El aislamiento
debe validarse contra Supabase antes del merge o despliegue.

**Frontend del candidato implementado (Fase 4)**: el portal profesional ya consume estos contratos e incluye postulaciones, evaluaciones, resultados, perfil, antecedentes, seguridad, privacidad y el runner común con recuperación y guardado automático. La acción de asignación desde `VacanteDetalle.jsx` continúa pendiente para la interfaz de empresa.

**Informes psicométricos implementados (Fase 5)**: existe un contrato seguro y auditable de sólo lectura, vistas protegidas para empresa y candidato, presentación diferenciada de puntajes/baremos/interpretaciones, marca empresarial, gráficos con carga diferida, exportación PDF e impresión accesible. Se excluyen los informes Excel y el InformeIntegral con IA.

---

## 5. Cómo levantar el proyecto

### Backend

```bash
cd backend
python -m venv .venv
./.venv/Scripts/python -m pip install -r requirements.txt   # Windows
cp .env.example .env   # completar con las credenciales de Supabase (pedirlas a Facundo)
./.venv/Scripts/python -m alembic upgrade head
./.venv/Scripts/python -m uvicorn app.main:app --reload
```

Notas importantes del `.env`:
- `DATABASE_URL` = rol `app_runtime` (sin privilegios — es el que usa la app).
- `DATABASE_URL_MIGRATIONS` = rol `postgres` (con privilegios — solo para correr Alembic). Si no lo tenés, Alembic no va a poder crear tablas/políticas.
- Sin `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` no van a funcionar las subidas de archivos (CV, selfies, firmas) — el resto de la app funciona igual.

### Frontend

```bash
npm install
cp .env.example .env   # por defecto apunta a http://127.0.0.1:8000/api
npm run dev
```

---

## 6. Credenciales

**No están en este repo** (correctamente gitignoreadas). Pedíselas a Facundo:
- Connection strings de Supabase (`app_runtime` y `postgres`).
- `SUPABASE_SERVICE_ROLE_KEY` (backend, storage).
- Cuenta de prueba: `admin-talent@example.com` (empresa) / `superadmin@example.com` (SuperAdmin) — las passwords te las pasa Facundo.

---

## 7. Dónde está todo lo demás

- `INSTRUCCIONES.md` en este mismo repo: el análisis técnico completo original de ambas plataformas legacy (útil si necesitás entender por qué se modeló algo de una forma puntual).
- Migraciones de Alembic (`backend/alembic/versions/`): cada una tiene un docstring explicando el porqué, especialmente las de RLS — son la mejor referencia de cómo está pensada la seguridad multi-tenant acá.
