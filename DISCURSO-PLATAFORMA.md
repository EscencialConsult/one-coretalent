# ONE Core-Talent — discurso de presentación

> Documento para explicar la plataforma de punta a punta: de dónde viene, qué tiene hoy, y qué se le sumó al unir Hub Talent con Core Analytics. Pensado para leerse en voz alta o adaptarse según a quién se lo cuentes (cliente, equipo interno, Santiago, un candidato nuevo del equipo).

---

## 1. El punto de partida — dos sistemas que resolvían la mitad del problema cada uno

Antes de esta plataforma, en Escencial teníamos **dos herramientas separadas** que hacían cada una una mitad del trabajo de selección de personal:

**Hub Talent** — nuestra plataforma de postulaciones. Un candidato entraba, cargaba su CV, se postulaba a una búsqueda. Una empresa entraba, publicaba un puesto, veía quién se había postulado. Funcionaba, pero estaba armada sobre **Google Sheets y Google Apps Script** — es decir, una planilla de cálculo haciendo de base de datos. Servía para arrancar, pero tenía techo: sin aislamiento real entre empresas (en el fondo, todas las empresas veían la misma planilla), sin capacidad de crecer mucho más, y atada a los límites de Google Sheets.

**Core Analytics** — nuestro motor de evaluaciones psicométricas. Ahí sí vivía la parte más sofisticada del negocio: el catálogo real de tests (DISC, WAIS-IV, Big Five, IPP, Kuder, DAT, CHASIDE, GDS-15, y varios más), con corrección automática, informes con gráficos y diagnósticos, todo con aislamiento real por empresa (multi-tenant, con seguridad a nivel de base de datos). Pero Core Analytics no tenía portal de postulación pública ni búsqueda de empleo — era para evaluar, no para reclutar.

Un cliente que quería **buscar personal y evaluarlo** tenía que pasar por dos sistemas distintos, sin conexión entre sí.

## 2. Qué es ONE Core-Talent hoy

**ONE Core-Talent** es la unificación de esos dos mundos en una sola plataforma, con la base técnica sólida de Core Analytics (React + FastAPI + Postgres con seguridad real por fila, no una planilla) y toda la experiencia de postulación pública que ya tenía Hub Talent, pero reconstruida desde cero sobre esa base.

Hoy, en un solo lugar:

- Un **candidato** entra, crea su perfil, sube su CV, busca vacantes públicas y se postula.
- Una **empresa** se auto-registra (con verificación de identidad: selfie, firma legal, documento), un administrador de Escencial la revisa y aprueba, y desde ahí la empresa publica sus propias búsquedas, ve quién se postuló, y — esto es lo nuevo — **puede evaluar a sus candidatos con el catálogo completo de tests psicométricos de Core Analytics**, todo integrado en el mismo flujo.
- El **equipo de Escencial** (SuperAdmin) tiene un panel central: aprueba empresas nuevas, habilita qué tests puede usar cada una, ve métricas globales, gestiona todo el catálogo.

## 3. Lo que se sumó — la parte de Core Analytics

Esto es lo que un cliente de Hub Talent **no tenía antes** y ahora sí:

- **Catálogo de 22 evaluaciones psicométricas y técnicas**, listas para asignar: personalidad (Big Five, DISC, Eneagrama), aptitudes (DAT, Domino 48, Toulouse-Piéron), orientación vocacional (CHASIDE, Kuder, IPP), liderazgo y perfil comercial (la línea DNLA completa), bienestar y salud mental (GDS-15, STAI, EBP, CAD), inteligencia emocional (Bar-On EQ-i), habilidades técnicas (Excel en sus tres niveles) y WAIS-IV.
- **Habilitación por empresa**: cada empresa solo ve y puede usar los tests que Escencial le habilitó — no es todo para todos, es un catálogo curado por cliente.
- **Corrección automática e informes**: el candidato responde online, el sistema corrige y arma el informe, sin trabajo manual de un psicólogo por cada evaluación individual.
- **Seguridad real de datos**: cada empresa está aislada de las demás a nivel de base de datos (Row Level Security) — no es una convención de la aplicación, es una regla que la base de datos misma hace cumplir. Antes, en la planilla de Hub Talent, ese aislamiento no existía de verdad.

## 4. Lo que se mantuvo y se mejoró de Hub Talent

- **Búsqueda pública de empleo** y **postulación en minutos**, sin fricción, con carga de CV.
- **Auto-registro de empresa con verificación de identidad** (selfie + firma legal + documento) antes de poder operar — el mismo espíritu de control que tenía Hub Talent, ahora sobre una base de datos real en vez de una planilla.
- **Migración completa de los datos históricos**: nada se perdió. Empresas, vacantes, candidatos y postulaciones reales que estaban en la planilla de Hub Talent ya están adentro de esta plataforma nueva — incluyendo una última pasada hecha hoy mismo para traer todo lo que había entrado en los últimos días.

## 5. Dónde vive, técnicamente (para quien pregunte)

- Frontend en React, backend en Python (FastAPI), base de datos Postgres con seguridad por fila real.
- Alojada en infraestructura propia (servidor de la oficina), no depende de un servicio de terceros pago.
- Accesible en **`hubtalent.onelabs.pro`** — el mismo link que la gente ya conocía de Hub Talent, ahora apuntando a la plataforma nueva.
- Marca: **ONE**, de Escencial Consultora.

## 6. Lo que todavía falta pulir (para ser honestos)

No todo lo que tenía Hub Talent se portó al 100% todavía:

- La verificación de identidad de empresas nueva no tiene, por ahora, la prueba de vida (detectar que la selfie es de una persona real y no una foto) que sí tenía el sistema viejo.
- Falta que la empresa cliente pueda exportar su propia base de candidatos a Excel/CSV directamente (hoy es una función solo del equipo de Escencial).
- Algunos campos de verificación (foto de DNI) están soportados por el sistema pero todavía no tienen un lugar en el formulario para cargarlos.

Nada de esto bloquea el uso diario de la plataforma — son mejoras para la hoja de ruta, no huecos de seguridad activos.

---

**En una frase**: Hub Talent te traía candidatos, Core Analytics te decía si eran los candidatos correctos. ONE Core-Talent hace las dos cosas en el mismo lugar, sobre una base técnica que por fin puede crecer con el negocio.
