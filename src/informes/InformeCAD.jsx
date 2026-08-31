// Informe CAD (Cuestionario de Afrontamiento del Dolor). Datos deterministas del motor:
// 6 estrategias (total, máx, %, normalizado 0-4) + ranking top/bottom. El CAD NO tiene
// puntos de corte: la comparación es relativa (ipsativa), nunca diagnóstica. Sin IA.

const ORDEN = ['Religión', 'Catarsis', 'Distracción', 'Autocontrol mental', 'Autoafirmación', 'Búsqueda de información']
const ALFAS = [
  ['Religión', '0.94'], ['Catarsis', '0.88'], ['Distracción', '0.82'],
  ['Autocontrol mental', '0.81'], ['Autoafirmación', '0.79'], ['Búsqueda de información', '0.77'],
]
const num = (x) => Number(x || 0).toFixed(2)

import FichaTest from './FichaTest.jsx'

export default function InformeCAD({ data }) {
  const d = data.datos || {}
  const ev = data.evaluado
  const marca = data.empresa
  const fecha = data.created_at ? new Date(data.created_at).toLocaleDateString('es-AR') : ''
  const escalas = d.escalas || {}
  const filas = ORDEN.filter((k) => escalas[k]).map((k) => ({ nombre: k, ...escalas[k] }))
  const top = d.ranking?.top || []
  const bottom = d.ranking?.bottom || []

  return (
    <div className="inf-doc">
      {/* PORTADA */}
      <div className="inf-sheet">
        <div className="inf-cover">
          <div className="top">
            <span className="brand">{marca?.logo_url ? <img className="inf-logo" src={marca.logo_url} alt={marca.razon_social} /> : (marca?.razon_social || 'ONE')}</span>
            <span className="badge">Informe confidencial</span>
          </div>
          <h1>CAD · Afrontamiento del Dolor</h1>
          <div className="st">Estrategias de afrontamiento del dolor crónico · 31 ítems (Soriano y Monsalve)</div>
        </div>
        <div className="inf-who">
          <div><div className="k">Evaluado/a</div><div className="v">{ev ? `${ev.nombre} ${ev.apellido}` : '—'}</div></div>
          <div><div className="k">Fecha</div><div className="v">{fecha}</div></div>
          <div><div className="k">Ítems</div><div className="v">31 · escala 0–4</div></div>
        </div>
      </div>

      <FichaTest slug={data.test_slug} />

      {/* DESCRIPCIÓN */}
      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Lectura recomendada</span>
        <h2 className="inf-sec">Descripción</h2>
        <p className="inf-tx">Cuestionario autoadministrado que detecta las <b>estrategias de afrontamiento</b> del dolor crónico (31 ítems). Se presentan las puntuaciones por estrategia en total y <b>normalizado (0 a 4)</b>. La puntuación normalizada es la más útil para comparar escalas con distinto número de ítems.</p>
        <div className="ee-note" style={{ marginTop: 10 }}>El CAD <b>no tiene puntos de corte oficiales</b>: el análisis es <b>relativo</b> (qué estrategias predominan en la misma persona), nunca un diagnóstico ni una medida de la intensidad del dolor.</div>
      </div></div>

      {/* RESULTADOS POR ESTRATEGIA */}
      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Resultado</span>
        <h2 className="inf-sec">Resultados por estrategia</h2>
        <div className="bf-bars" style={{ marginTop: 12 }}>
          {filas.map((f) => (
            <div className="bf-bar" key={f.nombre}>
              <label>
                <span>{f.icono ? `${f.icono} ` : ''}{f.nombre}</span>
                <b>{num(f.avg)} <span style={{ fontWeight: 600, color: 'var(--muted)' }}>/ 4</span></b>
              </label>
              <div className="bf-track"><i style={{ width: `${(Number(f.avg || 0) / 4) * 100}%`, background: f.color || 'linear-gradient(135deg,#4d248f,#6be1e3)' }} /></div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>{f.foco} · Total {f.total}/{f.max} ({f.pct}%)</div>
            </div>
          ))}
        </div>
      </div></div>

      {/* SÍNTESIS */}
      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Síntesis (sin puntos de corte)</span>
        <h2 className="inf-sec">Perfil relativo</h2>
        <p className="inf-tx">Qué estrategias aparecen más disponibles o preferidas frente al dolor o el estrés.</p>
        <div className="inf-two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 8 }}>
          <div style={{ border: '1px solid var(--linea)', borderRadius: 12, padding: 14 }}>
            <h3 style={{ fontSize: 14, color: 'var(--brand-acento)', margin: '0 0 8px' }}>Estrategias más altas</h3>
            <ul className="inf-nolist">{top.map((t) => <li key={t.key}><span className="ok" style={{ color: 'var(--brand-acento)', fontWeight: 800, flex: 'none' }}>›</span> {t.key} — <b>{num(t.avg)}</b>/4</li>)}</ul>
            <p className="inf-tx" style={{ fontSize: 12.5, marginTop: 6 }}>Las más utilizadas o accesibles en el repertorio actual.</p>
          </div>
          <div style={{ border: '1px solid var(--linea)', borderRadius: 12, padding: 14 }}>
            <h3 style={{ fontSize: 14, color: 'var(--brand-acento)', margin: '0 0 8px' }}>Estrategias más bajas</h3>
            <ul className="inf-nolist">{bottom.map((t) => <li key={t.key}><span className="ok" style={{ color: 'var(--muted)', fontWeight: 800, flex: 'none' }}>›</span> {t.key} — <b>{num(t.avg)}</b>/4</li>)}</ul>
            <p className="inf-tx" style={{ fontSize: 12.5, marginTop: 6 }}>No implica “déficit”: puede indicar menor preferencia, menor utilidad percibida o menor entrenamiento en esa respuesta.</p>
          </div>
        </div>
      </div></div>

      <div className="inf-sheet inf-foot"><b>ONE Core Analytics</b><br />Resultado determinista del cuestionario. El CAD no establece puntos de corte oficiales; la comparación es relativa. Informe confidencial.</div>
    </div>
  )
}
