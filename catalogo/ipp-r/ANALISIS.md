# Análisis de migración — IPP-R (Intereses y Preferencias Profesionales, Revisado)

## Fuentes legacy (Test8)
- `Test8/index.html` → front-end (registro, instrucciones, render de 180 ítems en escala 0-3, timer, envío).
- `Test8/script.js` → datos del front: `ITEMS_IPPR` (180 ítems con texto y campo) + flujo de UI.
- `Test8/script.gs` → **AUTORIDAD del cálculo**: `CAMPOS_IPP_R` (estructura AC/PR), `NIVELES_INTERES`,
  `calcularPuntuacionesIPPR`, `analizarPerfil`, `evaluarValidez`, `parsearRespuestasIPPR`, `generarInformeHTML`.

## Estructura del test
- 15 campos profesionales × 12 ítems = **180 ítems**.
- Cada campo: 6 ítems **AC** (actividades) + 6 ítems **PR** (profesiones).
- Escala **0-3**: 0=No Conozco, 1=Desagrado, 2=Indiferencia, 3=Agrado. **No hay ítems inversos.**
- PD por campo = suma directa de sus 12 ítems → rango 0-36.

## Lógica reconstruida (fiel al `.gs`)
1. **PD por campo** (`calcularPuntuacionesIPPR`): `pd_total` = suma de los 12 ítems (NC=0 suma 0 y cuenta como
   `n_nc`); `pd_ac` = suma de los 6 AC; `pd_pr` = suma de los 6 PR.
2. **Porcentaje**: `round(pd_total / 36 * 100)` con half-up (`Math.round`).
3. **Nivel** por intervalo cerrado sobre `pd_total` (primer match en orden): Muy alto 31-36, Alto 25-30,
   Medio-alto 19-24, Medio 13-18, Bajo 7-12, Muy bajo/Rechazo 0-6.
4. **Ranking** (`analizarPerfil`): campos ordenados por `pd_total` descendente (sort estable, igual que V8).
   - `primarios` = top 3; `secundarios` = del 4º en adelante con PD ≥ 19; `rechazos` = PD ≤ 12;
     `desconocidos` = `n_nc` ≥ 3.
5. **Tipo de perfil** (evaluado en este orden):
   - `Plano` si rango (max-min) ≤ 8;
   - `Alto generalizado` si nº campos con PD ≥ 25 es ≥ 6;
   - `Diferenciado` si nº campos con PD ≥ 25 está entre 2 y 4 (inclusive);
   - `Disperso` en caso contrario.
6. **Discrepancias AC/PR**: solo sobre los `primarios`; si `|pd_ac - pd_pr| ≥ 6` se marca `AC_MAYOR` o `PR_MAYOR`.
7. **Validez** (`evaluarValidez`): `respondidos` = nº de ítems contestados; etiqueta:
   - `No válida` si respondidos < 90;
   - `Con cautela` si respondidos < 126 **o** %NC > 50 **o** concentración máx > 90;
   - `Válida` en caso contrario.
   - Alertas de tiempo: < 10 min "muy corto"; > 60 min "excesivo". `pct`, `pctNC`, `maxConc` con `Math.round`.
8. **Redondeo half-up** idéntico a `Math.round` para no negativos (`_round_half_up = floor(x + 0.5)`).

## Separación datos / código
- `preguntas.json`: 180 ítems (id, campo, tipo AC/PR, número en campo, texto) — generado combinando textos del
  front con la clave AC/PR del `.gs` (script verificó que cada ítem es AC **xor** PR).
- `baremos.json`: `NIVELES_INTERES` + parámetros de perfil (umbrales rechazo/secundario/alto/NC, discrepancia).
- `interpretaciones.json`: catálogo de campos (`CAMPOS_IPP_R`: nombre, emoji, color, descripción, actividades,
  profesiones, carreras) + textos de tipo de perfil + glosa AC/PR.
- `scoring.py`: motor determinista (port literal del `.gs`).
- `informe.json`: estructura del informe (replica `generarInformeHTML`: validez, tipo de perfil, barras
  horizontales, primarios, secundarios, rechazos, discrepancias).

## Consistencia front ↔ back: ítem por ítem
- **IDs y agrupación por campo: ✅ coinciden.** Los 180 ítems del front (`ITEMS_IPPR`, campo asignado por id en
  bloques consecutivos de 12) coinciden 1:1 con los rangos `items` de `CAMPOS_IPP_R` del `.gs`.
- **Escala: ✅ coincide.** Front y back usan 0-3 (NC/D/I/A).
- **Clave AC/PR: solo en el back.** El front **no** distingue AC/PR; esa partición vive únicamente en el `.gs`
  (`items_ac` / `items_pr`) y se tomó de allí como autoridad. Cada lista AC/PR tiene 6 ítems sin solapamiento
  (verificado por script).

## DISCREPANCIAS detectadas (documentadas, no alteran el cálculo)
1. **Nombres de campo distintos front vs back.** El front rotula los campos con nombres "académicos"
   (p. ej. Campo 1 = "Ciencias Naturales", Campo 5 = "Derecho y Criminología", Campo 9 = "Informática y
   Tecnología"), mientras el `.gs` usa los nombres oficiales del IPP-R ("Científico", "Jurídico-Social",
   "Informática", etc.). **Se adoptaron los nombres del `.gs`** por ser la autoridad del informe. Los nombres del
   front se conservan en `preguntas.json` → `campos_nombre_front` para trazabilidad.
2. **Textos de ítem: el front es la única fuente.** El `.gs` no contiene los textos de los 180 ítems (solo
   descripciones agregadas por campo). Por eso los textos se tomaron del front (`script.js`). No hay forma de
   contrastarlos contra el back ítem por ítem.
3. **`parsearRespuestasIPPR`** acepta valores 0-3 y descarta fuera de rango / ids fuera de 1-180; ítems no
   enviados quedan ausentes (no se cuentan como respondidos, pero sí suman 0 en PD vía `?? 0`). Reproducido:
   `scoring.calcular` trata los ids ausentes como 0 en PD pero `validez.respondidos` cuenta solo los presentes.

## BLOQUEOS / FALTANTES
- **B1 — Sin baremos normativos (percentiles).** El IPP-R original de TEA usa baremos por edad/sexo para convertir
  PD → percentiles/eneatipos. El `.gs` **no** los implementa: la interpretación es **directa por PD** vía
  `NIVELES_INTERES`. Se portó exactamente lo que hay; **no se inventaron baremos normativos**. Si en el futuro se
  requieren percentiles oficiales, hay que incorporar las tablas del manual (faltan).
- **B2 — Validación contra salidas históricas.** Los valores esperados de `regresion.json` se derivaron del propio
  algoritmo del `.gs` (no de informes reales archivados). Pendiente cruzar con salidas históricas del sistema.
- **B3 — `plantilla` HTML del informe** referenciada por `generarInformeHTML` (`createTemplateFromFile('plantilla')`)
  no está en Test8; el layout exacto del PDF/email no se pudo portar visualmente. `informe.json` reconstruye la
  estructura lógica a partir de las variables que el `.gs` inyecta en la plantilla.

## Estado
- ✅ Completo: preguntas (180), baremos (niveles), interpretaciones (15 campos + perfil), scoring, informe,
  regresión (6/6).
- `tiempo_limite_min`: el front no imponía límite (estimado 20-25 min) → `null`. El tiempo solo alimenta la validez.
