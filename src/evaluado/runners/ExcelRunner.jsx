import { useEffect, useState } from 'react'
import Plexus from '../Plexus.jsx'
import Loader from '../RunnerLoader.jsx'
import { getPreguntas } from '../api.js'
import { MarcaLogo } from '../marca.jsx'
import { temaEmpresa } from '../brandTheme.js'

// Runner de test de CONOCIMIENTO (quiz de opción múltiple). Sin feedback durante el
// test: la corrección es del lado del servidor y la revisión aparece en el informe.
export default function ExcelRunner({ slug, empresa, onExit, onSubmit }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [screen, setScreen] = useState('intro') // intro | test | done
  const [answers, setAnswers] = useState({})
  const [idx, setIdx] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [aviso, setAviso] = useState(false)

  useEffect(() => {
    getPreguntas(slug).then(setData).catch((e) => setError(e.message))
  }, [slug])

  if (error) return <Centro><div className="card pad">⚠️ {error}</div></Centro>
  if (!data) return <Centro><Loader label="Cargando test…" /></Centro>

  const items = data.items
  const total = items.length
  const q = items[idx]
  const respondidas = Object.keys(answers).length
  const nivel = data.nivel || ''

  function volver() {
    if (screen === 'test' && !window.confirm('¿Salir del test? Tus respuestas no se guardarán.')) return
    if (onExit) onExit()
  }

  function elegir(i) {
    setAnswers((prev) => ({ ...prev, [q.id]: i }))
    setAviso(false)
    if (idx < total - 1) setTimeout(() => setIdx((n) => n + 1), 160)
  }

  async function finalizar() {
    if (respondidas < total) { setAviso(true); return }
    setSubmitting(true)
    try {
      if (onSubmit) await onSubmit(answers)
      setScreen('done')
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app" style={temaEmpresa(empresa)}>
      <Plexus />
      <nav className="topnav">
        <div className="brand"><MarcaLogo emp={empresa} /></div>
        {screen !== 'done' && <button className="btn ghost" onClick={volver}>← Volver</button>}
      </nav>

      <div className="wrap">
        {/* ---------- INTRO ---------- */}
        {screen === 'intro' && (
          <section className="card hero">
            <span className="badge">PRUEBA ASIGNADA</span>
            <h1>Test de <b>Excel</b>{nivel ? ` · ${nivel}` : ''}</h1>
            <p className="sub">Evaluación de conocimientos de Microsoft Excel. A diferencia de otros tests, acá <b>sí hay respuestas correctas</b>. Respondé lo mejor que puedas.</p>
            <div className="meta">
              <div className="chip"><span className="dot" style={{ background: 'var(--rosa)' }} /> <b>{total}</b>&nbsp;preguntas</div>
              <div className="chip"><span className="dot" style={{ background: 'var(--cian)' }} /> opción múltiple</div>
            </div>
            <div className="instr">
              <div className="it"><span className="ic">1</span> Cada pregunta tiene una sola respuesta correcta. Elegí la que creas mejor.</div>
              <div className="it"><span className="ic">2</span> No vas a ver si acertaste durante el test; el resultado lo recibe tu empresa.</div>
              <div className="it"><span className="ic">3</span> Podés navegar entre preguntas y revisar antes de finalizar.</div>
            </div>
            <button className="btn prim big" onClick={() => { setAnswers({}); setIdx(0); setScreen('test') }}>Comenzar la prueba →</button>
          </section>
        )}

        {/* ---------- TEST ---------- */}
        {screen === 'test' && (
          <>
            <div className="card runhead">
              <div className="r1">
                <span className="en"><span className="pulse" /> {q.category || 'Excel'}</span>
                <span className="qcount">{respondidas}/{total} respondidas</span>
              </div>
              <h2 style={{ fontSize: '17px', marginBottom: '10px', color: 'var(--violeta)' }}>Elegí la respuesta correcta</h2>
              <div className="progress"><i style={{ width: `${(respondidas / total) * 100}%` }} /></div>
              <div className="r3"><span>Pregunta {idx + 1} de {total}</span><span className="pct">{Math.round((respondidas / total) * 100)}%</span></div>
            </div>

            <div className="runrow">
              <div className="card qcard">
                <span className="qtag">Pregunta {idx + 1}</span>
                <div className="qtext">{q.question}</div>
                <div className="likert">
                  {q.options.map((opt, i) => (
                    <div
                      key={i}
                      className={'opt' + (answers[q.id] === i ? ' sel' : '')}
                      onClick={() => elegir(i)}
                    >
                      <span className="mark" /> {opt}
                    </div>
                  ))}
                </div>
                {aviso && <div className="aviso">Te faltan {total - respondidas} preguntas por responder.</div>}
                <div className="qnav">
                  <button className="btn ghost" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}>← Anterior</button>
                  {idx < total - 1 ? (
                    <button className="btn prim" onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}>Siguiente →</button>
                  ) : (
                    <button className="btn prim" disabled={submitting} onClick={finalizar}>
                      {submitting ? 'Procesando…' : 'Finalizar prueba →'}
                    </button>
                  )}
                </div>
              </div>

              <div className="card navp">
                <h4><span>NAVEGACIÓN</span><span>{respondidas}/{total}</span></h4>
                <div className="qgrid">
                  {items.map((it, i) => (
                    <div
                      key={it.id}
                      className={'qn' + (i === idx ? ' cur' : answers[it.id] !== undefined ? ' done' : '')}
                      onClick={() => setIdx(i)}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="navleg">
                  <span><i style={{ background: 'var(--grad)' }} /> Actual</span>
                  <span><i style={{ background: 'rgba(79,173,209,.4)' }} /> Respondida</span>
                  <span><i style={{ background: '#fff', border: '1.5px solid var(--linea)' }} /> Pendiente</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ---------- DONE ---------- */}
        {screen === 'done' && (
          <>
            <section className="card hero">
              <div className="finok">✓</div>
              <h1 style={{ fontSize: '30px', marginTop: '14px' }}>¡Listo!</h1>
              <p className="sub">Completaste el <b>Test de Excel{nivel ? ` · ${nivel}` : ''}</b>. Gracias por tu tiempo.</p>
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
