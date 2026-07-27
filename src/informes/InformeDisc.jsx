// Informe DISC Profesional (Método Cleaver). Datos deterministas del motor: perfil
// D/I/S/C, patrón, natural vs bajo presión, detalle. Sin IA.

import FichaTest from './FichaTest.jsx'

const DIM = {
  D: { nombre: 'Dominancia', color: '#ef4444' },
  I: { nombre: 'Influencia', color: '#f59e0b' },
  S: { nombre: 'Estabilidad', color: '#10b981' },
  C: { nombre: 'Cumplimiento', color: '#3b82f6' },
}
const ORDEN = ['D', 'I', 'S', 'C']

function Lista({ v }) {
  if (!Array.isArray(v)) return v ? <p className="inf-tx">{v}</p> : null
  return <ul className="inf-nolist">{v.map((x, i) => <li key={i}><span style={{ color: 'var(--brand-acento)', fontWeight: 800, flex: 'none' }}>›</span> {x}</li>)}</ul>
}

function EjeCard({ titulo, sub, n, pct, nivel, color }) {
  return (
    <div style={{ flex: '1 1 200px', background: '#f9fafb', border: '1px solid #e6e7ee', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 12, fontWeight: 800, color }}>{titulo}</div>
      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 6 }}>{sub}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 30, fontWeight: 800, color }}>{n}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted)' }}>{pct}%</span>
      </div>
      <div style={{ fontSize: 12, color: '#555' }}>Nivel: <b>{nivel}</b></div>
    </div>
  )
}

export default function InformeDisc({ data }) {
  const d = data.datos || {}
  const ev = data.evaluado
  const marca = data.empresa
  const fecha = data.created_at ? new Date(data.created_at).toLocaleDateString('es-AR') : ''
  const res = d.resumen || {}
  const est = d.estabilidad || {}
  const inten = d.intensidades || {}
  const detalle = d.detalle || []

  return (
    <div className="inf-doc">
      {/* PORTADA */}
      <div className="inf-sheet">
        <div className="inf-cover">
          <div className="top">
            <span className="brand">{marca?.logo_url ? <img className="inf-logo" src={marca.logo_url} alt={marca.razon_social} /> : (marca?.razon_social || 'ONE')}</span>
            <span className="badge">Informe confidencial</span>
          </div>
          <h1>Informe de Perfil Conductual · DISC</h1>
          <div className="st">Basado en el modelo de W. M. Marston — Método Cleaver</div>
        </div>
        <div className="inf-who">
          <div><div className="k">Evaluado/a</div><div className="v">{ev ? `${ev.nombre} ${ev.apellido}` : '—'}</div></div>
          <div><div className="k">Fecha</div><div className="v">{fecha}</div></div>
          <div><div className="k">Perfil</div><div className="v">{d.profileLabel}</div></div>
        </div>
      </div>

      <FichaTest slug={data.test_slug} />

      {/* QUÉ ES / QUÉ NO ES */}
      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Introducción</span>
        <h2 className="inf-sec">Qué es (y qué no es) el DISC</h2>
        <p className="inf-tx">El DISC evalúa <b>tendencias de comportamiento</b> en cuatro dimensiones: <b>Dominancia</b> (cómo respondés a los problemas), <b>Influencia</b> (cómo te relacionás con otros), <b>Estabilidad</b> (cómo respondés al ritmo del entorno) y <b>Cumplimiento</b> (cómo respondés a reglas y procedimientos).</p>
        <div className="inf-callout">No mide inteligencia, aptitudes ni salud mental, y no hay perfiles “buenos” o “malos”: cada estilo tiene fortalezas propias. Refleja tu autopercepción en este momento y es un punto de partida para el desarrollo, no una sentencia.</div>
      </div></div>

      {/* RESUMEN POR EJES */}
      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Resultados</span>
        <h2 className="inf-sec">Resumen: activo vs. reservado</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <EjeCard titulo="MÁS D/I" sub="Activo / Extrovertido" n={res.masDI} pct={res.masDI_pct} nivel={res.nivel_masDI} color="#ef4444" />
          <EjeCard titulo="MÁS S/C" sub="Reservado / Metódico" n={res.masSC} pct={res.masSC_pct} nivel={res.nivel_masSC} color="#10b981" />
          <EjeCard titulo="MENOS D/I" sub="Activo / Extrovertido" n={res.menosDI} pct={res.menosDI_pct} nivel={res.nivel_menosDI} color="#f59e0b" />
          <EjeCard titulo="MENOS S/C" sub="Reservado / Metódico" n={res.menosSC} pct={res.menosSC_pct} nivel={res.nivel_menosSC} color="#3b82f6" />
        </div>
        <p className="inf-tx" style={{ marginTop: 12, fontSize: 13, color: 'var(--muted)' }}>En cada uno de los 28 grupos elegiste la característica que MÁS y la que MENOS te describe. “MÁS” indica identificación; “MENOS”, rechazo.</p>
      </div></div>

      {/* BARRAS D/I/S/C */}
      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Perfil</span>
        <h2 className="inf-sec">Intensidad por dimensión</h2>
        <div className="bf-bars" style={{ marginTop: 12 }}>
          {ORDEN.map((k) => (
            <div className="bf-bar" key={k}>
              <label><span>{k} · {DIM[k].nombre}</span><b style={{ color: DIM[k].color }}>{inten[k]} · neto {d.netoScores?.[k] > 0 ? '+' : ''}{d.netoScores?.[k]}</b></label>
              <div className="bf-track"><i style={{ width: `${inten[k]}%`, background: DIM[k].color }} /></div>
            </div>
          ))}
        </div>
        <p className="inf-tx" style={{ marginTop: 10, fontSize: 13, color: 'var(--muted)' }}>La barra muestra la intensidad relativa de cada dimensión; el “neto” es MÁS − MENOS (un neto positivo indica una tendencia que asumís, uno negativo una que rechazás).</p>
      </div></div>

      {/* PERFIL DOMINANTE */}
      <div className="inf-sheet inf-divider"><div className="eb">TU PERFIL</div><h1>{d.profileLabel}</h1></div>
      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Perfil conductual dominante</span>
        <h2 className="inf-sec">{d.patron_tipo}{d.pattern && !d.isBalanced ? ` · ${d.pattern}` : ''}</h2>
        {d.profileDescription && <p className="inf-tx">{d.profileDescription}</p>}
        {d.fortalezas && <><h3 style={{ fontSize: 14, color: 'var(--brand-acento)', margin: '14px 0 6px' }}>Fortalezas y características</h3><Lista v={d.fortalezas} /></>}
        <div className="inf-two" style={{ marginTop: 14 }}>
          {d.ambienteIdeal && <div><h3 style={{ fontSize: 13.5, color: 'var(--brand-acento)', marginBottom: 4 }}>Ambiente ideal</h3><p className="inf-tx" style={{ fontSize: 13.5 }}>{d.ambienteIdeal}</p></div>}
          {d.comunicacion && <div><h3 style={{ fontSize: 13.5, color: 'var(--brand-acento)', marginBottom: 4 }}>Comunicación</h3><p className="inf-tx" style={{ fontSize: 13.5 }}>{d.comunicacion}</p></div>}
        </div>
        {d.estiloTrabajo && <><h3 style={{ fontSize: 13.5, color: 'var(--brand-acento)', margin: '10px 0 4px' }}>Estilo de trabajo</h3><p className="inf-tx" style={{ fontSize: 13.5 }}>{d.estiloTrabajo}</p></>}
      </div></div>

      {/* ESTABILIDAD PARTE I vs II */}
      {est.parte1 && (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">Consistencia</span>
          <h2 className="inf-sec">Estilo natural vs. bajo presión ({est.nivel})</h2>
          <p className="inf-tx">La Parte I refleja tu estilo natural; la Parte II, tu comportamiento bajo presión. {est.texto}</p>
          <div style={{ overflowX: 'auto', marginTop: 10 }}>
            <table className="inf-table">
              <thead><tr><th>Parte</th><th>MÁS D/I</th><th>MÁS S/C</th><th>MENOS D/I</th><th>MENOS S/C</th></tr></thead>
              <tbody>
                <tr><td className="dn">Parte I (natural)</td><td>{est.parte1.masDI}</td><td>{est.parte1.masSC}</td><td>{est.parte1.menosDI}</td><td>{est.parte1.menosSC}</td></tr>
                <tr><td className="dn">Parte II (bajo presión)</td><td>{est.parte2.masDI}</td><td>{est.parte2.masSC}</td><td>{est.parte2.menosDI}</td><td>{est.parte2.menosSC}</td></tr>
              </tbody>
            </table>
          </div>
          <p className="inf-tx" style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>Diferencia total: {est.dif_total} puntos.</p>
        </div></div>
      )}

      {/* DETALLE PREGUNTA POR PREGUNTA */}
      {detalle.length > 0 && (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">Detalle</span>
          <h2 className="inf-sec">Respuesta grupo por grupo</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="inf-table">
              <thead><tr><th>Nº</th><th>D</th><th>I</th><th>S</th><th>C</th><th>MÁS</th><th>MENOS</th></tr></thead>
              <tbody>
                {detalle.map((g) => (
                  <tr key={g.id}>
                    <td className="dn">{g.id}</td>
                    {ORDEN.map((k) => (
                      <td key={k} style={g.mas === k ? { background: 'rgba(16,185,129,.14)', fontWeight: 700 } : g.menos === k ? { background: 'rgba(192,57,43,.1)' } : undefined}>{g.adjetivos?.[k]}</td>
                    ))}
                    <td style={{ color: DIM[g.mas]?.color, fontWeight: 800 }}>{g.mas}</td>
                    <td style={{ color: DIM[g.menos]?.color, fontWeight: 800 }}>{g.menos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div></div>
      )}

      <div className="inf-sheet inf-foot"><b>ONE Core Analytics</b><br />El DISC describe tendencias conductuales, no capacidades. Se recomienda una devolución profesional. Informe confidencial.</div>
    </div>
  )
}
