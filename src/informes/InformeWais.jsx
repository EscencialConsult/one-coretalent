// Informe WAIS-IV (adaptación screening de opción múltiple). CI estimado + 4 índices
// cognitivos con interpretación. Datos deterministas del motor (sin IA).
// NOTA: es una estimación orientativa, NO sustituye una evaluación clínica.

import FichaTest from './FichaTest.jsx'

export default function InformeWais({ data }) {
  const d = data.datos || {}
  const ev = data.evaluado
  const marca = data.empresa
  const fecha = data.created_at ? new Date(data.created_at).toLocaleDateString('es-AR') : ''
  const indices = d.indices ? Object.values(d.indices) : []
  const nivelCI = d.nivelCI || {}

  return (
    <div className="inf-doc">
      {/* PORTADA */}
      <div className="inf-sheet">
        <div className="inf-cover">
          <div className="top">
            <span className="brand">{marca?.logo_url ? <img className="inf-logo" src={marca.logo_url} alt={marca.razon_social} /> : (marca?.razon_social || 'ONE')}</span>
            <span className="badge">Informe confidencial</span>
          </div>
          <h1>Evaluación Cognitiva · WAIS-IV</h1>
          <div className="st">Cuatro índices cognitivos y CI estimado</div>
        </div>
        <div className="inf-who">
          <div><div className="k">Evaluado/a</div><div className="v">{ev ? `${ev.nombre} ${ev.apellido}` : '—'}</div></div>
          <div><div className="k">Fecha</div><div className="v">{fecha}</div></div>
          <div><div className="k">CI estimado</div><div className="v">{d.ciTotal}</div></div>
        </div>
      </div>

      <FichaTest slug={data.test_slug} />

      {/* CI TOTAL */}
      <div className="inf-sheet"><div className="inf-pad" style={{ textAlign: 'center' }}>
        <span className="inf-eyebrow">Coeficiente intelectual estimado</span>
        <div style={{ fontSize: 60, fontWeight: 800, color: 'var(--brand-acento)', lineHeight: 1, margin: '6px 0 2px' }}>{d.ciTotal}</div>
        <div style={{ display: 'inline-block', fontWeight: 800, fontSize: 14, padding: '7px 16px', borderRadius: 999, color: '#fff', background: 'var(--brand-acento)', margin: '6px 0 8px' }}>{nivelCI.nivel}</div>
        {nivelCI.descripcion && <p className="inf-tx">{nivelCI.descripcion}</p>}
        <p className="inf-tx" style={{ marginTop: 6, color: 'var(--muted)', fontSize: 13 }}>{d.totalCorrectas}/{d.totalPreguntas} respuestas correctas ({d.porcentajeTotal}%).</p>
        <div className="inf-callout" style={{ textAlign: 'left', marginTop: 14 }}>
          <b>Importante:</b> este resultado es una <b>estimación orientativa</b> obtenida por un cuestionario de opción múltiple. <b>No sustituye</b> una evaluación clínica del WAIS-IV administrada individualmente por un profesional habilitado.
        </div>
      </div></div>

      {/* ÍNDICES */}
      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Perfil</span>
        <h2 className="inf-sec">Índices cognitivos</h2>
        <div className="bf-bars" style={{ marginTop: 12 }}>
          {indices.map((c) => (
            <div className="bf-bar" key={c.nombre}>
              <label><span>{c.nombre}</span><b style={{ color: c.color || 'var(--brand-acento)' }}>{c.correctas}/{c.total} · {c.rango}</b></label>
              <div className="bf-track"><i style={{ width: `${c.porcentaje}%`, background: c.color || 'linear-gradient(135deg,#4d248f,#6be1e3)' }} /></div>
            </div>
          ))}
        </div>
      </div></div>

      {/* INTERPRETACIÓN POR ÍNDICE */}
      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Interpretación</span>
        <h2 className="inf-sec">Qué mide cada índice</h2>
        {indices.map((c) => (
          <div key={c.nombre} style={{ borderLeft: `4px solid ${c.color || 'var(--brand-acento)'}`, background: '#f9fafb', borderRadius: 8, padding: '12px 15px', marginBottom: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--tinta)', marginBottom: 3 }}>{c.nombre} <span style={{ fontWeight: 700, color: c.color || 'var(--brand-acento)' }}>· {c.rango} ({c.porcentaje}%)</span></div>
            <div style={{ fontSize: 13, color: '#555', lineHeight: 1.55 }}>{c.interpretacion}</div>
          </div>
        ))}
      </div></div>

      {/* FORTALEZA / DEBILIDAD */}
      {(d.fortaleza || d.debilidad) && (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">Síntesis</span>
          <h2 className="inf-sec">Área más fuerte y a desarrollar</h2>
          <p className="inf-tx"><b style={{ color: '#0f9d6b' }}>Fortaleza relativa:</b> {d.fortaleza?.nombre}.</p>
          <p className="inf-tx"><b style={{ color: '#c0392b' }}>Área a desarrollar:</b> {d.debilidad?.nombre}.</p>
        </div></div>
      )}

      <div className="inf-sheet inf-foot"><b>ONE Core Analytics</b><br />Estimación orientativa por screening. No sustituye una evaluación clínica. Informe confidencial.</div>
    </div>
  )
}
