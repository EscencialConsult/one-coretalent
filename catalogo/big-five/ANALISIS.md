# Análisis de migración — Big Five (IPIP-50)

## Fuentes legacy
- `Test6/index.html` + `Test6/script.js` → front-end (50 ítems, 5 dim × 10, Likert 1-5).
- `Test6/script.gs` → scoring + normas + interpretaciones + gráficos.

## Consistencia front ↔ back: ✅ OK
A diferencia de Dominó, aquí coinciden:
- Mismos 50 ítems y mismas dimensiones.
- Mismos ítems inversos (front `reverseItems` == back `TODOS_ITEMS_INVERTIR`, en índices base-0).
- El front envía las 50 respuestas crudas (sin invertir); el `.gs` invierte y suma. Reproducido igual.

## Lógica reconstruida (fiel al `.gs`)
1. Invertir ítems reverse: `6 - valor`.
2. Sumar por dimensión (10 ítems c/u → rango 10-50).
3. Percentil por interpolación lineal entre anclas `NORMAS_POBLACIONALES`; ramas extremas:
   - `<= norma[5]`: `max(1, round(p/norma[5]*5))`
   - `>= norma[95]`: `min(99, 95 + round((p-norma[95])/5))`
4. Nivel por percentil: ≥90 muyAlto, ≥75 alto, ≥50 moderadoAlto, ≥40 promedio, ≥25 bajo, resto muyBajo.
5. Interpretación (descripción + fortalezas + áreas + profesional) por dimensión y nivel.
6. Dimensión dominante = mayor percentil.
7. Redondeo half-up idéntico a `Math.round` (ver `_round_half_up`).

## Estado
- ✅ Completo: preguntas, normas, interpretaciones, scoring, informe, regresión (4/4).
- Pendiente fino: validar percentiles contra salidas históricas reales del sistema (los esperados de `regresion.json` se derivaron del propio algoritmo).
- `tiempo_limite_min`: el front no imponía tiempo → `null`.

## Ítems parecidos/duplicados detectados (DECISIÓN: dejar fiel al test aprobado, NO cambiar)
Observado por el cliente; se mantiene tal cual la versión legacy. A revisar en el futuro si se valida con un profesional:
- **Caso A — ítems distintos en el IPIP-50 original pero con traducción casi idéntica:**
  - 34 "Cambio de humor frecuentemente" vs 39 "Tengo frecuentes cambios de humor" (orig: *Change my mood a lot* / *Have frequent mood swings*).
  - 24 "Me irrito fácilmente" vs 44 "Me molesto fácilmente" (orig: *Get irritated easily* / *Get upset easily*).
- **Caso B — probables duplicados del legacy (afectarían levemente el puntaje):**
  - 22 vs 42 ("no me interesan los problemas de otras personas") — en el original el 2º debería ser *Feel others' emotions* (+keyed).
  - 20 "No me interesan las ideas abstractas" vs 35 "No me interesan conceptos abstractos" (Apertura).
Se mantiene fiel para que el cálculo coincida con el sistema actual.
