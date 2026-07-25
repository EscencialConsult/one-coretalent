# Plan de trabajo — Facu

## ONE CoreTalent

Responsabilidad principal: **backend, base de datos, seguridad, integraciones, migración y despliegue**.

Este documento debe utilizarse junto con `para santi.md`. Los contratos que afecten frontend y backend se acuerdan entre ambos antes de comenzar a programar.

---

## 1. Prioridad inmediata: recorrido E2E integral

### Objetivo

Comprobar que el flujo principal funciona sin modificar manualmente la base de datos:

1. Empresa crea una vacante.
2. La vacante se publica.
3. Candidato crea su cuenta.
4. Completa su perfil.
5. Se postula.
6. Empresa consulta la postulación.
7. Empresa asigna una evaluación.
8. Candidato inicia, guarda progreso y finaliza.
9. Backend calcula y persiste el resultado.
10. Candidato consulta su resultado.
11. Empresa consulta el informe.
12. Se revoca el acceso empresarial.

### Tareas de Facu

- Observar logs y transacciones durante cada paso.
- Confirmar que todas las relaciones se realizan mediante IDs.
- Verificar que cada registro utilice el tenant correspondiente.
- Confirmar la creación de eventos de auditoría.
- Verificar las versiones de catálogo y algoritmo.
- Confirmar que las respuestas parciales se eliminan después de finalizar.
- Validar la creación y revocación de `AccesoResultado`.
- Revisar el procesamiento de `OutboxEvento`.
- Probar dobles asignaciones y dobles finalizaciones.
- Probar sesiones vencidas y tokens de roles incorrectos.
- Registrar cualquier incidencia reproducible.

### Criterio de cierre

- El recorrido completo funciona mediante UI y API.
- No se requieren consultas SQL manuales para completarlo.
- Los errores devuelven códigos HTTP y mensajes coherentes.
- La auditoría permite reconstruir el recorrido.

---

## 2. Gestión empresarial de evaluaciones

### Tareas

- Revisar y completar los contratos para:

  - asignar una evaluación;
  - listar evaluaciones de una postulación;
  - consultar su estado;
  - abrir un resultado autorizado;
  - revocar el acceso.

- Validar que la vacante y la postulación pertenezcan al tenant autenticado.
- Derivar `persona_id` desde la postulación.
- Rechazar propiedades adicionales no autorizadas.
- Validar catálogo, runner y licencia empresarial.
- Garantizar idempotencia ante solicitudes repetidas.
- Evitar asignaciones duplicadas.
- Diferenciar claramente:

  - pendiente;
  - en progreso;
  - completada;
  - resultado reutilizado;
  - acceso revocado.

- Incorporar paginación si los listados pueden crecer.
- Agregar pruebas de integración para permisos y estados.

### Dependencia con Santiago

Antes de implementar cambios de contrato, entregar ejemplos JSON de éxito y error para que Santiago construya la interfaz sobre un contrato estable.

---

## 3. Robustecimiento del motor psicométrico

### Tareas

- Revisar el contrato de preguntas para cada runner habilitado.
- Validar estrictamente el formato de respuestas.
- Evitar exponer:

  - claves de corrección;
  - baremos internos innecesarios;
  - respuestas de otros usuarios;
  - datos de scoring no autorizados.

- Confirmar que todo cálculo ocurra en backend.
- Revisar locks transaccionales de finalización.
- Confirmar que una asignación finalizada no se recalcula.
- Validar la reutilización concurrente de resultados.
- Mantener hashes estables para versión de catálogo y algoritmo.
- Ejecutar regresiones contra los casos conocidos del catálogo.

### Tests bloqueados

No habilitar sin autorización profesional:

- `dat`;
- `dnla-perfil-comercial`;
- `ebp`.

Dominó-48 debe mantenerse sujeto a la autorización vigente y a la comparación con el comportamiento validado.

---

## 4. Informes y acceso a resultados

### Tareas

- Confirmar que los informes consuman resultados persistidos.
- Evitar endpoints que recalculen scoring al consultar.
- Filtrar respuestas crudas según rol.
- Registrar cada consulta sensible.
- Comprobar que una revocación impida inmediatamente nuevas consultas.
- Confirmar que candidato y empresa reciban vistas permitidas diferentes.
- Incluir en la respuesta:

  - fecha;
  - test;
  - versión;
  - contexto;
  - puntaje;
  - baremo;
  - interpretación.

- Evitar afirmaciones clínicas no autorizadas.
- Agregar pruebas para acceso válido, acceso ajeno y acceso revocado.

---

## 5. Recuperación de contraseña y comunicaciones

### Tareas

- Implementar solicitud de recuperación de contraseña.
- Responder de forma neutra para no revelar si un email existe.
- Crear tokens:

  - aleatorios;
  - de un solo uso;
  - con vencimiento;
  - almacenados de manera segura.

- Invalidar tokens anteriores al generar uno nuevo.
- Implementar confirmación de nueva contraseña.
- Agregar rate limiting.
- Enviar emails mediante outbox.
- Incorporar reintentos y registro de fallos.
- Preparar configuración para email de staging.

### Trabajo conjunto

Definir con Santiago los estados de interfaz y probar un enlace real desde el email hasta la nueva contraseña.

---

## 6. Módulo 360°

### Tareas

- Auditar modelos y endpoints existentes.
- Confirmar aislamiento por empresa.
- Revisar roles y permisos.
- Evitar mezclar resultados 360° con tests de selección.
- Corregir contratos inconsistentes.
- Agregar pruebas de integración.
- Definir qué parte del módulo entra en la primera entrega.

### Dependencia

El alcance funcional debe confirmarse con negocio antes de portar o ampliar endpoints.

---

## 7. Seguridad

### Auditoría requerida

- Revisar RLS tabla por tabla.
- Probar acceso con tenant incorrecto.
- Probar IDs pertenecientes a otra empresa.
- Revisar CORS.
- Revisar expiración y validación JWT.
- Auditar logs para evitar datos sensibles.
- Verificar límites de archivos.
- Incorporar rate limiting en:

  - login;
  - registro;
  - recuperación de contraseña;
  - endpoints públicos.

- Revisar dependencias con alertas de seguridad.
- Preparar rotación de secretos.
- Verificar que `app_runtime` no tenga privilegios administrativos.

### Criterio de cierre

Ningún usuario puede consultar o modificar información de otro tenant mediante cambios de URL, ID o payload.

---

## 8. Rendimiento y operación

### Tareas

- Revisar consultas lentas y N+1.
- Confirmar índices para filtros y relaciones frecuentes.
- Validar conexiones con Supavisor/PgBouncer.
- Configurar health checks.
- Estructurar logs por `X-Request-ID`.
- Definir métricas mínimas:

  - errores HTTP;
  - duración de solicitudes;
  - fallos de outbox;
  - conexiones de base;
  - fallos de Storage.

- Preparar monitoreo y alertas para staging.

---

## 9. Migración de datos reales

No comenzar hasta aprobar el E2E integral.

### Tareas

- Obtener export verificable de las seis hojas del sistema anterior.
- Generar backup antes de transformar datos.
- Crear un script idempotente.
- Mantener un mapa de IDs anteriores y nuevos.
- Transformar:

  - empresas;
  - usuarios;
  - personas;
  - vacantes;
  - postulaciones;
  - notificaciones;
  - eventos.

- Definir tratamiento de contraseñas existentes.
- Descargar archivos desde Google Drive.
- Subir CV, selfies y firmas a Supabase Storage.
- Registrar:

  - filas procesadas;
  - migradas;
  - duplicadas;
  - omitidas;
  - fallidas.

- Permitir reanudar la migración sin duplicar datos.

### Criterio de cierre

Los conteos coinciden con el origen o cada diferencia queda justificada.

---

## 10. Staging y despliegue

### Tareas

- Confirmar hosting definitivo del backend.
- Preparar entorno de staging.
- Configurar variables mediante secretos del proveedor.
- Ejecutar migraciones durante el despliegue.
- Configurar dominio, HTTPS y CORS.
- Verificar URLs firmadas de Storage.
- Preparar:

  - procedimiento de deploy;
  - procedimiento de rollback;
  - backup previo;
  - smoke tests;
  - monitoreo posterior.

### Cutover

- Congelar escrituras en el sistema anterior.
- Ejecutar backup final.
- Correr migración definitiva.
- Validar conteos.
- Mantener los sistemas anteriores en modo consulta.
- Monitorear la primera semana antes de aprobar la baja.

---

## 11. Forma de trabajo con Santiago

### Antes de implementar

- Acordar el contrato API.
- Preparar ejemplos JSON.
- Definir permisos y estados.
- Marcar si requiere migración.

### Durante la implementación

- Trabajar en una rama corta.
- Evitar modificar archivos frontend salvo coordinación.
- Agregar pruebas junto con el cambio.
- No modificar migraciones ya compartidas; crear una correctiva.

### Entrega a Santiago

Cada endpoint debe entregarse con:

- ruta y método;
- autorización requerida;
- payload;
- respuesta;
- errores previstos;
- estados posibles;
- datos de prueba;
- prueba automatizada.

---

## 12. Comandos de validación

```bash
cd backend
./.venv/Scripts/python -m compileall -q app
./.venv/Scripts/python -m unittest discover -s tests -v
./.venv/Scripts/python -m alembic current
```

Antes de integrar:

- revisar migraciones;
- revisar RLS;
- ejecutar tests;
- confirmar ausencia de secretos;
- actualizar `PLATAFORMA.md` e `INSTRUCCIONES.md` si cambió el contrato.

---

## Resultado esperado

Facu deja estable y verificable:

- backend;
- seguridad;
- base de datos;
- evaluación psicométrica;
- migración;
- staging;
- operación y despliegue.

El trabajo se considera terminado cuando el recorrido completo funciona con datos reales, los permisos están validados y existe un procedimiento probado de despliegue y recuperación.
