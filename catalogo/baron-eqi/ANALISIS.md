# Análisis de migración — Bar-On EQ-i (Inteligencia Emocional)

## Fuentes legacy
- `Test17/index.html` → front-end (133 ítems, escala Likert 2-6) + **lógica inline** de scoring e interpretaciones (módulo `<script type="module">`).
- `Test17/script.gs` → scoring server-side + estructura de escalas + interpretaciones + envío de informe.

## AUTORIDAD: `script.gs` (no el inline de index.html)
Las reglas del proyecto indican que cuando `script.gs` tiene contenido, es la autoridad. En Test17 además la lógica está **duplicada y DIVERGE** entre front (inline) y back. Se portó el **`.gs`**. Diferencias detectadas (el inline queda OBSOLETO):

| Aspecto | `script.gs` (PORTADO) | `index.html` inline (descartado) |
|---|---|---|
| Niveles | 5 niveles: `>=81 MUY_ALTO`, `>=61 ALTO`, `>=41 PROMEDIO`, `>=21 BAJO`, resto `MUY_BAJO` | 4 niveles: `>=100 ALTO`, `>=70 MEDIO`, `>=25 BAJO`, resto `MUY BAJO` |
| Normalización pct | `((suma-min)/(max-min))*100`, **sin clamp** (permite negativos) | igual fórmula pero **con `Math.max(0,Math.min(100,...))`** |
| Interpretaciones | por **escala compuesta** (CEIA/CEIE/CEAD/CEME/CEAG) × 5 niveles + texto CE Total | por **subescala + compuesta** × niveles ALTO/MEDIO/BAJO/MUY BAJO, con campo `estado` (APTO / APTO CON SUPERVISION / NO APTO) |
| Redondeo | `Math.round(pct*10)/10` (1 decimal) | `toFixed(1)` solo para mostrar |

> El front inline en realidad **ni siquiera calcula**: `calculateResults()` solo valida 133 respuestas y las envía como CSV al `.gs`; las funciones `showResults`/`interpretations`/`classifyLevel` están definidas pero **nunca se invocan** (la pantalla final es solo "Respuestas enviadas"). Por tanto el scoring real de producción es 100% el `.gs`. Confirmado.

## Escala de respuesta
Likert de 5 puntos con **valores 2-6** (no 1-5): Nunca=2, Pocas=3, A veces=4, Muchas=5, Siempre=6. (Definido en `index.html` `likert` y validado en `.gs` `procesarFila`, rango 2-6.)

## Lógica reconstruida (fiel al `.gs` `calcularResultados`)
1. **Subescalas (15):** suma de los ítems de cada subescala (`SUBESCALAS`). `pct = ((suma - n*2)/(n*6 - n*2))*100`. Nivel por `clasificarNivel(pct)` sobre el pct **sin redondear**. `porcentaje` mostrado = `Math.round(pct*10)/10`.
2. **Escalas compuestas (5):** suma de los `puntajeBruto` de sus subescalas; `totalItems` = suma de `numItems`. **Solo CEIE** resta `itemsResta` = [55,61,72,98,119] (resta del valor de respuesta, sin `abs`). Normalización con `totalItems`.
3. **CE Total:** suma de los `puntajeBruto` de las 5 compuestas; luego resta `Math.abs(respuesta)` de `ITEMS_RESTA_CE_TOTAL` = [11,20,31,62,88,108]. Normalización con `n=133` fijo (min=266, max=798).
4. **Fortalezas / debilidades:** las 15 subescalas ordenadas descendente por `porcentaje`; top-5 = fortalezas, bottom-5 invertidas = debilidades.
5. **Interpretaciones:** `INTERPRETACIONES[codigoCompuesta][nivel]` (general + fortalezas) y `obtenerInterpretacionGeneral(nivelCE)` para el CE Total.
6. **Redondeo half-up:** `Math.round` → `_round_half_up(x)=floor(x+0.5)`; `Math.round(x*10)/10` → `_round1`.

## Quirks del `.gs` portados FIELMENTE (no son errores a "arreglar")
- **Porcentajes negativos:** por las restas (CEIE y CE Total) los porcentajes pueden ser negativos con respuestas muy bajas (p.ej. todo=2 → CE Total -13.2%, CEIE -10.9%). El `.gs` no aplica clamp; se replica. (Caso de regresión "Todo 2".)
- **Ítems compartidos entre subescalas (overlap):** ítem 23 (AS y RI), 86 (TE y CI), 112 (CM y PR), 119 (RS y EN). El raw de la compuesta cuenta esos ítems en cada subescala (doble conteo). Portado igual.
- **28 ítems sin subescala:** [4,12,17,20,25,27,38,41,50,57,65,68,71,76,78,79,92,93,94,101,104,108,109,115,120,123,132,133] (ítems de validez/control y de "mentira"). No suman a ninguna subescala ni compuesta; **pero el CE Total se normaliza con n=133** aunque su raw solo agrega los ítems de las compuestas. Es lo que hace el `.gs`; se replica.
- **`nivel` se clasifica sobre el pct sin redondear**, mientras que `porcentaje` se reporta redondeado a 1 decimal. Replicado.

## Consistencia front ↔ back
- Textos de los 133 ítems: solo existen en `index.html` (`items`). El `.gs` solo trae el mapeo ítem→subescala. Se combinaron: textos del HTML + estructura del `.gs`.
- Escala 2-6 y nº de ítems (133): coinciden front y back. ✅
- Lógica de scoring/niveles/interpretaciones: **DIVERGE** (ver tabla). Se usó el `.gs`. ⚠

## BLOQUEOS / FALTANTES
- **BLOQUEO MENOR — baremos poblacionales reales:** el `.gs` NO usa baremos normativos del manual Bar-On (percentiles/eneatipos por edad/sexo). Usa una **normalización interna 0-100** ("para visualización", según comentarios del propio inline). Los percentiles clínicos oficiales del EQ-i NO están en el legacy → no se inventan. Si el psicólogo requiere baremos oficiales, es un dato faltante a aportar.
- **BLOQUEO MENOR — interpretaciones de subescalas:** el `.gs` (autoridad) solo define interpretaciones para las 5 **compuestas** + CE Total. Las 15 subescalas no tienen texto interpretativo en el `.gs`. (El inline sí tenía textos por subescala con `estado` APTO/NO APTO, pero pertenece a la lógica divergente descartada; no se mezcla para no contaminar el port aprobado.) Si se quieren textos por subescala, decidirlo con el psicólogo (¿adoptar los del inline?).
- **Validez/control:** los 28 ítems sin escala incluyen ítems de deseabilidad social / "mentira" (p.ej. 50 "No hago nada malo", 80 "Yo no he mentido", 133 "He respondido sincera y honestamente"). El `.gs` NO calcula índice de validez con ellos (el inline tenía `flags` pero tampoco los poblaba). No se implementa índice de validez por falta de regla aprobada.
- **Posible errata de mapeo en el `.gs`:** algunos ítems compartidos (23, 86, 112, 119) podrían ser intencionales o erratas del manual. Se portó tal cual (autoridad). Señalar al psicólogo para confirmación.

## Estado
- ✅ Completo: preguntas (133), baremos (estructura de 15 subescalas + 5 compuestas + CE Total), interpretaciones (5 compuestas × 5 niveles + CE Total), scoring, informe, regresión (4/4).
- Regresión: 4/4 OK (`python test_scoring.py`). Casos: todo=2 (mínimo + restas negativas), todo=4 (medio), todo=6 (máximo + resta CEIE), patrón cíclico 2-6 (mixto + orden fortalezas/debilidades).
- Valores esperados derivados del algoritmo del `.gs` vía implementación de referencia independiente; pendiente validar contra salidas históricas reales del sistema.
- `tiempo_limite_min`: el front no imponía tiempo → `null`.
