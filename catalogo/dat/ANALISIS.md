# Análisis de migración — DAT (Test de Aptitudes Diferenciales)

## Fuentes legacy
- `_migracion/catalogo-tests-one/tests/Test1/index.html` (~1577 líneas) → front-end. Recolecta respuestas y las envía a la planilla; lógica inline en JS.
- `_migracion/catalogo-tests-one/tests/Test1/script.gs` (553 líneas) → **autoridad de corrección** (CLAVES, calcularResultados, generarTextosExpandidos, LIB_TEXTOS).
- `_migracion/catalogo-tests-one/tests/Test1/img/abstracto/*.png` y `img/espacial/*.webp` → estímulos visuales (NO copiados; sólo se referencia el nombre por ítem).

## Subtests
| ID | Nombre | Corrección | Opciones | Ítems clave (.gs) | Ítems front |
|----|--------|-----------|----------|-------------------|-------------|
| PSA | Rapidez y Exactitud Perceptiva | conteo de respuestas (sin clave) | dinámico | — | dinámico (RAW_TEXT_P1/P2) |
| VR | Razonamiento Verbal | clave | A–E | 50 | 40 (QUESTIONS_TEST2) |
| ORT | Ortografía | clave | A–D | 40 | 40 |
| NR | Razonamiento Numérico | clave | A–E | 40 | 40 |
| AR | Razonamiento Abstracto | clave | A–E | 50 | 40 (renderizados; ANSWERS_TEST5 tiene 50) |
| SR | Relaciones Espaciales | clave | A–D | 50 | 50 |

## Flujo de datos
1. El front sólo guarda la **letra elegida** por ítem y la envía como string `"1;C, 2;E, ..."` por subtest (separador alterno `:`). No corrige nada.
2. El `.gs` `parsearColumnas` parsea esos strings a dicts `{id: LETRA}`.
3. `calcularResultados`:
   - **PSA**: `pct = nº de respuestas dadas` (cap 100). No usa clave.
   - **VR/ORT/NR/AR/SR**: `calcularPrueba` itera sobre las **CLAVES** → `total = nº de claves`, `correctas = aciertos`, `pct = Math.round(correctas/total*100)`.
4. `generarTextosExpandidos`:
   - Nivel por % (getBlock): `ALTO >= 70`, `MEDIO >= 40`, resto `BAJO`. Sólo VR/NR/AR/SR tienen bloque de interpretación.
   - **Estilo de trabajo** (PSA=rapidez, ORT=precisión), primer if/else que se cumple: `DINAMICO` (psa>70 y ort<50) → `METICULOSO` (psa<50 y ort>70) → `EFICIENTE` (psa>65 y ort>65) → `ESTANDAR` (default).
   - **Roles** (acumulativos, estricto `>`): VR>60, NR>60, AR>70, SR>60, ORT>80; si ninguno → "Soporte Operativo General".

## Consistencia front ↔ back
- **AR (abstracto): consistente.** `ANSWERS_TEST5` del front == `CLAVES.ABSTRACTO` del back, 50/50 idénticas.
- **SR (espacial): DISCREPANCIA MAYOR.** `ANSWERS_TEST6` del front difiere de `CLAVES.ESPACIAL` del back en **38 de 50** ítems (sólo 12 coinciden). Igual que pasó con Dominó, el front parece otra versión. **Decisión:** se porta la clave del `.gs` por ser la autoridad de corrección (es la que efectivamente puntúa en producción). El front no corrige, así que su `ANSWERS_TEST6` nunca se usó para puntuar.
- **VR (verbal): inconsistencia de tamaño.** El front recolecta 40 ítems; la clave del `.gs` tiene 50 entradas. El back divide entre 50 → un evaluado que acierte los 40 que ve obtiene como máximo 40/50 = 80%. Se porta tal cual (autoridad).
- **AR front 40 vs clave 50:** análogo a VR; el back puntúa sobre 50.
- VR/ORT/NR: el front NO contiene clave de corrección; las claves existen sólo en el `.gs`.

## Lógica reconstruida (fiel al `.gs`)
- `scoring.py` replica `cleanCell`/`parsearColumnas` (acepta string crudo o dict), `calcularPrueba`, getBlock, estilo y roles.
- Redondeo half-up idéntico a `Math.round` (`_round_half_up = floor(x+0.5)`), aplicado al `pct`.
- Datos separados: claves y umbrales en `baremos.json`; enunciados/opciones en `preguntas.json`; textos en `interpretaciones.json`.

## Estado
- ✅ Completo (con bloqueos documentados): preguntas, baremos (claves + umbrales), interpretaciones, scoring, informe, regresión (6/6 OK).
- Regresión: 6 casos derivados del algoritmo del `.gs` (perfecto, vacío, half-up, y los 4 estilos de trabajo DINAMICO/METICULOSO/EFICIENTE/ESTANDAR).

## BLOQUEOS / faltantes
1. **Clave SR (front vs back) incoherente (38/50 distintas).** Se adoptó la del `.gs`. Requiere validación del psicólogo contra el cuadernillo oficial DAT-SR para confirmar cuál es la correcta. **No se cambió la lógica**, sólo se documenta.
2. **VR clave de 50 vs 40 ítems recolectados** (y AR análogo): el denominador del % es 50 aunque el evaluado sólo responda 40, lo que limita el máximo alcanzable a 80% si el front no envía los ítems 41-50. Confirmar con el psicólogo si las claves 41-50 de VR y los ítems 41-50 de AR deben recolectarse en el front o si el denominador debería ser 40. Portado tal cual del `.gs`.
3. **PSA sin clave ni ítems fijos:** los estímulos se generan dinámicamente y aleatorizados en el front; el puntaje es sólo el conteo de respuestas (cap 100). No hay corrección de exactitud, sólo de cantidad. Si se desea puntuar exactitud (rapidez vs aciertos reales), faltaría la clave de PSA — no existe en el legacy.
4. **ORT y PSA no producen interpretación de aptitud propia** en el legacy: sólo alimentan el estilo de trabajo. No hay textos ALTO/MEDIO/BAJO para ellos.
5. **Baremos normativos:** el DAT de este sistema NO usa percentiles/tablas normativas; reporta % de aciertos con cortes fijos (70/40). No hay baremos por edad/sexo en el legacy.
