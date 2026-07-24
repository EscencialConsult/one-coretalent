# Análisis de migración — DNLA Percepción Personal (Personal Insight Profile)

> ANALISIS.md reconstruido a posteriori (el subagente original se cortó por límite de sesión antes
> de escribirlo, pero dejó todos los demás archivos completos y con regresión 7/7).

## Fuentes legacy
- `Test11/index.html` (lógica de presentación / posible inline) y `Test11/script.gs` (autoridad del cálculo).
- Funciones portadas: `calcularDimensiones`, `calcularPromedioGlobal`, `identificarPerfilGlobal`,
  `obtenerInterpretacionGlobal`, `generarBadgeGlobalHTML`, y los generadores de bloques textuales
  (análisis por dimensión, patrones transversales, riesgos, recomendaciones, resumen ejecutivo, síntesis).

## Lógica reconstruida (fiel al `.gs`)
- **24 ítems**, escala de frecuencia 1-5, **sin ítems inversos**.
- **6 dimensiones × 4 ítems**; promedio por dimensión = suma de sus 4 ítems / 4.
- **Promedio global** = media de los 6 promedios de dimensión.
- **Clasificación global** (badge / perfil / interpretación) por umbrales descendentes del promedio global;
  ramas inferiores (<3.0) dependen de ítems puntuales (r[16], r[19]).
- **Bloques textuales** seleccionados de forma DETERMINISTA por condiciones sobre ítems crudos `r[i]`
  (base-0, r[0]=ítem 1) y/o promedios de dimensión. El evaluador soporta `>= <= < > ==` y `AND`
  (sin OR ni paréntesis), data-driven desde `interpretaciones.json`. Nada de IA.
- **Fortalezas/debilidades** del resumen ejecutivo por umbrales (≥ fortaleza / ≤ debilidad), en el orden
  de definición de las dimensiones.
- Redondeo half-up replicado (`math.floor(x+0.5)`) donde el `.gs` usaba `Math.round`.

## Consistencia / notas
- Entrada aceptada: dict `{id 1-24: valor}` o lista de 24 (posición 0 = ítem 1). Ítems faltantes → 0
  (igual que `|| 0` del `.gs`).
- Los textos de interpretación son contenido curado del legacy, seleccionados por condición — no generados por IA.

## BLOQUEOS / faltantes
- **Validación histórica pendiente:** los esperados de `regresion.json` se derivaron del propio algoritmo
  portado, no de salidas reales del sistema en producción.
- **Sin baremos poblacionales:** la clasificación es por umbrales fijos del promedio 1-5, no por normas
  por edad/sexo (el legacy no las tiene; no se inventaron).

## Estado
✅ Completo: preguntas, baremos (umbrales), interpretaciones, scoring, informe, regresión (7/7).
