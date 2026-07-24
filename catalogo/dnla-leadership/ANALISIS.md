# Análisis de migración — DNLA Leadership & Middle Management (Test12)

## Estado: ✅ COMPLETO (NO bloqueado)

La hipótesis del encargo era que esto podía ser un bloqueo (`script.gs` vacío → sin
lógica de scoring). **No lo es.** El `script.gs` legacy efectivamente está vacío (0 bytes),
pero **toda la lógica de scoring vive INLINE en `Test12/index.html`** y es completamente
determinista. Se portó fielmente, sin inventar nada.

## Fuentes legacy
- `Test12/index.html` → front-end (40 ítems, 8 dim × 5, escala frecuencia 1-5) **+ toda la
  lógica de cálculo e interpretación inline** dentro del `<script type="module">`.
- `Test12/script.gs` → **VACÍO (0 bytes)**. Solo se usaba para el POST de respuestas crudas a
  una Google Sheet (`URL_TEST12`), no para scoring. No aporta nada al cálculo.

## Lógica reconstruida (fiel al index.html)

### Escala
- 5 opciones de frecuencia: 5=Siempre, 4=Frecuentemente, 3=A veces, 2=Rara vez, 1=Nunca.
- **No hay ítems inversos.** Todos puntúan en sentido directo (a diferencia de Big Five).

### Cálculo (`calculateAndDisplayResults`)
1. Promedio por dimensión = `suma de los 5 ítems / 5`.
2. `dimensionScores[dim] = parseFloat(avg.toFixed(2))` → puntuación redondeada a 2 decimales.
   (Como el denominador es 5, los promedios de dimensión son múltiplos exactos de 0.2; no hay
   ambigüedad de redondeo a este nivel.)
3. Promedio global = media de los **8 promedios SIN redondear** (`totalSum` acumula los `avg`
   crudos, no los `dimensionScores`), y luego `toFixed(2)`. Aquí sí puede hacer falta redondeo:
   se replica `toFixed` con half-up (`math.floor(x*100 + 0.5)/100`). Verificado: 3.375 → 3.38.

### Clasificación de nivel por dimensión (`getDimensionAnalysis`, umbrales descendentes sobre el score redondeado)
- `>= 4.6` → Sobresaliente (`badge-sobresaliente`)
- `>= 3.8` → Efectivo (`badge-fortaleza`)
- `>= 3.0` → Potencial Medio (`badge-medio`)
- `>= 2.0` → Necesita Desarrollo (`badge-desarrollo`)
- resto → Bajo (`badge-bajo`)

(Claves internas de nivel: `sobresaliente`, `fortaleza`, `medio`, `desarrollo`, `bajo`.)

### Interpretación global (`getGlobalAnalysis`, mismos umbrales sobre el promedio global)
- `>= 4.6` LIDERAZGO SOBRESALIENTE · `>= 3.8` LIDERAZGO EFECTIVO Y CONSOLIDADO ·
  `>= 3.0` POTENCIAL MEDIO · `>= 2.0` REQUIERE DESARROLLO · resto BAJO NIVEL DE INFLUENCIA.

### Síntesis del perfil (`displayProfileSynthesis`)
- Fortaleza si `score >= 3.8`; debilidad si `score < 3.0`.
- Recomendación por tramo del promedio global (mismos cortes 4.6/3.8/3.0/2.0).

### Orden de dimensiones
Se preserva el orden de inserción del objeto `dimensions` del index.html (Visión Estratégica,
Comunicación, Decisión, Motivación, Conflictos, Resiliencia, Innovación, Autogestión), que es el
orden usado para el radar y las tarjetas.

## Lo que SÍ se extrajo
- ✅ 40 preguntas con su dimensión (`preguntas.json`).
- ✅ 8 dimensiones + escala 1-5 + nombres de display.
- ✅ Algoritmo de scoring determinista (`scoring.py`): promedios, global, niveles, síntesis.
- ✅ Textos de interpretación por dimensión/nivel y globales (`interpretaciones.json`),
  tal cual el index.html.
- ✅ Config de informe (`informe.json`): radar (eje 0-5), bloques por dimensión, global, síntesis.
- ✅ Regresión `regresion.json` + `test_scoring.py` → **6/6 OK**.

## Lo que NO existe en el legacy (y por qué NO es un bloqueo)
- **No hay baremos/percentiles ni normas poblacionales.** Este instrumento, tal como está
  implementado, NO usa tablas de normas: clasifica por **umbrales fijos** sobre el promedio 1-5.
  Por eso no hay `baremos.json` ni `normas.json` (no aplican). No se inventó ninguna tabla.
- Los textos de interpretación global en el index.html están **truncados con "..."**
  (p.ej. `'Perfil de liderazgo sobresaliente ... '`). Se portaron **literalmente como están en
  el legacy** (incluyendo los "..."). Si se desea texto completo, debe pedirse el contenido
  aprobado al autor/psicólogo — no se completó por IA.

## Discrepancias / notas
- El front (index.html) solo envía las respuestas crudas + tiempo a la Sheet; el scoring se
  hacía 100% en el navegador. Aquí se movió a `scoring.py` server-side, idéntico bit a bit.
- `tiempo_limite_min`: el front no imponía tiempo (solo mide el usado) → `null`.
- Caso límite de los umbrales: se usa `>=` (un score exactamente en el corte sube al nivel
  superior), idéntico al `if (score >= X)` del index.html.

## Pendiente fino (no bloqueante)
- Reemplazar los textos de interpretación **global** truncados ("...") por su versión completa
  aprobada, cuando el autor la provea (`interpretaciones.json → niveles_global[*].interpretation`
  y `recomendacion`). Las descripciones **por dimensión** sí están completas.
- Validar los esperados de `regresion.json` contra salidas históricas reales del sistema (los
  esperados actuales se derivaron del propio algoritmo portado, que es idéntico al del index.html).
