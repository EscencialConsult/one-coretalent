# Catálogo de tests reconstruidos — Plataforma ONE

Hogar limpio y definitivo de los tests, independiente del legacy `_migracion/` (que se eliminará).
La lógica de cada test ya fue aprobada por el psicólogo y **no se modifica**: aquí solo se porta
fielmente desde el legacy (HTML + `script.gs`) y se separa en datos + código determinista.

## Estructura por test

```
catalogo/<slug-del-test>/
├── manifest.json        # metadatos: id, nombre, código, versión, nº ítems, tiempo, gráficos
├── preguntas.json       # reactivos/estímulos + clave de respuestas (lo que ve el evaluado)
├── scoring.py           # lógica de cálculo DETERMINISTA (port fiel del .gs) — sin IA
├── baremos.json         # tablas de baremos (puntaje crudo → percentil/nivel)
├── interpretaciones.json# textos de interpretación pre-aprobados, por resultado
├── informe.json         # config del informe: secciones, gráficos (barras, radar, etc.)
├── regresion.json       # casos de prueba: input → output esperado (validan "idéntico al original")
└── ANALISIS.md          # notas de migración, decisiones y discrepancias detectadas
```

## Principios
- **Scoring 100% determinista y server-side.** Mismo input → mismo output. Sin IA.
- **Datos vs código.** Preguntas, baremos e interpretaciones son datos (JSON); solo el algoritmo es código.
- **Regresión obligatoria.** Cada test trae casos `regresion.json` que reproducen resultados del sistema original.
- **Interpretaciones curadas.** Los textos del informe son contenido real aprobado, seleccionado por el resultado — nunca generado por IA.
- **Trazabilidad.** `ANALISIS.md` registra de qué archivo legacy salió cada cosa y cualquier inconsistencia.

## Estado de reconstrucción
Los 18 tests están reconstruidos con motor de scoring y regresión en verde (108 casos).
**Ver [REVISION.md](REVISION.md) para el detalle de bloqueos y decisiones pendientes del psicólogo.**

| Slug | Test | Regresión | Bloqueo principal |
|---|---|---|---|
| big-five | Big Five (IPIP-50) | 4/4 | — |
| eneagrama | Eneagrama Profesional | 6/6 | — |
| gds-15 | GDS-15 (Depresión Geriátrica) | 9/9 | validar textos de apoyo |
| cad | CAD (Afrontamiento del Dolor) | 6/6 | sin baremos oficiales (propio del test) |
| dnla-percepcion-personal | DNLA Percepción Personal | 7/7 | — |
| stai | STAI (Ansiedad Estado-Rasgo) | 7/7 | — |
| ipp-r | IPP-R | 6/6 | sin percentiles oficiales |
| dnla-leadership | DNLA Leadership | 6/6 | textos globales truncados en legacy |
| chaside | CHASIDE | 5/5 | 9 claves de perfil "corregidas" → confirmar |
| kuder | Kuder | 5/5 | 165 vs 168 tríadas; 4 claves divergentes |
| ipp | IPP | 8/8 | `.gs` truncado; bug "disperso" inalcanzable |
| wais-iv | WAIS-IV | 6/6 | CI por fórmula simplificada (no tablas oficiales) |
| toulouse-pieron | Toulouse-Piéron | 5/5 | aciertos/errores estimados (no reales) |
| baron-eqi | Bar-On EQ-i | 4/4 | front↔back divergen; subescalas sin texto |
| ebp | EBP (Bienestar Psicológico) | 6/6 | front desincronizado; faltan textos de ítems |
| dat | DAT (Aptitudes) | 6/6 | clave SR difiere 38/50; VR/AR 50 vs 40 ítems |
| dnla-perfil-comercial | DNLA Perfil Comercial | 8/8 | front≠back; faltan textos de 25 reactivos |
| domino-48 | Dominó 48 (D-48) | 5/5 | front=40 vs .gs=48; faltan estímulos |
