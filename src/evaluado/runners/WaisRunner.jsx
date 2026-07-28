import { useEffect, useMemo, useState } from 'react'
import Plexus from '../Plexus.jsx'
import Loader from '../RunnerLoader.jsx'
import { getPreguntas } from '../api.js'
import { MarcaLogo } from '../marca.jsx'
import { temaEmpresa } from '../brandTheme.js'

// Runner del WAIS-IV (screening de opción múltiple, 2 partes). Sin feedback durante:
// la corrección es del lado del servidor y el informe aparece después.

export default function WaisRunner({ slug, empresa, onExit, onSubmit }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [screen, setScreen] = useState('intro') // intro | test | done
  const [answers, setAnswers] = useState({}) // clave "parte-id" -> letra
  const [idx, setIdx] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [aviso, setAviso] = useState(false)

  useEffect(() => {
    getPreguntas(slug).then(setData).catch((e) => setError(e.message))
  }, [slug])

  const items = useMemo(() => {
    if (!data) return []
    const p1 = (data.parte1 || []).map((it) => ({ ...it, parte: 1 }))
    const p2 = (data.parte2 || []).map((it) => ({ ...it, parte: 2 }))
    return [...p1, ...p2]
  }, [data])

  if (error) return <Centro><div className="card pad">⚠️ {error}</div></Centro>
  if (!data) return <Centro><Loader label="Cargando test…" /></Centro>

  const letras = data.letras || ['a', 'b', 'c', 'd']
  const total = items.length
  const q = items[idx]
  const k = (it) => `${it.parte}-${it.id}`
  const respondidas = Object.keys(answers).length

  function volver() {
    if (screen === 'test' && !window.confirm('¿Salir del test? Tus respuestas no se guardarán.')) return
    if (onExit) onExit()
  }

  function elegir(i) {
    setAnswers((prev) => ({ ...prev, [k(q)]: letras[i] }))
    setAviso(false)
    if (idx < total - 1) setTimeout(() => setIdx((n) => n + 1), 140)
  }

  async function finalizar() {
    if (respondidas < total) { setAviso(true); return }
    setSubmitting(true)
    const parte1 = {}, parte2 = {}
    for (const it of items) {
      const letra = answers[k(it)]
      if (letra == null) continue
      if (it.parte === 1) parte1[it.id] = letra
      else parte2[it.id] = letra
    }
    try {
      if (onSubmit) await onSubmit({ parte1, parte2 })
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
        {screen === 'intro' && (
          <section className="card hero">
            <span className="badge">PRUEBA ASIGNADA</span>
            <h1>Evaluación Cognitiva <b>· WAIS-IV</b></h1>
            <p className="sub">Vas a responder preguntas de razonamiento, vocabulario, memoria y agilidad. A diferencia de otros tests, acá <b>hay respuestas correctas</b>. Respondé lo mejor que puedas.</p>
            <div className="meta">
              <div className="chip"><span className="dot" style={{ background: 'var(--rosa)' }} /> <b>{total}</b>&nbsp;preguntas (2 partes)</div>
              <div className="chip"><span className="dot" style={{ background: 'var(--cian)' }} /> opción múltiple</div>
            </div>
            <div className="instr">
              <div className="it"><span className="ic">1</span> Cada pregunta tiene una sola respuesta correcta. Elegí la mejor opción.</div>
              <div className="it"><span className="ic">2</span> No vas a ver si acertaste durante el test; el resultado lo recibe tu empresa.</div>
              <div className="it"><span className="ic">3</span> Tomate tu tiempo, pero no te detengas demasiado en cada pregunta.</div>
            </div>
            <button className="btn prim big" onClick={() => { setAnswers({}); setIdx(0); setScreen('test') }}>Comenzar la prueba →</button>
          </section>
        )}

        {screen === 'test' && (
          <>
            <div className="card runhead">
              <div className="r1">
                <span className="en"><span className="pulse" /> Parte {q.parte} · {q.subtest || q.indice}</span>
                <span className="qcount">{respondidas}/{total} respondidas</span>
              </div>
              <h2 style={{ fontSize: '17px', marginBottom: '10px', color: 'var(--violeta)' }}>Elegí la respuesta correcta</h2>
              <div className="progress"><i style={{ width: `${(respondidas / total) * 100}%` }} /></div>
              <div className="r3"><span>Pregunta {idx + 1} de {total}</span><span className="pct">{Math.round((respondidas / total) * 100)}%</span></div>
            </div>

            <div className="runrow">
              <div className="card qcard">
                <span className="qtag">{q.indice} · {q.subtest}</span>
                <div className="qtext">{q.text}</div>
                <div className="likert">
                  {q.options.map((opt, i) => (
                    <div key={i} className={'opt' + (answers[k(q)] === letras[i] ? ' sel' : '')} onClick={() => elegir(i)}>
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
                    <button className="btn prim" disabled={submitting} onClick={finalizar}>{submitting ? 'Procesando…' : 'Finalizar prueba →'}</button>
                  )}
                </div>
              </div>

              <div className="card navp">
                <h4><span>NAVEGACIÓN</span><span>{respondidas}/{total}</span></h4>
                <div className="qgrid">
                  {items.map((it, i) => (
                    <div key={k(it)} className={'qn' + (i === idx ? ' cur' : answers[k(it)] !== undefined ? ' done' : '')} onClick={() => setIdx(i)}>{i + 1}</div>
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

        {screen === 'done' && (
          <>
            <section className="card hero">
              <div className="finok">✓</div>
              <h1 style={{ fontSize: '30px', marginTop: '14px' }}>¡Listo!</h1>
              <p className="sub">Completaste la <b>Evaluación Cognitiva</b>. Gracias por tu tiempo.</p>
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
