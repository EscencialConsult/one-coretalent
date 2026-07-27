// Informe CHASIDE — data-driven, replicando la maqueta aprobada.
import { kind, fmtNivel } from './nivel.js'

const AREAS_REF = [
  ['C — Administrativas y Contables', 'Organización, cálculo, orden y gestión administrativa y contable.'],
  ['H — Humanísticas y Sociales', 'Justicia, comunicación, mediación y análisis social.'],
  ['A — Artísticas', 'Expresión, creatividad, estética y sensibilidad.'],
  ['S — Medicina y Ciencias de la Salud', 'Asistencia, cuidado de personas e investigación médica.'],
  ['I — Ingeniería y Computación', 'Lógica, cálculo, tecnología y resolución técnica.'],
  ['D — Defensa y Seguridad', 'Protección, orden, servicio y manejo del riesgo.'],
  ['E — Ciencias Exactas y Agrarias', 'Investigación, análisis numérico y contacto con la naturaleza.'],
]

export default function InformeChaside({ data }) {
  const d = data.datos || {}
  const ev = data.evaluado
  const marca = data.empresa
  const fecha = data.created_at ? new Date(data.created_at).toLocaleDateString('es-AR') : ''
  const areas = d.areasResultado || []
  const ordenadas = [...areas].sort((a, b) => (b.puntajeDirecto / b.maxPD) - (a.puntajeDirecto / a.maxPD))
  const principales = (d.areasAltas && d.areasAltas.length ? d.areasAltas : ordenadas.slice(0, 3))
  const pct = (x) => Math.round((x.puntajeDirecto / x.maxPD) * 100)

  return (
    <div className="inf-doc">
      {/* PORTADA */}
      <div className="inf-sheet">
        <div className="inf-cover">
          <div className="top"><span className="brand">{marca?.logo_url ? <img className="inf-logo" src={marca.logo_url} alt={marca.razon_social} /> : (marca?.razon_social || 'ONE')}</span><span className="badge">Informe confidencial</span></div>
          <h1>Informe CHASIDE</h1><div className="st">Orientación Vocacional · 7 áreas de interés</div>
        </div>
        <div className="inf-who">
          <div><div className="k">Evaluado/a</div><div className="v">{ev ? `${ev.nombre} ${ev.apellido}` : '—'}</div></div>
          <div><div className="k">Fecha</div><div className="v">{fecha}</div></div>
          <div><div className="k">Código de perfil</div><div className="v" style={{ color: 'var(--brand-acento)' }}>{d.codigoPerfil}</div></div>
        </div>
      </div>

      {/* ===== PARTE I ===== */}
      <div className="inf-sheet inf-divider"><div className="eb">PARTE I</div><h1>Comprendiendo el modelo CHASIDE</h1></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 1</span>
        <h2 className="inf-sec">¿Qué es el Test CHASIDE?</h2>
        <p className="inf-tx">El Test CHASIDE es una herramienta de evaluación psicométrica enfocada en la <b>orientación vocacional</b>, diseñada para identificar las áreas de mayor interés y preferencia profesional.</p>
        <p className="inf-tx">Su nombre es un acrónimo de las <b>7 áreas</b> que evalúa: Administrativas y Contables (C), Humanísticas y Sociales (H), Artísticas (A), Medicina y Ciencias de la Salud (S), Ingeniería y Computación (I), Defensa y Seguridad (D), y Ciencias Exactas y Agrarias (E). A través de 98 preguntas Sí/No, revela las inclinaciones del evaluado.</p>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 2</span>
        <h2 className="inf-sec">Historia y fundamentos del modelo</h2>
        <p className="inf-tx">El método CHASIDE se basa en el análisis cuantitativo de respuestas afirmativas: cada una de las 98 preguntas se asocia a un área vocacional.</p>
        <p className="inf-tx">Divide cada área en dos sub-escalas: los <b>Intereses</b> (actividades que atraen) y las <b>Aptitudes</b> (capacidades autopercibidas). El puntaje directo (máx. 14 por área) se clasifica en cinco niveles (Muy Alto a Muy Bajo). Las dos áreas de mayor puntaje forman el <b>Código de Perfil</b> (ej. "H-S"), base de las profesiones combinadas sugeridas.</p>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 3</span>
        <h2 className="inf-sec">Las 7 áreas vocacionales</h2>
        <table className="inf-table">
          <thead><tr><th>Área</th><th>Qué evalúa</th></tr></thead>
          <tbody>{AREAS_REF.map(([a, q]) => <tr key={a}><td><span className="dn">{a}</span></td><td>{q}</td></tr>)}</tbody>
        </table>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 4</span>
        <h2 className="inf-sec">Qué NO es (y cómo evitar malos usos)</h2>
        <ul className="inf-nolist">
          <li><span className="xx">✕</span><span><b>No mide habilidades objetivas, inteligencia ni conocimientos reales</b>: evalúa intereses y aptitudes <b>autopercibidas</b>.</span></li>
          <li><span className="xx">✕</span><span><b>No hay respuestas correctas o incorrectas</b>: registra únicamente preferencias personales.</span></li>
          <li><span className="xx">✕</span><span><b>No es una sentencia definitiva</b> sobre el futuro; tiene carácter orientativo.</span></li>
          <li><span className="xx">✕</span><span><b>No debe usarse aislado</b>: los resultados los interpreta un profesional de la orientación vocacional.</span></li>
        </ul>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 5</span>
        <h2 className="inf-sec">Cómo se calcula el resultado</h2>
        <p className="inf-tx">Cada "Sí" suma un punto al área (máx. <b>14 por área</b>), con sub-escalas de <b>Intereses</b> y <b>Aptitudes</b>. Según el puntaje, cada área se clasifica:</p>
        <table className="inf-table">
          <thead><tr><th>Puntaje (0–14)</th><th>Nivel</th></tr></thead>
          <tbody>
            <tr><td>12–14</td><td>Muy Alto</td></tr>
            <tr><td>9–11</td><td>Alto</td></tr>
            <tr><td>5–8</td><td>Promedio</td></tr>
            <tr><td>2–4</td><td>Bajo</td></tr>
            <tr><td>0–1</td><td>Muy Bajo</td></tr>
          </tbody>
        </table>
        <div className="inf-callout"><b>Código de perfil:</b> las dos áreas de mayor puntaje forman el código (ej. "H-S"), base de las profesiones combinadas. <b>Cálculo exacto y sin IA.</b></div>
      </div></div>

      {/* ===== PARTE II ===== */}
      <div className="inf-sheet inf-divider"><div className="eb">PARTE II</div><h1>Perfil vocacional</h1></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 1</span>
        <h2 className="inf-sec">Código de perfil</h2>
        <div className="inf-codebox">
          <div className="lbl">Código de perfil vocacional</div>
          <div className="code">{(d.codigoPerfil || '').split('-').join(' · ')}</div>
          <div className="desc">{principales.slice(0, 2).map((a) => a.nombre).join(' + ')}</div>
        </div>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 2</span>
        <h2 className="inf-sec">Perfil por área (las 7)</h2>
        <div className="inf-bars">
          {ordenadas.map((a) => (
            <div className="inf-row" key={a.letra}>
              <div className="inf-let">{a.letra}</div>
              <div className="nm"><div className="t">{a.nombre}</div><div className="track"><i className={'fl-' + kind(a.nivel)} style={{ width: `${pct(a)}%` }} /></div></div>
              <div className="pd">{a.puntajeDirecto}/{a.maxPD}</div>
              <div className="lvlbadge inf-lvlbadge"><span className={'lvlbadge ' + kind(a.nivel)}>{fmtNivel(a.nivel)}</span></div>
            </div>
          ))}
        </div>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 3</span>
        <h2 className="inf-sec">Áreas de interés preferente</h2>
        {principales.map((a) => (
          <div className="inf-card" key={a.letra}>
            <div className="ah"><div><b>{a.letra} · {a.nombre}</b></div><span className="pc">{a.puntajeDirecto}/{a.maxPD}</span></div>
            <div className="desc">{a.descripcion}</div>
            <div className="track" style={{ margin: '4px 0 12px' }}><i className={'fl-' + kind(a.nivel)} style={{ width: `${pct(a)}%` }} /></div>
            {a.profesiones?.length > 0 && <p className="g"><b style={{ color: 'var(--brand-acento)' }}>Profesiones:</b> {a.profesiones.slice(0, 8).join(' · ')}</p>}
          </div>
        ))}
      </div></div>

      {d.profesionesCombinadas?.length > 0 && (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">Sección 4</span>
          <h2 className="inf-sec">Profesiones sugeridas — {d.codigoPerfil}</h2>
          <ul className="inf-list">{d.profesionesCombinadas.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </div></div>
      )}

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 5</span>
        <h2 className="inf-sec">Desglose: intereses vs. aptitudes</h2>
        <table className="inf-table">
          <thead><tr><th>Área</th><th>Intereses</th><th>Aptitudes</th><th>Total</th></tr></thead>
          <tbody>
            {ordenadas.map((a) => (
              <tr key={a.letra}>
                <td><span className="dn">{a.letra}</span> {a.nombre}</td>
                <td>{a.puntajeIntereses}/{a.maxIntereses}</td>
                <td>{a.puntajeAptitudes}/{a.maxAptitudes}</td>
                <td><b>{a.puntajeDirecto}/{a.maxPD}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        <div className="inf-foot"><b>{marca?.razon_social || 'ONE'}</b><div>Informe confidencial · generado por ONE Core Analytics</div></div>
      </div>
    </div>
  )
}
