# Revisión profunda del catálogo de tests

Fecha de revisión: 2026-06-25. Resultado de auditar los 18 tests reconstruidos en `catalogo/`.

## Decisión tomada y próximos pasos
- **Criterio para los 4 con discrepancia (Dominó, DAT, DNLA Comercial, EBP):** se mantiene la **lógica del `.gs` como autoridad** (ya portada). El contenido que falta queda como "a completar"; esos 4 están en estado `parcial_logica_gs_falta_contenido_original`.
- **No se contará con el psicólogo ni con cuadernillos oficiales.** El usuario buscará **versiones tempranas (primeras versiones) de algunos tests** para cubrir los huecos.

### Qué buscar en las versiones tempranas (shopping list para destrabar los 4)
| Test | Qué falta hoy | Qué versión temprana lo destraba |
|---|---|---|
| **Dominó 48** | Los 48 estímulos (imágenes de las secuencias) que correspondan a la clave de 48 del `.gs`. | Una versión del front con **48 ítems** (no la de 40), con sus secuencias/imágenes. |
| **DAT** | Clave de Espacial (SR) que coincida con el `.gs` (hoy difieren 38/50) y los ítems 41-50 de Verbal y Abstracto. | Una versión del front cuyo SR coincida con la clave del `.gs` y que recoja los 50 ítems de VR y AR. |
| **DNLA Comercial** | Los **textos de los 25 reactivos** que puntúa el `.gs` (el front actual es otro test de 30 ítems). | Una versión del front **DNLA Sales de 25 ítems / 5 dimensiones** (la que casa con el `.gs`). |
| **EBP** | Los **10 enunciados de Bienestar Laboral** y los ítems de Relaciones de Pareja que el `.gs` espera en `section3`. | Una versión del front cuyo `section3` traiga los 10 ítems de Bienestar Laboral (y los 15 de RP). |

> Al recibir cualquiera de estas versiones, se completa `preguntas.json` del test correspondiente y se valida con la regresión existente. No se inventa contenido.


## Estado general
- **18/18 tests con motor de scoring funcionando y regresión en verde (108 casos en total).**
- Estructura completa por test (manifest, preguntas, baremos/normas, interpretaciones, scoring.py, informe, regresión, ANALISIS).
- Correcciones de esta revisión: **DAT** reconstruido (estaba incompleto, solo tenía manifest), **EBP** tenía un valor esperado mal en regresión (corregido), **dnla-percepcion-personal** sin ANALISIS.md (agregado).

> ⚠️ "Regresión en verde" significa que `scoring.py` reproduce el algoritmo legacy con los casos definidos.
> NO equivale a validación contra informes históricos reales — eso queda pendiente para TODOS los tests
> (los esperados se derivaron del propio algoritmo del `.gs`, no de salidas emitidas en producción).

## Tabla de estado
| Test | Regresión | Listo para usar | Bloqueo principal |
|---|---|---|---|
| big-five | 4/4 | ✅ Sí | — |
| eneagrama | 6/6 | ✅ Sí | — |
| gds-15 | 9/9 | ✅ Sí | validar textos de apoyo (badges sí son del legacy) |
| cad | 6/6 | ✅ Sí | sin baremos oficiales (propio del CAD) |
| dnla-leadership | 6/6 | 🟡 Casi | textos de interpretación GLOBAL truncados con "..." en el legacy |
| dnla-percepcion-personal | 7/7 | ✅ Sí | — |
| stai | 7/7 | ✅ Sí | selección de sexo (muestra ambos baremos) |
| ipp-r | 6/6 | ✅ Sí | sin percentiles oficiales (interpretación por PD) |
| chaside | 5/5 | 🟡 Confirmar | 9 claves de perfil "corregidas" → decisión psicólogo |
| kuder | 5/5 | 🟡 Confirmar | 165 vs 168 tríadas + 4 claves divergentes |
| ipp | 8/8 | 🟡 Confirmar | `.gs` truncado (informe inferido) + bug "disperso" inalcanzable |
| wais-iv | 6/6 | 🟡 Confirmar | CI por fórmula simplificada, NO tablas normativas oficiales |
| toulouse-pieron | 5/5 | 🟠 Revisar | aciertos/errores ESTIMADOS (no reales) + baremos sin origen |
| baron-eqi | 4/4 | 🟠 Revisar | front↔back divergen; ítems compartidos; subescalas sin texto |
| ebp | 6/6 | 🔴 Bloqueo | front desincronizado + faltan 10 textos de ítems (Bienestar Laboral) |
| dat | 6/6 | 🔴 Bloqueo | clave SR difiere 38/50; VR/AR clave 50 vs 40 ítems; PSA sin clave |
| dnla-perfil-comercial | 8/8 | 🔴 Bloqueo | front (30 ítems) ≠ back (25); faltan los textos de los 25 reactivos |
| domino-48 | 5/5 | 🔴 Bloqueo | front=40 vs .gs=48 ítems; faltan los estímulos del cuadernillo |

## Decisiones que requieren al psicólogo (por prioridad)

### 🔴 Bloqueos que impiden usar el test tal cual
1. **Dominó 48** — Definir cuadernillo oficial (40 o 48 ítems) y aportar los estímulos (no están en el repo). El motor y baremos están listos para 48.
2. **DAT** — La clave del subtest Espacial (SR) difiere entre front y back en 38/50 ítems; las claves de Verbal/Abstracto son de 50 pero el front solo recoge 40. Confirmar claves y nº de ítems oficiales por subtest. PSA solo puntúa cantidad, no exactitud (no hay clave).
3. **DNLA Perfil Comercial** — El front (30 ítems / 6 dimensiones) y el `.gs` (25 ítems / 5 dimensiones) son tests distintos; además faltan los textos de los 25 reactivos (no están en el `.gs`). Alinear ambos al modelo correcto y aportar los enunciados.
4. **EBP** — El front envía una estructura de secciones que el `.gs` interpreta distinto (Bienestar Laboral se calcula sobre ítems de pareja; faltan 10 ítems de Relaciones de Pareja). Faltan los 10 enunciados oficiales de Bienestar Laboral. Hay que sincronizar el front con el `.gs` (o redefinir la estructura).

### 🟠 Revisar metodología
5. **Toulouse-Piéron** — En el legacy los aciertos/errores son una ESTIMACIÓN (`round(marcados * 0.20)`), no la corrección real marca-a-marca. Si se quiere el cálculo correcto hay que capturar marcas vs objetivos. Baremos sin origen normativo documentado.
6. **Bar-On EQ-i** — Front y back divergen (se portó el `.gs` como autoridad, y el inline ni siquiera puntuaba). Quirks del `.gs`: ítems compartidos entre subescalas (doble conteo), 28 ítems sin subescala, solo las 5 escalas compuestas tienen texto interpretativo (las 15 subescalas no). Confirmar si son intencionales y si se quieren textos por subescala.

### 🟡 Confirmar fidelidad / bugs heredados
7. **CHASIDE** — Se "corrigieron" 9 claves de combinación de perfil que en el legacy devolvían vacío por un bug de orden alfabético. Esto cambia el resultado de 9 perfiles. Confirmar si se mantiene la corrección o se replica el bug.
8. **Kuder** — El `.gs` puntúa 165 tríadas y el front presenta 168; 4 claves difieren entre front y back. Confirmar cuadernillo y claves correctas.
9. **IPP** — El `.gs` está truncado (falta el cierre y el armado del informe → `informe.json` está inferido). El tipo de perfil "disperso" es inalcanzable por un bug legacy (portado tal cual). Confirmar si "disperso" debe poder darse.
10. **WAIS-IV** — El CI se calcula con una fórmula simplificada (`CI = round(40 + sumaPE*1.5)`), NO con las tablas normativas oficiales del WAIS-IV (no están en el legacy). Confirmar si se requieren las tablas oficiales.

### Contenido a completar/validar
- **DNLA Leadership**: los textos de interpretación GLOBAL están truncados con "..." en el legacy; aportar versión completa (las descripciones por dimensión sí están completas).
- **GDS-15**: los badges son port literal del legacy; los textos de descripción/recomendación se redactaron en la migración → validar antes de usarlos en informes.

## Baremos: nota transversal
Varios instrumentos NO usan percentiles/normas poblacionales oficiales, sino umbrales fijos o conversiones
simplificadas (es así en el legacy aprobado): CAD, IPP, IPP-R, Eneagrama, DNLA (todos), DNLA Leadership,
WAIS-IV, Toulouse, EBP. Si en algún caso se requieren baremos normativos oficiales (por edad/sexo), hay
que incorporar las tablas del manual correspondiente — no se inventaron.

## Pendiente para todos
Validar contra **informes/correos históricos reales** del sistema actual (Google Sheets/Apps Script) para
certificar "cálculo idéntico al original" de punta a punta. Hoy la equivalencia está verificada contra el
algoritmo del `.gs`, no contra salidas emitidas.
