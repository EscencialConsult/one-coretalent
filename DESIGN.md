---
name: ONE Core-Talent
description: Plataforma de selección de personal y evaluación psicométrica de Escencial Consultora
colors:
  violeta: "#4d248f"
  cian: "#6be1e3"
  rosa: "#e17bd7"
  oro: "#e4c76a"
  tinta: "#1a181d"
  blanco: "#fefeff"
  oscuro: "#241d2a"
  muted: "#767b93"
  linea: "#c6c9d7"
  fondo: "#f4f4f7"
typography:
  display:
    fontFamily: "'Segoe UI', -apple-system, Roboto, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 5.4vw, 5rem)"
    fontWeight: 900
    lineHeight: 0.99
    letterSpacing: "-0.052em"
  body:
    fontFamily: "'Segoe UI', -apple-system, Roboto, system-ui, sans-serif"
    fontSize: "clamp(1rem, 1.4vw, 1.16rem)"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "'Segoe UI', -apple-system, Roboto, system-ui, sans-serif"
    fontSize: "0.82rem"
    fontWeight: 850
rounded:
  sm: "13px"
  lg: "22px"
  pill: "999px"
components:
  button-primary:
    backgroundColor: "{colors.violeta}"
    textColor: "{colors.blanco}"
    rounded: "{rounded.sm}"
    padding: "0.8rem 1.25rem"
  button-secondary:
    backgroundColor: "{colors.blanco}"
    textColor: "#302936"
    rounded: "{rounded.sm}"
    padding: "0.8rem 1.25rem"
---

# Design System: ONE Core-Talent

## 1. Overview

**Creative North Star: "El Escritorio del Consultor, con calidez setentosa en los objetos"**

ONE Core-Talent es la herramienta de trabajo real de una consultora de RRHH — no una
vidriera de marketing. Cada pantalla existe para que alguien resuelva algo (postularse,
publicar una búsqueda, decidir a quién avanzar); la estructura general es sobria y
funcional. La calidez retro **no es atmósfera de página** (no hay fondos de papel ni
paleta color crema/parchment de fondo) — vive en los **elementos**: tarjetas con borde
definido y esquina semi-redondeada, botones y badges que usan los cuatro colores de marca
(violeta, cian, rosa, oro) con roles propios en vez de que uno solo cargue con todo, un
poco más de efecto/detalle/animación en la interacción de esos objetos. El fondo de página
y la tipografía siguen limpios y contemporáneos; el carácter retro-setentoso está en cómo
se dibuja cada tarjeta, botón y etiqueta, no en el clima general del sitio.

Este sistema rechaza explícitamente tres cosas: el **SaaS genérico de estética IA**
(gradientes por todos lados, glow en reposo, eyebrows en cada sección, badges de colores
sin criterio semántico), el **software de RRHH corporativo aburrido** (azules apagados,
tablas grises sin jerarquía) y la **app de búsqueda de empleo genérica** (un LinkedIn/Indeed
más, sin identidad propia). La diferencia con el look "IA gradiente por todos lados" no es
usar menos color — es que acá cada color tiene un rol fijo, reconocible y con borde
definido, en vez de flotar sin criterio.

**Key Characteristics:**
- Los cuatro colores de marca (violeta, cian, rosa, oro) trabajan, cada uno con un rol
  propio y reconocible — no es "todo violeta" ni "cualquier color en cualquier lado".
- Los elementos interactivos (cards, botones, badges) llevan borde definido y esquina
  semi-redondeada — el retro-setentoso vive ahí, no en el fondo de la página.
- Superficies de página limpias; la sombra y el detalle se concentran en el objeto, no en
  el ambiente general.
- Tipografía del sistema (Segoe UI) en toda la app — sin fuente decorativa que compita con
  el contenido.
- Formularios que reemplazan texto libre por selección donde el dato importa (provincia,
  localidad, puesto, idioma), porque el registro es `product`: la claridad manda sobre el
  efecto visual, incluso en el landing.
- Más animación/detalle deliberado que antes — pero en la interacción de los elementos
  (hover, focus, entrada), no como decoración fija en reposo.

## 2. Colors

Los cuatro colores de marca trabajan, cada uno con un rol fijo — no es "todo violeta" ni
"cualquiera en cualquier lado". El fondo de página se mantiene neutro y limpio; el color
vive en los elementos (tarjetas, botones, badges), coherente con que el tono retro-setentoso
es de objeto, no de atmósfera.

### Primary
- **Violeta ONE** (#4d248f): la acción principal. CTA primario, links activos, foco de
  inputs, estado seleccionado/activo en nav. Sigue siendo el color con más peso semántico
  — "esto es lo que hay que hacer acá" — pero ya no el único que aparece.

### Secondary
- **Cian ONE** (#6be1e3): segundo rol real, no solo endpoint de degradé — estados
  informativos, badges secundarios, detalle en tarjetas (borde superior, ícono de
  categoría). Frío donde el violeta es cálido-intenso: buen contraste de temperatura.

### Tertiary
- **Rosa ONE** (#e17bd7): acento cálido para highlights puntuales — badge destacado, tag
  de "nuevo"/"recomendado", detalle decorativo en un borde o esquina de tarjeta.
- **Oro ONE** (#e4c76a): el tono más setentoso de los cuatro — bien para bordes, chips y
  fondos de tarjeta muy tenues que buscan esa calidez retro. No confundir con el
  verde/ámbar de los semáforos de nivel bajo/medio/alto de los informes psicométricos —
  ese es un sistema semántico aparte, fijo, no ligado a esta paleta de marca.

### Neutral
- **Tinta** (#1a181d): texto principal, casi negro con un pelo de calidez.
- **Blanco cálido** (#fefeff): fondo base de tarjetas y superficies.
- **Fondo** (#f4f4f7): fondo de página — se mantiene neutro, no vira a crema/parchment; la
  calidez retro no es del fondo, es de los objetos que se apoyan en él.
- **Línea** (#c6c9d7): bordes y divisores por defecto (donde el elemento no lleva un borde
  de color de marca).
- **Muted** (#767b93): texto secundario — ya ajustado una vez esta sesión por bajo
  contraste (era #a4a8c0, ≈2.3:1); no volver a aclararlo.
- **Oscuro** (#241d2a): bookend oscuro en degradés con el violeta (heroes con fondo oscuro,
  CTA final) — no es texto, es superficie.

### Named Rules
**La Regla de los Cuatro con Rol Fijo.** Violeta = acción. Cian = información/secundario.
Rosa = highlight puntual. Oro = calidez/detalle retro. Cualquier componente nuevo elige
UNO de estos cuatro según qué está comunicando — nunca decorativo sin motivo, y nunca los
cuatro mezclados en el mismo elemento (ahí sí se cae en el patrón "IA gradiente por todos
lados" que el sistema rechaza).

## 3. Typography

**Display/Body/Label Font:** "Segoe UI", -apple-system, Roboto, system-ui, sans-serif —
una sola familia (del sistema), en múltiples pesos.

**Character:** una sola voz tipográfica, sin la fricción de mezclar dos fuentes: el peso y
el tamaño hacen la jerarquía, no una fuente decorativa aparte.

### Hierarchy
- **Display** (900, `clamp(2.75rem, 5.4vw, 5rem)`, line-height .99, letter-spacing -0.052em):
  headline del hero. Techo real ≈5rem (80px) — lejos del límite de 6rem antes de "gritar".
- **Headline** (900, ~1.5–2rem): títulos de sección.
- **Body** (400, `clamp(1rem, 1.4vw, 1.16rem)`, line-height 1.7, máx. ~620px de ancho ≈
  65-70ch): texto de apoyo del hero y párrafos largos.
- **Label** (850, .82rem): botones, eyebrows puntuales, badges — peso alto compensando el
  tamaño chico en vez de subir el tamaño.

### Named Rules
**La Regla del Peso, no del Tamaño.** La jerarquía se construye subiendo el `font-weight`
(hasta 900) antes que el `font-size`. Mantiene la densidad de la información alta sin que
el texto grite.

## 4. Elevation

Doble estrategia, a propósito: el **borde** es la elevación en reposo (define el objeto,
retro-editorial, siempre visible); la **sombra** es la elevación en movimiento (responde a
hover/foco, nunca decorativa en reposo). No se apila borde grueso + sombra ambiente + glow
a la vez — eso es exactamente el look "IA" que se rechaza.

### Shadow Vocabulary
- **Borde de card en reposo** (`border: 1.5px solid` en el color de rol del elemento, o
  `linea` #c6c9d7 si es neutro): la profundidad de base no es una sombra, es un borde
  definido — coherente con el tono retro-editorial.
- **Botón primario** (`box-shadow: 0 14px 28px rgba(77,36,143,.22)`): halo tenue del color
  del propio botón, no un gris genérico — ancla visualmente la sombra a lo que la proyecta.
- **Hover de card** (`box-shadow: 0 20px 42px rgba(39,27,48,.11)` + el borde pasa de
  `linea` al color de rol del elemento): la sombra aparece recién en el hover, sumada al
  cambio de color del borde — dos señales de "esto es interactivo", ninguna en reposo.
- **Foco de input** (`box-shadow: 0 0 0 3px rgba(77,36,143,.1)`): anillo de foco, no sombra
  de profundidad — cumple función de accesibilidad (visible al navegar por teclado), no
  decorativa.

### Named Rules
**La Regla del Borde en Reposo, Sombra en Movimiento.** Un elemento interactivo se define
por su borde estando quieto; la sombra es exclusiva de cuando algo pasa (hover, foco,
activo). Nunca sombra ambiente permanente ni glow en reposo.

## 5. Components

### Buttons
- **Shape:** radio .72rem (~11.5px), esquina semi-redondeada — no cuadrada, no pill.
- **Primary:** fondo violeta sólido, texto blanco, sombra tenue del propio violeta
  (`rgba(77,36,143,.22)`), `min-height: 3.15rem`, `padding: .8rem 1.25rem`.
- **Secondary:** borde `#d9d4df` (o el color de rol del contexto), texto `#302936`, fondo
  blanco casi opaco (`rgba(255,255,255,.86)`) — mismo tamaño que el primario.
- **Hover:** `translateY(-2px)` + sombra que crece levemente + el borde puede tomar el
  color de rol si el botón lo tiene asignado. Sin cambio de color brusco.

### Badges / Chips
- **Shape:** esquina semi-redondeada (8–10px) o pill según el contexto — no forzar una sola
  forma para todos los badges de la app.
- **Color:** fondo = tinte muy suave del color de rol (`color-mix` al ~10-12%), texto y
  borde = el color de rol sólido. Un badge, un color, un rol — nunca dos colores de marca
  en el mismo chip.
- **Uso:** cada uno de los cuatro colores tiene su categoría de badge fija (ver Regla de
  los Cuatro en Colors) — así un usuario aprende a leer el color sin tener que leer el
  texto primero.

### Cards / Containers (`.tarjeta`, `.landing-proof`)
- **Corner Style:** esquina semi-redondeada (radio ~13–16px) — retro-editorial, ni cuadrada
  ni tipo-pill. El 22px grande queda para el hero/CTA final, no para tarjetas de contenido
  repetidas.
- **Background:** blanco (#fefeff) sobre fondo de página (#f4f4f7) — el fondo de página no
  cambia; la calidez va en la tarjeta.
- **Shadow Strategy:** borde en reposo, sombra solo en hover; ver Elevation.
- **Border:** 1.5px definido — `linea` (#c6c9d7) por defecto, o el color de rol (violeta/
  cian/rosa/oro) cuando la tarjeta necesita comunicar esa categoría específicamente. Nunca
  los cuatro mezclados en una sola tarjeta.

### Inputs / Fields
- **Style:** borde 1px `#ddd8e2`, radio .65rem, fondo blanco, texto `#332c38`.
- **Focus:** borde pasa a violeta + anillo de foco `rgba(77,36,143,.1)` (ver Elevation).
- **Selección en vez de texto libre**: donde el dato se usa para filtrar/matchear
  (provincia, localidad, puesto deseado, idioma), el campo es un selector/buscador, no un
  `<input>` de texto libre — decisión de producto, no solo de estilo, ya implementada.
- **Disabled:** texto `#817985`, fondo `#f6f4f7`.

### Navigation (`.public-navbar`)
- **Style:** sticky, fondo blanco translúcido con blur (`backdrop-filter: blur(18px)`),
  borde inferior 1px sutil.
- **Logo:** isotipo ONE + wordmark "Core-Talent", altura `clamp(2.15rem, 3.4vw, 3.15rem)` —
  ya ajustado una vez esta sesión, se veía desproporcionado a 4.5rem por el aspect ratio
  2.55:1 del lockup completo.
- **Links:** peso 700, sin subrayado; estado activo con línea inferior en violeta.
- **Mobile:** colapsa a menú hamburguesa (ver `.public-mobile-menu`).

## 6. Do's and Don'ts

### Do:
- **Do** asignar cada uno de los cuatro colores de marca a un rol fijo y usarlo con ese
  criterio en toda la app (violeta=acción, cian=info, rosa=highlight, oro=calidez/detalle).
- **Do** dar a cards/botones/badges un borde definido (1.5px) y esquina semi-redondeada en
  reposo — esa es la elevación de base, no la sombra.
- **Do** reservar la sombra para hover/foco/activo — nunca ambiente en reposo.
- **Do** usar selección/buscador en vez de texto libre cuando el dato se usa para filtrar
  (provincia, localidad, puesto, idioma) — ya resuelto, mantenerlo como estándar para
  campos nuevos del mismo tipo.
- **Do** subir el `font-weight` antes que el `font-size` para construir jerarquía.
- **Do** verificar contraste real (≥4.5:1 en texto de cuerpo) antes de dar por bueno un
  gris — el error más común encontrado esta sesión fue texto muted demasiado claro.
- **Do** sumar detalle/efecto/animación en la interacción de los elementos (hover, foco,
  entrada) — el pedido explícito de esta ronda fue "más creativo, con detalles y efectos",
  siempre que responda a un estado, no decoración fija.

### Don't:
- **Don't** repetir el patrón "SaaS genérico de estética IA": gradientes decorativos fuera
  del isotipo/loader, glow en tarjetas en reposo, eyebrow en mayúsculas arriba de cada
  sección, badges de colores sin criterio semántico.
- **Don't** mezclar los cuatro colores de marca en un mismo elemento — un objeto, un rol,
  un color.
- **Don't** llevar la calidez retro al fondo de página (nada de crema/parchment/textura de
  papel de fondo) — el retro es de objeto, el fondo se mantiene neutro y contemporáneo.
- **Don't** usar `border-left`/`border-right` de color como acento decorativo en cards o
  alertas.
- **Don't** usar `background-clip: text` con gradiente para texto — énfasis por peso o
  tamaño, no por degradé.
- **Don't** dejar un color de marca vieja (AdRHA) hardcodeado en hex NI en `rgba(r,g,b,*)`
  — ya pasó dos veces esta sesión (una vez en hex, una vez en rgb) y las dos veces costó
  encontrarlo después. Si se toca un color de marca, buscar también su forma `rgba(...)`.
