import { useEffect, useRef, useState } from 'react'
import Plexus from '../Plexus.jsx'
import Loader from '../RunnerLoader.jsx'
import { getPreguntas, calcular } from '../api.js'
import { MarcaLogo } from '../marca.jsx'
import { temaEmpresa } from '../brandTheme.js'

const completa = (a) => a && a.mas != null && a.menos != null && a.mas !== a.menos

export default function KuderRunner({ slug, empresa, onExit, onSubmit }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [screen, setScreen] = useState('intro') // intro | test | done
  const [idx, setIdx] = useState(0)
  const [ans, setAns] = useState({}) // {n: {mas, menos}}
  const [submitting, setSubmitting] = useState(false)
  const [aviso, setAviso] = useState(false)
  const finishedRef = useRef(false)

  useEffect(() => {
    getPreguntas(slug).then(setData).catch((e) => setError(e.message))
  }, [slug])

  if (error) return <Centro><div className="card pad">⚠️ {error}</div></Centro>
  if (!data) return <Centro><Loader label="Cargando test…" /></Centro>

  const triadas = data.triadas
  const total = triadas.length
  const t = triadas[idx]
  const cur = ans[t.n] || { mas: null, menos: null }
  const respondidas = Object.values(ans).filter(completa).length

  function volver() {
    if (screen === 'test' && !window.confirm('¿Salir del test? Tus respuestas no se guardarán.')) return
    if (onExit) onExit()
  }

  function pick(kind, i) {
    let mas = cur.mas
    let menos = cur.menos
    if (kind === 'mas') {
      mas = mas === i ? null : i
      if (menos === i) menos = null
    } else {
      menos = menos === i ? null : i
      if (mas === i) mas = null
    }
    const val = { mas, menos }
    setAns((prev) => ({ ...prev, [t.n]: val }))
    setAviso(false)
    if (completa(val) && idx < total - 1) setTimeout(() => setIdx((x) => x + 1), 200)
  }

  function irPrimeraPendiente() {
    const i = triadas.findIndex((tr) => !completa(ans[tr.n]))
    if (i >= 0) setIdx(i)
    setAviso(false)
  }

  async function finalizar() {
    if (respondidas < total) {
      setAviso(true)
      return
    }
    if (finishedRef.current) return
    finishedRef.current = true
    setSubmitting(true)
    try {
      if (onSubmit) await onSubmit(ans)
      else await calcular(slug, ans) // motor real; el evaluado solo ve el cierre
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
            <h1>Test de Kuder <b>· Preferencias Vocacionales</b></h1>
            <p className="sub">Orientación vocacional por elección forzada. En cada grupo de 3 actividades elegís la que te gusta <b>más</b> y la que te gusta <b>menos</b>.</p>
            <div className="meta">
              <div className="chip"><span className="dot" style={{ background: 'var(--rosa)' }} /> <b>{total}</b>&nbsp;grupos</div>
              <div className="chip"><span className="dot" style={{ background: 'var(--cian)' }} /> elegí + y −</div>
            </div>
            <div className="instr">
              <div className="it"><span className="ic">1</span> En cada grupo verás 3 actividades.</div>
              <div className="it"><span className="ic">2</span> Marcá <b>“Me gusta más”</b> en una y <b>“Me gusta menos”</b> en otra (deben ser distintas).</div>
              <div className="it"><span className="ic">3</span> No hay respuestas correctas; respondé según tus preferencias reales.</div>
            </div>
            <button className="btn prim big" onClick={() => { setIdx(0); setScreen('test') }}>Comenzar la prueba →</button>
          </section>
        )}

        {/* ---------- TEST ---------- */}
        {screen === 'test' && (
          <>
            <div className="card runhead">
              <div className="r1">
                <span className="en"><span className="pulse" /> EN CURSO</span>
                <span className="qcount">{respondidas}/{total} respondidas</span>
              </div>
              <h2>Test de Kuder</h2>
              <div className="progress"><i style={{ width: `${(respondidas / total) * 100}%` }} /></div>
              <div className="r3"><span>Grupo {idx + 1} de {total}</span><span className="pct">{Math.round((respondidas / total) * 100)}%</span></div>
            </div>

            <div className="card qcard">
              <div className="qtag">¿Cuál te gusta MÁS y cuál MENOS?</div>
              <div className="triada">
                {t.actividades.map((act, i) => {
                  const estado = cur.mas === i ? 'mas' : cur.menos === i ? 'menos' : ''
                  return (
                    <div key={i} className={'tract' + (estado ? ' ' + estado : '')}>
                      <span className="txt">{act}</span>
                      <span className="picks">
                        <button className={'pick mas' + (cur.mas === i ? ' on' : '')} onClick={() => pick('mas', i)}>♥ Más</button>
                        <button className={'pick menos' + (cur.menos === i ? ' on' : '')} onClick={() => pick('menos', i)}>✕ Menos</button>
                      </span>
                    </div>
                  )
                })}
              </div>

              {aviso && (
                <div className="aviso">
                  Te faltan {total - respondidas} grupos por completar.{' '}
                  <a style={{ color: '#4f7a34', fontWeight: 800, textDecoration: 'underline', cursor: 'pointer' }} onClick={irPrimeraPendiente}>Ir al primero pendiente</a>
                </div>
              )}

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
          </>
        )}

        {/* ---------- DONE ---------- */}
        {screen === 'done' && (
          <>
            <section className="card hero">
              <div className="finok">✓</div>
              <h1 style={{ fontSize: '30px', marginTop: '14px' }}>¡Listo!</h1>
              <p className="sub">Completaste el <b>Test de Kuder</b>. Gracias por tu tiempo y honestidad.</p>
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
