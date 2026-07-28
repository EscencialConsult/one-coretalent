import { useEffect, useState } from 'react'
import Plexus from '../Plexus.jsx'
import Loader from '../RunnerLoader.jsx'
import { getPreguntas, calcular } from '../api.js'
import { MarcaLogo } from '../marca.jsx'
import { temaEmpresa } from '../brandTheme.js'

const PARTE = {
  estado: { n: 'Parte 1 de 2 · Ansiedad Estado', sub: 'Indicá cómo te sentís AHORA MISMO, en este momento.' },
  rasgo: { n: 'Parte 2 de 2 · Ansiedad Rasgo', sub: 'Indicá cómo te sentís GENERALMENTE, en tu vida habitual.' },
}

export default function StaiRunner({ slug, empresa, onExit, onSubmit }) {
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
  const opciones = Object.entries(data.escala[q.tipo]).map(([value, label]) => ({ value, label }))
  const parte = PARTE[q.tipo]

  function volver() {
    if (screen === 'test' && !window.confirm('¿Salir del test? Tus respuestas no se guardarán.')) return
    if (onExit) onExit()
  }

  function elegir(value) {
    setAnswers((prev) => ({ ...prev, [q.id]: value }))
    setAviso(false)
    if (idx < total - 1) setTimeout(() => setIdx((i) => i + 1), 160)
  }

  async function finalizar() {
    if (respondidas < total) {
      setAviso(true)
      return
    }
    setSubmitting(true)
    try {
      if (onSubmit) await onSubmit(answers)
      else await calcular(slug, answers) // el motor real invierte ítems y calcula; el evaluado solo ve el cierre
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
            <h1>Cuestionario de Ansiedad <b>· STAI</b></h1>
            <p className="sub">Tiene dos partes: en la primera respondés cómo te sentís <b>ahora mismo</b>, y en la segunda cómo te sentís <b>generalmente</b>.</p>
            <div className="meta">
              <div className="chip"><span className="dot" style={{ background: 'var(--rosa)' }} /> <b>{total}</b>&nbsp;ítems (20 + 20)</div>
              <div className="chip"><span className="dot" style={{ background: 'var(--cian)' }} /> escala de 4 opciones</div>
            </div>
            <div className="instr">
              <div className="it"><span className="ic">1</span> No hay respuestas correctas ni incorrectas: respondé con sinceridad.</div>
              <div className="it"><span className="ic">2</span> No te detengas mucho en cada frase; elegí lo primero que sientas.</div>
              <div className="it"><span className="ic">3</span> <b>Parte 1:</b> cómo te sentís ahora. <b>Parte 2:</b> cómo te sentís en general.</div>
            </div>
            <button className="btn prim big" onClick={() => { setAnswers({}); setIdx(0); setScreen('test') }}>Comenzar la prueba →</button>
          </section>
        )}

        {/* ---------- TEST ---------- */}
        {screen === 'test' && (
          <>
            <div className="card runhead">
              <div className="r1">
                <span className="en"><span className="pulse" /> {parte.n}</span>
                <span className="qcount">{respondidas}/{total} respondidas</span>
              </div>
              <h2 style={{ fontSize: '17px', marginBottom: '10px', color: 'var(--violeta)' }}>{parte.sub}</h2>
              <div className="progress"><i style={{ width: `${(respondidas / total) * 100}%` }} /></div>
              <div className="r3"><span>Ítem {idx + 1} de {total}</span><span className="pct">{Math.round((respondidas / total) * 100)}%</span></div>
            </div>

            <div className="runrow">
              <div className="card qcard">
                <span className="qtag">{q.tipo === 'estado' ? 'Ahora mismo…' : 'Generalmente…'}</span>
                <div className="qtext">“{q.text}”</div>
                <div className="likert">
                  {opciones.map((o) => (
                    <div
                      key={o.value}
                      className={'opt' + (answers[q.id] === o.value ? ' sel' : '')}
                      onClick={() => elegir(o.value)}
                    >
                      <span className="mark" /> {o.label}
                    </div>
                  ))}
                </div>
                {aviso && <div className="aviso">Te faltan {total - respondidas} ítems por responder.</div>}
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
              <p className="sub">Completaste el <b>Cuestionario STAI</b>. Gracias por tu tiempo y honestidad.</p>
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
