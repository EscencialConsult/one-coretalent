# Análisis de migración — EBP (Escala de Bienestar Psicológico)

Test: **EBP — Escala de Bienestar Psicológico** (José Sánchez-Cánovas, Universidad de Valencia).
Slug catálogo: `ebp`. Código: `EBP`.

## Fuentes legacy
- `tests/Test15/script.gs` → **AUTORIDAD del cálculo** (ITEMS_EBP, BAREMOS_GENERALES, TEXTOS_INTERPRETACION, `parsearRespuestasEBP`, `calcularResultadosEBP`, `obtenerPercentil`, `interpretarPercentil`).
- `tests/Test15/script.js` → front-end (ítems mostrados, recogida de respuestas, JSON enviado).
- `tests/Test15/index.html`, `styles.css` → UI (3 secciones: 40 / 10 / 15 ítems).
- `tests/Test15-/` → **duplicado de Test15** con `script.gs` VACÍO (0 bytes); el resto de archivos son byte-idénticos a Test15. Se descarta como fuente. Se usó **Test15** según lo indicado.

## Mapeo de subescalas (según el .gs, autoridad)
| Subescala | Nombre | Ítems | Máx | Invertidos (índice subescala) |
|---|---|---|---|---|
| BPS | Bienestar Psicológico Subjetivo | 30 | 150 | — |
| BM  | Bienestar Material | 10 | 50 | — |
| BL  | Bienestar Laboral | 10 | 50 | 5, 8 |
| RP  | Relaciones con la Pareja | 15 | 75 | 5, 6, 7, 10, 11, 12 |

Total ítems puntuados por el .gs: **65** (30 + 10 + 10 + 15).

## Lógica reconstruida (fiel al `.gs`)
1. **Parseo** (`parsearRespuestasEBP` → `_parsear`): la entrada es `{section1, section2, section3}` (JSON del front).
   - `section1` → BPS (el .gs solo suma ids **1..30**).
   - `section2` → BM (ids 1..10).
   - `section3` se **divide**: ids **1..10 → BL**; ids **11..25 → RP** (remapeados a 1..15 restando 10).
2. **Puntuación** (`calcularResultadosEBP` → `calcular`):
   - BPS = Σ section1[1..30] (sin inversión).
   - BM = Σ section2[1..10] (sin inversión).
   - BL = Σ ids 1..10; en 5 y 8 se invierte `6 - valor`.
   - RP = Σ ids 1..15; en [5,6,7,10,11,12] se invierte `6 - valor`.
   - `pd_total = BPS + BM + BL + RP`.
   - **Ítems faltantes cuentan como 0** (el .gs usa `respuestas[i] || 0`). En ítems invertidos un faltante produce `6 - 0 = 6`. Reproducido tal cual.
3. **Percentil** (`obtenerPercentil` → `_obtener_percentil`): tabla por subescala ordenada de mayor a menor `pd`; devuelve el percentil del **primer** umbral con `pd_persona >= umbral.pd`. Si no aplica ninguno (PD por debajo del menor umbral) → **1**.
4. **Nivel** (`interpretarPercentil` → `_interpretar_percentil`): ≥99 Excepcional, ≥90 Muy Alto, ≥75 Alto, ≥50 Medio-Alto, ≥25 Medio-Bajo, ≥10 Bajo, resto Muy Bajo.
5. **Texto/color/icono** por subescala y nivel (`TEXTOS_INTERPRETACION`).

> El `.gs` **no** usa interpolación lineal de percentiles (a diferencia de Big Five): es una tabla de saltos discretos. **No hay redondeo Math.round en el scoring del .gs**, por lo que `_round_half_up` no aplica aquí (se documenta; el único `Math.round` del front está en la barra de progreso de la UI, irrelevante para el resultado).

## Consistencia front ↔ back: ⚠️ DISCREPANCIAS

### D1 (estructural, GRAVE) — reparto de ítems por sección
- **Front (`script.js`)**: `section1`=**40** ítems, `section2`=**10**, `section3`=**15**.
- **Back (`script.gs`)**: espera `section1` con BPS (usa solo **1..30**), `section2`=BM (10), y `section3` con **25** ítems (1..10 BL + 11..25 RP).
- **Efecto real con el front actual**:
  - BPS: el front manda 40 ítems pero el .gs **solo suma 1..30**; los ids **31..40 se ignoran** (no puntúan). Esos 10 textos del front (31..40) son de contenido **material/económico** ("Mi situación es relativamente próspera", "Estoy tranquilo/a sobre mi futuro económico", etc.) — encajarían conceptualmente con BM, pero el .gs no los usa.
  - `section3` del front tiene **solo 15 ítems** (1..15, todos de pareja). El .gs interpreta ids 1..10 como **BL** y 11..15 como **RP** (remapeados a 1..5). Es decir, con el front actual **BL se calcula sobre ítems de PAREJA** (no laborales) y **RP solo recibe 5 de sus 15 ítems** (los 10 restantes faltan → cuentan como 0, con inversión generando valores espurios).
- **Conclusión**: con el front tal cual, BL y RP **no** se calculan sobre el contenido correcto. El `.gs` fue claramente diseñado para un front que enviara `section1`=30 (BPS), `section2`=10 (BM), `section3`=25 (10 BL + 15 RP). El front desplegado quedó **desincronizado** con el back.
- **Decisión de migración**: se porta el **scoring del .gs (autoridad)** sin alterarlo. `scoring.py` acepta exactamente el JSON `{section1, section2, section3}` y aplica la misma división/suma. La estructura de `preguntas.json` documenta ambas vistas. **El front debe corregirse** para alimentar al .gs con la estructura que éste espera (BLOQUEO B1).

### D2 (etiqueta) — "Bienestar Material" vs textos laborales
- El .gs llama a la subescala 2 **BM = Bienestar Material**, pero los textos de `section2` en el front (y las interpretaciones BM) mezclan: las preguntas del front (`ITEMS_SECTION2`) son **laborales** ("Mi trabajo es creativo...", "Disfruto con mi trabajo"), mientras los textos de interpretación de BM hablan de **situación económica/recursos**. Hay un cruce conceptual BM/BL en el legacy. Se porta tal cual (no se corrige contenido aprobado); documentado.

### D3 (título) — instrucciones del front
- El front describe "tres áreas" (BPS 40, Material/Laboral 10, Pareja 15), no las **cuatro** subescalas reales del .gs (BPS, BM, BL, RP). Otra señal de la desincronización D1.

## BLOQUEOS / FALTANTES
- **B1 (front desincronizado)**: el front no envía la estructura que el .gs espera (ver D1). El scoring portado es fiel al .gs; **falta corregir el front** o confirmar con el psicólogo la estructura definitiva de secciones e ítems.
- **B2 (textos de ítems BL)**: no existen en el legacy los **10 textos de ítems de Bienestar Laboral** tal como el .gs los espera en `section3[1..10]`. En `preguntas.json` quedan como placeholders. Faltan los enunciados oficiales de la subescala BL.
- **B3 (RP completa)**: el .gs espera 15 ítems de RP en `section3[11..25]`; el front solo aporta 15 ítems de pareja en `section3[1..15]`. Los textos de RP disponibles (`ITEMS_SECTION3`) son 15 y coinciden con la inversión [5,6,7,10,11,12]; se asignaron a RP 1..15. Confirmar el orden/numeración oficial de origen (section3 ids 11..25).
- **B4 (baremos)**: `BAREMOS_GENERALES` están etiquetados en el .gs como "BAREMOS SIMPLIFICADOS"; son tablas de saltos de 5 percentiles, no baremos oficiales por sexo/edad. El test recoge `sexo` (col E) pero el .gs **no lo usa** en el cálculo. Confirmar si deben usarse baremos oficiales diferenciados por sexo.
- **B5 (validación histórica)**: los esperados de `regresion.json` se derivaron del propio algoritmo del .gs; **pendiente** validar contra salidas históricas reales del sistema (correos/informes generados).

## Estado
- ✅ Scoring portado fiel al `.gs`, determinista, server-side, sin IA.
- ✅ Datos (preguntas/baremos/interpretaciones/informe) separados del código.
- ✅ Regresión: 6/6 casos OK (`python test_scoring.py`).
- ⚠️ Discrepancia front↔back documentada (D1–D3) y bloqueos B1–B5 abiertos.
- `tiempo_limite_min`: el front cronometra pero no impone tope → `null`.
