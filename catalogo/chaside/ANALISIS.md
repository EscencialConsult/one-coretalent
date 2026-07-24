# Análisis de migración — CHASIDE (Orientación Vocacional)

## Fuentes legacy
- `Test7/index.html` → front-end (título "Test de Orientación Vocacional CHASIDE", 98 ítems en 7 secciones de 14, respuesta SI/NO, sin límite de tiempo).
- `Test7/script.js` → `questions` (98 ítems con su `area`), construcción de secciones y envío de respuestas como cadena `"SI,NO,..."`.
- `Test7/script.gs` → **AUTORIDAD del cálculo**: `GRILLA_CHASIDE`, `INTERESES`, `APTITUDES`, `AREAS`, `COMBINACIONES_PROFESIONES`, `TEXTOS_INTERPRETACION`, `calcularResultados`, `calcularPercentil`, `obtenerNivelInterpretacion`.

## Consistencia front ↔ back: ✅ OK (ítem por ítem)
Verificado programáticamente los 98 ítems:
- El área de cada pregunta en `script.js` (`area:"X"`) coincide **exactamente** con `GRILLA_CHASIDE` del `.gs` para las 98 preguntas (0 discrepancias).
- 14 ítems por área en ambos lados (C, H, A, S, I, D, E).
- El front envía respuestas crudas `SI/NO` en orden 1-98; el `.gs` cuenta los `SI` por área. Reproducido igual.
- Sub-escalas `INTERESES` (2 ítems/área) y `APTITUDES` (4 ítems/área) son sub-conjuntos válidos de la grilla de su área, sin solapamiento entre sí. Marcadas en `preguntas.json` con el campo `subescala`.

## Lógica reconstruida (fiel al `.gs`)
1. **Puntaje directo (PD)** por área = nº de respuestas `SI` entre sus 14 ítems → rango 0-14.
2. **Sub-puntajes** de intereses y aptitudes = nº de `SI` entre los ítems de cada sub-escala.
3. **Percentil** por tabla discreta `calcularPercentil(pd, 14)` (NO interpolada). Bordes: `pd<=0 → 5`, `pd>=14 → 99`; tabla por tramos (13-14→99, 11-12→90, 9-10→75, 7-8→60, 5-6→45, 3-4→25, 1-2→10, 0→5). Ver `baremos.json`.
4. **Nivel** por PD (umbral descendente): `>=12` MUY_ALTO, `>=9` ALTO, `>=5` PROMEDIO, `>=2` BAJO, resto MUY_BAJO.
5. **Orden** de áreas por PD descendente. Empates: el `.gs` usa `Array.sort` (estable) sobre el orden canónico `C,H,A,S,I,D,E`; replicado con `sorted(key=-pd)` de Python (también estable) → mismo orden en empates.
6. **Código de perfil** = letras de las 2 áreas top, **ordenadas alfabéticamente** y unidas por `-` (p. ej. `A-I`).
7. **Áreas altas** = `PD >= 9`; **áreas bajas** = `PD <= 4`.
8. **Profesiones combinadas** = `COMBINACIONES_PROFESIONES[codigoPerfil]` o `[]` si no existe.
9. **Totales** SI / NO sobre las respuestas.

## Redondeo / Math.round
No aplica: CHASIDE no hace ninguna división ni redondeo. El percentil sale de una tabla discreta de enteros. Por tanto **no se usa `math.floor(x+0.5)`** (no hay ningún cálculo que lo requiera). Documentado para trazabilidad.

## ⚠️ DISCREPANCIA / BUG LEGACY corregido — claves de COMBINACIONES_PROFESIONES
En el `.gs`, el código de perfil se calcula **siempre alfabéticamente**:
`[top2[0].letra, top2[1].letra].sort().join('-')`.
Pero 9 de las 21 claves de `COMBINACIONES_PROFESIONES` están escritas en orden **NO alfabético**, por lo que el lookup nunca las alcanzaba y esos perfiles devolvían `[]` silenciosamente:

| Clave en `.gs` (muerta) | Clave que realmente genera el lookup |
|---|---|
| `C-A` | `A-C` |
| `H-A` | `A-H` |
| `H-D` | `D-H` |
| `H-E` | `E-H` |
| `S-I` | `I-S` |
| `S-D` | `D-S` |
| `S-E` | `E-S` |
| `I-D` | `D-I` |
| `I-E` | `E-I` |

**Decisión:** en `interpretaciones.json` las claves se normalizaron a orden alfabético (la asociación pareja→profesiones es claramente intencional). Esto **cambia el output observable** para esos 9 perfiles: antes devolvían `[]`, ahora devuelven la lista de profesiones correspondiente. Las otras 12 claves ya estaban alfabéticas y no cambian.

**ACCIÓN REQUERIDA (psicólogo):** confirmar si se desea (a) mantener la corrección — comportamiento previsiblemente buscado — o (b) replicar el bug devolviendo `[]` para esos 9 perfiles. Actualmente está aplicada la opción (a). El caso de regresión "Áreas I y A al máximo" cubre esta corrección (perfil `A-I`, antes muerto como `I-A`).

## Bloqueos / faltantes
- **Validación histórica:** los esperados de `regresion.json` se derivaron del propio algoritmo portado (idéntico al `.gs`), no de salidas reales del sistema en producción. Pendiente cotejar contra informes históricos si se dispone de ellos. (No bloquea el funcionamiento; sí la certificación de "idéntico al original" extremo a extremo.)
- **Percentiles "aproximados":** el propio `.gs` los rotula como aproximación proporcional, no como baremo normativo poblacional real. Se portan tal cual; no se inventó ninguna tabla.
- `tiempo_limite_min`: el front no imponía tiempo → `null`.
- El `.gs` también generaba HTML/PDF/email y leía Google Sheets; eso es plomería de entrega, fuera del alcance del scoring. Solo se portó la lógica de cálculo. La config del informe (gráfico de barras horizontal 0-14, colores por nivel) se recogió en `informe.json`.

## Estado
- ✅ Completo: preguntas (98), baremos, interpretaciones, scoring, informe, regresión (5/5).
- 1 discrepancia documentada (claves de combinación) pendiente de confirmación del psicólogo.
```
98 ítems · 7 áreas (C,H,A,S,I,D,E), 14 ítems c/u · sub-escalas intereses(2)/aptitudes(4) por área
Percentil: tabla discreta 0-14 · Niveles: MUY_ALTO/ALTO/PROMEDIO/BAJO/MUY_BAJO
```
