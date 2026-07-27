// Informe Test de Dominó D-48 — data-driven, replicando la maqueta aprobada.
import { kind, fmtNivel } from './nivel.js'

const TIPOS_REF = [
  ['A · Progresiones Simples', 'Identificación de secuencias lineales y patrones predecibles.'],
  ['B · Progresiones con Ciclos', 'Comprensión de sistemas cíclicos y patrones que se reinician.'],
  ['C · Alternancia y Pares', 'Flexibilidad cognitiva para detectar patrones no lineales.'],
  ['D · Progresiones Múltiples', 'Razonamiento aritmético avanzado con operaciones complejas.'],
  ['E · Intercalación Compleja', 'Separar y analizar múltiples secuencias entrelazadas.'],
  ['F · Series Especiales', 'Pensamiento recursivo y memoria de trabajo avanzada.'],
  ['G · Máxima Complejidad', 'Combinación de múltiples operaciones lógicas de alto nivel.'],
]
const flTipo = (p) => 'fl-' + (p >= 70 ? 'alto' : p >= 40 ? 'medio' : 'bajo')

export default function InformeDomino({ data }) {
  const d = data.datos || {}
  const ev = data.evaluado
  const marca = data.empresa
  const fecha = data.created_at ? new Date(data.created_at).toLocaleDateString('es-AR') : ''
  const k = kind(d.nivel)
  const tipos = Object.entries(d.analisis_por_tipo || {})
  const interp = typeof d.interpretacion === 'object' ? (d.interpretacion?.general || '') : d.interpretacion

  return (
    <div className="inf-doc">
      {/* PORTADA */}
      <div className="inf-sheet">
        <div className="inf-cover">
          <div className="top"><span className="brand">{marca?.logo_url ? <img className="inf-logo" src={marca.logo_url} alt={marca.razon_social} /> : (marca?.razon_social || 'ONE')}</span><span className="badge">Informe confidencial</span></div>
          <h1>Informe Test de Dominó D-48</h1><div className="st">Inteligencia No Verbal y Razonamiento Abstracto</div>
        </div>
        <div className="inf-who">
          <div><div className="k">Evaluado/a</div><div className="v">{ev ? `${ev.nombre} ${ev.apellido}` : '—'}</div></div>
          <div><div className="k">Fecha</div><div className="v">{fecha}</div></div>
          <div><div className="k">Clasificación</div><div className={'v pin-' + k}>{fmtNivel(d.nivel)} · P{d.percentil}</div></div>
        </div>
      </div>

      {/* ===== PARTE I ===== */}
      <div className="inf-sheet inf-divider"><div className="eb">PARTE I</div><h1>Comprendiendo el test</h1></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 1</span>
        <h2 className="inf-sec">¿Qué es el Test de Dominó D-48?</h2>
        <p className="inf-tx">El Test de Dominó D-48 es una evaluación psicométrica centrada en la medición de la <b>inteligencia no verbal y el razonamiento abstracto</b>.</p>
        <p className="inf-tx">Se compone de <b>48 problemas visuales</b> con fichas de dominó. La tarea consiste en descubrir la regla subyacente en cada secuencia y seleccionar la ficha exacta que completa el patrón. Mide razonamiento lógico-abstracto, detección de patrones, inducción, abstracción y flexibilidad cognitiva, sin depender del lenguaje.</p>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 2</span>
        <h2 className="inf-sec">Historia y fundamentos</h2>
        <p className="inf-tx">Creado en <b>1955</b> por <b>Edgar Anstey</b> para medir el <b>Factor G</b> de inteligencia (teoría de Charles Spearman).</p>
        <p className="inf-tx"><b>Progresión de complejidad:</b> dificultad creciente en siete tipologías de patrones. <b>Baremos:</b> las respuestas correctas (máx. 48) se traducen a percentil y a uno de cinco niveles. <b>Factor de presión:</b> límite de tiempo estricto que evalúa la agilidad de procesamiento.</p>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 3</span>
        <h2 className="inf-sec">Las 7 tipologías de patrones</h2>
        <table className="inf-table">
          <thead><tr><th>Tipo</th><th>Qué mide</th></tr></thead>
          <tbody>{TIPOS_REF.map(([t, q]) => <tr key={t}><td><span className="dn">{t}</span></td><td>{q}</td></tr>)}</tbody>
        </table>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 4</span>
        <h2 className="inf-sec">Qué NO es (y cómo evitar malos usos)</h2>
        <ul className="inf-nolist">
          <li><span className="xx">✕</span><span><b>No es una prueba de conocimientos teóricos o académicos.</b> Su diseño es transcultural y libre de la barrera del idioma.</span></li>
          <li><span className="xx">✕</span><span><b>Un resultado bajo NO es una etiqueta cognitiva inamovible.</b> Señala dificultades, pero exige considerar factores externos (comprensión de instrucciones, estrés por el tiempo, estado emocional) y una <b>evaluación complementaria</b>.</span></li>
        </ul>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 5</span>
        <h2 className="inf-sec">Cómo se calcula el resultado</h2>
        <p className="inf-tx">El puntaje crudo es la cantidad de <b>respuestas correctas</b> (0–48), que se traduce a percentil y nivel:</p>
        <table className="inf-table">
          <thead><tr><th>Nivel</th><th>Percentil</th></tr></thead>
          <tbody>
            <tr><td>Superior</td><td>90–99</td></tr>
            <tr><td>Superior al Término Medio</td><td>65–80</td></tr>
            <tr><td>Término Medio</td><td>40–50</td></tr>
            <tr><td>Inferior al Término Medio</td><td>15–30</td></tr>
            <tr><td>Deficiente</td><td>menor a 6</td></tr>
          </tbody>
        </table>
        <div className="inf-callout"><b>Cálculo exacto y sin IA.</b> Acierto = la ficha elegida coincide en ambos pips. El percentil y el nivel surgen de una tabla de baremos fija.</div>
      </div></div>

      {/* ===== PARTE II ===== */}
      <div className="inf-sheet inf-divider"><div className="eb">PARTE II</div><h1>Resultados de la evaluación</h1></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 1</span>
        <h2 className="inf-sec">Resultados globales</h2>
        <div className="inf-stats">
          <div className="inf-stat"><div className="k">Respuestas correctas</div><div className="v">{d.correctas}</div><div className="sub">de {d.total} preguntas</div></div>
          <div className="inf-stat"><div className="k">Porcentaje</div><div className="v">{d.porcentaje}%</div><div className="sub">de aciertos</div></div>
          <div className="inf-stat"><div className="k">Percentil</div><div className="v">{d.percentil}</div><div className="sub">población general</div></div>
        </div>
        <div className={'inf-clasif ' + k}>
          <span className="tag">{fmtNivel(d.nivel)}</span>
          <span className="d"><b>{d.descripcion}</b></span>
        </div>
        {interp && <><h3 className="inf-subh">Interpretación</h3><p className="inf-tx">{interp}</p></>}
        {k === 'bajo' && (
          <div className="inf-warn"><b>Lectura responsable.</b> Este puntaje no es una etiqueta fija. Conviene confirmar el resultado con una evaluación complementaria, considerando factores externos que pudieron influir.</div>
        )}
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 2</span>
        <h2 className="inf-sec">Análisis por tipo de patrón</h2>
        <div className="inf-bars">
          {tipos.map(([code, t]) => (
            <div className="inf-row" key={code}>
              <div className="nm"><div className="t">{code} · {t.nombre}</div><div className="d">{t.descripcion}</div>
                <div className="track"><i className={flTipo(t.porcentaje)} style={{ width: `${Math.max(t.porcentaje, 2)}%` }} /></div>
              </div>
              <div className="pd"><b>{t.porcentaje}%</b> · {t.correctas}/{t.total}</div>
            </div>
          ))}
        </div>
        <div className="inf-callout" style={{ marginTop: 18 }}><b>Sobre el test.</b> El D-48 (Edgar Anstey, 1955) mide el Factor G mediante 48 problemas de dominó de dificultad creciente, sin depender del lenguaje ni la cultura.</div>
      </div>
        <div className="inf-foot"><b>{marca?.razon_social || 'ONE'}</b><div>Informe confidencial · generado por ONE Core Analytics</div></div>
      </div>
    </div>
  )
}
