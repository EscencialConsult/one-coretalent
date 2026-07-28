// Informe DNLA — Liderazgo y Mandos Medios. 8 competencias con nivel + descripción,
// perfil global y síntesis de fortalezas/áreas a desarrollar. Datos deterministas.

import FichaTest from './FichaTest.jsx'

function colorScore(p) {
  const n = parseFloat(p) || 0
  if (n >= 3.5) return '#0f9d6b'
  if (n >= 2.5) return '#4f7a34'
  return '#c0392b'
}

function Lista({ v, vacio }) {
  if (!Array.isArray(v) || v.length === 0) return <p className="inf-tx" style={{ color: 'var(--muted)' }}>{vacio}</p>
  return <ul className="inf-nolist">{v.map((x, i) => <li key={i}><span style={{ color: 'var(--brand-acento)', fontWeight: 800, flex: 'none' }}>›</span> {x}</li>)}</ul>
}

export default function InformeDnlaLeadership({ data }) {
  const d = data.datos || {}
  const ev = data.evaluado
  const marca = data.empresa
  const fecha = data.created_at ? new Date(data.created_at).toLocaleDateString('es-AR') : ''
  const g = d.global || {}
  const dims = d.dimensiones ? Object.values(d.dimensiones) : []
  const sin = d.sintesis || {}

  return (
    <div className="inf-doc">
      {/* PORTADA */}
      <div className="inf-sheet">
        <div className="inf-cover">
          <div className="top">
            <span className="brand">{marca?.logo_url ? <img className="inf-logo" src={marca.logo_url} alt={marca.razon_social} /> : (marca?.razon_social || 'ONE')}</span>
            <span className="badge">Informe confidencial</span>
          </div>
          <h1>Informe de Liderazgo · DNLA</h1>
          <div className="st">Liderazgo y Mandos Medios · 8 competencias</div>
        </div>
        <div className="inf-who">
          <div><div className="k">Evaluado/a</div><div className="v">{ev ? `${ev.nombre} ${ev.apellido}` : '—'}</div></div>
          <div><div className="k">Fecha</div><div className="v">{fecha}</div></div>
          <div><div className="k">Puntuación global</div><div className="v">{g.puntuacion} / 5</div></div>
        </div>
      </div>

      <FichaTest slug={data.test_slug} />

      {/* PERFIL GLOBAL */}
      <div className="inf-sheet"><div className="inf-pad" style={{ textAlign: 'center' }}>
        <span className="inf-eyebrow">Perfil global de liderazgo</span>
        <div style={{ fontSize: 52, fontWeight: 800, color: g.color || 'var(--brand-acento)', lineHeight: 1, margin: '6px 0 2px' }}>{g.puntuacion}<span style={{ fontSize: 22, color: 'var(--muted)' }}> / 5</span></div>
        <div style={{ display: 'inline-block', fontWeight: 800, fontSize: 14, padding: '7px 16px', borderRadius: 999, color: '#fff', background: g.color || 'var(--brand-acento)', margin: '6px 0 10px' }}>{g.label}</div>
        {g.interpretation && <p className="inf-tx" style={{ textAlign: 'left' }}>{g.interpretation}</p>}
        {g.recomendacion && <div className="inf-callout" style={{ textAlign: 'left' }}><b>Recomendación:</b> {g.recomendacion}</div>}
      </div></div>

      {/* COMPETENCIAS */}
      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Detalle</span>
        <h2 className="inf-sec">Perfil por competencia</h2>
        <div className="bf-bars" style={{ marginTop: 12 }}>
          {dims.map((c) => (
            <div className="bf-bar" key={c.nombre}>
              <label><span>{c.nombre}</span><b style={{ color: colorScore(c.puntuacion) }}>{c.puntuacion} · {c.label}</b></label>
              <div className="bf-track"><i style={{ width: `${(parseFloat(c.puntuacion) / 5) * 100}%`, background: colorScore(c.puntuacion) }} /></div>
            </div>
          ))}
        </div>
      </div></div>

      {/* DESCRIPCIÓN POR COMPETENCIA */}
      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Interpretación</span>
        <h2 className="inf-sec">Qué significa cada competencia</h2>
        {dims.map((c) => (
          <div key={c.nombre} style={{ borderLeft: `4px solid ${colorScore(c.puntuacion)}`, background: '#f9fafb', borderRadius: 8, padding: '12px 15px', marginBottom: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--tinta)', marginBottom: 3 }}>{c.nombre} <span style={{ fontWeight: 700, color: colorScore(c.puntuacion) }}>· {c.label} ({c.puntuacion})</span></div>
            <div style={{ fontSize: 13, color: '#555', lineHeight: 1.55 }}>{c.descripcion}</div>
          </div>
        ))}
      </div></div>

      {/* SÍNTESIS */}
      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Síntesis</span>
        <h2 className="inf-sec">Fortalezas y áreas a desarrollar</h2>
        <h3 style={{ fontSize: 14, color: '#0f9d6b', margin: '10px 0 6px' }}>Fortalezas</h3>
        <Lista v={sin.fortalezas} vacio="No se destacan competencias claramente por encima del resto." />
        <h3 style={{ fontSize: 14, color: '#c0392b', margin: '16px 0 6px' }}>Áreas a desarrollar</h3>
        <Lista v={sin.debilidades} vacio="No se identifican competencias por debajo del umbral de desarrollo." />
      </div></div>

      <div className="inf-sheet inf-foot"><b>ONE Core Analytics</b><br />Autoevaluación de liderazgo. Resultado determinista. Informe confidencial.</div>
    </div>
  )
}
