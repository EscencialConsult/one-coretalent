# Matriz de pruebas E2E — Santiago

Fecha de preparación: 25-07-2026  
Estado: Fase S0 completada; Fase S1 en ejecución.

## Objetivo

Validar el recorrido completo de la plataforma con datos sintéticos:

`vacante pública → registro/login → postulación → asignación de evaluación → ejecución → resultado → consulta empresarial → auditoría`

Las pruebas deben ejecutarse sin usar datos productivos y sin guardar credenciales en el repositorio.

## Entorno validado

| Componente | Dirección local | Estado S0 |
|---|---|---|
| Frontend | `http://127.0.0.1:5173` | Disponible |
| Backend | `http://127.0.0.1:8000` | Disponible |
| Salud de API | `GET /health` | Correcta |
| Base de datos | Supabase mediante variables locales ignoradas por Git | Conectada |
| Migraciones | Alembic `e6f7a8b9c0d1` | En `head` |
| Storage privado | CV, selfies y firmas | Configurado |

## Línea base técnica

| Verificación | Resultado |
|---|---|
| Frontend lint | Sin errores; 2 advertencias preexistentes de Dominó-48 |
| Frontend tests | 33/33 aprobados |
| Frontend build | Exitoso |
| Backend compilación | Exitosa |
| Backend tests | 15/15 aprobados |
| Migraciones | Base actualizada al último `head` |

## Actores de prueba

| Rol | Identidad E2E | Estado |
|---|---|---|
| SuperAdmin | Cuenta sintética con dominio `example.com` | Existe; acceso pendiente de recuperar o restablecer |
| Administrador de empresa | Cuenta asociada a `Empresa E2E Test` | Login verificado |
| Candidato | Cuenta global sintética | Login verificado |

Las contraseñas y claves administrativas se mantienen solamente en el entorno local.

## Inventario inicial

- 4 empresas activas.
- 5 vacantes activas, 2 borradores y 1 pausada.
- 6 postulaciones.
- 6 personas globales.
- 1 licencia de test activa.
- 0 asignaciones de evaluación.
- 0 resultados de persona.
- 0 accesos activos a resultados.
- Outbox de eventos vacío.

### Empresa E2E

- `Analista de Datos (E2E)`: activa, con 3 postulaciones.
- `Desarrollador/a Frontend React (E2E)`: activa, con 2 postulaciones.
- `Coordinador/a RRHH (E2E)`: pausada, sin postulaciones.

## Instrumento recomendado

Se utilizará `gds-15` para el primer recorrido controlado porque es un instrumento corto, estable y actualmente presente en el catálogo.

Precondición pendiente: la única licencia activa de `gds-15` pertenece a `Empresa Staging QA`. Antes de crear la asignación deberá habilitarse esa licencia para `Empresa E2E Test` mediante el flujo administrativo, o ejecutar el caso íntegramente bajo la empresa que ya posee la licencia.

## Matriz de ejecución S1

| # | Actor | Ruta o API | Acción | Resultado esperado | Estado | Evidencia |
|---:|---|---|---|---|---|---|
| 1 | Público | `/busquedas` | Abrir catálogo | Solo se listan vacantes activas de empresas activas | Aprobado | Validación en navegador: 5 activas antes del alta S1 |
| 2 | Público | `/busquedas` | Filtrar y ordenar vacantes | Resultados y contador se actualizan correctamente | Pendiente | Captura |
| 3 | Público | Detalle de vacante | Abrir una vacante E2E | Se presenta información pública sin datos administrativos | Aprobado | Detalle de `Especialista QA de Plataforma (S1 E2E)` |
| 4 | Candidato | `/registro-candidato` | Registrar una identidad sintética nueva | Se crea la persona, inicia sesión y entra al portal | Aprobado | Cuenta sintética S1 y sesión automática verificadas |
| 5 | Candidato | `/candidato/perfil` | Completar datos profesionales | El perfil persiste formación, idiomas y experiencia | Aprobado | Perfil, formación, idioma, experiencia y CV PDF persistidos |
| 6 | Candidato | Postulación pública/autenticada | Postularse a una vacante | La postulación deriva `persona_id` desde la identidad autenticada | Aprobado | Perfil reutilizado, firma capturada y postulación creada |
| 7 | Candidato | `/candidato/postulaciones` | Consultar historial | La nueva postulación aparece con empresa, vacante y estado | Aprobado | Historial con 1 postulación activa |
| 8 | Empresa | Login empresarial | Iniciar sesión | Se restaura el tenant correcto sin acceso a otras empresas | Aprobado | Sesión de Empresa E2E Test |
| 9 | Empresa | Vacantes/postulaciones | Abrir la postulación creada | Solo se presentan datos autorizados del candidato | Aprobado parcial | La empresa ve candidato y CV; falta detalle administrable |
| 10 | SuperAdmin/dato E2E | Administración de licencias | Habilitar `gds-15` para la empresa E2E | La empresa obtiene una licencia activa y auditable | Aprobado para fixture | Licencia sintética activa; falta pantalla SuperAdmin |
| 11 | Empresa | Evaluaciones de postulación | Asignar `gds-15` | Se crea una asignación vinculada a postulación y persona correctas | Aprobado | Asignación real creada desde el panel empresarial |
| 12 | Candidato | `/candidato/evaluaciones` | Consultar pendientes | La evaluación asignada aparece sin respuestas sensibles | Aprobado | GDS-15 visible como pendiente |
| 13 | Candidato | Runner | Iniciar evaluación | Se registra inicio y versión del catálogo/algoritmo | Aprobado | GDS-15 iniciado desde la interfaz con consentimiento explícito |
| 14 | Candidato | Runner | Guardar respuestas parciales | El progreso se recupera tras recargar la página | Aprobado | Autoguardado real y recuperación en pregunta 14 con 13/15 respuestas |
| 15 | Candidato | Runner | Finalizar una vez | El backend calcula y persiste el resultado | Aprobado | GDS-15 finalizado; aparece en la sección Completadas |
| 16 | Candidato | Runner | Reintentar finalización | La operación es idempotente y no recalcula el test | Aprobado automatizado | El endpoint devuelve el resumen existente; contrato cubierto por test backend |
| 17 | Candidato/Empresa | Informe del postulante | Consultar resultado permitido | Se muestra puntaje, baremo, interpretación, fecha y versiones | Aprobado | Ambas audiencias verificadas con GDS-15; PDF real generado y validado |
| 18 | Empresa | Auditoría y accesos | Consultar/revocar acceso | Consulta y revocación quedan registradas; el acceso revocado deja de funcionar | Aprobado | Revocación real desde el panel; URL directa empresarial devuelve “Resultado no disponible” y el candidato conserva acceso |

## Controles transversales

- Regresión del catálogo ejecutada: **108/108 casos conocidos aprobados**.
- Regresión frontend final: **40/40 pruebas aprobadas**.
- Regresión backend final: **20/20 pruebas aprobadas**.
- Viewports comprobados: móvil, tablet y escritorio, sin overflow horizontal.
- Accesibilidad estructural: títulos principales, nombres de controles, textos alternativos, estados ARIA, foco y navegación móvil comprobados.
- Rutas profundas comprobadas mediante carga directa y refresh.
- Consola de candidato y empresa sin errores ni advertencias del producto.
- Backend y conexión de base de datos saludables.

- Verificar aislamiento entre empresas en cada consulta empresarial.
- Confirmar que el frontend nunca envía ni decide el `persona_id` efectivo.
- Confirmar que el scoring ocurre únicamente en backend.
- No exponer respuestas crudas ni datos sensibles en listados.
- Verificar recuperación de sesión y progreso parcial.
- Comprobar navegación por teclado, foco, mensajes de error y estados de carga.
- Confirmar que notificaciones/eventos diferidos no bloquean la transacción principal.
- Conservar evidencia sin tokens, contraseñas ni claves de Supabase.

## Bloqueos para iniciar el recorrido completo

1. Recuperar o restablecer la credencial local de la cuenta SuperAdmin E2E.
2. Habilitar una licencia de `gds-15` para `Empresa E2E Test`, preferentemente mediante la interfaz administrativa.
3. Confirmar el catálogo y runner disponible de `gds-15` antes de finalizar la evaluación.

## Hallazgos durante S1

### Corregidos

- Los campos del alta de vacantes no estaban asociados programáticamente con sus etiquetas.
- El selector de estado de la vacante no tenía nombre accesible.
- Cargar el CV reemplazaba el formulario completo con la respuesta del backend y eliminaba cambios todavía no guardados.
- Se sincronizó la contraseña del rol restringido `app_runtime` con la configuración local para recuperar la conexión real con RLS.
- `Postularme con mi perfil` ya reutiliza nombre, contacto, ubicación, perfil, idiomas y experiencia.
- La API deriva la identidad efectiva desde el token de Persona cuando existe una sesión y no confía en el email del formulario.
- La transición RLS permite leer la vacante pública y luego inserta la postulación bajo el tenant y la Persona autenticada.
- Corregida la expresión regular que rechazaba emails válidos.
- Normalizado el nivel de idioma guardado para que coincida con las opciones del formulario.

### Pendientes

- El formulario público de postulación contiene campos sin etiquetas accesibles.
- La empresa E2E todavía necesita una licencia válida antes de asignar `gds-15`.
- El detalle empresarial lista al postulante y su CV, pero no permite abrir la postulación ni gestionar evaluaciones; este bloqueo se resuelve en S2.

## Resultado de S2 — Gestión empresarial

- Agregado acceso **Gestionar** desde cada postulante de una vacante.
- Creada una vista empresarial dedicada con:

  - identidad, datos autorizados, puesto y CV;
  - evaluaciones asignadas;
  - estados pendiente, en progreso y completada;
  - resultado reutilizado;
  - acceso revocado;
  - catálogo completo de instrumentos;
  - diferenciación entre habilitado, sin licencia y no disponible;
  - prevención de asignaciones duplicadas;
  - solicitud en proceso;
  - apertura del informe;
  - revocación mediante confirmación.

- Incorporado el contrato `GET /empresa/catalogo-tests`, que presenta el catálogo junto con el estado de licencia del tenant.
- Incorporado `acceso_revocado` al resumen de evaluación para no inferirlo ambiguamente en frontend.
- Habilitada `gds-15` únicamente como fixture de la empresa `e2e-codex`, debido a que la administración visual de licencias SuperAdmin todavía no existe.
- Asignación real GDS-15 creada y visible como pendiente en el portal del candidato.
- Confirmado que el catálogo bloquea una segunda asignación del mismo instrumento.

## Evidencia de postulación S1

- Vacante: `Especialista QA de Plataforma (S1 E2E)`.
- La cámara se utilizó temporalmente para confirmar presencia facial y se abandonó al finalizar el formulario.
- La firma sintética quedó almacenada como consentimiento de la postulación.
- El historial del candidato muestra una postulación activa.
- La empresa visualiza al candidato, sus datos autorizados y el enlace firmado del CV.
- No se almacenó una selfie ni contenido de video.
