# Análisis de migración — WAIS-IV (adaptación screening de opción múltiple)

## Fuentes legacy
- `Test4/index.html` → front-end. Contiene los **datos reales de los ítems** (`ITEMS_PART1`,
  `ITEMS_PART2`: texto, opciones, `correct`, `indice`, `subtest`) y la lógica de captura/envío.
  Las constantes de claves al final del HTML (`CLAVES_PART1`, `INDICES_PART1`, …) están **vacías**
  (placeholders `/* ... */`); el front NO puntúa, solo arma el string de respuestas.
- `Test4/script.gs` → **AUTORIDAD del scoring**: `parsearRespuestasWAIS`, `calcularResultadosWAIS`,
  baremos (`BAREMOS_INDICE`, `BAREMOS_CI`), interpretaciones (`INTERPRETACIONES_INDICES`),
  distribución de ítems (`INDICES_PART1/2`, `SUBTESTS`).

## Consistencia front ↔ back: ✅ OK (claves 50/50 en cada parte)
- Verificación 1:1 de la letra correcta: `index.html` `correct` vs `.gs` `CLAVES_PART1/2`.
  **0 discrepancias** en Parte I (50/50) y Parte II (50/50).
- Distribución de índices coincide: Parte I → ICV (1-25) + IRP (26-50); Parte II → IMT (1-25) + IVP (26-50).
- El front envía solo la letra elegida por ítem (string `{PI: ...}{PII: ...}`); el `.gs` parsea,
  compara contra claves y puntúa. Reproducido igual en `scoring.py` (`parsear_respuestas` + `calcular`).
- Subtests: tomados del front (incluye "Dígitos Inverso" y "Secuenciación" en Parte II, más finos
  que el `SUBTESTS` del `.gs` que agrupa esos ítems bajo "Dígitos"). El scoring NO usa subtests
  para puntuar (solo agrupa por índice), así que esta diferencia es puramente descriptiva.

## Lógica reconstruida (fiel al `.gs`)
1. **Parseo** del string crudo: regex `\{PI:\s*(\d+m\s*\d+s)\s*-\s*([^}]+)\}` (ídem PII); cada
   respuesta `"num;letra"` → `{num: letra.lower().strip()}`.
2. **Aciertos por índice** (25 ítems c/u): cuenta solo si la respuesta existe **y** coincide con la
   clave (omisión = fallo). Igual que `if (respuestas.parteX[item] && ... === CLAVES[item])`.
3. **Porcentaje** = `round(correctas/25*100)` (half-up).
4. **Baremo por índice** (`BAREMOS_INDICE`): primer tramo donde `min <= % <= max` → `pe`, `rango`, `color`.
5. **Interpretación** por índice: `% >= 70` alto, `% >= 40` medio, resto bajo.
6. **CI Total** = `round(40 + sumaPE*1.5)` donde `sumaPE` = PE de los 4 índices. Half-up
   (verificado: caso mixto 95.5 → 96).
7. **Nivel CI** (`BAREMOS_CI`): primer tramo donde `min <= CI <= max`; fallback = último (Muy Bajo).
8. **Totales**: `totalCorrectas` (sobre 100), `porcentajeTotal = round(/100*100)`.
9. **Fortaleza/Debilidad**: orden descendente estable por `porcentaje` (empates → orden de inserción
   ICV, IRP, IMT, IVP, igual que `Array.prototype.sort` en V8). Fortaleza = `[0]`, debilidad = `[3]`.
10. Redondeo half-up idéntico a `Math.round` (`_round_half_up = floor(x + 0.5)`).

## BLOQUEO — tablas normativas oficiales ausentes (NO inventadas)
La WAIS-IV real convierte puntajes brutos a **puntuaciones escalares por edad** y luego a índices/CI
mediante tablas normativas extensas (manual). **El legacy NO las contiene.** En su lugar usa:
- `BAREMOS_INDICE`: mapea bandas de **% de aciertos** a una PE **fija** (1/4/7/10/13/16/19).
- `BAREMOS_CI`: fórmula simplificada `CI = round(40 + sumaPE*1.5)`.

Esto está documentado en `.gs` como "Fórmula simplificada" / "Puntuación Escalar basada en % de
aciertos". Se portó **exactamente como está**; NO se añadieron tablas normativas reales por edad ni
conversiones estándar. Si en el futuro se requiere fidelidad psicométrica WAIS-IV, hay que incorporar
las tablas oficiales del manual (faltante, fuera del alcance de la migración).

## Otras notas
- `tiempo_limite_min`: el front mide tiempo por parte (cronómetro informativo) pero no impone
  límite → `null`. Los tiempos se conservan como strings (`tiempoParte1/2`).
- Toda la infraestructura del `.gs` (Google Sheets, envío de email, QuickChart, plantilla HTML) NO
  se porta: queda fuera del motor de scoring determinista. Los gráficos se describen en `informe.json`.
- Los colores por tramo (`#059669`, etc.) se conservan en `baremos.json` porque el informe legacy los
  usaba para colorear las barras de PE.

## Estado
- ✅ Completo: preguntas (100), baremos (índice + CI), interpretaciones, scoring, informe, regresión (6/6).
- ⚠️ Baremos = conversión simplificada del legacy, NO tablas normativas oficiales WAIS-IV (ver BLOQUEO).
- Pendiente fino: validar contra salidas históricas reales del sistema (los esperados de
  `regresion.json` se derivaron del propio algoritmo portado).
