# ANÁLISIS DE MIGRACIÓN — STAI (Cuestionario de Ansiedad Estado-Rasgo)

Port fiel de `_migracion/catalogo-tests-one/tests/Test16` (Spielberger, Gorsuch y Lushene).
La lógica fue aprobada por el psicólogo y **no se modifica**: solo se porta y se separa en
datos (JSON) + código determinista (`scoring.py`).

## Fuentes legacy y autoridad

| Pieza | Fuente legacy | Rol |
|---|---|---|
| Ítems, tipo (estado/rasgo) e inversión | `index.html · ALL_QUESTIONS` y `script.gs · ITEMS_STAI` (idénticos) | datos → `preguntas.json` |
| Inversión de respuestas (3 − valor) | `index.html · calcularPuntuaciones()` (INLINE) | lógica → `scoring.py` |
| Suma de PD, prorrateo, categorías, percentiles, factores, relación E/R | `script.gs · calcularResultadosSTAI / obtenerCategoria / obtenerPercentil / calcularFactoriales` | **AUTORIDAD** del scoring → `scoring.py` |
| Baremos de categoría y tablas de percentil | `script.gs · BAREMOS_ADULTOS + PERCENTILES_ADULTOS` | datos → `baremos.json` |
| Factores EA/EN/RA/RN | `script.gs · FACTORES` | datos → `baremos.json` |
| Textos por categoría y relación E/R | `script.gs · TEXTOS_CATEGORIA + TEXTOS_RELACION` | datos → `interpretaciones.json` |
| Gráficos (barras A/E vs A/R, radar factorial) | `script.gs · generarInformeHTML (quickchart)` | config → `informe.json` |

OJO confirmado: en Test16 **la lógica de inversión está INLINE en `index.html`**, no en el
`.gs`. El HTML guarda en la hoja los valores YA invertidos (dirección-ansiedad). El `.gs`
suma directamente esos valores. Para que `scoring.py` sea verificable end-to-end, acepta por
defecto los valores **crudos del usuario (0-3)** y aplica la inversión internamente; con
`ya_invertidas=True` reproduce el comportamiento del `.gs` sobre los valores de la hoja.

## Modelo de cálculo (replicado)

1. **Escala de respuesta:** 0-3 por ítem (índice de opción). Estado = Nada/Algo/Bastante/Mucho;
   Rasgo = Casi nunca/A veces/A menudo/Casi siempre.
2. **Inversión (HTML):** ítems `inverso` → `3 - valor`. Tras esto todos los valores quedan en
   dirección-ansiedad. (Ítems inversos: 1,2,5,8,10,11,15,16,19,20,21,26,27,30,33,36,39 → 17 ítems.)
3. **Puntuaciones Directas (PD):** A/E = suma ítems 1-20; A/R = suma ítems 21-40. Rango 0-60.
4. **Prorrateo:** si se respondieron 18 o 19 ítems de una escala → `round(suma / respondidos * 20)`.
   `Math.round` se replica con half-up = `math.floor(x + 0.5)`.
5. **Categorías:** primer rango `[min,max]` que contiene la PD, por sexo (VARONES/MUJERES × AE/AR).
   Fallback "Alto" (igual que el `.gs`).
6. **Percentiles:** primera fila (tabla ordenada de mayor a menor `pd`) donde `PD >= pd`.
   Fallback 1 (igual que el `.gs`).
7. **Factores (EA/EN/RA/RN):** EA y RA (afirmativos) suman el valor dirección-ansiedad; EN y RN
   (negativos) suman el valor ORIGINAL del usuario = `3 - direccion`. `porcentaje = round(suma / (numItems*3) * 100)`.
8. **Relación E/R:** `estado_mayor` si `pdEstado > pdRasgo + 3`; `estado_menor` si `pdEstado < pdRasgo - 3`;
   `estado_igual` en otro caso.

## Escalas y dimensiones

- **Escala Estado (A/E):** ítems 1-20, PD 0-60.
- **Escala Rasgo (A/R):** ítems 21-40, PD 0-60.
- **Factores (Tablas 7 y 8 del manual):** EA (Estado Afirmativo, 10 ítems), EN (Estado Negativo, 10),
  RA (Rasgo Afirmativo, 13), RN (Rasgo Negativo, 7).
- **Baremos:** adultos por sexo (VARONES_AE, MUJERES_AE, VARONES_AR, MUJERES_AR), categorías
  Bajo / Tend. Promedio / Promedio / Sobre promedio / Alto, más tablas de centiles.

## Regresión

7/7 casos OK (`python test_scoring.py`). Cubren: inversión (crudo todo 0 / todo 3 espejo),
relación estado_igual, valores extremos (PD 60 y PD 0, percentil tope/mínimo), prorrateo
(19 ítems → 40) y un caso mixto realista (estado_menor). Valores esperados derivados del
algoritmo de Test16.

## BLOQUEOS / FALTANTES / decisiones

- **[BLOQUEO menor] Validación contra salidas históricas reales.** Los valores esperados de
  `regresion.json` se derivaron del algoritmo legacy (HTML + `.gs`), NO de informes históricos
  reales emitidos a evaluados. Falta cotejar contra al menos un caso real de la hoja
  `Respuestas` (planilla `17DbIfXGWaCAFNE6aX_KFlVC_ezlbpQ5aKfcW9K7Hla4`, columna E con formato
  `{PI: ... - id;valor, ...} {PII: ...}`) para certificar paridad bit a bit.
- **[BLOQUEO menor] Selección de sexo en el flujo.** El `.gs` calcula y muestra SIEMPRE ambos
  baremos (varón y mujer) porque el `index.html` no captura el sexo del evaluado. Se replicó ese
  comportamiento: la salida incluye `categoria_varon/mujer` y `percentil_varon/mujer`. El
  parámetro `sexo` de `scoring.calcular` es una conveniencia añadida (no altera el cálculo) que
  expone además campos únicos `categoria/percentil/interpretacion`. **Falta decisión de producto:**
  ¿se debe pedir el sexo en el formulario para elegir un único baremo?
- **[NOTA] Percentiles no interpolados.** A diferencia de Big Five, el STAI legacy usa búsqueda
  por umbral en tabla (no interpolación lineal). Se portó tal cual; no hay `Math.round` en esa rama.
- **[NOTA] El umbral de relación E/R (±3 puntos) está fijo en el `.gs`** y se conservó en
  `baremos.json` (`relacion_estado_rasgo.umbral`).
- **[NOTA] `analisis_items` y textos/colores/iconos** se portaron íntegros aunque son consumidos
  por el renderizador del informe, no por el scoring numérico.
- **[NOTA] Ítem 8 (estado) e ítem 26 (rasgo)** comparten el texto "Me siento descansado"; es
  correcto en el original (mismo enunciado en ambas escalas), no es duplicación errónea.
