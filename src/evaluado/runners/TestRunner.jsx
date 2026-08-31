import { useEffect, useMemo, useState } from 'react'
import Plexus from '../Plexus.jsx'
import Loader from '../RunnerLoader.jsx'
import { getPreguntas, calcular } from '../api.js'
import { MarcaLogo } from '../marca.jsx'
import { temaEmpresa } from '../brandTheme.js'

// Metadatos de presentación por test (el cálculo siempre viene del backend).
const META = {
  'big-five': {
    nombre: 'Test de Personalidad Big Five',
    subtitulo: 'IPIP-50',
    instrucciones: [
      'Respondé con sinceridad: no hay respuestas correctas ni incorrectas.',
      'Elegí la opción que mejor te describa, sin pensarlo demasiado.',
    ],
    dimNames: {
      extraversion: 'Extraversión',
      agreeableness: 'Amabilidad',
      conscientiousness: 'Responsabilidad',
      neuroticism: 'Neuroticismo',
      openness: 'Apertura a la Experiencia',
    },
  },
  chaside: {
    nombre: 'Test de Orientación Vocacional CHASIDE',
    subtitulo: '7 áreas',
    instrucciones: [
      'Respondé con sinceridad: no hay respuestas correctas ni incorrectas.',
      'Marcá Sí o No según lo que mejor refleje tus intereses y preferencias.',
    ],
    dimNames: {},
  },
  'dnla-percepcion-personal': {
    nombre: 'DNLA — Personal Insight Profile',
    subtitulo: 'Bienestar y Desarrollo',
    intro: 'Una mirada a tu bienestar integral y desarrollo personal. Respondé con tranquilidad; no hay respuestas correctas.',
    instrucciones: [
      'Respondé con sinceridad: no hay respuestas correctas ni incorrectas.',
      'Elegí la frecuencia que mejor refleje tu situación actual.',
    ],
    dimNames: {
      autopercepcion_autoestima: 'Autopercepción y Autoestima',
      motivacion_proposito: 'Motivación y Propósito',
      adaptabilidad_emocional: 'Adaptabilidad Emocional',
      relaciones_empatia: 'Relaciones y Empatía',
      bienestar_equilibrio: 'Bienestar y Equilibrio',
      crecimiento_personal: 'Crecimiento Personal',
    },
  },
  'gds-15': {
    nombre: 'GDS-15 — Escala de Depresión Geriátrica',
    subtitulo: 'Cribado',
    intro: 'Cuestionario breve sobre cómo te sentiste durante la última semana. Respondé Sí o No según lo que mejor te describa.',
    instrucciones: [
      'Pensá en cómo te sentiste durante la última semana.',
      'Respondé Sí o No con sinceridad; no hay respuestas correctas ni incorrectas.',
    ],
    dimNames: {},
  },
  'ipp-r': {
    nombre: 'IPP-R — Intereses y Preferencias Profesionales',
    subtitulo: 'Orientación vocacional',
    intro: 'Explorá tus intereses hacia 15 campos profesionales. No hay respuestas correctas: indicá cuánto te agrada cada actividad o profesión.',
    escalaLabel: 'No conozco · Desagrado · Indiferencia · Agrado',
    instrucciones: [
      'Para cada ítem indicá tu nivel de agrado: No Conozco, Desagrado, Indiferencia o Agrado.',
      'No hay respuestas correctas ni incorrectas; respondé con sinceridad.',
      'Son 180 ítems: tomate tu tiempo, no es una prueba de velocidad.',
    ],
    dimNames: {},
  },
  'dnla-leadership': {
    nombre: 'DNLA — Liderazgo y Mandos Medios',
    subtitulo: '8 competencias',
    intro: 'Autoevaluación de tu estilo de liderazgo: cómo guiás, motivás y desarrollás personas. Respondé según la frecuencia con que actuás así; no hay respuestas correctas.',
    escalaLabel: 'escala 1–5 (Nunca → Siempre)',
    instrucciones: [
      'Indicá con qué frecuencia actuás como describe cada afirmación (de Nunca a Siempre).',
      'Respondé con sinceridad sobre cómo actuás realmente, no cómo te gustaría actuar.',
      'Son 40 afirmaciones; no hay respuestas correctas ni incorrectas.',
    ],
    dimNames: {
      vision_estrategica: 'Visión Estratégica', comunicacion: 'Comunicación', decision: 'Decisión',
      motivacion: 'Motivación', conflictos: 'Conflictos', resiliencia: 'Resiliencia',
      innovacion: 'Innovación', autogestion: 'Autogestión',
    },
  },
  'baron-eqi': {
    nombre: 'Bar-On EQ-i',
    subtitulo: 'Inteligencia Emocional',
    intro: 'Un cuestionario sobre cómo reconocés, expresás y gestionás tus emociones. No hay respuestas correctas ni incorrectas: respondé según con qué frecuencia te identificás con cada afirmación.',
    escalaLabel: 'escala 1–5 (Nunca → Siempre)',
    instrucciones: [
      'Indicá con qué frecuencia te identificás con cada afirmación (de Nunca a Siempre).',
      'Respondé con sinceridad; no hay respuestas correctas ni incorrectas.',
      'Son 133 afirmaciones; no te detengas demasiado en cada una.',
    ],
    dimNames: {},
  },
  eneagrama: {
    nombre: 'Eneagrama Profesional',
    subtitulo: '9 eneatipos',
    intro: 'Un mapa de tu personalidad según los 9 eneatipos. No hay respuestas correctas ni incorrectas: respondé según con qué frecuencia te identificás con cada afirmación.',
    escalaLabel: 'escala 1–5 (Nunca → Siempre)',
    instrucciones: [
      'Indicá con qué frecuencia te identificás con cada afirmación (de Nunca a Siempre).',
      'Respondé con sinceridad y espontaneidad; no hay respuestas correctas.',
      'Son 90 afirmaciones; no te detengas demasiado en cada una.',
    ],
    dimNames: {},
  },
  cad: {
    nombre: 'CAD — Afrontamiento del Dolor',
    subtitulo: '31 ítems',
    intro: 'Cuestionario sobre cómo afrontás el dolor o el malestar. No hay respuestas correctas ni incorrectas: indicá tu grado de acuerdo con cada afirmación.',
    escalaLabel: 'Totalmente de acuerdo → Totalmente en desacuerdo',
    instrucciones: [
      'Indicá tu grado de acuerdo con cada afirmación (de Totalmente de acuerdo a Totalmente en desacuerdo).',
      'Respondé con sinceridad; no hay respuestas correctas ni incorrectas.',
      'Son 31 afirmaciones; no te detengas demasiado en cada una.',
    ],
    dimNames: {},
  },
}

export default function TestRunner({ slug, empresa, onExit, onSubmit }) {
  const meta = META[slug] || { nombre: slug, subtitulo: '', instrucciones: [], dimNames: {} }
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

  const opciones = useMemo(() => {
    if (!data?.escala) return []
    // value = clave que se envía al backend (ej. "5" o "SI"); label = texto visible.
    return Object.entries(data.escala).map(([k, label]) => ({ value: k, label }))
  }, [data])

  if (error) return <Centro><div className="card pad">⚠️ {error}</div></Centro>
  if (!data) return <Centro><Loader label="Cargando test…" /></Centro>
  if (!data.escala || !Array.isArray(data.items) || data.items.length === 0) {
    return (
      <Centro>
        <div className="card pad">
          Este test todavía no está disponible para rendir en línea.
          {onExit && <div style={{ marginTop: 16 }}><button className="btn prim" onClick={onExit}>← Volver</button></div>}
        </div>
      </Centro>
    )
  }

  const items = data.items
  const total = items.length
  const respondidas = Object.keys(answers).length
  const q = items[idx]

  function volver() {
    if (screen === 'test') {
      if (!window.confirm('¿Salir del test? Tus respuestas no se guardarán.')) return
    }
    if (onExit) onExit()
  }

  function comenzar() {
    setAnswers({})
    setIdx(0)
    setScreen('test')
  }

  function elegir(value) {
    setAnswers((prev) => ({ ...prev, [q.id]: value }))
    setAviso(false)
    if (idx < total - 1) setTimeout(() => setIdx((i) => i + 1), 180)
  }

  async function finalizar() {
    if (respondidas < total) {
      setAviso(true)
      return
    }
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
            <h1>{meta.nombre} {meta.subtitulo && <b>· {meta.subtitulo}</b>}</h1>
            <p className="sub">{meta.intro || 'Una mirada a tus rasgos de personalidad. Respondé con tranquilidad; lleva pocos minutos.'}</p>
            <div className="meta">
              <div className="chip"><span className="dot" style={{ background: 'var(--rosa)' }} /> <b>{total}</b>&nbsp;preguntas</div>
              <div className="chip"><span className="dot" style={{ background: 'var(--cian)' }} /> {meta.escalaLabel || (opciones.length === 2 ? 'respuesta Sí / No' : `escala 1–${opciones.length}`)}</div>
            </div>
            <div className="instr">
              {meta.instrucciones.map((t, i) => (
                <div className="it" key={i}><span className="ic">{i + 1}</span> {t}</div>
              ))}
            </div>
            <button className="btn prim big" onClick={comenzar}>Comenzar la prueba →</button>
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
              <h2>{meta.nombre}</h2>
              <div className="progress"><i style={{ width: `${(respondidas / total) * 100}%` }} /></div>
              <div className="r3"><span>Pregunta {idx + 1} de {total}</span><span className="pct">{Math.round((respondidas / total) * 100)}%</span></div>
            </div>

            <div className="runrow">
              <div className="card qcard">
                {q.dimension && meta.dimNames[q.dimension] && (
                  <span className="qtag">{meta.dimNames[q.dimension]}</span>
                )}
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
                  <span><i style={{ background: 'rgba(107,225,227,.4)' }} /> Respondida</span>
                  <span><i style={{ background: '#fff', border: '1.5px solid var(--linea)' }} /> Pendiente</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ---------- DONE (dashboard liviano del evaluado) ---------- */}
        {screen === 'done' && (
          <>
            <section className="card hero">
              <div className="finok">✓</div>
              <h1 style={{ fontSize: '30px', marginTop: '14px' }}>¡Listo!</h1>
              <p className="sub">Completaste el <b>{meta.nombre}</b>. Gracias por tu tiempo y honestidad.</p>
            </section>
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button className="btn prim" onClick={volver}>Volver al inicio</button>
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
