// Informe Eneagrama (90 ítems). Datos deterministas del motor: tipo base + alas +
// flechas (integración/desintegración) + interpretación rica por eneatipo. Sin IA.

import FichaTest from './FichaTest.jsx'

function Lista({ v }) {
  if (!Array.isArray(v) || v.length === 0) return null
  return <ul className="inf-nolist">{v.map((x, i) => <li key={i}><span className="ok" style={{ color: 'var(--brand-acento)', fontWeight: 800, flex: 'none' }}>›</span> {x}</li>)}</ul>
}

function Dato({ k, v }) {
  if (!v) return null
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11.5, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, marginBottom: 2 }}>{k}</div>
      <div className="inf-tx" style={{ margin: 0 }}>{v}</div>
    </div>
  )
}

export default function InformeEneagrama({ data }) {
  const d = data.datos || {}
  const ev = data.evaluado
  const marca = data.empresa
  const fecha = data.created_at ? new Date(data.created_at).toLocaleDateString('es-AR') : ''
  const p = d.perfil || {}
  const ranking = d.ranking || []
  const niveles = p.niveles || {}

  return (
    <div className="inf-doc">
      {/* PORTADA */}
      <div className="inf-sheet">
        <div className="inf-cover">
          <div className="top">
            <span className="brand">{marca?.logo_url ? <img className="inf-logo" src={marca.logo_url} alt={marca.razon_social} /> : (marca?.razon_social || 'ONE')}</span>
            <span className="badge">Informe confidencial</span>
          </div>
          <h1>Informe de Eneagrama</h1>
          <div className="st">Perfil de personalidad según los 9 eneatipos</div>
        </div>
        <div className="inf-who">
          <div><div className="k">Evaluado/a</div><div className="v">{ev ? `${ev.nombre} ${ev.apellido}` : '—'}</div></div>
          <div><div className="k">Fecha</div><div className="v">{fecha}</div></div>
          <div><div className="k">Tipo base</div><div className="v">{d.base} · {p.nombre || d.base_nombre}</div></div>
        </div>
      </div>

      <FichaTest slug={data.test_slug} />

      {/* NOTACIÓN + SÍNTESIS */}
      <div className="inf-sheet inf-divider">
        <div className="eb">TU CONFIGURACIÓN</div>
        <h1>{d.notacion || `Tipo ${d.base}`}</h1>
        {p.subtitulo && <div className="st" style={{ marginTop: 6 }}>Eneatipo {d.base} — {p.nombre}: {p.subtitulo}</div>}
      </div>
      {p.descripcion && (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">Tu tipo base</span>
          <h2 className="inf-sec">Eneatipo {d.base} · {p.nombre}</h2>
          <p className="inf-tx">{p.descripcion}</p>
          <div className="inf-two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 24px', marginTop: 8 }}>
            <Dato k="Motivación profunda" v={p.motivacion} />
            <Dato k="Miedo básico" v={p.miedo} />
            <Dato k="Deseo básico" v={p.deseo} />
            <Dato k="Emoción básica" v={p.emocion_basica} />
            <Dato k="Pasión / pecado capital" v={p.pecado_capital} />
            <Dato k="Virtud" v={p.virtud} />
          </div>
        </div></div>
      )}

      {/* RANKING */}
      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Resultado</span>
        <h2 className="inf-sec">Distribución de los 9 eneatipos</h2>
        <p className="inf-tx">Tu <b>tipo base</b> es el de mayor puntaje; sus dos <b>alas</b> lo matizan. El puntaje de cada tipo va de 0 a 100 según tus respuestas.</p>
        <div className="bf-bars" style={{ marginTop: 12 }}>
          {ranking.map((t) => (
            <div className="bf-bar" key={t.tipo}>
              <label>
                <span>{t.tipo}. {t.nombre}{t.rol === 'base' ? ' · Base' : t.rol === 'ala' ? ' · Ala' : ''}</span>
                <b>{t.porcentaje}%</b>
              </label>
              <div className="bf-track"><i style={{ width: `${t.porcentaje}%`, background: t.rol ? 'linear-gradient(135deg,#4d248f,#6be1e3)' : '#c6c9d7' }} /></div>
            </div>
          ))}
        </div>
      </div></div>

      {/* ALAS + FLECHAS */}
      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Dinámica</span>
        <h2 className="inf-sec">Alas y flechas</h2>
        <div className="inf-two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
          {d.ala1 && <Dato k="Ala dominante" v={`Tipo ${d.ala1.tipo} — ${d.ala1.nombre} (${d.ala1.porcentaje}%)`} />}
          {d.ala2 && <Dato k="Ala secundaria" v={`Tipo ${d.ala2.tipo} — ${d.ala2.nombre} (${d.ala2.porcentaje}%)`} />}
          {d.integracion && <Dato k="Integración (crecimiento)" v={`Hacia el Tipo ${d.integracion.tipo} — ${d.integracion.nombre}. En sus mejores momentos, adopta lo sano de este tipo.`} />}
          {d.desintegracion && <Dato k="Desintegración (estrés)" v={`Hacia el Tipo ${d.desintegracion.tipo} — ${d.desintegracion.nombre}. Bajo estrés, puede tomar rasgos de este tipo.`} />}
        </div>
      </div></div>

      {/* FORTALEZAS / ÁREAS */}
      {(p.fortalezas?.length || p.areas_desarrollo?.length) ? (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">Perfil</span>
          <h2 className="inf-sec">Fortalezas y áreas de desarrollo</h2>
          <div className="inf-two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
            <div>
              <h3 style={{ fontSize: 14, color: 'var(--brand-acento)', margin: '6px 0 6px' }}>Fortalezas</h3>
              <Lista v={p.fortalezas} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, color: 'var(--brand-acento)', margin: '6px 0 6px' }}>Áreas de desarrollo</h3>
              <Lista v={p.areas_desarrollo} />
            </div>
          </div>
        </div></div>
      ) : null}

      {/* EN EL TRABAJO / EN EQUIPO */}
      {(p.en_trabajo || p.en_equipo) && (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">Ámbito laboral</span>
          <h2 className="inf-sec">En el trabajo y en equipo</h2>
          {p.en_trabajo && <><h3 style={{ fontSize: 14, color: 'var(--brand-acento)', margin: '10px 0 4px' }}>En el trabajo</h3><p className="inf-tx">{p.en_trabajo}</p></>}
          {p.en_equipo && <><h3 style={{ fontSize: 14, color: 'var(--brand-acento)', margin: '14px 0 4px' }}>En equipo</h3><p className="inf-tx">{p.en_equipo}</p></>}
        </div></div>
      )}

      {/* NIVELES + CAMINO */}
      {(niveles.sano || niveles.promedio || niveles.insano || p.camino_crecimiento) && (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">Desarrollo</span>
          <h2 className="inf-sec">Niveles y camino de crecimiento</h2>
          <Dato k="Nivel sano" v={niveles.sano} />
          <Dato k="Nivel promedio" v={niveles.promedio} />
          <Dato k="Nivel de alerta" v={niveles.insano} />
          {p.camino_crecimiento && <><h3 style={{ fontSize: 14, color: 'var(--brand-acento)', margin: '14px 0 4px' }}>Camino de crecimiento</h3><p className="inf-tx">{p.camino_crecimiento}</p></>}
        </div></div>
      )}

      <div className="inf-sheet inf-foot"><b>ONE Core Analytics</b><br />Resultado determinista del cuestionario. Este informe es confidencial.</div>
    </div>
  )
}
