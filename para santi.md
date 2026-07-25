# Plan de trabajo — Santiago

## ONE CoreTalent

Responsabilidad principal: **frontend, experiencia de usuario, integración de pantallas, accesibilidad y validación E2E en navegador**.

Este documento debe utilizarse junto con `para facu.md`. Los contratos que afecten frontend y backend se acuerdan entre ambos antes de comenzar a programar.

---

## 1. Prioridad inmediata: recorrido E2E integral

### Objetivo

Ejecutar y documentar desde la interfaz:

1. Crear una vacante.
2. Publicarla.
3. Crear una cuenta de candidato.
4. Completar el perfil y CV.
5. Postularse.
6. Consultar la postulación desde empresa.
7. Asignar una evaluación.
8. Iniciarla como candidato.
9. Guardar respuestas parciales.
10. Salir y recuperar la sesión.
11. Finalizar el test.
12. Consultar el resultado.
13. Abrir el informe como candidato.
14. Abrir el informe como empresa.
15. Revocar el acceso.
16. Confirmar que la empresa ya no pueda abrirlo.

### Tareas de Santiago

- Ejecutar el recorrido mediante navegador.
- Tomar evidencia de cada paso.
- Registrar URL, rol y datos utilizados.
- Comprobar:

  - navegación;
  - loaders;
  - errores;
  - reintentos;
  - estados vacíos;
  - mensajes de éxito;
  - dobles clics;
  - recuperación de sesión;
  - responsive;
  - accesibilidad.

- Crear incidencias reproducibles para los fallos backend.
- Corregir problemas frontend encontrados.
- Agregar pruebas de integración cuando se corrija un flujo.

### Criterio de cierre

El flujo puede completarse sin Swagger, SQL manual ni cambios directos en Supabase.

---

## 2. Gestión empresarial de evaluaciones

### Pantallas a completar

Dentro del detalle de una postulación:

- Mostrar evaluaciones asignadas.
- Mostrar estado de cada evaluación.
- Mostrar tests que la empresa puede asignar.
- Diferenciar tests sin licencia.
- Evitar asignaciones duplicadas.
- Mostrar resultados reutilizados.
- Permitir abrir el informe cuando corresponda.
- Permitir revocar el acceso con confirmación.

### Estados visuales

- Sin evaluaciones.
- Pendiente.
- En progreso.
- Completada.
- Resultado reutilizado.
- Acceso revocado.
- Error de catálogo.
- Test sin licencia.
- Solicitud en proceso.

### Criterio de cierre

Una empresa puede administrar el flujo completo sin abandonar su panel.

---

## 3. Robustecimiento del TestRunner

### Shell común

Revisar y completar:

- encabezado y marca;
- instrucciones;
- consentimiento;
- progreso;
- guardado automático;
- indicador del último guardado;
- recuperación de sesión;
- navegación controlada;
- advertencia al abandonar;
- estados de carga y error;
- reintento;
- envío idempotente;
- pantalla final;
- accesibilidad por teclado;
- responsive;
- reducción de movimiento.

### Adaptadores

- Escala/Likert.
- Opción múltiple.
- Selección forzada.
- Matrices.
- Estímulos visuales.
- Test cronometrado.

### Orden de revisión

1. DISC.
2. Big Five.
3. STAI.
4. Kuder.
5. WAIS-IV.
6. Toulouse-Piéron.
7. Dominó-48 si está autorizado.
8. Resto de tests habilitados.

### Validación

- Comparar con el runner original.
- Utilizar casos conocidos.
- Confirmar payload de respuestas.
- Probar refresh y recuperación.
- Probar doble finalización.
- Probar interrupción de red durante el autoguardado.

---

## 4. Informes psicométricos

### Tareas

- Revisar la vista de empresa.
- Revisar la vista de candidato.
- Unificar:

  - encabezado;
  - fecha;
  - contexto;
  - versión;
  - escalas;
  - gráficos;
  - tablas;
  - interpretaciones;
  - estados sin información.

- Verificar impresión.
- Verificar exportación PDF.
- Revisar saltos de página.
- Probar textos extensos.
- Mantener Recharts y PDF con carga diferida.
- No mostrar respuestas crudas.
- No calcular puntajes en frontend.
- No presentar afirmaciones clínicas no permitidas.

### Accesibilidad

- Títulos jerárquicos.
- Texto alternativo o equivalente para gráficos.
- Contraste suficiente.
- Navegación por teclado.
- Versión imprimible legible.

---

## 5. Recuperación de contraseña

### Pantallas necesarias

- Solicitar recuperación.
- Confirmar solicitud sin revelar si el email existe.
- Crear nueva contraseña.
- Token vencido.
- Token inválido.
- Recuperación exitosa.

### Validaciones

- Email válido.
- Contraseña mínima.
- Confirmación coincidente.
- Prevención de doble envío.
- Estados de carga y reintento.

### Trabajo conjunto

Probar con Facu el enlace recibido por email y el regreso correcto al login.

---

## 6. Módulo 360°

### Tareas

- Revisar las pantallas originales de `one-test`.
- Inventariar:

  - procesos;
  - áreas;
  - evaluadores;
  - formularios;
  - resultados;
  - informes;
  - estados administrativos.

- Portar las vistas priorizadas.
- Adaptarlas al sistema visual actual.
- Mantener separado el recorrido de:

  - candidato/postulante;
  - evaluado/colaborador.

- Incorporar loaders, errores, vacíos y responsive.
- Agregar pruebas de navegación y permisos.

### Dependencia

No comenzar una pantalla hasta que Facu confirme el endpoint y el alcance funcional.

---

## 7. Auditoría visual completa

### Portal público

- Landing.
- Navbar desktop y móvil.
- Footer.
- Búsquedas.
- Registro de candidato.
- Login de candidato.
- Registro de empresa.
- Postulación.
- Páginas legales.
- Página 404.

### Portal candidato

- Inicio.
- Búsquedas.
- Postulaciones.
- Detalle de postulación.
- Evaluaciones.
- Runner.
- Resultados.
- Informes.
- Perfil.
- Seguridad.
- Privacidad.

### Panel empresa

- Vacantes.
- Formulario de vacante.
- Detalle.
- Postulantes.
- Evaluaciones.
- Informes.

### SuperAdmin

- Empresas pendientes.
- Aprobación.
- Rechazo.
- Estados vacíos y errores.

### Viewports

- Escritorio amplio.
- Notebook.
- Tablet.
- Móvil.

### Verificar

- Sin overflow horizontal.
- Sin botones cortados.
- Sin textos corruptos.
- Sin controles sin estilos.
- Foco visible.
- Navegación por teclado.
- Estados activos claros.
- Diálogos accesibles.
- Cámara y firma utilizables en móvil.

---

## 8. Rendimiento frontend

### Tareas

- Revisar chunks generados.
- Mantener lazy loading por ruta.
- Evitar cargar PDF, gráficos o MediaPipe fuera de sus pantallas.
- Optimizar imágenes.
- Evitar renders innecesarios.
- Cancelar solicitudes al desmontar.
- Revisar tamaños de bundles.
- Validar tiempos de carga con backend frío.
- Agregar skeletons donde el tiempo sea perceptible.

---

## 9. Validación de migración

Cuando Facu prepare la migración:

- Comparar empresas del origen y destino.
- Comparar usuarios.
- Comparar vacantes.
- Comparar candidatos.
- Comparar postulaciones.
- Abrir muestras de CV.
- Abrir muestras de firmas.
- Verificar textos, fechas y caracteres.
- Validar estados.
- Registrar inconsistencias con ID anterior y nuevo.

### Criterio de cierre

Una muestra representativa puede utilizarse desde la interfaz sin diferencias funcionales relevantes respecto del sistema anterior.

---

## 10. Staging

### Tareas

- Ejecutar smoke test después de cada despliegue.
- Probar rutas profundas.
- Probar refresh en rutas internas.
- Validar variables públicas.
- Probar los tres roles.
- Probar desktop y móvil.
- Revisar consola.
- Revisar errores de red.
- Confirmar URLs de Storage.
- Verificar documentos PDF descargados.

### Checklist mínimo

- Landing abre.
- Login candidato abre.
- Login empresa abre.
- Login SuperAdmin funciona.
- Vacantes públicas cargan.
- Candidato accede a su portal.
- Empresa accede a su panel.
- Evaluado puede iniciar un test.
- Resultado e informe se consultan.

---

## 11. Documentación de usuario

### Preparar guías para

- Candidato:

  - crear cuenta;
  - completar perfil;
  - postularse;
  - rendir evaluación;
  - consultar resultado.

- Empresa:

  - crear vacante;
  - consultar postulantes;
  - asignar evaluación;
  - consultar informe;
  - revocar acceso.

- SuperAdmin:

  - revisar empresa;
  - aprobar;
  - rechazar;
  - resolver incidencias comunes.

### Formato sugerido

- Pasos cortos.
- Capturas.
- Resultado esperado.
- Errores frecuentes.
- Canal de soporte.

---

## 12. Forma de trabajo con Facu

### Antes de implementar

- Confirmar endpoint y payload.
- Acordar estados visuales.
- Solicitar ejemplos reales.
- Identificar permisos.
- Definir criterio de aceptación.

### Durante la implementación

- Trabajar en una rama corta.
- Evitar cambios backend salvo coordinación.
- No duplicar lógica de scoring.
- Mantener componentes reutilizables.
- Agregar pruebas junto con el cambio.

### Entrega a Facu

Cada integración debe informar:

- ruta de frontend;
- endpoint utilizado;
- estados soportados;
- errores manejados;
- evidencia visual;
- prueba automatizada;
- pendiente o limitación detectada.

---

## 13. Rutina diaria

### Inicio — 15 minutos

- Revisar tareas.
- Informar bloqueos.
- Elegir archivos sin conflicto.
- Acordar contratos.

### Desarrollo paralelo

- Santiago: frontend, UX y navegador.
- Facu: backend, datos y seguridad.

### Pair programming — 45 a 90 minutos

Usarlo para:

- contratos;
- errores E2E;
- permisos;
- migraciones;
- flujos críticos.

Alternar diariamente quién conduce.

### Cierre — 20 minutos

- Ejecutar pruebas.
- Revisar cambios cruzados.
- Actualizar documentación.
- Preparar el siguiente punto exacto.

---

## 14. Comandos de validación

```bash
npm run lint
npm test -- --run
npm run build
```

Antes de integrar:

- revisar consola;
- probar ruta modificada;
- probar viewport móvil;
- confirmar ausencia de secretos;
- actualizar `PLATAFORMA.md` e `INSTRUCCIONES.md` si cambió el comportamiento.

---

## Resultado esperado

Santiago deja completa y consistente:

- experiencia pública;
- portal del candidato;
- panel empresarial;
- runners;
- informes;
- accesibilidad;
- validación E2E;
- documentación de usuario.

El trabajo se considera terminado cuando todos los flujos pueden completarse desde la interfaz, funcionan en staging y están documentados para usuarios y soporte.
