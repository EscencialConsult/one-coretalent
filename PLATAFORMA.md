# ONE Core-Talent — Documento de traspaso

> Documento de traspaso para cualquier integrante que continúe el proyecto.
> Última actualización: 2026-07-27, por Facundo (con Claude).

---

## 1. Qué es esto

Escencial Consultora tiene dos plataformas separadas bajo la marca "ONE":

1. **Plataforma ONE** — tests psicométricos, multi-empresa. Vive en `../one-test/` (repo aparte, sigue en producción).
2. **ONE Talent Hub** — postulaciones y búsquedas laborales, hoy en Google Sheets + Apps Script. Vive en `../postulaciones-empresas/` (repo aparte, sigue en producción).

**Este repo (`ONE Core-Talent`) es la fusión de las dos** en una sola plataforma: una empresa publica una vacante → un candidato se postula → la empresa opcionalmente le hace rendir un test psicométrico → todo queda en el mismo perfil de esa persona.

Los repos originales (`one-test`, `postulaciones-empresas`) **siguen funcionando en producción sin tocarse** durante toda la migración — son el respaldo hasta que este proyecto nuevo esté probado y listo para el cutover.

### Lo que NO incluye este proyecto (confirmado por Facundo, 2026-07-27 — definitivo, no "todavía no")

- **Módulo 360°**: NO se va a construir en esta plataforma. Queda descartado, no es un pendiente para más adelante.
- **Módulo de informes con IA** (`informes_ia.py` en el backend, usa OpenAI). El código sigue existiendo porque vino con el resto de Plataforma ONE, pero no se construye UI ni se expone — confirmado que tampoco va a estar en la plataforma.
- **Módulo de "planilla"** — los tests de Excel del catálogo (`excel-inicial`, `excel-intermedio`, `excel-avanzado`). El código queda, no se expone.

---

## 2. Arquitectura

```
sistema mixto core-talent/          ← este repo
├── backend/                        ← FastAPI (Python), copiado de one-test/backend + Etapas 1-3 nuevas
├── catalogo/                       ← los 22 tests psicométricos (preguntas + scoring), lo usa el backend
├── src/                            ← frontend (React 19 + Vite 8 + Tailwind 2.2.19)
├── PLATAFORMA.md                   ← este archivo
└── INSTRUCCIONES.md                ← el contexto original completo de la fusión (leer si falta algo acá)
```

- **Backend**: FastAPI + SQLAlchemy async + Alembic. Base de datos: **Supabase Postgres** (ya no Render). Multi-tenant con **Row Level Security real** activado a nivel de base de datos (no solo por código).
- **Frontend**: React **19.2.7** + Vite **8.1.5** + Tailwind CSS **2.2.19**. El white-label por empresa se aplica en runtime mediante variables CSS desde `src/theme/ThemeProvider.jsx`; no hay que modificar componentes para cambiar la marca.
- **Storage de archivos** (CVs, selfies, firmas): Supabase Storage, buckets privados con URLs firmadas — reemplaza Google Drive del sistema viejo.

---

## 3. Estado actual (qué está hecho, probado en navegador contra datos reales)

| Etapa | Contenido | Estado |
|---|---|---|
| 1 | Base movida a Supabase, RLS activado, rol de runtime sin privilegios de superusuario | ✅ hecho y probado |
| 2 | Modelo de datos nuevo: `Persona` (candidato global), `Vacante`, `Postulacion`, `NotificacionVacante`, `EventoComercial` | ✅ hecho y probado |
| 3 | Backend: motor de matching, Supabase Storage, registro público de empresa, login de candidato, postulación pública | ✅ hecho y probado |
| 4 | Frontend nuevo para Talent Hub, panel de empresa, SuperAdmin y portal profesional del candidato | ✅ hecho y probado |
| 5 | Evaluaciones de postulantes: asignación, progreso, scoring backend, reutilización, auditoría y revocación | ✅ implementado y migrado |
| 6 | Runners psicométricos, resultados e informes para empresa/candidato | ✅ recorrido GDS-15 completo, informes y revocación validados |

### Estado funcional consolidado

- Portal público: landing, navbar, footer, registro de empresa, registro/login de candidato y búsquedas activas.
- Portal candidato: dashboard, búsquedas internas, postulaciones, evaluaciones, resultados, perfil, CV, seguridad y privacidad.
- Panel empresa: vacantes, consolidado de postulantes, asignación de evaluaciones y consulta de informes.
- SuperAdmin: revisión de empresas pendientes.
- Portal evaluado y runners habilitados portados con carga diferida.
- Informes psicométricos para empresa y candidato, gráficos y exportación PDF.
- Supabase conectado localmente; migraciones de Fases 3 y 4 aplicadas; RLS y Storage validados.
- Datos sintéticos E2E disponibles para los tres roles.
- Recorrido E2E integral S0–S5 validado: vacante, postulación, evaluación, recuperación, resultado, informe y revocación.
- Auditoría responsive, accesible, de caché, secretos y cabeceras defensivas completada.

### Decisiones confirmadas por Facundo (2026-07-27)

- **Módulo 360°**: descartado, no se construye (ver arriba).
- **Informe con IA**: descartado, no se construye (ver arriba).
- **Hosting**: **Render NO se usa para nada** (ni base de datos, ni backend). La base es **Supabase**. El backend corre en **Railway** (`backend/Procfile` + `backend/railway.json`, build con Nixpacks, arranca con `alembic upgrade head && uvicorn ...`). El frontend está desplegado en **Netlify**, dominio propio **`coretalent.onelabs.pro`**, con `VITE_API_URL` apuntando a la URL pública de Railway (tiene que incluir el `/api` al final — ver `src/api/client.js`). Ya está en producción y probado de punta a punta.
- **Migración de datos reales**: NO se trae nada de la base vieja de Render/Plataforma ONE (los datos de esos tests psicométricos no andaban bien de antes, se descarta esa migración). SÍ se van a traer los datos de **postulaciones**, que hoy viven en una planilla de Google Sheets (Talent Hub) — Facundo va a pasar esa planilla para migrarla.
- **Reutilización de resultados**: confirmado que la lógica actual es la correcta — si el resultado ya existe se reusa directo (no se pide de nuevo); si no existe, recién ahí se solicita acceso/se rinde. No requiere cambios.
- **Tests psicométricos por vacante** (2026-07-27): la empresa configura los tests requeridos **una vez, a nivel de vacante** (al crearla o editarla), no postulante por postulante. Al postular, esos tests se asignan solos; para postulaciones que ya existían, editar la vacante los pone al día automáticamente (también hay un botón manual de "Aplicar a postulaciones pendientes" como red de seguridad). Ver `Vacante.tests_requeridos`, `aplicar_tests_a_postulaciones_existentes` en `evaluaciones_postulantes.py`.

### Pendientes reales para la próxima persona

1. **Email real**: SMTP todavía no está cargado en Railway — se va a usar **Brevo**. Sin esto, recuperación de contraseña y notificaciones no mandan correos reales (el sistema los genera pero no los envía; no rompe nada, solo queda deshabilitado). Ver `backend/app/core/email.py` y `SMTP_*` en `config.py`.
2. Falta que Facundo pruebe manualmente: revocación de acceso, doble asignación y doble finalización de una evaluación (ver Etapa 5).
3. **Migración de postulaciones desde Google Sheets**: pendiente de que Facundo entregue la planilla; no empezar sin eso.
4. Dar seguimiento al advisory RSC de React Router antes de adoptar APIs RSC o actualizar a la próxima versión compatible.
5. Mantener bloqueados `dat`, `dnla-perfil-comercial` y `ebp` hasta recibir definición psicométrica autorizada.

---

## 4. Flujo de negocio: empresa evalúa a un postulante (IMPLEMENTADO — Fase 3)

> Actualización de Santiago, 2026-07-24: backend, migraciones, RLS, progreso parcial,
> reutilización, accesos revocables, auditoría y outbox fueron implementados. Las migraciones
> ya están aplicadas en Supabase; queda pendiente el recorrido E2E integral en navegador.

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
