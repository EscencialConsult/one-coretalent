import { useEffect, useMemo, useState } from 'react'
import Plexus from '../Plexus.jsx'
import Loader from '../RunnerLoader.jsx'
import { getPreguntas } from '../api.js'
import { MarcaLogo } from '../marca.jsx'
import { temaEmpresa } from '../brandTheme.js'

// Runner del Test DISC (elección forzada). Por cada grupo de 4 adjetivos, el evaluado
// elige el que MÁS y el que MENOS lo describe (deben ser distintos). Sin respuestas
// correctas. El servidor calcula el perfil D/I/S/C.

const DIMS = ['D', 'I', 'S', 'C']

export default function DiscRunner({ slug, empresa, onExit, onSubmit }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [screen, setScreen] = useState('intro') // intro | test | done
  const [mas, setMas] = useState({})
  const [menos, setMenos] = useState({})
  const [idx, setIdx] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [aviso, setAviso] = useState(false)

  useEffect(() => {
    getPreguntas(slug).then(setData).catch((e) => setError(e.message))
  }, [slug])

  const grupos = useMemo(() => data?.grupos || [], [data])
  if (error) return <Centro><div className="card pad">⚠️ {error}</div></Centro>
  if (!data) return <Centro><Loader label="Cargando test…" /></Centro>

  const total = grupos.length
  const g = grupos[idx]
  const completas = grupos.filter((x) => mas[x.id] && menos[x.id] && mas[x.id] !== menos[x.id]).length
  const listo = mas[g.id] && menos[g.id] && mas[g.id] !== menos[g.id]

  function volver() {
    if (screen === 'test' && !window.confirm('¿Salir del test? Tus respuestas no se guardarán.')) return
    if (onExit) onExit()
  }

  function elegirMas(dim) {
    setMas((p) => ({ ...p, [g.id]: dim }))
    setMenos((p) => (p[g.id] === dim ? { ...p, [g.id]: undefined } : p)) // no puede ser el mismo
    setAviso(false)
  }
  function elegirMenos(dim) {
    setMenos((p) => ({ ...p, [g.id]: dim }))
    setMas((p) => (p[g.id] === dim ? { ...p, [g.id]: undefined } : p))
    setAviso(false)
  }

  function siguiente() {
    if (!listo) { setAviso(true); return }
    if (idx < total - 1) setIdx((i) => i + 1)
  }

  async function finalizar() {
    if (completas < total) { setAviso(true); return }
    setSubmitting(true)
    const masOut = {}, menosOut = {}
    for (const x of grupos) { masOut[x.id] = mas[x.id]; menosOut[x.id] = menos[x.id] }
    try {
      if (onSubmit) await onSubmit({ mas: masOut, menos: menosOut })
      setScreen('done')
    } catch (e) { setError(e.message) } finally { setSubmitting(false) }
  }

  return (
    <div className="app" style={temaEmpresa(empresa)}>
      <Plexus />
      <nav className="topnav">
        <div className="brand"><MarcaLogo emp={empresa} /></div>
        {screen !== 'done' && <button className="btn ghost" onClick={volver}>← Volver</button>}
      </nav>

      <div className="wrap">
        {screen === 'intro' && (
          <section className="card hero">
            <span className="badge">PRUEBA ASIGNADA</span>
            <h1>Test de Perfil <b>DISC Profesional</b></h1>
            <p className="sub">Vas a ver 28 grupos de 4 características. En cada uno elegí la que <b>MÁS</b> te describe y la que <b>MENOS</b> te describe. No hay respuestas correctas.</p>
            <div className="meta">
              <div className="chip"><span className="dot" style={{ background: 'var(--rosa)' }} /> <b>{total}</b>&nbsp;grupos</div>
              <div className="chip"><span className="dot" style={{ background: 'var(--cian)' }} /> elegí MÁS y MENOS</div>
            </div>
            <div className="instr">
              <div className="it"><span className="ic">1</span> En cada grupo, marcá una característica como “la que MÁS” y otra distinta como “la que MENOS”.</div>
              <div className="it"><span className="ic">2</span> Respondé con sinceridad y espontaneidad; pensá en cómo sos realmente.</div>
              <div className="it"><span className="ic">3</span> No hay respuestas correctas ni incorrectas.</div>
            </div>
            <button className="btn prim big" onClick={() => { setMas({}); setMenos({}); setIdx(0); setScreen('test') }}>Comenzar la prueba →</button>
          </section>
        )}

        {screen === 'test' && (
          <>
            <div className="card runhead">
              <div className="r1">
                <span className="en"><span className="pulse" /> Parte {g.parte} de 2</span>
                <span className="qcount">{completas}/{total} completos</span>
              </div>
              <h2 style={{ fontSize: '18px', margin: '10px 0' }}>Grupo {idx + 1} de {total}</h2>
              <div className="progress"><i style={{ width: `${(completas / total) * 100}%` }} /></div>
            </div>

            <div className="card qcard">
              <span className="qtag" style={{ color: '#0f9d6b', background: 'rgba(16,185,129,.12)', borderColor: 'rgba(16,185,129,.4)' }}>La que MÁS te describe</span>
              <div className="likert" style={{ marginBottom: 22 }}>
                {DIMS.map((d) => (
                  <div key={'m' + d} className={'opt' + (mas[g.id] === d ? ' sel' : '')} onClick={() => elegirMas(d)}>
                    <span className="mark" /> {g[d]}
                  </div>
                ))}
              </div>
              <span className="qtag" style={{ color: '#c0392b', background: 'rgba(192,57,43,.1)', borderColor: 'rgba(192,57,43,.35)' }}>La que MENOS te describe</span>
              <div className="likert">
                {DIMS.map((d) => (
                  <div key={'n' + d} className={'opt' + (menos[g.id] === d ? ' sel' : '')} onClick={() => elegirMenos(d)} style={mas[g.id] === d ? { opacity: .4, pointerEvents: 'none' } : undefined}>
                    <span className="mark" /> {g[d]}
                  </div>
                ))}
              </div>
              {aviso && <div className="aviso">Elegí una opción para MÁS y otra distinta para MENOS{completas < total ? ' en todos los grupos' : ''}.</div>}
              <div className="qnav">
                <button className="btn ghost" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}>← Anterior</button>
                {idx < total - 1 ? (
                  <button className="btn prim" onClick={siguiente}>Siguiente →</button>
                ) : (
                  <button className="btn prim" disabled={submitting} onClick={finalizar}>{submitting ? 'Procesando…' : 'Finalizar prueba →'}</button>
                )}
              </div>
            </div>

            <div className="card navp" style={{ width: '100%' }}>
              <h4><span>GRUPOS</span><span>{completas}/{total}</span></h4>
              <div className="qgrid" style={{ gridTemplateColumns: 'repeat(7,1fr)' }}>
                {grupos.map((x, i) => {
                  const ok = mas[x.id] && menos[x.id] && mas[x.id] !== menos[x.id]
                  return <div key={x.id} className={'qn' + (i === idx ? ' cur' : ok ? ' done' : '')} onClick={() => setIdx(i)}>{i + 1}</div>
                })}
              </div>
            </div>
          </>
        )}

        {screen === 'done' && (
          <>
            <section className="card hero">
              <div className="finok">✓</div>
              <h1 style={{ fontSize: '30px', marginTop: '14px' }}>¡Listo!</h1>
              <p className="sub">Completaste el <b>Test DISC Profesional</b>. Gracias por tu tiempo.</p>
            </section>
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button className="btn prim" onClick={() => onExit && onExit()}>Volver al inicio</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Centro({ children }) {
  return <div className="app"><Plexus /><div className="wrap" style={{ paddingTop: '80px' }}>{children}</div></div>
}
