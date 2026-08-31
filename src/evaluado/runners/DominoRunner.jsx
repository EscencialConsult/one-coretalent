import { useEffect, useMemo, useRef, useState } from 'react'
import Plexus from '../Plexus.jsx'
import Loader from '../RunnerLoader.jsx'
import { getPreguntas, calcular } from '../api.js'
import { MarcaLogo } from '../marca.jsx'
import { temaEmpresa } from '../brandTheme.js'

// Posición de los puntos (pips) por número, en % dentro de cada mitad de la ficha.
const PIP_POS = {
  0: [],
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 28], [72, 28], [28, 50], [72, 50], [28, 72], [72, 72]],
}

const TIEMPO_SEG = 25 * 60 // 25 minutos (tiempo oficial del D-48)

function Half({ n }) {
  return (
    <div className="dom-half">
      {(PIP_POS[n] || []).map(([l, t], i) => (
        <span key={i} className="pip" style={{ left: l + '%', top: t + '%' }} />
      ))}
    </div>
  )
}

function Ficha({ tile, small }) {
  return (
    <div className={'domino' + (small ? ' sm' : '')}>
      <Half n={tile[0]} />
      <Half n={tile[1]} />
    </div>
  )
}

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const eqTile = (a, b) => a && b && a[0] === b[0] && a[1] === b[1]

export default function DominoRunner({ slug, empresa, onExit, onSubmit, initialAnswers = {}, onProgress }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [screen, setScreen] = useState('intro') // intro | practica | test | done

  // práctica
  const [pIdx, setPIdx] = useState(0)
  const [pFb, setPFb] = useState(null) // {ok, expl}

  // test real
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState(initialAnswers) // {id: [pip,pip]}
  const [left, setLeft] = useState(TIEMPO_SEG)
  const [submitting, setSubmitting] = useState(false)
  const [aviso, setAviso] = useState(false)
  const finishedRef = useRef(false)

  useEffect(() => {
    getPreguntas(slug).then(setData).catch((e) => setError(e.message))
  }, [slug])

  // Opciones de práctica barajadas una vez (las reales ya vienen barajadas del backend).
  const practica = data?.practica || []
  const pOpts = useMemo(
    () => practica.map((p) => shuffle(p.opciones)),
    [data] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Timer del test real.
  useEffect(() => {
    if (screen !== 'test') return
    if (left <= 0) {
      finalizar()
      return
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [screen, left]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (screen === 'test' && onProgress) onProgress(answers)
  }, [answers, onProgress, screen])

  if (error) return <Centro><div className="card pad">⚠️ {error}</div></Centro>
  if (!data) return <Centro><Loader label="Cargando test…" /></Centro>

  const items = data.items
  const total = items.length
  const respondidas = Object.keys(answers).length
  const q = items[idx]

  function volver() {
    if (screen === 'test' || screen === 'practica') {
      if (!window.confirm('¿Salir del test? Tus respuestas no se guardarán.')) return
    }
    if (onExit) onExit()
  }

  // ---------- PRÁCTICA ----------
  function elegirPractica(tile) {
    if (pFb?.ok) return // ya acertó, esperando avanzar
    const correcta = practica[pIdx].respuesta
    const ok = eqTile(tile, correcta)
    setPFb({ ok, expl: practica[pIdx].explicacion, tile })
  }
  function siguientePractica() {
    if (pIdx < practica.length - 1) {
      setPIdx((i) => i + 1)
      setPFb(null)
    } else {
      // arrancar test real
      setIdx(0)
      setAnswers(initialAnswers)
      setLeft(TIEMPO_SEG)
      setScreen('test')
    }
  }

  // ---------- TEST REAL ----------
  function elegir(tile) {
    setAnswers((prev) => ({ ...prev, [q.id]: tile }))
    setAviso(false)
    if (idx < total - 1) setTimeout(() => setIdx((i) => i + 1), 200)
  }

  async function finalizar() {
    if (finishedRef.current) return
    // si quedan sin responder y aún hay tiempo, avisar una vez (salvo que se acabe el tiempo)
    if (left > 0 && respondidas < total) {
      setAviso(true)
      return
    }
    finishedRef.current = true
    setSubmitting(true)
    try {
      if (onSubmit) await onSubmit(answers)
      else await calcular(slug, answers) // el motor real puntúa; el evaluado solo ve el cierre
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
            <h1>Test de Dominó <b>· D-48</b></h1>
            <p className="sub">Prueba de inteligencia no verbal (razonamiento abstracto). Descubrí el patrón lógico de la serie y elegí la ficha que la continúa.</p>
            <div className="meta">
              <div className="chip"><span className="dot" style={{ background: 'var(--rosa)' }} /> <b>48</b>&nbsp;ítems</div>
              <div className="chip"><span className="dot" style={{ background: 'var(--cian)' }} /> 25 minutos</div>
              <div className="chip"><span className="dot" style={{ background: 'var(--oro)' }} /> 6 opciones por ítem</div>
            </div>
            <div className="instr">
              <div className="it"><span className="ic">1</span> Verás una secuencia de fichas con un patrón. Una posición queda con “?”.</div>
              <div className="it"><span className="ic">2</span> Elegí, entre las 6 fichas, la que continúa la serie.</div>
              <div className="it"><span className="ic">3</span> La dificultad aumenta de a poco. Primero hacés 2 ejemplos de práctica.</div>
            </div>
            <button className="btn prim big" onClick={() => { setPIdx(0); setPFb(null); setScreen('practica') }}>
              Comenzar con la práctica →
            </button>
          </section>
        )}

        {/* ---------- PRÁCTICA ---------- */}
        {screen === 'practica' && practica[pIdx] && (
          <>
            <div className="card runhead">
              <div className="r1">
                <span className="en" style={{ color: '#2b6f8c', background: 'rgba(107,225,227,.16)', borderColor: 'rgba(107,225,227,.42)' }}>
                  <span className="pulse" style={{ background: 'var(--cian)' }} /> PRÁCTICA
                </span>
                <span className="qcount">Ejemplo {pIdx + 1} de {practica.length}</span>
              </div>
              <h2>No cuenta para el resultado</h2>
            </div>

            <div className="card qcard">
              <div className="qtag">¿Qué ficha continúa la secuencia?</div>
              <div className="seq">
                {practica[pIdx].secuencia.map((f, i) => <Ficha key={i} tile={f} />)}
                <span className="qmark">?</span>
              </div>
              <div className="optgrid">
                {pOpts[pIdx].map((opt, i) => {
                  const chosen = pFb && eqTile(pFb.tile, opt)
                  const cls = 'optcell' + (chosen ? (pFb.ok ? ' ok' : ' no') : '')
                  return (
                    <button type="button" aria-label={`Elegir ficha ${i + 1}`} key={i} className={cls} onClick={() => elegirPractica(opt)}>
                      <Ficha tile={opt} small />
                    </button>
                  )
                })}
              </div>

              {pFb && (
                <div className={'domfb ' + (pFb.ok ? 'ok' : 'no')}>
                  <b>{pFb.ok ? '✓ ¡Correcto!' : '✕ No es la correcta'}</b>
                  <p>{pFb.expl}</p>
                  {pFb.ok ? (
                    <button className="btn prim" onClick={siguientePractica}>
                      {pIdx < practica.length - 1 ? 'Siguiente ejemplo →' : 'Comenzar el test real →'}
                    </button>
                  ) : (
                    <button className="btn ghost" onClick={() => setPFb(null)}>Intentar de nuevo</button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ---------- TEST ---------- */}
        {screen === 'test' && (
          <>
            <div className="card runhead">
              <div className="r1">
                <span className="en"><span className="pulse" /> EN CURSO</span>
                <span className={'timerbox' + (left <= 60 ? ' low' : '')}>⏱ {fmt(left)}</span>
              </div>
              <h2>Test de Dominó D-48</h2>
              <div className="progress"><i style={{ width: `${(respondidas / total) * 100}%` }} /></div>
              <div className="r3"><span>Ítem {idx + 1} de {total}</span><span className="pct">{respondidas}/{total} respondidas</span></div>
            </div>

            <div className="card qcard">
              <div className="qtag">¿Qué ficha continúa la secuencia?</div>
              <div className="seq">
                {q.secuencia.map((f, i) => <Ficha key={i} tile={f} />)}
                <span className="qmark">?</span>
              </div>
              <div className="optgrid">
                {q.opciones.map((opt, i) => (
                  <button
                    type="button"
                    aria-label={`Elegir ficha ${i + 1}`}
                    key={i}
                    className={'optcell' + (eqTile(answers[q.id], opt) ? ' sel' : '')}
                    onClick={() => elegir(opt)}
                  >
                    <Ficha tile={opt} small />
                  </button>
                ))}
              </div>

              {aviso && <div className="aviso">Te faltan {total - respondidas} ítems. Podés finalizar igual; los no respondidos cuentan como omitidos.</div>}

              <div className="qnav">
                <button className="btn ghost" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}>← Anterior</button>
                {idx < total - 1 ? (
                  <button className="btn prim" onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}>Siguiente →</button>
                ) : (
                  <button className="btn prim" disabled={submitting} onClick={finalizar}>
                    {submitting ? 'Procesando…' : 'Finalizar test →'}
                  </button>
                )}
              </div>
              {idx === total - 1 && aviso && (
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <button className="btn prim" disabled={submitting} onClick={() => { finishedRef.current = false; setAviso(false); finalizarForzado() }}>
                    Finalizar de todos modos →
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ---------- DONE ---------- */}
        {screen === 'done' && (
          <>
            <section className="card hero">
              <div className="finok">✓</div>
              <h1 style={{ fontSize: '30px', marginTop: '14px' }}>¡Listo!</h1>
              <p className="sub">Completaste el <b>Test de Dominó D-48</b>. Gracias por tu tiempo y concentración.</p>
            </section>
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button className="btn prim" onClick={() => onExit && onExit()}>Volver al inicio</button>
            </div>
          </>
        )}
      </div>
    </div>
  )

  // Finalizar aunque queden ítems sin responder (los omitidos cuentan como error).
  async function finalizarForzado() {
    if (finishedRef.current) return
    finishedRef.current = true
    setSubmitting(true)
    try {
      if (onSubmit) await onSubmit(answers)
      else await calcular(slug, answers)
      setScreen('done')
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }
}

function Centro({ children }) {
  return <div className="app"><Plexus /><div className="wrap" style={{ paddingTop: '80px' }}>{children}</div></div>
}
