# Análisis de migración — Dominó 48

## Fuentes legacy
- `_migracion/catalogo-tests-one/tests/Test5/index.html` → carga `./script.js`
- `_migracion/catalogo-tests-one/tests/Test5/script.js` → front-end (40 ítems)
- `_migracion/catalogo-tests-one/tests/Test5/script.gs` → Apps Script (48 ítems, baremos, textos)

## ⚠️ Conflicto: front-end (40) vs Apps Script (48)
El front-end que corre hoy y el `.gs` aprobado son **versiones distintas del test**:

| Aspecto | `script.js` (front, lo que corre) | `script.gs` (back, lógica pegada) |
|---|---|---|
| Nº ítems | 40 (`TOTAL_ITEMS = 40`) | 48 (Dominó D-48 clásico) |
| Clave de respuestas | embebida por ítem (P1 = `[3,3]`) | `RESPUESTAS_CORRECTAS` (P1 = `[5,6]`) — distinta |
| Envío | `i:0/1` (acierto/error ya calculado) | espera `i:valor`, compara contra `correcta[0]` |
| Agrupación | bloques A/B/C (1-10, 11-25, 26-40) | tipología A-G sobre 48 ítems |
| Baremos | no tiene | sí, calibrados a 48 ítems |
| Métricas extra | PD, PA, IER, velocidad | correctas, %, percentil, nivel, tipología |

### Sub-discrepancia en la regla de acierto
- `script.js`: acierto = la ficha elegida coincide en **ambos** pips (`tile[0]==ans[0] && tile[1]==ans[1]`).
- `script.gs` (`parsearRespuestas`): compara solo el **primer** pip (`valor === correcta[0]`) — artefacto del formato de entrada lossy.

## 🔴 Falta crítica
El `.gs` tiene las **respuestas correctas** (48) y los **baremos**, pero **no los estímulos**
(las secuencias de dominó que ve el evaluado). Los estímulos solo existen en el front-end... que es
la versión de **40 ítems**. Por lo tanto, para el D-48 de 48 ítems **no hay banco de estímulos** en el repo.

## Decisión tomada
- ✅ Versión aprobada: **D-48 (48 ítems)** — la del `script.gs`.
- Regla de acierto adoptada: **ambos pips coinciden** (estándar D-48; el front-end legacy también compara ambos). El `.gs` comparaba solo el primer pip por su formato de entrada lossy — se descarta como artefacto.

## Origen de los estímulos (confirmado)
Las fichas que se muestran están **hardcodeadas en `script.js`** (lista `ITEMS`), con `sequence` + `answer` + 6 `options`.
Esa lista tiene **40 ítems**, no 48. → El test que funciona hoy es el de 40; el `.gs` aprobado es de 48. Siguen sin coincidir.
Preservado verbatim en `_legacy-front-40items.js`.

## Pendiente del cliente (resolver con el psicólogo)
1. ¿Cuál cuadernillo es el oficial: el de **48 ítems** (D-48 del `.gs`) o el de **40** (el que corre)?
   - Si 48: falta el banco de 48 estímulos (no existe en el repo).
   - Si 40: tengo los 40 estímulos (`_legacy-front-40items.js`) pero faltan baremos calibrados a 40.
2. Confirmar **tiempo oficial** (manifest usa 25 min, tomado del front de 40 ítems).

## Ya extraído (aprobado, del `.gs`, no se pierde al borrar el legacy)
- `baremos.json` — rangos puntaje→percentil/nivel (48 ítems)
- `tipologia.json` — patrones A-G
- `interpretaciones.json` — textos por nivel
- `clave-respuestas.json` — fichas correctas (48) [faltan los estímulos]

## Pendiente de construir (tras resolver la decisión)
- `preguntas.json` (estímulos + clave) · `scoring.py` · `informe.json` · `regresion.json` · `manifest.json`

## ✅ RESUELTO (2026-06-30): aparecieron los 48 estímulos
El cliente encontró el **front original de 48 ítems** (`Test5/index.html`, distinto del de 40): tiene
`const problems[]` con las 48 secuencias (4 fichas) + 6 opciones por ítem. **Sus 48 respuestas coinciden
EXACTAMENTE con `RESPUESTAS_CORRECTAS` del `.gs`** (P1=[5,6]…P48=[5,0]) → es el banco de estímulos del D-48
aprobado. Se extrajo a `preguntas.json` (48 ítems + 2 de práctica). Validado: clave presente en opciones,
secuencias de 4 fichas, motor + regresión 5/5 OK. Tiempo oficial = **30 min** (este front).

Nota baremos: este front trae un baremo embebido con percentiles levemente distintos (P75/P60/P25/P10/P5/P1)
vs `baremos.json` del `.gs` (P80/P65/P30/P15/P6/P2). **Los cortes y los NIVELES son idénticos**; solo difiere
el número exacto de percentil. Se mantiene `baremos.json` (el `.gs` es la autoridad). Confirmar con el psicólogo
si se prefiere el percentil del front.

**Falta solo:** la UI en React (componente que dibuja las fichas por pips, como `createDots`/`createDomino`)
y el informe. El motor y los datos ya están completos.

## DECISIÓN PREVIA (obsoleta): DIFERIDO
Aclaración confirmada con el cliente: las fichas SIEMPRE fueron datos en código (`ITEMS` en `script.js`,
dibujadas por CSS con `createDots`/`createDomino`), NUNCA imágenes. El bloqueo no era "faltan imágenes".
- No es "al front le faltan 8 fichas": el front (40) y el `.gs` (48) tienen **claves distintas desde el ítem 1**
  (ej. ítem 1 → front `[3,3]` vs `.gs` `[5,6]`), son baterías diferentes. No se pueden "agregar 8".
- No se inventan fichas (rompería la validez; regla del proyecto: portar fiel, no inventar).
- Caminos: **A)** usar la versión real de **40** (estímulos en `_legacy-front-40items.js`, cálculo PD/%/bloques/IER/
  velocidad; falta baremo de 40 para percentil/nivel) — **recomendado**; **B)** conseguir cuadernillo oficial
  de **48** estímulos y usar los baremos de 48 ya extraídos.
- **Cliente decidió: DIFERIDO** (no elegir A/B por ahora).
