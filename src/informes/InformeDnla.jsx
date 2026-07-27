// Informe DNLA (Personal Insight Profile) — data-driven, replicando la maqueta aprobada.
import { kind } from './nivel.js'

const w5 = (p) => `${Math.max(0, Math.min(100, (p / 5) * 100))}%`
const flDim = (p) => 'fl-' + (p >= 4 ? 'alto' : p >= 3 ? 'medio' : 'bajo')

const DIMS_REF = [
  ['Autopercepción y Autoestima', 'Reconocimiento de talentos y aceptación de las propias áreas de mejora.'],
  ['Motivación y Propósito', 'Sentido vital, metas y persistencia ante obstáculos.'],
  ['Adaptabilidad Emocional', 'Calma bajo presión y recuperación ante la adversidad.'],
  ['Relaciones y Empatía', 'Escucha, comprensión de otros y vínculos saludables.'],
  ['Bienestar y Equilibrio', 'Autocuidado, descanso y balance vida-responsabilidades.'],
  ['Crecimiento Personal', 'Aprendizaje continuo, reflexión y apertura al feedback.'],
]

export default function InformeDnla({ data }) {
  const d = data.datos || {}
  const ev = data.evaluado
  const marca = data.empresa
  const fecha = data.created_at ? new Date(data.created_at).toLocaleDateString('es-AR') : ''
  const perfil = d.perfil_global || {}
  const dims = Object.values(d.dimensiones || {}).sort((a, b) => b.promedio - a.promedio)
  const analisis = d.analisis_dimensiones || []
  const resumen = d.resumen_ejecutivo || {}

  return (
    <div className="inf-doc">
      {/* PORTADA */}
      <div className="inf-sheet">
        <div className="inf-cover">
          <div className="top"><span className="brand">{marca?.logo_url ? <img className="inf-logo" src={marca.logo_url} alt={marca.razon_social} /> : (marca?.razon_social || 'ONE')}</span><span className="badge">Informe confidencial</span></div>
          <h1>Informe Personal Insight — DNLA</h1><div className="st">Bienestar y Desarrollo Personal · 6 dimensiones</div>
        </div>
        <div className="inf-who">
          <div><div className="k">Evaluado/a</div><div className="v">{ev ? `${ev.nombre} ${ev.apellido}` : '—'}</div></div>
          <div><div className="k">Fecha</div><div className="v">{fecha}</div></div>
          <div><div className="k">Perfil global</div><div className="v" style={{ color: 'var(--brand-acento)' }}>{perfil.titulo} · {d.promedio_global_texto}</div></div>
        </div>
      </div>

      {/* ===== PARTE I ===== */}
      <div className="inf-sheet inf-divider"><div className="eb">PARTE I</div><h1>Comprendiendo el modelo DNLA</h1></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 1</span>
        <h2 className="inf-sec">¿Qué es el Test DNLA Personal Insight Profile?</h2>
        <p className="inf-tx">El DNLA (Personal Insight Profile) es una herramienta enfocada en medir el <b>bienestar integral y el desarrollo personal</b>.</p>
        <p className="inf-tx">A través de <b>24 preguntas</b> en escala Likert de 5 puntos (de "Siempre" a "Nunca"), mapea los recursos psicológicos en seis dimensiones: Autopercepción y Autoestima, Motivación y Propósito, Adaptabilidad Emocional, Relaciones y Empatía, Bienestar y Equilibrio, y Crecimiento Personal.</p>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 2</span>
        <h2 className="inf-sec">Historia y fundamentos del modelo</h2>
        <p className="inf-tx">Cuantifica las percepciones personales para identificar fortalezas consolidadas y factores de desgaste. Sus bases:</p>
        <p className="inf-tx"><b>Puntuación por dimensiones:</b> 4 ítems por dimensión, máximo 5.0 por área. <b>Clasificación global:</b> el promedio ubica el perfil en Sobresaliente (≥4.6), Sólido (&gt;3.8), En Desarrollo (&gt;3.0), o Atención Requerida / Riesgo de Desgaste.</p>
        <p className="inf-tx"><b>Patrones transversales:</b> cruza respuestas para detectar patrones (ej. "Triángulo del Bienestar Sólido", "Motor de Logro Activado", "La Paradoja del Cuidador"). <b>Feedback accionable:</b> cuatro pilares — Lo que funciona, Oportunidad, Herramienta e Indicador/KPI.</p>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 3</span>
        <h2 className="inf-sec">Las 6 dimensiones</h2>
        <table className="inf-table">
          <thead><tr><th>Dimensión</th><th>Qué evalúa</th></tr></thead>
          <tbody>{DIMS_REF.map(([n, q]) => <tr key={n}><td><span className="dn">{n}</span></td><td>{q}</td></tr>)}</tbody>
        </table>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 4</span>
        <h2 className="inf-sec">Qué NO es (y cómo evitar malos usos)</h2>
        <ul className="inf-nolist">
          <li><span className="xx">✕</span><span><b>No es un diagnóstico clínico o médico</b>: los resultados son un "mapa" para el crecimiento personal, no etiquetas patológicas.</span></li>
          <li><span className="xx">✕</span><span><b>No hay respuestas correctas o incorrectas</b>: se basa en la percepción honesta del propio individuo.</span></li>
          <li><span className="xx">✕</span><span><b>Las alertas no son sentencias definitivas</b>, sino llamadas a la acción preventivas (ajustar límites, protocolos de recarga, acompañamiento profesional).</span></li>
        </ul>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 5</span>
        <h2 className="inf-sec">Cómo se calcula el resultado</h2>
        <p className="inf-tx">Cada dimensión promedia sus 4 ítems (máx. 5.0). El <b>promedio global</b> es la media de las 6 y determina el perfil:</p>
        <table className="inf-table">
          <thead><tr><th>Promedio global</th><th>Perfil</th></tr></thead>
          <tbody>
            <tr><td>≥ 4.6</td><td>Sobresaliente</td></tr>
            <tr><td>&gt; 3.8</td><td>Sólido</td></tr>
            <tr><td>&gt; 3.0</td><td>En Desarrollo</td></tr>
            <tr><td>&lt; 3.0</td><td>Atención Requerida / Riesgo de Desgaste</td></tr>
          </tbody>
        </table>
        <div className="inf-callout"><b>Cálculo exacto y sin IA.</b> No hay ítems inversos; los patrones y alertas surgen de condiciones deterministas sobre las respuestas.</div>
      </div></div>

      {/* ===== PARTE II ===== */}
      <div className="inf-sheet inf-divider"><div className="eb">PARTE II</div><h1>Perfil de bienestar</h1></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 1</span>
        <h2 className="inf-sec">Puntuación global y resumen ejecutivo</h2>
        <div className="inf-global">
          <div className="lbl">Promedio global</div>
          <div className="num">{d.promedio_global_texto}</div>
          <div className={'nivel lvl-' + kind(perfil.titulo)}>{perfil.titulo}</div>
          {d.interpretacion_global && <p>{d.interpretacion_global}</p>}
        </div>
        <div style={{ marginTop: 20 }}>{(resumen.parrafos || []).map((p, i) => <p className="inf-tx" key={i}>{p}</p>)}</div>
        <h3 className="inf-subh">Promedio por dimensión</h3>
        <div className="inf-bars">
          {dims.map((x) => (
            <div className="inf-row" key={x.nombre}>
              <div className="nm"><div className="t">{x.nombre}</div><div className="track"><i className={flDim(x.promedio)} style={{ width: w5(x.promedio) }} /></div></div>
              <div className="pd"><b>{x.promedio_texto}</b></div>
            </div>
          ))}
        </div>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 2</span>
        <h2 className="inf-sec">Análisis por dimensión</h2>
        {analisis.map((a) => (
          <div className="inf-card" key={a.nombre}>
            <div className="ah"><b>{a.nombre}</b><span className="pc">{a.promedio_texto}</span></div>
            {a.texto && <p className="g" style={{ margin: '8px 0 12px' }}>{a.texto}</p>}
            {a.feedback && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Pill lbl="Lo que funciona" v={a.feedback.bien} c="#178a8f" />
                <Pill lbl="Oportunidad" v={a.feedback.op} c="#9a7d1a" />
                <Pill lbl="Herramienta" v={a.feedback.herr} c="#b5559f" />
                <Pill lbl="Indicador" v={a.feedback.kpi} c="#4d248f" />
              </div>
            )}
          </div>
        ))}
      </div></div>

      {d.patrones_transversales?.length > 0 && (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">Sección 3</span>
          <h2 className="inf-sec">Patrones identificados</h2>
          {d.patrones_transversales.map((p, i) => <div className="inf-callout" key={i}><b>{p.titulo}.</b> {p.texto}</div>)}
        </div></div>
      )}

      {d.recomendaciones?.length > 0 && (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">Sección 4</span>
          <h2 className="inf-sec">Plan de acción</h2>
          {d.recomendaciones.map((r, i) => <p className="inf-tx" key={i}><b>{r.titulo}:</b> {r.texto}</p>)}
        </div></div>
      )}

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Cierre</span>
        <h2 className="inf-sec">Síntesis final</h2>
        {d.sintesis_final && <p className="inf-tx" style={{ fontStyle: 'italic' }}>{d.sintesis_final}</p>}
      </div>
        <div className="inf-foot"><b>{marca?.razon_social || 'ONE'}</b><div>Informe confidencial · generado por ONE Core Analytics</div></div>
      </div>
    </div>
  )
}

function Pill({ lbl, v, c }) {
  if (!v) return null
  return (
    <div style={{ background: '#f7f7fb', borderRadius: 10, padding: '11px 13px', fontSize: 12.5, lineHeight: 1.45 }}>
      <span style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '.6px', textTransform: 'uppercase', color: c, marginBottom: 4 }}>{lbl}</span>
      {v}
    </div>
  )
}
