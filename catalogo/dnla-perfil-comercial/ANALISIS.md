# Análisis de migración — DNLA Perfil Comercial (DNLA Sales Profile)

## Fuentes legacy
- `Test10/script.gs` → **AUTORIDAD del cálculo** (DNLA Sales Profile v1.1). Define dimensiones,
  baremos, interpretaciones, parseo de respuestas, promedios, niveles, fortalezas/áreas y
  recomendaciones globales.
- `Test10/index.html` → front-end. **NO coincide con el `.gs`** (ver discrepancia crítica abajo).

## Discrepancia CRÍTICA front ↔ back: ❌ Son tests DISTINTOS

El `index.html` y el `script.gs` implementan **dos tests diferentes**:

| Aspecto | `script.gs` (AUTORIDAD) | `index.html` (front) |
|---|---|---|
| Nº ítems | **25** (5 dim × 5) | **30** (6 dim × 5) |
| Nº dimensiones | **5** | **6** |
| Dimensiones | Iniciativa y Proactividad · Comunicación Persuasiva · Escucha Activa y Empatía · Orientación al Cliente · Resiliencia y Gestión del Rechazo | Responsabilidad Personal · Compromiso y Motivación · Autoestima y Confianza · Empatía y Relaciones · Adaptabilidad y Flexibilidad · Organización y Planificación |
| Interpretaciones | 5 niveles × dim, detalladas (fortalezas/recom./riesgos) | Texto corto por dim/nivel, inline en JS |
| Escala | 1-5 (no etiquetada en `.gs`) | 1=Nunca … 5=Siempre |

**Decisión (regla del proyecto): se porta el `.gs` como autoridad.** El front `index.html`
parece un test posterior/distinto ("competencias generales") reusando la misma infraestructura
de envío (URL_TEST10, hoja "Respuestas"). Lo que el `.gs` procesa al recibir los datos es el
modelo de **5 dimensiones comerciales**.

> ⚠️ **Implicación operativa:** si el front actualmente desplegado es el de 30 ítems/6 dim, los
> datos que llegan a la hoja NO corresponden a las 25 preguntas que el `.gs` espera (mapea ids
> 1-25 a dimensiones comerciales). Esto debe resolverse antes de producción: alinear front y
> back al MISMO modelo. Mientras tanto, este port reproduce exactamente el `.gs`.

## BLOQUEO: textos de los reactivos
El `.gs` (autoridad) **no contiene los textos de las 25 preguntas**, solo el mapeo id→dimensión
(`DIMENSIONES[i].preguntas`). Los textos vivían en el formulario / plantilla externa (`plantilla`
en `HtmlService.createTemplateFromFile('plantilla')`) que no fue provista. Los 30 textos del
`index.html` pertenecen al OTRO test y no aplican.
- **Estado:** `preguntas.json` lleva id + dimensión + `reverse:false`, con `text: null`.
- **Acción pendiente:** recuperar el cuadernillo oficial DNLA Sales (25 ítems comerciales) para
  completar los textos. No afecta al scoring (el cálculo solo usa id→dimensión y el valor 1-5).

## Lógica reconstruida (fiel al `.gs`)
1. **Parseo** (`parsearRespuestas`): cadena `"1:5,2:4,..."` → `split(',')` → `split(':')` →
   `parseInt(trim)`. Replicado con `_js_parse_int` (semántica de `parseInt`, base 10).
2. **Promedio por dimensión** (`calcularPromedioDimension`): suma de los 5 ítems / 5. Ítem
   ausente o 0 cuenta como 0 (`respuestas[p] || 0`); el divisor es siempre 5. Rango 1.0-5.0.
3. **Clasificación de nivel** (`clasificarNivel`): se compara el **promedio crudo (float)**,
   no el redondeado, con umbrales `>=` descendentes:
   - ≥ 4.6 → SOBRESALIENTE · ≥ 3.8 → SÓLIDO · ≥ 3.0 → POTENCIAL MEDIO · ≥ 2.0 → NECESITA
     DESARROLLO · resto → BAJO.
   - Los `max` de `BAREMOS` en el `.gs` son informativos/presentación; el algoritmo NO los usa.
4. **Promedio global**: media de los 5 promedios crudos (`sumaPromedios / 5`), clasificado igual.
5. **Presentación** (`promedio.toFixed(2)`): el campo `promedio` se expone como cadena de 2
   decimales. Como cada promedio es múltiplo de 0.2 (sumas de enteros /5) y el global es
   múltiplo de 0.04 (sum/25), `toFixed(2)` es exacto — no hay ambigüedad de redondeo.
6. **Fortalezas / Áreas de mejora** (`identificarFortalezas` / `identificarAreasMejora`):
   ordenar por `parseFloat(toFixed(2))` desc/asc y tomar top-3 / bottom-3. El `Array.sort` de
   V8 es **estable** (≥ V8 7.0); en empates conserva el orden de inserción (dimensiones 1→5).
   Se replica con `sorted()` de Python (también estable) preservando el orden 1→5.
7. **Recomendaciones globales** (`generarRecomendacionesGlobales`): listas por `nivelGlobal`.
8. **Redondeo half-up** (`_round_half_up = math.floor(x + 0.5)`) usado en `toFixed`, idéntico a
   `Math.round` para valores no negativos.

## Separación datos / código
- **Datos:** `preguntas.json` (id→dim), `baremos.json` (niveles + dimensiones), `interpretaciones.json`
  (por dim/nivel + globales), `informe.json` (config de informe).
- **Código:** `scoring.py` (algoritmo determinista puro). Sin IA, sin estado, sin red.

## Decisiones de portabilidad puntuales
- **Wrapper de tiempo del front** (`"{2m 15s - 1:5,...}"`): el `.gs` `parsearRespuestas` NO lo
  sanea — `parseInt("{2m 15s - 1")` = NaN, por lo que el ítem 1 se pierde. El port reproduce
  ese comportamiento (clave NaN descartada → el ítem cuenta como 0). Caso de regresión #8 lo
  documenta. Es otra cara de la discrepancia front↔back.
- **Claves de dimensión:** se introdujeron slugs estables (`iniciativa_proactividad`, etc.) para
  enlazar baremos/interpretaciones/scoring; el `nombre` legible se conserva idéntico al `.gs`.

## Regresión
8 casos en `regresion.json`, todos derivados del propio algoritmo del `.gs` (verificados con un
reimplemento de referencia independiente). Cubren: todo-3 / todo-5 / todo-1, escalonado por banda
(valida niveles y orden de fortalezas/áreas), fronteras 4.6 y 3.8, parseo de texto crudo y parseo
del wrapper de tiempo.

```
8/8 casos OK
```

## CONFIRMACIÓN (2026-06-30) y DECISIÓN: diferido
Se revisó el `index.html` real del front (provisto por el cliente). **Confirma la discrepancia**:
- El front desplegado (`URL_TEST10` → hoja "Respuestas") es el test **genérico de 30 ítems / 6 dimensiones**
  (Responsabilidad Personal · Compromiso y Motivación · Autoestima y Confianza · Empatía y Relaciones ·
  Adaptabilidad y Flexibilidad · Organización y Planificación), con su propia lógica inline
  (`getDetailedAnalysis` / `displayGlobalInterpretation`, 5 niveles, radar Chart.js).
- El `.gs` que genera el informe (`plantilla.html`, provisto) es el **comercial de 25 ítems / 5 dimensiones**.
- Es decir: en producción el evaluado responde 30 preguntas genéricas y el `.gs` puntúa las primeras 25
  como dimensiones COMERCIALES → relabeling semánticamente incoherente.

**Faltante real para tomar el Sales Profile:** los 25 enunciados COMERCIALES (Iniciativa, Comunicación
Persuasiva, Escucha, Orientación al Cliente, Resiliencia/Rechazo). NO existen ni en el `.gs` ni en el
front; el `index.html` (30 ítems genéricos) y el `plantilla.html` (template del informe) NO los contienen.

**Decisión del cliente: DIFERIDO** hasta conseguir/definir los 25 ítems comerciales (o decidir si el
test genérico de 30/6 se trata como instrumento separado con su propio informe).

## Estado
- ✅ Motor + baremos + interpretaciones + scoring + informe + regresión (8/8).
- ⏸️ DIFERIDO por decisión del cliente (2026-06-30): faltan los 25 enunciados comerciales.
- ⛔ **BLOQUEO:** textos de los 25 reactivos (no están en el `.gs`; el `index.html` es de otro test).
- ⛔ **DISCREPANCIA CRÍTICA front↔back:** front (30 ítems/6 dim) ≠ back (25 ítems/5 dim). Requiere
  decisión de negocio/psicólogo para alinear ambos al mismo modelo.
- Pendiente fino: validar promedios/niveles contra salidas históricas reales del sistema (los
  esperados de `regresion.json` se derivaron del algoritmo, no de corridas históricas).
- `tiempo_limite_min`: el front no imponía tiempo → `null`.
```
