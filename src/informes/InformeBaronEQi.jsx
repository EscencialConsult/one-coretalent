// Informe Bar-On EQ-i (Inteligencia Emocional). Datos deterministas del motor:
// CE Total + 5 escalas compuestas (con interpretación y características por nivel) +
// 15 subescalas + fortalezas / áreas de oportunidad. Sin IA.

import FichaTest from './FichaTest.jsx'

function kind(nivel) {
  const n = (nivel || '').toUpperCase().replace(/_/g, ' ')
  if (n.includes('ALTO') || n.includes('ALTA')) return 'alto'
  if (n.includes('PROMEDIO') || n.includes('MEDIO')) return 'medio'
  return 'bajo'
}
const COLOR = { alto: '#16a34a', medio: '#d97706', bajo: '#dc2626' }
const fmtNivel = (n) => (n || '').replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\w/g, (c) => c.toUpperCase())

function Pct({ v, nivel }) {
  return <b style={{ color: COLOR[kind(nivel)] }}>{v}% <span style={{ fontWeight: 600, color: 'var(--muted)' }}>· {fmtNivel(nivel)}</span></b>
}

export default function InformeBaronEQi({ data }) {
  const d = data.datos || {}
  const ce = d.ceTotal || {}
  const subMap = d.subescalas || {}
  const compuestas = Object.values(d.compuestas || {})
  const fortalezas = d.fortalezas || []
  const debilidades = d.debilidades || []
  const ev = data.evaluado
  const marca = data.empresa
  const fecha = data.created_at ? new Date(data.created_at).toLocaleDateString('es-AR') : ''
  const ceK = kind(ce.nivel)

  return (
    <div className="inf-doc">
      {/* PORTADA */}
      <div className="inf-sheet">
        <div className="inf-cover">
          <div className="top">
            <span className="brand">{marca?.logo_url ? <img className="inf-logo" src={marca.logo_url} alt={marca.razon_social} /> : (marca?.razon_social || 'ONE')}</span>
            <span className="badge">Informe confidencial</span>
          </div>
          <h1>Informe de Inteligencia Emocional</h1>
          <div className="st">Test Bar-On EQ-i (Emotional Quotient Inventory) · 15 subescalas · 5 componentes</div>
        </div>
        <div className="inf-who">
          <div><div className="k">Evaluado/a</div><div className="v">{ev ? `${ev.nombre} ${ev.apellido}` : '—'}</div></div>
          <div><div className="k">Fecha</div><div className="v">{fecha}</div></div>
          <div><div className="k">Cociente Emocional</div><div className="v" style={{ color: COLOR[ceK] }}>{fmtNivel(ce.nivel)}</div></div>
        </div>
      </div>

      <FichaTest slug={data.test_slug} />

      {/* CE TOTAL */}
      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Resultado global</span>
        <h2 className="inf-sec">Cociente Emocional Total</h2>
        <div style={{ textAlign: 'center', padding: '18px 0 6px' }}>
          <div style={{ fontSize: 46, fontWeight: 800, lineHeight: 1, color: COLOR[ceK] }}>{ce.porcentaje != null ? `${ce.porcentaje}%` : '—'}</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6, color: COLOR[ceK] }}>{fmtNivel(ce.nivel)}</div>
        </div>
      </div></div>

      {/* INTERPRETACIÓN GENERAL */}
      {ce.interpretacion && (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">Lectura</span>
          <h2 className="inf-sec">Interpretación general</h2>
          <p className="inf-tx">{ce.interpretacion}</p>
        </div></div>
      )}

      {/* ANÁLISIS DE ESCALAS COMPUESTAS */}
      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Análisis</span>
        <h2 className="inf-sec">Escalas compuestas (5 componentes)</h2>
      </div></div>

      {compuestas.map((c) => {
        const ck = kind(c.nivel)
        const carac = c.interpretacion?.fortalezas || []
        const subs = (c.subescalas || []).map((code) => ({ code, ...subMap[code] })).filter((s) => s.nombre)
        return (
          <div className="inf-sheet" key={c.nombre}><div className="inf-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <h3 className="inf-sec" style={{ margin: 0 }}>{c.nombre}</h3>
                <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{c.descripcion}</div>
              </div>
              <div style={{ textAlign: 'right', flex: 'none' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: COLOR[ck] }}>{c.porcentaje}%</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLOR[ck] }}>{fmtNivel(c.nivel)}</div>
              </div>
            </div>
            <div className="bf-track" style={{ margin: '10px 0 14px' }}><i style={{ width: `${c.porcentaje}%`, background: COLOR[ck] }} /></div>

            {c.interpretacion?.general && <p className="inf-tx">{c.interpretacion.general}</p>}

            {carac.length > 0 && (
              <>
                <h4 style={{ fontSize: 13, color: COLOR.alto, margin: '12px 0 6px' }}>Características identificadas</h4>
                <ul className="inf-nolist">{carac.map((x, i) => <li key={i}><span className="ok" style={{ color: COLOR.alto, fontWeight: 800, flex: 'none' }}>✓</span> {x}</li>)}</ul>
              </>
            )}

            {subs.length > 0 && (
              <>
                <h4 style={{ fontSize: 13, color: 'var(--brand-acento)', margin: '14px 0 8px' }}>Subescalas componentes</h4>
                <div className="bf-bars">
                  {subs.map((s) => {
                    const sk = kind(s.nivel)
                    return (
                      <div className="bf-bar" key={s.code}>
                        <label><span>{s.nombre}</span><Pct v={s.porcentaje} nivel={s.nivel} /></label>
                        <div className="bf-track"><i style={{ width: `${s.porcentaje}%`, background: COLOR[sk] }} /></div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div></div>
        )
      })}

      {/* FORTALEZAS */}
      {fortalezas.length > 0 && (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">Perfil</span>
          <h2 className="inf-sec">Tus principales fortalezas</h2>
          <p className="inf-tx">Las áreas donde demostrás mayor desarrollo en tu inteligencia emocional.</p>
          <ol style={{ margin: '10px 0 0', paddingLeft: 0, listStyle: 'none' }}>
            {fortalezas.map((f, i) => (
              <li key={f.codigo} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderTop: i ? '1px solid var(--linea)' : 'none' }}>
                <span style={{ flex: 'none', width: 26, height: 26, borderRadius: 8, background: 'var(--brand-acento)', color: '#fff', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                <span style={{ flex: 1, fontWeight: 700 }}>{f.nombre}</span>
                <Pct v={f.porcentaje} nivel={f.nivel} />
              </li>
            ))}
          </ol>
        </div></div>
      )}

      {/* ÁREAS DE OPORTUNIDAD */}
      {debilidades.length > 0 && (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">Desarrollo</span>
          <h2 className="inf-sec">Áreas de oportunidad</h2>
          <p className="inf-tx">Áreas que representan oportunidades de crecimiento y desarrollo. Un puntaje bajo no es un déficit: indica margen de mejora.</p>
          <ul className="inf-nolist" style={{ marginTop: 8 }}>
            {debilidades.map((f) => (
              <li key={f.codigo}><span className="ok" style={{ color: COLOR.bajo, fontWeight: 800, flex: 'none' }}>›</span> <span style={{ flex: 1 }}>{f.nombre}</span> <Pct v={f.porcentaje} nivel={f.nivel} /></li>
            ))}
          </ul>
        </div></div>
      )}

      <div className="inf-sheet inf-foot"><b>ONE Core Analytics</b><br />Resultado determinista del cuestionario. Evaluación estandarizada, parte de un proceso más amplio. Informe confidencial.</div>
    </div>
  )
}
