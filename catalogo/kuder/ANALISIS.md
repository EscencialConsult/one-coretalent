# Análisis de migración — Test de Kuder (Registro de Preferencias Vocacionales, Forma C)

## Fuentes legacy (`_migracion/catalogo-tests-one/tests/Test2/`)
- `Test2/script.gs` → **AUTORIDAD del cálculo**. Contiene `TRIADAS` (claves de área),
  `AREAS`, `BAREMOS`, `COMBINACIONES_PROFESIONES`, `TEXTOS_INTERPRETACION` y la función
  `calcularResultados`. Es el código server-side que efectivamente puntúa los envíos.
- `Test2/script.js` → front-end (UI de tríadas, textos de las actividades,
  recolección de `mas|menos` y envío a la planilla vía `doPost`). Su propio cálculo
  (`calculateResults`) es **solo para mostrar en pantalla** y NO es el oficial.
- `Test2/index.html` → estructura de pantallas (registro / test / resultados). Sin tiempo límite.

## Lógica reconstruida (fiel al `.gs` → `scoring.py`)
1. **Parseo**: respuestas por tríada `{mas, menos}` (índices de actividad 0/1/2).
   La planilla las guarda como `"mas|menos"`; `scoring._normalizar` acepta ambos formatos.
2. **Puntaje directo (PD) por área**: para cada tríada, `+1` al área de la actividad
   marcada `+` (`keys[mas]`) y `+1` al área de la actividad marcada `−` (`keys[menos]`).
   (Esta es la "CORRECCIÓN CRÍTICA" comentada en el `.gs`: se suman MÁS **y** MENOS.)
   Guarda `if (idx < TRIADAS.length)`: solo se puntúan las primeras 165 tríadas.
3. **Percentil por área**: lookup en `BAREMOS[area]`, primera fila con `min ≤ PD ≤ max`.
   Si ninguna fila aplica → percentil por defecto = 50 (idéntico al `.gs`).
4. **Nivel** (umbral descendente sobre el percentil): ≥90 MUY_ALTO, ≥75 ALTO,
   ≥60 PROMEDIO_ALTO, ≥40 PROMEDIO, ≥25 PROMEDIO_BAJO, resto BAJO.
5. **Áreas ordenadas** por percentil descendente (orden estable, como `Array.sort`).
6. **Código de perfil** = las 2 áreas de mayor percentil, ordenadas ascendente por
   número de área, unidas con `-` (ej. `2-9`).
7. **Áreas altas** (percentil ≥ 75) y **bajas** (percentil ≤ 25).
8. **Escala de verificación (V)**: cuenta tríadas con `mas != menos`. Validez (manual,
   pág. 2): VÁLIDO 31-39, DUDOSO 28-32, INVÁLIDO <28 o >39. Réplica exacta del `if/else`
   anidado del `.gs` (nótese el solape 28-32 / 31-39: con verificación 31 o 32 el flag
   `esValido` es `true` y `estadoValidez` es `"VALIDO"`; el `.gs` se porta tal cual).
9. **Profesiones combinadas**: `COMBINACIONES_PROFESIONES[codigoPerfil]` o `[]`.

## Redondeo (Math.round half-up)
La ruta de **scoring del `.gs` no usa `Math.round`** en ningún punto: el percentil es un
lookup de tabla por rango. Por tanto **no hay redondeo que portar** en el cálculo.
Se incluye `_round_half_up = math.floor(x + 0.5)` en `scoring.py` por consistencia con el
resto del catálogo, pero la lógica de puntuación no lo invoca.
(El front `script.js` usa `Math.round` solo para una barra de progreso y para un percentil
"aproximado" de pantalla `(score/maxPossible)*100`, que NO es el oficial — ver abajo.)

## Consistencia front (`script.js`) ↔ back (`script.gs`): ⚠️ DISCREPANCIAS
Comparación ítem por ítem de las claves de tríada (`keys`):

### BLOQUEO 1 — Número de tríadas: 165 (`.gs`) vs 168 (`script.js`)
- El `.gs` (autoridad) define **165** tríadas en `TRIADAS` y solo puntúa `idx < 165`.
- El front presenta **168** tríadas y envía 168 pares `mas|menos`.
- Efecto: las respuestas a las tríadas **166, 167 y 168 se descartan silenciosamente**
  en el cálculo oficial. Las claves front de esas 3 tríadas extra son
  `[7,4,8]`, `[0,1,9]`, `[3,5,6]`.
- Decisión: se porta el comportamiento del `.gs` (165, con el guard). `n_triadas_scoring=165`,
  `n_triadas_frontend=168` quedan documentados en `preguntas.json` y `manifest.json`.
- **Acción requerida del psicólogo/owner**: decidir cuál es el cuadernillo correcto
  (¿el `.gs` quedó corto en 3 tríadas, o el front tiene 3 de más?). El test de Kuder Forma C
  clásico tiene 168 tríadas (504 actividades), lo que sugiere que **el `.gs` está incompleto**;
  pero la lógica aprobada y en producción es la del `.gs`, así que NO se altera sin aprobación.

### BLOQUEO 2 — 4 claves de tríada difieren entre front y back
En las tríadas (1-based) **140, 143, 155, 161** las `keys` no coinciden:

| Tríada | `.gs` (usado) | `script.js` |
|---|---|---|
| 140 | [0, 1, 2] | [0, 1, 9] |
| 143 | [0, 1, 9] | [0, 1, 2] |
| 155 | [0, 1, 2] | [0, 1, 9] |
| 161 | [0, 1, 9] | [0, 1, 2] |

- Solo afecta a las áreas **2 (Cálculo)** y **9 (Administrativo)**: en esas 4 tríadas la
  3.ª actividad puntúa a Cálculo en el `.gs` y a Administrativo en el front (o viceversa).
- Decisión: `preguntas.json` usa las `keys` del `.gs` (autoridad) y registra la clave del
  front en `_keys_frontend_difiere` solo en esas 4 tríadas, para trazabilidad.
- **Acción requerida**: el psicólogo debe confirmar qué clave es la correcta por tríada.

### Observación — Claves restantes coinciden
Las otras 161 tríadas comunes (de las 165 del `.gs`) tienen claves idénticas en ambos lados.

## Otras notas / decisiones
- **`maxPD` (en `AREAS`)**: valores del manual (82, 68, 56, 70, 86, 52, 42, 30, 80, 102).
  No coinciden con `2 × (nº de tríadas donde aparece el área)` derivado de este set de 165
  tríadas (que daría 110, 104, 30, 110, 110, 112, 110, 106, 110, 88). Son **solo informativos**
  (no intervienen en el scoring); se portan tal cual desde el `.gs`. Posible inconsistencia
  histórica entre el cuadernillo y el manual — documentada, no corregida.
- **`COMBINACIONES_PROFESIONES` clave `"7-4"`**: el `codigoPerfil` siempre se ordena
  ascendente (`4-7`), por lo que la clave `"7-4"` **nunca se puede emparejar** con un código
  generado. Se conserva el dato tal cual (no se renombra sin aprobación), pero queda registrado
  como código muerto. El resto de claves (`0-1`, `0-3`, …) sí están en orden ascendente.
- **`tiempo_limite_min`**: el front no impone tiempo → `null`.
- **Percentil "de pantalla" del front**: `script.js` calcula un percentil aproximado
  `Math.round((score / 56) * 100)` solo para la UI; NO es el baremo oficial. Se descarta:
  el oficial es el lookup de `BAREMOS` del `.gs`.

## Estado
- ✅ Motor (`scoring.py`), datos (`preguntas.json`, `baremos.json`, `interpretaciones.json`),
  informe (`informe.json`) y regresión (`regresion.json`, **5/5 OK**) portados fielmente del `.gs`.
- Los esperados de `regresion.json` se derivaron del algoritmo del `.gs` y se verificaron con
  una reimplementación independiente del `.gs` (no de `scoring.py`).
- ⚠️ Estado general `completo_con_bloqueos`: BLOQUEO 1 (165 vs 168 tríadas) y BLOQUEO 2
  (4 claves divergentes) requieren decisión del psicólogo/owner antes de considerarlo cerrado.
- Pendiente fino: validar percentiles/perfiles contra salidas históricas reales del sistema
  (los esperados actuales se derivan del propio algoritmo, no de informes emitidos).
