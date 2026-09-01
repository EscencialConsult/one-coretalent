# Product

## Register

product

## Users

Dos públicos, en el sitio público (landing, búsquedas, login, registro):

- **Postulantes** — público general buscando trabajo. No asumir buena conectividad ni
  dispositivo nuevo: muchos entran desde el celular, con planes de datos limitados o wifi
  lenta. Nivel técnico variable, desde perfiles junior/primer empleo hasta profesionales
  senior. Objetivo inmediato: entender rápido si hay una búsqueda para ellos, postularse sin
  fricción, y no perder su perfil/CV entre una postulación y otra.
- **Empresas y consultoras de RRHH** — publican búsquedas y evalúan candidatos. Necesitan
  confiar en que la plataforma es seria antes de registrarse (van a poner ahí datos de
  postulantes reales). Su tarea es más transaccional: publicar, filtrar, decidir.

## Product Purpose

ONE Core-Talent (de Escencial Consultora) une selección de personal (postulaciones,
búsquedas laborales) y evaluación psicométrica en una sola plataforma multi-tenant. Un
postulante arma un perfil una sola vez y lo reutiliza en cualquier búsqueda; una empresa
publica una búsqueda, recibe postulantes organizados y opcionalmente les asigna una
evaluación, todo con marca blanca por empresa cliente. Reemplaza dos sistemas legacy
separados (un motor de evaluaciones y un sistema de postulaciones en Google Sheets) que
antes no se hablaban entre sí.

Éxito = un postulante sin instrucciones previas entiende en segundos si le sirve una
búsqueda y se postula sin trabarse, y una empresa confía lo suficiente en la primera
pantalla como para registrarse.

## Brand Personality

**La marca es ONE — de Escencial Consultora.** No es "AdRHA": ese fue un pelaje de marca
blanca que se probó y se revirtió; el look base de la plataforma vuelve a ser el de ONE
(paleta rosa/cian/oro/violeta, isotipo espiral).

Personalidad: **consultora de RRHH real, no un SaaS frío.** Seria pero humana — pensada
para alguien buscando trabajo, no para un inversor mirando un pitch deck. Directa y clara
antes que "linda"; el diseño sirve para que la persona resuelva su trámite (postularse,
publicar una búsqueda), no para impresionar.

## Anti-references

Confirmado explícitamente, evitar los tres:

- **SaaS genérico de estética IA** — gradientes por todos lados, glow en tarjetas idle,
  eyebrows en mayúscula arriba de cada sección, iconos flotando sin motivo, badges de
  colores random. Esto ya se marcó varias veces esta sesión como "se ve muy IA" — es el
  problema concreto a resolver, no una preferencia estética abstracta.
- **Software de RRHH corporativo aburrido** — azules apagados, tablas grises sin jerarquía,
  cero personalidad, la sensación de sistema de gestión de personal de los 2000.
- **App de búsqueda de empleo genérica** — clon de LinkedIn/Indeed sin identidad propia de
  ONE/Escencial, donde cualquier marca podría estar en el logo y no cambiaría nada.

## Design Principles

1. **Producto antes que vidriera.** El registro es `product`, no `brand`, incluso en el
   landing: cada pantalla existe para que alguien complete una tarea (postularse, publicar,
   decidir), no para lucirse. La ambición visual sirve a la claridad, nunca la reemplaza.
2. **Cálido y estructurado, no plano ni frío.** Los cuatro colores de marca (violeta, cian,
   rosa, oro) se reparten con criterio por la interfaz — no todo el peso cae en un acento
   único — dentro de un tono retro setentoso: fondos suaves, tarjetas con borde definido y
   esquinas semi-redondeadas, textura antes que vacío. Sigue sin ser "rociar color al
   voleo" (eso se corrigió una vez en el topbar del candidato y no se reintroduce): cada
   color tiene un rol fijo y reconocible, no aparece al azar.
3. **Cero fricción para el postulante de a pie.** Sin dar nada por sabido: copy en
   español claro, sin jerga de RRHH, formularios con selección en vez de texto libre donde
   el dato importa (provincia, localidad, puesto, idioma — ya resuelto), estados de carga y
   error que expliquen qué pasó, nunca una pantalla en blanco.
4. **Mobile-first de verdad, no responsive de compromiso.** Diseñar primero para una
   pantalla chica y conexión lenta; el desktop es la expansión, no el punto de partida.
5. **Cada dato en pantalla se explica solo.** Nada de números o badges sin contexto
   (huella del anti-patrón "hero metric" y de las cards idénticas): si un dato aparece, tiene
   que quedar claro qué significa para quien lo está mirando.

## Accessibility & Inclusion

- **WCAG AA** como piso: contraste ≥4.5:1 en texto de cuerpo, ≥3:1 en texto grande,
  navegación completa por teclado, foco visible. Ya se vienen aplicando fixes de contraste
  esta sesión (headers de tabla, texto muted) — sostener ese nivel, no bajarlo.
  Placeholder text también a 4.5:1, no al gris apagado por defecto.
- **Mobile-first estricto**: la mayoría de los postulantes entra desde el celular, a veces
  con conexión lenta y hardware de gama media/baja. Priorizar tiempo de carga real (no solo
  el layout responsive), imágenes optimizadas, y que ninguna interacción dependa de hover
  (touch-first).
