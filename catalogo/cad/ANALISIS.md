# Análisis de migración — CAD (Cuestionario de Afrontamiento del Dolor)

Soriano y Monsalve. 31 ítems, escala Likert 0-4, 6 escalas de estrategias de afrontamiento.

## Fuentes legacy
- `Test14/index.html` → front-end (registro, instrucciones, 31 ítems, leyenda de escala A-E).
- `Test14/script.js` → **AUTORIDAD DEL CÁLCULO**. Define ITEMS_CAD, ESCALAS, OPCIONES y `calcularEscalasDetalladas()`.
- `Test14/script.gs` → **NO calcula puntajes**. Recibe el JSON de escalas ya computado por el front
  (columna F = escalas, columna G = respuestas crudas) y solo:
  - reconstruye el resumen en orden fijo (`construirResumenEscalas`, con defaults por si falta algún campo),
  - rankea (`rankearEscalas`: top 2 / bottom 2 por `avg`),
  - genera HTML + radar (quickchart, eje 0-4).

> Particularidad importante respecto a Big Five: en Big Five el `.gs` era la autoridad del cálculo.
> En CAD la autoridad es el **front (`script.js`)**; el `.gs` es solo presentación/ranking.

## Lógica reconstruida (fiel)
1. Escala de respuesta: A=4, B=3, C=2, D=1, E=0 (la letra A — máximo acuerdo — vale 4).
2. **Sin ítems inversos.** Cada ítem suma su valor directo.
3. Cada uno de los 31 ítems pertenece a **exactamente una** escala (sin solapamiento).
4. Por escala: `total` = suma de valores de sus ítems (ítem no respondido = 0);
   `n` = nº de ítems; `max` = n·4; `avg` = total/n; `pct` = total/max·100.
5. `avg` redondeado a 2 decimales y `pct` a 0 decimales, replicando JS `Number(x.toFixed(d))`
   (half-up para positivos → `math.floor(x·10^d + 0.5) / 10^d`). Verificado: total=15/24 → 62.5% → **63%**.
6. Ranking (del `.gs`): orden por `avg` descendente → `top` = 2 primeras, `bottom` = 2 últimas (invertidas).
7. **No hay baremos ni puntos de corte.** El propio test (nota oficial de Soriano y Monsalve, citada en
   `CAD_INFO.notaInterpretacion`) indica que la comparación es **ipsativa** (entre escalas del mismo perfil),
   usando el promedio normalizado `avg` (0-4) para comparar escalas con distinto número de ítems.

## Consistencia front (index.html / script.js) ↔ back (script.gs): ✅ OK
Verificación ítem por ítem:
- index.html declara 31 ítems y 6 escalas; script.js los enumera con su asignación a escala.
- Las 6 escalas y su composición coinciden entre `script.js · ESCALAS` y `script.gs · CAD_INFO.escalas`
  (mismo orden, mismos nombres, mismos colores/iconos/foco).
- Cobertura: 5+5+6+5+5+5 = **31 ítems**, sin huecos ni duplicados (todos los ids 1-31 cubiertos exactamente una vez).
- El `.gs` usa defaults `n = (Distracción ? 6 : 5)` y `max = n·4` — consistentes con la composición real.
- El front envía respuestas crudas (columna G) + escalas ya calculadas (columna F); el `.gs` confía en las escalas.
  Aquí se recalcula todo server-side desde las respuestas crudas, reproduciendo los mismos valores.

Discrepancias detectadas: **ninguna** en la lógica de cálculo.
- Nota menor (cosmética, no afecta cálculo): en index.html el ícono de "Búsqueda de información" es 🔍
  y en `.gs` es 🔎. Se conservó el del `.gs` (autoridad de presentación del informe). Sin impacto.
- Nota menor: el orden de columnas que arma `script.js` (`[...respuestas, escalas]`) coloca respuestas
  en G y escalas en F respecto al mapeo del `.gs` (`ESCALA:5=F`, `RESPUESTAS:4`→ se etiqueta "G" en
  comentarios pero el índice 4 es E). Es ambigüedad de etiquetado de columnas en los comentarios del `.gs`,
  irrelevante para el scoring (no cambia ningún puntaje). Documentado, sin acción.

## BLOQUEOS / Faltantes
- **BLOQUEO (esperado, no resoluble): no existen baremos/puntos de corte oficiales para el CAD.** El instrumento
  no los define; la interpretación es comparativa intra-perfil. Por eso `baremos.json` documenta el método
  ipsativo y los rangos teóricos por escala (informativos), en lugar de una tabla puntaje→percentil/nivel.
  No se inventó ninguna tabla.
- **No hay textos de interpretación por nivel** (no existen niveles). La única interpretación curada disponible
  es la descripción del "foco" de cada escala (de `CAD_INFO.escalas`), portada a `interpretaciones.json`.
- `tiempo_limite_min`: el front muestra cronómetro informativo (estimado 10-15 min) pero no impone límite → `null`.

## Estado
- ✅ Completo: preguntas, scoring, interpretaciones (por escala), informe, regresión (6/6).
- ✅ Regresión 6/6 OK con `python test_scoring.py`.
- Pendiente fino: validar contra salidas históricas reales del sistema (los esperados se derivaron del
  propio algoritmo del front, que es la autoridad del cálculo legacy).
