# Análisis de migración — Test de Toulouse-Piéron (atención/percepción)

## Fuentes legacy
- `_migracion/catalogo-tests-one/tests/Test13/index.html` → front-end (cuadrícula 1600, 8 tipos de símbolo, 2 objetivos aleatorios, timer 10 min). Lógica de captura inline en `<script type="module">`.
- `_migracion/catalogo-tests-one/tests/Test13/script.gs` → **AUTORIDAD del cálculo** (`analizarRespuestas`, `clasificarPorBaremo`, `clasificarPorNivel`, `identificarPerfil`, `analizarDistribucionPorSegmentos`).

## Qué mide y cómo (port fiel del `.gs`)
El test es una prueba de **cancelación**: el evaluado marca, sobre 1600 cuadrados, los que coinciden con 2 símbolos de referencia. El front registra los **índices marcados** (0-based) y los envía como string `"{<tiempo> - idx,idx,...}"`.

`analizarRespuestas` (reconstruido literal en `scoring.py`):
1. **Limpieza/parseo**: si hay `" - "`, toma lo posterior al último; quita `{` `}`; `split(",")` → `parseInt(base 10)` → descarta NaN.
2. `totalMarcados` = nº de índices.
3. `maxIndex` = máximo índice; `totalProcesado = maxIndex + 1`.
4. `porcentajeCompletado = totalProcesado / 1600 * 100`.
5. `aciertos = round(totalMarcados * 0.20)`  ← **estimación**, ver BLOQUEO 1.
6. `errores = totalMarcados - aciertos`.
7. `omisiones = 320 - aciertos` (320 = OBJETIVOS_ESPERADOS = 20% de 1600).
8. Índices: `indiceAciertos = aciertos/totalProcesado*100`; `indiceErrores = errores/totalProcesado*100`; `indiceProductividad = aciertos - errores`; `coeficienteAptitud = aciertos - errores/2`.
9. `nivelAtencion` por baremo de aciertos; `nivelPrecision` por errores; `nivelVelocidad` por totalProcesado (tablas en `baremos.json`, rangos `min..max` inclusive, fallback = última fila).
10. `perfil` por criterios evaluados **en orden** (`ATENTO_PRECISO → RAPIDO_IMPULSIVO → LENTO_PRECISO → DISPERSO → INTERMEDIO`); el último es catch-all.
11. `analisisPorSegmentos`: 10 segmentos de 160 cuadrados; `cantidad` = marcas en `[inicio, fin)`; `densidad = cantidad/160*100` formateado con `toFixed(2)`.

### Redondeo (idéntico a JS)
- `aciertos` usa `Math.round` → replicado con `_round_half_up(x) = floor(x + 0.5)`.
- `densidad` usa `Number.toFixed(2)` → replicado con `_to_fixed_2`. **Verificado uno a uno** contra Node.js para los 161 valores posibles (0..160 marcas/segmento), incluyendo las rarezas de coma flotante de JS (`14.37`, `25.62`, `54.37`). Coincidencia exacta.

## Verificación de equivalencia
La regresión (`regresion.json`, 5/5 OK) fue validada contra una **reimplementación en Node.js de la lógica exacta del `.gs`** (no contra el propio Python). Todos los campos numéricos, niveles, perfil y densidades de segmento coinciden.

## Consistencia front ↔ back
- **Símbolos/objetivos**: el front genera 1600 símbolos y 2 objetivos aleatorios por sesión; **no envía** qué símbolos eran objetivo ni cuáles marcados eran realmente correctos. Sólo manda la lista de índices marcados.
- **Formato**: front envía `"{<tiempo> - idx,idx,...}"`; el `.gs` limpia el prefijo. Reproducido igual (acepta string front, string crudo o lista).
- **Stat "Procesados" del front** = `max(index)+1`, idéntico a `totalProcesado` del back. Consistente.

## BLOQUEOS / faltantes (NO se inventó lógica)

### BLOQUEO 1 — Aciertos/errores NO son reales, son estimados (heredado del legacy)
El `.gs` **no** compara las marcas contra los objetivos reales (el front no los transmite). Calcula `aciertos = round(totalMarcados * 0.20)` y `errores = totalMarcados - aciertos`. Consecuencia inevitable del legacy:
- `indiceAciertos` ≈ 20% y `indiceErrores` ≈ 80% casi siempre (salvo redondeo en marcados bajos).
- `indiceProductividad` y `coeficienteAptitud` resultan casi siempre negativos.
- Un Toulouse-Piéron metodológicamente correcto requeriría aciertos/errores/omisiones reales (comparación marca↔objetivo). **Esto NO está en el legacy y NO se implementó** para no alterar la lógica aprobada. Si el psicólogo desea el cálculo real, hay que: (a) que el front envíe los tipos objetivo y el tipo de cada índice marcado, y (b) definir el baremo correcto. Pendiente de decisión.

### BLOQUEO 2 — Baremos sin origen normativo documentado
`BAREMOS_ACIERTOS`, `CLASIFICACION_ERRORES`, `CLASIFICACION_VELOCIDAD` y los umbrales de `PERFILES_DESEMPENO` están hardcodeados en el `.gs` sin referencia a baremos oficiales (edad/escolaridad). Se portan **literalmente**. Su validez normativa queda fuera de alcance; documentar fuente con el psicólogo.

### BLOQUEO 3 — Caso degenerado "sin marcas" (divergencia documentada vs JS)
Con 0 marcas, JS hace `Math.max.apply(null, [])` = `-Infinity` → `totalProcesado = -Infinity`, `porcentajeCompletado = NaN` (salida rota). `scoring.py` lo maneja como `totalProcesado = 0`, `porcentajeCompletado = 0` y evita división por cero. **Única divergencia deliberada** respecto al `.gs` (el original produce salida inválida en ese caso, que no ocurre en una evaluación real). Por eso el caso vacío **no** se incluye como caso "idéntico al original" en la regresión.

### Otros faltantes menores
- `tiempo_limite_min = 10` (del front: 600 s); el `.gs` no lo usa en el cálculo.
- El gráfico se genera vía QuickChart en el legacy; `informe.json` describe la sección de barras de forma agnóstica al renderer.

## Estado
- ✅ Motor + baremos + perfiles + segmentos + regresión (5/5) — port fiel del `.gs`, verificado contra Node.js.
- ⚠️ Con BLOQUEOS: aciertos estimados (no reales) y baremos sin origen normativo. Ver BLOQUEO 1 y 2.
