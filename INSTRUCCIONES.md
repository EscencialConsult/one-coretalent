# CORE-TALENT — Plataforma unificada ONE

> Este archivo es el punto de entrada para cualquier sesión de IA (Claude Code u otra) que trabaje en este proyecto. Contiene TODO el contexto acumulado hasta ahora: quién es el usuario, qué se analizó, qué se decidió y el plan de trabajo completo. Leelo entero antes de tocar código.

---

## ACTUALIZACIÓN DE TRASPASO — 24/07/2026

> Esta sección refleja el estado actual del repositorio y prevalece sobre los checklists históricos que aparecen más abajo.

### Trabajo completado

- Etapas originales 1 a 4 de CoreTalent implementadas.
- Fases 1 a 5 del plan posterior implementadas a nivel funcional.
- Supabase configurado localmente con roles separados para runtime y migraciones.
- Migraciones `d5e6f7a8b9c0` y `e6f7a8b9c0d1` aplicadas.
- RLS forzado y validado sobre entidades sensibles.
- Supabase Storage validado para CV, firmas y verificaciones.
- Portal público completo: landing, búsquedas, registro de empresa, registro/login de candidato y páginas legales.
- Portal privado del candidato completo: inicio, búsquedas, postulaciones, evaluaciones, resultados, perfil, seguridad y privacidad.
- Panel de empresa con vacantes y sección consolidada de postulantes.
- Flujo backend de evaluaciones de postulantes con asignación, inicio idempotente, progreso parcial, finalización, scoring backend, reutilización, revocación, auditoría y outbox.
- Portal del evaluado y runners psicométricos habilitados.
- Informes psicométricos para empresa/candidato con gráficos y PDF.
- Datos sintéticos E2E creados para SuperAdmin, empresa y candidato.

### Rutas principales agregadas

- Públicas: `/busquedas`, `/registro-candidato`, `/login-candidato`, `/registro-empresa`.
- Candidato: `/candidato`, `/candidato/busquedas`, `/candidato/postulaciones`, `/candidato/evaluaciones`, `/candidato/resultados`, `/candidato/perfil`, `/candidato/seguridad`, `/candidato/privacidad`.
- Empresa: `/empresa/vacantes`, `/empresa/postulantes`.
- SuperAdmin: `/admin/empresas-pendientes`.

### Puesta en marcha local

Backend:

```bash
cd backend
python -m venv .venv
./.venv/Scripts/python -m pip install -r requirements.txt
cp .env.example .env
./.venv/Scripts/python -m alembic upgrade head
./.venv/Scripts/python -m uvicorn app.main:app --reload
```

Variables importantes:

- `DATABASE_URL`: conexión del rol restringido `app_runtime`.
- `DATABASE_URL_MIGRATIONS`: conexión administrativa usada solamente por Alembic.
- `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`: necesarias para CV, selfies y firmas.
- Nunca incorporar `.env`, claves de Supabase ni credenciales E2E al repositorio.

Frontend:

```bash
npm install
npm run dev
```

Validación:

```bash
npm run lint
npm test -- --run
npm run build

cd backend
./.venv/Scripts/python -m compileall -q app
./.venv/Scripts/python -m unittest discover -s tests -v
```

Estado validado al cierre:

- 33 tests frontend aprobados.
- 15 tests backend aprobados.
- Lint sin errores; quedan dos warnings preexistentes en el código legacy de Dominó-48.
- Build de producción y compilación backend correctos.

### Siguiente trabajo recomendado

1. Ejecutar el recorrido E2E integral: vacante → postulación → asignación → inicio → respuestas → finalización → resultado → informe → revocación.
2. Documentar cualquier incidencia detectada durante ese recorrido.
3. Continuar con el módulo 360° y la gestión empresarial ampliada de evaluaciones si son priorizados.
4. No habilitar `dat`, `dnla-perfil-comercial` ni `ebp` sin definición del profesional psicométrico responsable.
5. Mantener fuera de alcance informes con IA y planilla/Excel.
6. Confirmar hosting del backend, dominio definitivo y plan de migración de datos reales antes del cutover.

---

## 0. Quién pide esto y para qué

**Facundo Maximiliano Lazarte** — Área de Innovación y Desarrollo, **Escencial Consultora** (RRHH, contable/laboral, capacitaciones, Argentina). Perfil no-programador (estudiante de Psicología), fuerte en UX/lógica de negocio, aprende los detalles técnicos en el proceso. Cuando trabajes con él: explicá el razonamiento (el "por qué"), no solo el "qué"; conectá cada decisión técnica con el impacto en el usuario final; sé directo, sin relleno.

**El objetivo de este proyecto**: Escencial tiene dos plataformas vivas, separadas, bajo la misma marca comercial "ONE":

1. **Plataforma ONE** (tests psicométricos) — carpeta hermana `../one-test/`
2. **ONE Talent Hub** (postulaciones y búsquedas laborales) — carpeta hermana `../postulaciones-empresas/`

La idea es fusionarlas en **una sola plataforma** ("Core-Talent") que tenga TODO el funcionamiento que ya existe en ambas, con una empresa cliente y un candidato/evaluado compartiendo un mismo recorrido: se postula a un puesto → la empresa lo evalúa con un test psicométrico → todo queda en el mismo perfil.

**Rutas relevantes** (todas hermanas de esta carpeta, dentro de `SISTEMA MIXTO HUB-CORE/`):
- Código fuente de Plataforma ONE: `../one-test/`
- Código fuente de ONE Talent Hub: `../postulaciones-empresas/`
- Repos originales: `https://github.com/EscencialConsult/one-test.git` y `https://github.com/EscencialConsult/postulaciones-empresas.git`
- Esta carpeta (`sistema mixto core-talent/`) es donde va a vivir el proyecto fusionado nuevo (o sus documentos de trabajo, a definir cuando arranque la implementación).

---

## 1. Estructura y funcionamiento real de cada plataforma (verificado leyendo el código, no supuesto)

### 1.1 Plataforma ONE (`../one-test/`)

- **Backend**: Python + **FastAPI**, en `one-test/backend/app/`. Punto de entrada `app/main.py`, 17 routers bajo `/api` en `app/api/routes/` (`auth.py`, `admin.py`, `empresa.py` singular = panel del propio admin de empresa logueado, `empresas.py` plural = CRUD del SuperAdmin sobre empresas, `evaluados.py`, `evaluaciones.py` (762 líneas, el más grande — evaluaciones 360°/área/proceso), `resultados.py`, `informes_ia.py`, `catalogo.py`, `tests.py`, `asignaciones.py`, `areas.py`, `perfiles.py`, `publico.py`, `yo.py`, `health.py`).
- **Base de datos**: **PostgreSQL**, SQLAlchemy 2.0 async + `asyncpg`, migraciones con **Alembic** (12 migraciones en `backend/alembic/versions/`). Hoy alojada en **Render** (`backend/render.yaml`), con `DATABASE_URL` configurable — el código de `app/core/db.py` ya usa `statement_cache_size=0`, que es justamente lo necesario para conectar contra poolers tipo **Supabase/pgbouncer** (o sea, ya está preparado para el movimiento a Supabase, ver sección 3).
- **Modelos** (`backend/app/models/`):
  - `Empresa` (`tenant.py`) = el tenant. Campos actuales: `razon_social`, `subdominio`, `email_admin`, `logo_url`, `color_acento`, `color_secundario`, `estado` (enum `EstadoEmpresa`: hoy solo `activo` | `suspendido`).
  - `Usuario` (`user.py`) = admin. `rol` (`RolUsuario`: `superadmin` | `admin_empresa`), `tenant_id` (NULL si es superadmin), `email`, `password_hash` (**bcrypt**, no texto plano), `nombre`, `apellido`, `activo`.
  - `Evaluado` (`evaluado.py`) = la persona que rinde tests. **Ya tiene un campo `tipo`** con valores `"colaborador"` (empleado, evaluaciones 360°/área) o `"postulante"` (candidato, tests de selección) — el sistema ya estaba pensado para absorber candidatos de reclutamiento. Es **tenant-scoped** (`TenantMixin`, `tenant_id` obligatorio + `UniqueConstraint(tenant_id, email)`) — es decir, aislado por empresa, NO hay noción de candidato compartido entre empresas.
  - Resto de modelos: `area.py`, `asignacion.py` (asignación de test a evaluado), `empresa_test.py` (qué tests tiene habilitados cada empresa), `evaluacion.py` (360°), `informe_integral.py` (informe con IA), `notificacion.py`, `perfil.py` (perfil de puesto/competencias), `resultado.py`.
  - `base.py`: mixins compartidos — `UUIDPkMixin` (PK uuid4), `TimestampMixin` (`created_at`/`updated_at`), `TenantMixin` (`tenant_id` FK a `empresa.id`, `ondelete=CASCADE`, indexado — "habilita el RLS" dice el comentario, pero **RLS real de Postgres todavía no está activado**, el aislamiento hoy depende de que cada query filtre por `tenant_id` a mano).
- **Catálogo de tests** (`../one-test/catalogo/`) — **código Python funcional**, no diseño. 22 subcarpetas (una por test: Big Five, WAIS-IV, DISC, Kuder, Dominó-48, DAT, STAI-ansiedad, GDS-15, DNLA, EBP, Excel inicial/intermedio/avanzado, etc.), cada una con `preguntas.json`, `scoring.py` (cálculo determinista, SIN IA), `baremos.json`/`interpretaciones.json`, `test_scoring.py`. El backend las carga con `importlib` dinámico desde `app/core/engine.py`. Estado real documentado en `catalogo/REVISION.md` (2026-06-25): 18/18 tests con motor funcionando y regresión en verde contra el algoritmo legacy (108 casos), pero **4 tests con bloqueo real** (Dominó-48, DAT, DNLA Perfil Comercial, EBP) por discrepancias entre frontend/backend legacy — requieren decisión del psicólogo a cargo, no del programador.
- **`../one-test/maquetas/`**: solo mockups HTML estáticos de referencia visual, sin conexión al código real. No se migran, son insumo de diseño.
- **Auth**: `app/core/security.py` (bcrypt) + JWT (`pyjwt`, `SECRET_KEY`, duración configurable — 480 min por defecto). Dos logins separados en `auth.py`: `/api/auth/login` (Usuario admin) y `/api/auth/evaluado/login` (Evaluado). Guardas en `app/api/deps.py`: `require_superadmin`, `require_admin_empresa`, `get_current_tenant_id`, `get_current_evaluado`.
- **IA opcional**: `app/core/ia.py` + `informes_ia.py` — usa OpenAI (GPT-4o por defecto) SOLO para redactar prosa de un informe integral que cruza varios tests de una misma persona; nunca calcula ni inventa puntajes. Si no hay `OPENAI_API_KEY`, se desactiva sin romper nada más.
- **Email**: `app/core/email.py` existe y ya está integrado (SMTP configurable vía `.env`, si `SMTP_HOST` queda vacío simplemente no manda correos).
- **Frontend**: React 18 + Vite + React Router 7, en `../one-test/frontend/src/`. Carpetas: `auth/`, `components/`, `empresa/` (panel admin de empresa), `evaluaciones/`, `evaluado/` (portal del evaluado), `informes/` (17 componentes de informes, uno por test, con `recharts` para gráficos y `html2pdf.js` para exportar PDF), `lib/` (`api.js` = cliente autenticado con JWT en `localStorage` bajo la clave `one_token`; ojo que también hay un `frontend/src/api.js` suelto en la raíz, sin autenticar, usado por los runners de test para personas externas sin login), `pages/`, `superadmin/`. Los runners de cada test (`DiscRunner.jsx`, `WaisRunner.jsx`, `DominoRunner.jsx`, etc.) viven sueltos en la raíz de `src/`.
- **Deploy actual**: Frontend en **Netlify** (`netlify.toml`, `base = "frontend"`, publica `frontend/dist`, con proxy `/api/*` → backend en Render para evitar CORS, más fallback SPA a `index.html`). Backend en **Render** (`backend/render.yaml`, blueprint que crea la Postgres gratis + el servicio web `uvicorn app.main:app`, corre `alembic upgrade head` en cada build). Render gratis "duerme" a los ~15 min de inactividad (cold-start 40-50s) — ya causó un bug real, parcheado en un commit (`0efbdbe`).
- **Estado**: proyecto vivo, en desarrollo activo, sin TODOs/código muerto relevante detectado.

### 1.2 ONE Talent Hub (`../postulaciones-empresas/`)

- **Frontend**: **HTML/JS/CSS plano, sin build, sin framework** — ni React ni bundler. Páginas: `index.html`, `empresas.html` (panel de empresa), `postular.html` (formulario público de postulación, 6 pasos), `busquedas.html` (listado público de vacantes activas), `admin.html` (panel de administración interno), `recuperar.html` (recuperación de contraseña), `politica-privacidad.html`, `terminos-condiciones.html`. Scripts sueltos: `config.js` (conexión al backend), `puestos.js` (lógica de panel de empresa + formulario de postulación), `busquedas-publicas.js` (listado público), `firmas.js` (firma digital en canvas, con MediaPipe en el navegador para detectar rostro/vida en la selfie de verificación), `soporte.js` (burbuja de WhatsApp). Única dependencia externa: `signature_pad` por CDN.
- **Backend real**: **Google Apps Script**, un único archivo `apps-script/Codigo.gs` (2904 líneas), atado a una Google Sheet que actúa como base de datos (`SpreadsheetApp.getActiveSpreadsheet()`). Expone `doGet`/`doPost` → despachador único `manejar()` que rutea por un campo `action` (más de 25 acciones: postulantes, empresas, búsquedas, firmas, admin).
- **Motor de matching por reglas**: `calcularCoincidenciaVacante` (línea 1636 de `Codigo.gs`) compara puesto, ubicación, habilidades, formación, idioma y experiencia entre un postulante y una vacante, calcula un puntaje (`MATCH_MINIMO_NOTIFICACION = 55`) y si supera el umbral dispara un email de aviso (`enviarEmailVacante`), con tope de `MAX_NOTIFICACIONES_DIARIAS_POSTULANTE = 3` para no hacer spam. Queda registrado en la hoja `NotificacionesVacantes`.
- **Persistencia — 6 pestañas de Google Sheets**, columnas EXACTAS (orden importa, está hardcodeado en `Codigo.gs` líneas 56-132):
  - **`Postulantes`** (`COLUMNAS_POSTULANTES`): `ID, FechaRegistro, Nombre, Apellido, Email, Telefono, PuestoDeseado, FechaNacimiento, Identificacion, Provincia, CodigoPostalCiudad, PerfilProfesional, Formacion, DescripcionPerfil, DispViajar, DispCambioResidencia, Idiomas, PrimerEmpleo, Experiencias, CVNombre, CVUrl, FirmaConsentimientoUrl, FechaFirmaConsentimiento, FirmaConformidadUrl, FechaFirmaConformidad, BusquedaID, BusquedaPuesto, RespuestasBusqueda` — una fila por cada postulación individual (no por persona).
  - **`Perfiles`** (`COLUMNAS_PERFILES`): cuenta reutilizable del postulante (una fila POR EMAIL, no por postulación): `Email, Password, Token, TokenExpira, FechaRegistro, FechaActualizacion, Nombre, Apellido, Telefono, PuestoDeseado, FechaNacimiento, Identificacion, Provincia, CodigoPostalCiudad, PerfilProfesional, Formacion, DescripcionPerfil, DispViajar, DispCambioResidencia, Idiomas, PrimerEmpleo, Experiencias, CVNombre, CVUrl, FirmaConsentimientoUrl, FirmaConformidadUrl, ResetToken, ResetExpira`.
  - **`Usuarios`** (`COLUMNAS_USUARIOS`): cuentas de empresa/admin: `Usuario, Password, Empresa, Token, TokenExpira, Email, FechaRegistro, Rol, Estado, Cuit, Rubro, Nombre, Apellido, Telefono, Dni, EstadoVerificación, FechaVerificación, ConfianzaVerificación, AceptoTerminos, FechaAceptoTerminos, SelfieUrl, NombreVerificado, VerificacionLegacyId/Url/Estado/Fecha, DniFrenteUrl, DniDorsoUrl, FirmaLegalUrl, FechaFirmaLegal, ResetToken, ResetExpira`. **`Password` en texto plano** — confirmado en código (`login()` compara `p === password` sin hash) y admitido explícitamente en el propio `README.md` del repo (línea 165) como debilidad conocida, "uso interno".
  - **`Busquedas`** (`COLUMNAS_BUSQUEDAS`): vacantes: `ID, FechaCreacion, FechaActualizacion, UsuarioEmpresa, Empresa, Puesto, Descripcion, Provincia, Localidad, Modalidad, Jornada, Vacantes, Estado (borrador|activa|pausada|cerrada), Area, TipoContrato, Zona, Responsabilidades, RequisitosExcluyentes, RequisitosDeseables, Habilidades, IdiomaRequerido, NivelIdioma, SalarioMin, SalarioMax, OcultarSalario, Horario, Beneficios, BeneficiosOtros, FechaVencimiento, Reclutador, Pregunta1, Pregunta2`.
  - **`NotificacionesVacantes`** (`COLUMNAS_NOTIFICACIONES_VACANTES`): `Fecha, BusquedaID, BusquedaPuesto, Empresa, EmailPostulante, NombrePostulante, Puntaje, Motivos, Estado, Error`.
  - **`EventosComerciales`** (`COLUMNAS_EVENTOS_COMERCIALES`): auditoría interna: `Fecha, TipoEvento, Empresa, Usuario, Detalle, Canal, Destinatarios, EstadoNotificacion, Error`.
- **Archivos** (CVs, selfies, firmas): se guardan en **Google Drive**, carpeta `CVs Postulantes` (`CARPETA_CV`), tope `CV_MAX_MB = 5`, funciones `guardarArchivoCV`/`guardarImagenVerificacion`/`guardarArchivoFirma` devuelven URL pública.
- **Auth**: dos sistemas de login independientes. (1) Empresa/admin: usuario+password contra hoja `Usuarios`, token `Utilities.getUuid()` con `TOKEN_HORAS = 12`, guardado en `sessionStorage` bajo `admtoken` en el frontend, valida `rol !== 'admin'` para el panel de administración. (2) Postulante: contra hoja `Perfiles`. Recuperación de contraseña de dos pasos (`recuperarPassword`/`resetearPassword`) con `ResetToken` de `RESET_MINUTOS = 60`, sirve para ambos tipos (`tipo` en la URL).
- **Verificación de identidad de empresa**: al registrarse, la empresa sube selfie + firma + DNI (frente/dorso). La función `verificarIdentidadDNI` **NO verifica nada automáticamente en el servidor** — solo chequea que el DNI tenga 8 dígitos y que existan los archivos, y siempre devuelve `estado: 'pendiente'`, `confianza: 'revision_manual'`. La aprobación real la hace un humano admin desde `admin.html` (`aprobarEmpresa`, `cambiarEstadoVerificacion`).
- **Deploy**: Frontend estático en **Netlify** (`netlify.toml` sin build command, publica la raíz tal cual, solo agrega headers de seguridad). Backend en **Google Apps Script**: se pega el código en el editor ligado al Sheet, se corre `setup()` una vez, se publica manualmente como "Aplicación Web" (Implementar → Nueva implementación) — **cada cambio en `Codigo.gs` requiere una reimplementación manual**, no hay CI/CD. `config.js` en el repo ya apunta a una URL `/exec` real de producción (no un placeholder).
- **Producción real activa**: dominio `hubtalent.onelabs.pro` hardcodeado en `Codigo.gs` (`URL_PLATAFORMA`, `URL_APP`, logo de emails), WhatsApp de soporte real en `index.html`/`soporte.js`. No es una demo.
- **Roadmap ya documentado por el propio equipo en su README** como pendiente (2da etapa, todavía sin hacer): preferencia del postulante de recibir o no ofertas por email, panel con métricas de matching, acción manual de "notificar candidatos", mejora de sinónimos/equivalencias entre puestos.

---

## 2. Por qué se fusionan (y por qué así)

**Problema**: dos sistemas vivos, misma marca ("ONE"), arquitecturas incompatibles — uno moderno y sólido (FastAPI + Postgres + React, multi-tenant, JWT+bcrypt), el otro fragil y manual (Google Sheets + Apps Script + HTML vanilla, passwords en texto plano, deploy manual). Modelan entidades que en el negocio real son la misma cosa (una empresa cliente, una persona candidata/evaluada) pero como silos que no se hablan.

**Solución elegida**: NO sincronizar las dos bases en vivo (Sheets↔Postgres sería un puente frágil, Apps Script tiene cuotas de ejecución y no tiene transacciones). Se **migra todo** a una sola base — **Supabase Postgres** — usando Plataforma ONE como cimiento (es el sistema más maduro) y reconstruyendo ahí adentro la funcionalidad de Talent Hub como módulos nuevos.

**Por qué Supabase y no seguir en Render**: decisión explícita del usuario (Facundo) — el stack de trabajo de Escencial ya usa Supabase/Neon/Vercel, y quiere consolidar ahí en vez de mantener Render. Bonus técnico: Supabase trae **Row Level Security** nativo, lo que de paso cierra una deuda que Plataforma ONE tenía anotada (hoy el aislamiento por tenant depende solo de que cada query filtre bien, sin barrera real en la base) y **Supabase Storage** reemplaza a Google Drive para CVs/selfies/firmas, quedando todo en un solo proveedor.

**Por qué no rehacer Plataforma ONE en vanilla JS/Sheets para "igualar" a Talent Hub**: tiraría a la basura el motor de 22 tests, el modelo multi-tenant y la auth ya sólida. No tiene sentido bajar el nivel del sistema maduro para nivelar con el frágil.

---

## 3. Modelo de datos unificado (diseño objetivo)

La tensión de diseño a resolver: en Talent Hub la base de candidatos es **compartida entre todas las empresas** (una sola hoja `Perfiles`); en Plataforma ONE, `Evaluado` es **aislado por empresa** (`tenant_id` obligatorio). Para no perder ninguna de las dos lógicas de negocio existentes:

| Entidad nueva/modificada | Reemplaza / se basa en | Notas |
|---|---|---|
| **`Persona`** (nueva, GLOBAL, sin `tenant_id`) | Hoja `Perfiles` | Identidad única del candidato (email único global): CV, formación, experiencia, idiomas, disponibilidad. Es la única entidad compartida entre empresas, igual que hoy en Talent Hub. |
| **`Vacante`** (nueva, tenant-scoped) | Hoja `Busquedas` | Mismos campos: puesto, descripción, ubicación, modalidad, jornada, estado (borrador/activa/pausada/cerrada), requisitos, salario, etc. |
| **`Postulacion`** (nueva, vincula `Persona`+`Vacante`) | Hoja `Postulantes` | Firmas (consentimiento/conformidad), respuestas a preguntas de filtrado de la vacante, fecha. |
| **`Evaluado`** (YA EXISTE, `../one-test/backend/app/models/evaluado.py`) | — | Se referencia a `Persona` (por email o FK) cuando una empresa decide tomarle un test psicométrico a alguien que se postuló. El resultado del test queda privado de esa empresa (tenant-scoped, como ya funciona hoy), pero el perfil de la persona es uno solo en todo el sistema. Ya tiene el campo `tipo` (`colaborador`/`postulante`) listo para esto. |
| **`Empresa`** (YA EXISTE, `tenant.py`) — EXTENDER | Hoja `Usuarios` (columnas de empresa) | Sumar: `cuit`, `rubro`, `dni`, `selfie_url`, `dni_frente_url`, `dni_dorso_url`, `firma_legal_url`, `nombre_verificado`, `acepto_terminos`, `fecha_acepto_terminos`. |
| **`EstadoEmpresa`** (enum, YA EXISTE en `enums.py`) — EXTENDER | `EstadoVerificación` de Talent Hub | Hoy solo `activo`/`suspendido`. Sumar `pendiente_verificacion` y `rechazada` para soportar el flujo de alta con aprobación manual (hoy Plataforma ONE no tiene auto-registro de empresa, la da de alta el SuperAdmin a mano — ver `empresas.py`; Talent Hub sí, con verificación). |
| **`NotificacionVacante`** (nueva, tenant-scoped) | Hoja `NotificacionesVacantes` | Auditoría de emails de match enviados. |
| **`EventoComercial`** (nueva) | Hoja `EventosComerciales` | Auditoría interna general. |

**Motor de matching**: portar `calcularCoincidenciaVacante` (Apps Script, `Codigo.gs` línea 1636) a un servicio Python nuevo, ej. `backend/app/core/matching.py`, con la misma lógica de puntaje y el mismo umbral (`MATCH_MINIMO_NOTIFICACION = 55`, tope `3` notificaciones diarias por persona). Reusar `app/core/email.py` (SMTP ya integrado) para el envío.

**Storage de archivos**: buckets de Supabase Storage reemplazando Drive — sugerido: `cvs`, `verificaciones-empresa`, `firmas`.

---

## 4. Plan de trabajo — etapas

> Cada etapa se puede pedir como tarea separada a la IA que lea este archivo. No arrancar una etapa sin haber cerrado (o revisado explícitamente) la anterior, porque hay datos de producción reales en juego (dominio `hubtalent.onelabs.pro` activo, base de Render activa).

### Etapa 0 — Preparación (no destructiva)
- [ ] Confirmar credenciales de Supabase (proyecto creado, connection string, service role key).
- [ ] Exportar snapshot completo del Google Sheet actual (las 6 pestañas, CSV o JSON) como respaldo antes de tocar nada.
- [ ] Confirmar que `../one-test` y `../postulaciones-empresas` siguen desplegados y funcionando en producción sin cambios (son el fallback durante toda la migración).

### Etapa 1 — Mover la base de Plataforma ONE de Render a Supabase (sin agregar features nuevas)
- [ ] Crear la base en Supabase, correr las 12 migraciones de Alembic existentes (`../one-test/backend/alembic/versions/`) tal cual están, sin modificarlas todavía.
- [ ] Actualizar `DATABASE_URL`/`DB_SSL` en el `.env` del backend para apuntar a Supabase.
- [ ] Validar que Plataforma ONE (login, tests, informes) funciona exactamente igual que antes, ahora contra Supabase. Esto de-riesga la infraestructura antes de sumar complejidad de modelo de datos.
- [ ] Activar Row Level Security en las tablas con `tenant_id` (cerrar la deuda documentada en el propio proyecto).

### Etapa 2 — Ampliar el modelo de datos
- [ ] Migraciones Alembic nuevas: tablas `persona`, `vacante`, `postulacion`, `notificacion_vacante`, `evento_comercial`.
- [ ] Migración para extender `Empresa` (campos de verificación) y el enum `EstadoEmpresa` (`pendiente_verificacion`, `rechazada`).
- [ ] Confirmar que `Evaluado.tipo = "postulante"` se vincula correctamente a `Persona` (definir si es FK directa o por email — decidir en esta etapa).

### Etapa 3 — Backend: nuevos módulos
- [ ] Router `vacantes.py` (crear/listar/editar/cambiar estado/eliminar vacante, listado público de activas).
- [ ] Router `postulaciones.py` (recibir postulación pública, listar postulaciones por empresa, exportar).
- [ ] Ampliar `publico.py` con registro público de empresa (con carga de selfie/DNI/firma a Supabase Storage) + flujo de aprobación en `admin.py`.
- [ ] Servicio `matching.py` con el motor portado + integración con `email.py` para las notificaciones automáticas.
- [ ] Migrar `Usuario`/login de empresa a bcrypt desde el registro (ya es el estándar del proyecto, no hay que inventar nada nuevo).

### Etapa 4 — Frontend: nuevas vistas en React
- [ ] Reemplazar `postular.html` → formulario de postulación en React (reusar componentes de `../one-test/frontend/src/components/`).
- [ ] Reemplazar `busquedas.html` → listado público de vacantes.
- [ ] Reemplazar funcionalidad de `empresas.html` → integrarla al panel existente `../one-test/frontend/src/empresa/` (agregar sección "Vacantes" y "Postulantes" al lado de lo que ya hay).
- [ ] Reemplazar `admin.html` → integrar aprobación de empresas al panel `../one-test/frontend/src/superadmin/`.
- [ ] Portar firma digital en canvas (`firmas.js` + `signature_pad` + verificación con MediaPipe) como componente React reutilizable.

### Etapa 5 — Migración de datos reales
- [ ] Script Python one-shot: leer el export de las 6 pestañas del Sheet, mapear a las tablas nuevas de Supabase.
- [ ] Hashear todas las contraseñas de `Usuarios`/`Perfiles` con bcrypt al migrar (invalida sesiones viejas — es intencional y correcto).
- [ ] Descargar los archivos de Google Drive (CVs, selfies, firmas) y resubirlos a los buckets de Supabase Storage, actualizando las URLs.
- [ ] Validar conteos: cantidad de filas migradas = cantidad de filas en el Sheet, por cada pestaña.

### Etapa 6 — Cutover
- [ ] Congelar el Google Sheet / Apps Script viejo (dejarlo de solo lectura, no aceptar más escrituras).
- [ ] Apuntar el dominio (`hubtalent.onelabs.pro` u otro que se decida) al frontend nuevo.
- [ ] Monitorear una semana con datos reales antes de dar de baja definitivamente Apps Script y el Sheet.

---

## 5. Decisiones ya tomadas (no volver a preguntar)

- Se fusionan las dos plataformas en una sola. Se mantiene TODO el funcionamiento existente de ambas, no se recorta nada.
- Plataforma ONE (`one-test`) es la base técnica; Talent Hub se reconstruye sobre ella, no al revés.
- Base de datos única: **Supabase Postgres** (no Render, no Google Sheets). Archivos: **Supabase Storage** (no Google Drive).
- Modelo de candidato: **`Persona` global** + **`Evaluado` por empresa** cuando hay evaluación psicométrica — preserva la base de candidatos compartida de Talent Hub Y el aislamiento de resultados de Plataforma ONE, a la vez.
- Contraseñas: bcrypt en toda la plataforma nueva (se cierra la deuda de passwords en texto plano de Talent Hub).

## 6. Decisiones pendientes (preguntarle a Facundo antes de avanzar en eso puntual)

- Cómputo del backend: ¿se queda en Render (solo se mueve la base a Supabase) o también se migra el hosting del API (ej. a Vercel, dado que está en el stack de Escencial)? FastAPI no corre nativo como función serverless de Vercel sin adaptación — evaluarlo antes de decidir.
- Dominio final de la plataforma unificada (¿se mantiene `hubtalent.onelabs.pro`, se unifica con el dominio de Plataforma ONE, o es uno nuevo?).
- Relación `Evaluado`↔`Persona`: FK directa vs. vínculo por email — definir en la Etapa 2 según cómo se quiera modelar el histórico si una persona cambia de email.
- Qué pasa con los 4 tests bloqueados del catálogo (Dominó-48, DAT, DNLA, EBP) — requiere decisión del psicólogo a cargo, no es un tema de esta migración pero convive con ella.

---

*Última actualización: generado a partir del análisis técnico completo de ambos repos y la conversación de planificación con Facundo. Si esta conversación tuvo continuación después de este archivo, revisar si hay una versión más nueva antes de asumir que esto sigue vigente al 100%.*
