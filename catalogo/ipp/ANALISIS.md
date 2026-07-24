# Análisis de migración — IPP (Inventario de Intereses y Preferencias Profesionales)

## Fuentes legacy
- `Test3/index.html` → front-end: presentación, escala A/I/D (A=Agrada, I=Indiferente, D=Desagrada), 108 ítems.
- `Test3/script.js` → front-end: `ITEMS_IPP` (108 ítems con `id`, `text`, `campo`), renderizado, envío. **No calcula nada**; solo serializa las respuestas crudas al formato `"{Xm Ys - 1;A, 2;D, ...}"` y las manda al backend.
- `Test3/script.gs` → **AUTORIDAD del cálculo**: `CAMPOS_PROFESIONALES`, `NIVELES_INTERES`, `TEXTOS_INTERPRETACION`, `parsearRespuestasIPP`, `calcularResultadosIPP`.

## Consistencia front ↔ back: ✅ OK (ítem por ítem)
- **108 ítems**, **18 campos × 6 ítems**. El mapeo ítem→campo de `script.js` (`ITEMS_IPP[].campo`) coincide exactamente, ítem por ítem, con `CAMPOS_PROFESIONALES[codigo].items` del `.gs`. Verificado para los 108.
- Escala A/I/D idéntica en `index.html` y en el parser/cálculo del `.gs`.
- El front envía respuestas crudas (letras), el `.gs` aplica el puntaje. Reproducido igual.

## Lógica reconstruida (fiel al `.gs`, `calcularResultadosIPP`)
1. **Puntaje por respuesta**: `A`=+2, `I`=+1, `D`=+0. Ítem sin responder = no suma (0). Máximo por campo = 6×2 = **12**.
2. **Puntuación por campo** = suma de sus 6 ítems. Conteo de detalle A/I/D por campo.
3. **Porcentaje** = `Math.round(puntuacion / 12 * 100)`. Replicado con half-up: `math.floor(x + 0.5)` (`_round_half_up`).
4. **Nivel de interés** por puntuación cruda, primer rango que la contenga (orden MUY_ALTO→MUY_BAJO):
   - Muy Alto 10–12, Alto 7–9, Medio 4–6, Bajo 1–3, Muy Bajo −6…0. Por defecto Muy Bajo.
5. **Ordenamiento** de los 18 campos por puntuación descendente. `Array.sort` de JS es **estable**: en empate se conserva el orden de inserción de `CAMPOS_PROFESIONALES` (= `orden_campos` en `baremos.json`). Reproducido con `sorted(..., key=-puntuacion)` (estable en Python).
6. **Predominantes** = top 3 (`slice(0,3)`). **Rechazados** = últimos 3 invertidos (`slice(-3).reverse()`).
7. **Tipo de perfil** (a partir de `rango = max − min`):
   - `rango <= 4` → **plano**.
   - else if (entre los 3 predominantes, los que tienen `puntuacion >= 8` son `>= 5`) → **disperso**.
   - else → **definido**.
8. Textos de interpretación general y por tipo de perfil seleccionados por el resultado (no IA).

## Separación datos / código
- **Datos**: `preguntas.json` (108 ítems + escala), `baremos.json` (campos, ítems, valores A/I/D, niveles), `interpretaciones.json` (descripciones, carreras, textos de perfil), `informe.json`.
- **Código**: `scoring.py` (algoritmo determinista). Sin baremos ni textos hardcodeados.

## Regresión
- `test_scoring.py` ejecuta `regresion.json`: **8/8 casos OK**.
- Casos: todo A / todo I / todo D, perfil definido, half-up (5→42%), fronteras del perfil (rango 4 plano / rango 5 definido), respuestas parciales.
- Esperados **derivados del propio algoritmo del `.gs`** (no de salidas históricas reales del sistema, que no están disponibles).

## BLOQUEOS / FALTANTES
1. **`.gs` TRUNCADO.** El archivo `Test3/script.gs` termina a media función `calcularResultadosIPP` (línea ~451): falta el `return` del objeto resultado y **toda** la función `generarInformeHTML`, además de `limpiarImagenesParaPdf`. Consecuencias:
   - El **shape exacto del objeto retornado** por `calcularResultadosIPP` está inferido de las variables construidas antes del corte (`resultadosPorCampo`, `camposOrdenados`, `camposPredominantes`, `camposRechazados`, `tipoPerfil`, `interpretacionPerfil`). La salida de `scoring.py` expone todas estas; los nombres de campo del dict de salida son nuestra convención.
   - El **diseño del informe** (`informe.json`) está inferido del flujo, NO portado del HTML real (que no existe en el legacy disponible). Estructura razonable pero **no verificada** contra el original.
2. **Rama `disperso` muerta (port fiel del bug original).** La condición `camposPredominantes.filter(c => c.puntuacion >= 8).length >= 5` opera sobre `camposPredominantes`, que solo tiene **3** elementos (es el `slice(0,3)`). Por tanto `>= 5` **nunca** se cumple y el tipo de perfil "disperso" es **inalcanzable** con la lógica legacy. Se portó tal cual (no se corrige, regla: solo portar). El texto/tipo "disperso" queda definido en datos por completitud, pero el algoritmo jamás lo produce. **Decisión del psicólogo requerida** si se desea que "disperso" sea alcanzable (p. ej. evaluar sobre los 18 campos, no sobre el top 3).
3. **Baremos sin normas poblacionales.** A diferencia de Big Five, el IPP legacy NO usa percentiles ni normas poblacionales: el "nivel" se asigna por la puntuación cruda 0–12 (`NIVELES_INTERES`). No falta nada del `.gs`; simplemente el instrumento legacy no baremiza contra población. Documentado para que no se confunda con una omisión.
4. **`tiempo_limite_min`**: el front mide y reporta el tiempo empleado pero no impone límite → `null`. El tiempo no participa en el cálculo (en el `.gs`, `tiempo` se pasa a `calcularResultadosIPP` pero no se usa en la parte visible del cálculo; la posible parte que lo usara estaría en el tramo truncado).
5. **Validación contra histórico real pendiente.** Los esperados de `regresion.json` reproducen el algoritmo, no salidas reales del sistema en producción (no disponibles).

## Estado
- ✅ Motor de cálculo completo y verificado: preguntas, baremos, interpretaciones, scoring, regresión (8/8).
- ⚠️ Informe inferido (no portado del HTML real, ausente por truncamiento del `.gs`).
- ⚠️ Bug legacy "disperso inalcanzable" portado fielmente; pendiente decisión del psicólogo.
