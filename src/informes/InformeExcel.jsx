// Informe de test de conocimiento (Excel). Puntaje %, desglose por categoría y
// revisión ítem por ítem. Los datos vienen ya calculados del servidor (sin IA).
import FichaTest from './FichaTest.jsx'

const BANDA = {
  excelente: { color: '#0f9d6b', bg: 'rgba(16,185,129,.12)', txt: 'Excelente' },
  muy_bien: { color: '#0f9d6b', bg: 'rgba(16,185,129,.12)', txt: 'Muy bien' },
  bien: { color: '#4f7a34', bg: 'rgba(111,170,70,.22)', txt: 'Aceptable' },
  insuficiente: { color: '#c0392b', bg: 'rgba(192,57,43,.1)', txt: 'Insuficiente' },
}

export default function InformeExcel({ data }) {
  const d = data.datos || {}
  const ev = data.evaluado
  const marca = data.empresa
  const fecha = data.created_at ? new Date(data.created_at).toLocaleDateString('es-AR') : ''
  const banda = BANDA[d.banda] || BANDA.bien
  const cats = d.por_categoria || []
  const rev = d.revision || []

  return (
    <div className="inf-doc">
      {/* PORTADA */}
      <div className="inf-sheet">
        <div className="inf-cover">
          <div className="top">
            <span className="brand">{marca?.logo_url ? <img className="inf-logo" src={marca.logo_url} alt={marca.razon_social} /> : (marca?.razon_social || 'ONE')}</span>
            <span className="badge">Informe confidencial</span>
          </div>
          <h1>Test de Excel{d.nivel ? ` · Nivel ${d.nivel}` : ''}</h1>
          <div className="st">Evaluación de conocimientos de Microsoft Excel</div>
        </div>
        <div className="inf-who">
          <div><div className="k">Evaluado/a</div><div className="v">{ev ? `${ev.nombre} ${ev.apellido}` : '—'}</div></div>
          <div><div className="k">Fecha</div><div className="v">{fecha}</div></div>
          <div><div className="k">Resultado</div><div className="v">{d.correctos}/{d.total} · {d.porcentaje}%</div></div>
        </div>
      </div>

      <FichaTest slug={data.test_slug} />

      {/* PUNTAJE */}
      <div className="inf-sheet"><div className="inf-pad" style={{ textAlign: 'center' }}>
        <span className="inf-eyebrow">Puntuación final</span>
        <div style={{ fontSize: 64, fontWeight: 800, color: 'var(--brand-acento)', lineHeight: 1, margin: '6px 0 2px' }}>{d.porcentaje}%</div>
        <div style={{ fontSize: 15, color: '#555', marginBottom: 12 }}>{d.correctos} de {d.total} respuestas correctas</div>
        <span style={{ display: 'inline-block', fontWeight: 800, fontSize: 13, padding: '7px 16px', borderRadius: 999, color: banda.color, background: banda.bg }}>{banda.txt}</span>
        {d.mensaje && <p className="inf-tx" style={{ marginTop: 14 }}>{d.mensaje}</p>}
      </div></div>

      {/* POR CATEGORÍA */}
      {cats.length > 0 && (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">Detalle</span>
          <h2 className="inf-sec">Rendimiento por categoría</h2>
          <div className="bf-bars" style={{ marginTop: 12 }}>
            {cats.map((c) => (
              <div className="bf-bar" key={c.categoria}>
                <label><span>{c.categoria}</span><b>{c.correctos}/{c.total} · {c.porcentaje}%</b></label>
                <div className="bf-track"><i style={{ width: `${c.porcentaje}%`, background: c.porcentaje >= 50 ? 'linear-gradient(135deg,#4d248f,#6be1e3)' : 'linear-gradient(135deg,#e17bd7,#e4c76a)' }} /></div>
              </div>
            ))}
          </div>
        </div></div>
      )}

      {/* REVISIÓN */}
      {rev.length > 0 && (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">Revisión</span>
          <h2 className="inf-sec">Respuestas pregunta por pregunta</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
            {rev.map((r) => (
              <div key={r.n} style={{ borderLeft: `4px solid ${r.es_correcta ? '#10b981' : '#e3556a'}`, background: '#f9fafb', borderRadius: 8, padding: '14px 16px' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: 'var(--tinta)' }}>{r.n}. {r.pregunta}</div>
                {r.es_correcta ? (
                  <div style={{ fontSize: 13.5, color: '#0f9d6b', fontWeight: 600 }}>✓ Respondió correctamente: {r.correcta_texto}</div>
                ) : (
                  <>
                    <div style={{ fontSize: 13.5, color: '#c0392b', fontWeight: 600 }}>✗ Respondió: {r.elegida_texto}</div>
                    <div style={{ fontSize: 13.5, color: '#0f9d6b', fontWeight: 600, marginTop: 2 }}>✓ Correcta: {r.correcta_texto}</div>
                  </>
                )}
                {r.explicacion && <div style={{ fontSize: 12.5, color: '#666', marginTop: 8, fontStyle: 'italic', lineHeight: 1.5 }}>{r.explicacion}</div>}
              </div>
            ))}
          </div>
        </div></div>
      )}

      <div className="inf-sheet inf-foot"><b>ONE Core Analytics</b><br />Puntuación determinista por aciertos. Este informe es confidencial.</div>
    </div>
  )
}
