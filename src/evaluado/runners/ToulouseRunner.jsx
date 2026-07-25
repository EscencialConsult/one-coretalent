import { useEffect, useMemo, useRef, useState } from 'react'
import Plexus from '../Plexus.jsx'
import { MarcaLogo } from '../marca.jsx'
import { temaEmpresa } from '../brandTheme.js'

// Test de cancelación de Toulouse-Piéron. Grilla de 1600 símbolos (8 tipos); el
// evaluado marca los que coinciden con 2 símbolos de referencia, contra reloj.
// El cálculo es VÁLIDO: se envían la grilla/objetivos reales + las marcas y el
// servidor compara marca por marca (aciertos/errores/omisiones exactos).

const TOTAL = 1600
const COLS = 40
const TIEMPO_SEG = 600 // 10 minutos

// Dibujo de cada tipo de símbolo (viewBox 0 0 24 24).
function Simbolo({ t }) {
  const c = 'currentColor'
  const L = (x1, y1, x2, y2) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="2.4" strokeLinecap="round" />
  switch (t) {
    case 0: return <svg viewBox="0 0 24 24">{L(5, 12, 19, 12)}</svg>
    case 1: return <svg viewBox="0 0 24 24">{L(12, 5, 12, 19)}</svg>
    case 2: return <svg viewBox="0 0 24 24">{L(5, 19, 19, 5)}</svg>
    case 3: return <svg viewBox="0 0 24 24">{L(5, 5, 19, 19)}</svg>
    case 4: return <svg viewBox="0 0 24 24">{L(5, 12, 19, 12)}{L(12, 5, 12, 19)}</svg>
    case 5: return <svg viewBox="0 0 24 24">{L(5, 5, 19, 19)}{L(5, 19, 19, 5)}</svg>
    case 6: return <svg viewBox="0 0 24 24" />
    case 7: return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.6" fill={c} /></svg>
    default: return <svg viewBox="0 0 24 24" />
  }
}

function mmss(s) {
  const m = Math.floor(s / 60), r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

export default function ToulouseRunner({ empresa, onExit, onSubmit, initialAnswers = {}, onProgress }) {
  const [screen, setScreen] = useState('intro') // intro | test | done
  const [count, setCount] = useState(() => (initialAnswers.marcados || []).length)
  const [left, setLeft] = useState(() => Math.max(0, TIEMPO_SEG - (initialAnswers.tiempo_seg || 0)))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const marcadosRef = useRef(new Set(initialAnswers.marcados || []))
  const gridWrapRef = useRef(null)
  // Columnas responsivas: en el celular usamos menos columnas para que las celdas sean
  // más grandes y fáciles de tocar. El scoring va por índice, así que no lo afecta.
  const [cols, setCols] = useState(() => (typeof window !== 'undefined' && window.innerWidth <= 560 ? 16 : COLS))
  useEffect(() => {
    const onR = () => setCols(window.innerWidth <= 560 ? 16 : COLS)
    window.addEventListener('resize', onR)
    return () => window.removeEventListener('resize', onR)
  }, [])

  // Grilla y objetivos: se generan una sola vez al montar (no cambian durante el test).
  const { grid, objetivos } = useMemo(() => {
    if (initialAnswers.grid?.length === TOTAL && initialAnswers.objetivos?.length === 2) {
      return { grid: initialAnswers.grid, objetivos: initialAnswers.objetivos }
    }
    const g = new Array(TOTAL)
    for (let i = 0; i < TOTAL; i++) g[i] = Math.floor(Math.random() * 8)
    const a = Math.floor(Math.random() * 8)
    let b = Math.floor(Math.random() * 8)
    while (b === a) b = Math.floor(Math.random() * 8)
    return { grid: g, objetivos: [a, b] }
  }, [initialAnswers.grid, initialAnswers.objetivos])

  // Temporizador (solo mientras se rinde).
  useEffect(() => {
    if (screen !== 'test') return
    if (left <= 0) { finalizar(); return }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [screen, left]) // eslint-disable-line react-hooks/exhaustive-deps

  function volver() {
    if (screen === 'test' && !window.confirm('¿Salir del test? Se perderá el avance.')) return
    if (onExit) onExit()
  }

  // Delegación: un solo handler para las 1600 celdas.
  function onGridClick(e) {
    const btn = e.target.closest('button[data-idx]')
    if (!btn) return
    const idx = Number(btn.dataset.idx)
    const s = marcadosRef.current
    if (s.has(idx)) { s.delete(idx); btn.classList.remove('on'); btn.setAttribute('aria-pressed', 'false') }
    else { s.add(idx); btn.classList.add('on'); btn.setAttribute('aria-pressed', 'true') }
    setCount(s.size)
    if (onProgress) {
      onProgress({
        grid,
        objetivos,
        tiempo_seg: TIEMPO_SEG - left,
        marcados: Array.from(s).sort((x, y) => x - y),
      })
    }
  }

  async function finalizar() {
    if (submitting) return
    if (screen === 'test' && left > 0 && !window.confirm('¿Terminar la prueba ahora?')) return
    setSubmitting(true)
    const objetivo_indices = []
    for (let i = 0; i < TOTAL; i++) if (grid[i] === objetivos[0] || grid[i] === objetivos[1]) objetivo_indices.push(i)
    const payload = {
      tiempo_seg: TIEMPO_SEG - left,
      objetivo_indices,
      marcados: Array.from(marcadosRef.current).sort((x, y) => x - y),
    }
    try {
      if (onSubmit) await onSubmit(payload)
      setScreen('done')
    } catch (e) {
      setError(e.message); setScreen('done')
    } finally {
      setSubmitting(false)
    }
  }

  // Celdas: se construyen una sola vez (no dependen del marcado, que se togglea por DOM).
  const celdas = useMemo(() => grid.map((t, i) => (
    <button key={i} data-idx={i} className={'tp-cell' + (marcadosRef.current.has(i) ? ' on' : '')} type="button" aria-label={`Símbolo ${i + 1}`} aria-pressed={marcadosRef.current.has(i)}><Simbolo t={t} /></button>
  )), [grid])

  return (
    <div className="app" style={temaEmpresa(empresa)}>
      <Plexus />
      <nav className="topnav">
        <div className="brand"><MarcaLogo emp={empresa} /></div>
        {screen !== 'done' && <button className="btn ghost" onClick={volver}>← Volver</button>}
      </nav>

      <div className="wrap tp-wrap">
        {screen === 'intro' && (
          <section className="card hero">
            <span className="badge">PRUEBA ASIGNADA</span>
            <h1>Test de Atención <b>· Toulouse-Piéron</b></h1>
            <p className="sub">Vas a ver una cuadrícula con muchos símbolos. Tenés que <b>marcar todos los que coincidan</b> con los <b>2 símbolos de referencia</b>, lo más rápido y preciso que puedas.</p>
            <div className="meta">
              <div className="chip"><span className="dot" style={{ background: 'var(--rosa)' }} /> <b>{TOTAL}</b>&nbsp;cuadrados</div>
              <div className="chip"><span className="dot" style={{ background: 'var(--cian)' }} /> {mmss(TIEMPO_SEG)} min de tiempo</div>
            </div>
            <div className="instr">
              <div className="it"><span className="ic">1</span> Marcá con un clic (o toque) cada cuadrado que coincida con alguno de los 2 símbolos de referencia.</div>
              <div className="it"><span className="ic">2</span> Trabajá en orden, de izquierda a derecha y de arriba hacia abajo, sin saltear.</div>
              <div className="it"><span className="ic">3</span> Priorizá la precisión, pero avanzá rápido: el tiempo cuenta.</div>
            </div>
            <div className="tp-refs" style={{ margin: '4px 0 22px' }}>
              <span className="tp-refs-lbl">Símbolos a marcar:</span>
              <span className="tp-ref"><Simbolo t={objetivos[0]} /></span>
              <span className="tp-ref"><Simbolo t={objetivos[1]} /></span>
            </div>
            <button className="btn prim big" onClick={() => { setLeft(TIEMPO_SEG); setScreen('test') }}>Comenzar la prueba →</button>
          </section>
        )}

        {screen === 'test' && (
          <>
            <div className="card tp-bar">
              <div className="tp-refs">
                <span className="tp-refs-lbl">Marcá:</span>
                <span className="tp-ref"><Simbolo t={objetivos[0]} /></span>
                <span className="tp-ref"><Simbolo t={objetivos[1]} /></span>
              </div>
              <div className="tp-stats">
                <span className="tp-count">{count} marcados</span>
                <span className={'tp-timer' + (left <= 60 ? ' low' : '')}>⏱ {mmss(left)}</span>
                <button className="btn prim" disabled={submitting} onClick={finalizar}>{submitting ? 'Procesando…' : 'Finalizar'}</button>
              </div>
            </div>
            <div className="tp-scroll">
              <div className="tp-grid" ref={gridWrapRef} onClick={onGridClick} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {celdas}
              </div>
            </div>
          </>
        )}

        {screen === 'done' && (
          <>
            <section className="card hero">
              <div className="finok">✓</div>
              <h1 style={{ fontSize: '30px', marginTop: '14px' }}>¡Listo!</h1>
              <p className="sub">Completaste el <b>Test de Toulouse-Piéron</b>. Gracias por tu concentración.</p>
              {error && <div className="login-error" style={{ marginTop: 12 }}>Hubo un problema al guardar: {error}</div>}
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
