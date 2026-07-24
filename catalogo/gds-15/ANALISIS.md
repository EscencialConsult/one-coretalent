# Análisis de migración — Escala de Depresión Geriátrica (GDS-15)

## Fuentes legacy
- `Test19/index.html` → **front-end Y lógica de scoring INLINE** (15 ítems Sí/No, clave de respuesta sintomática y puntos de corte).
- `Test19/script.gs` → **VACÍO (0 bytes)**. No aportó nada.

## Fuente de la lógica: INLINE DEL REPO (autoridad)
Aunque `script.gs` estaba vacío, la lógica completa de cálculo SÍ existía en el repo,
inline dentro del `<script type="module">` de `index.html`. Por lo tanto **este es un port fiel
del legacy**, NO una reconstrucción desde el estándar publicado.

Lo portado literalmente:
- `QUESTIONS_GDS` (array de 15 ítems con `depressionAnswer: 'si'|'no'`) → `preguntas.json` campo `respuesta_sintomatica`.
- `finishTest()` cálculo del score:
  ```js
  let score = 0;
  QUESTIONS_GDS.forEach(q => { if (answers[q.id] === q.depressionAnswer) score++; });
  ```
  → `scoring.py` suma 1 punto por ítem cuya respuesta coincide con `respuesta_sintomatica`.
- `finishTest()` puntos de corte (if/else literales) → `baremos.json`:
  - `score <= 4`  → Normal
  - `score <= 8`  → Depresión leve
  - `score <= 11` → Depresión moderada
  - resto         → Depresión grave
- Textos del badge (`interpretationBadge`) → `interpretaciones.json` campo `badge` (literal).

## Clave de respuestas sintomáticas (verificada contra el inline)
- Responder **"no"** suma punto en ítems: 1, 5, 7, 11, 13.
- Responder **"si"** suma punto en ítems: 2, 3, 4, 6, 8, 9, 10, 12, 14, 15.

(Coincide con la clave estándar de Yesavage GDS-15, lo que da confianza adicional.)

## Lógica reconstruida (fiel al inline)
1. Normalizar respuestas a `'si'`/`'no'` en minúsculas (ítems no respondidos se ignoran).
2. Sumar 1 punto por ítem cuya respuesta == respuesta sintomática (rango 0-15).
3. Clasificar nivel por el primer rango (ascendente) cuyo `max` >= puntuación.
4. Seleccionar interpretación por nivel.
5. Desglose: respondidas / sin responder / sintomáticas (replica el bloque `scoreBreakdown`).

No aplica inversión de ítems ni `Math.round`: el scoring es una suma entera simple,
por lo que no hay redondeo half-up que replicar.

## Consistencia front ↔ back: ✅ OK
El front no envía la puntuación; envía respuestas crudas (`id;si/no`) y calcula el score
con la misma lógica que aquí se porta. Mismos 15 ítems, misma clave, mismos cortes.

## Discrepancia documentada
- El badge legacy etiqueta el rango 5-8 como "Depresión leve" y 9-11 como "Depresión moderada",
  ambos con la misma clase visual (`interp-mild`). Se conservaron como **dos niveles distintos**
  (`leve` y `moderada`) según el texto y los cortes, registrando la clase visual en `baremos.json`
  por trazabilidad. Sin impacto en el scoring.

## Contenido a validar por el psicólogo
- Los campos `badge` de `interpretaciones.json` son **port literal del legacy** (no requieren validación de contenido nuevo).
- Los campos `descripcion` y `recomendacion` son **texto de apoyo redactado en migración** (no existían en el legacy,
  que solo mostraba el badge). **REQUIEREN validación del psicólogo** antes de usarse en informes finales.

## Estado
- ✅ Completo: preguntas, baremos, interpretaciones, scoring, informe, regresión (9/9).
- Fuente: **inline del repo** (`Test19/index.html`), port fiel.
- `tiempo_limite_min`: el front mide tiempo transcurrido pero no impone límite → `null`.
