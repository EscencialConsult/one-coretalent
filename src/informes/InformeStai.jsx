// Informe STAI (Ansiedad Estado-Rasgo) — data-driven, replicando la maqueta aprobada.
const FACT = {
  EA: { nombre: 'Estado Afirmativo', desc: 'Nerviosismo, tensión y preocupación en el momento actual.', tipo: 'afir' },
  EN: { nombre: 'Estado Negativo', desc: 'Bienestar, animación y confianza en el momento actual.', tipo: 'nega' },
  RA: { nombre: 'Rasgo Afirmativo', desc: 'Melancolía y sentimientos de incapacidad como disposición habitual.', tipo: 'afir' },
  RN: { nombre: 'Rasgo Negativo', desc: 'Estabilidad emocional como disposición habitual.', tipo: 'nega' },
}

export default function InformeStai({ data }) {
  const d = data.datos || {}
  const ev = data.evaluado
  const marca = data.empresa
  const fecha = data.created_at ? new Date(data.created_at).toLocaleDateString('es-AR') : ''
  const e = d.escalas?.estado || {}
  const r = d.escalas?.rasgo || {}

  return (
    <div className="inf-doc">
      {/* PORTADA */}
      <div className="inf-sheet">
        <div className="inf-cover">
          <div className="top"><span className="brand">{marca?.logo_url ? <img className="inf-logo" src={marca.logo_url} alt={marca.razon_social} /> : (marca?.razon_social || 'ONE')}</span><span className="badge">Informe confidencial</span></div>
          <h1>Informe STAI</h1><div className="st">Ansiedad Estado-Rasgo · Spielberger, Gorsuch y Lushene</div>
        </div>
        <div className="inf-who">
          <div><div className="k">Evaluado/a</div><div className="v">{ev ? `${ev.nombre} ${ev.apellido}` : '—'}</div></div>
          <div><div className="k">Fecha</div><div className="v">{fecha}</div></div>
          <div><div className="k">A/E · A/R</div><div className="v" style={{ color: 'var(--brand-acento)' }}>{d.pd_estado} · {d.pd_rasgo} /60</div></div>
        </div>
      </div>

      {/* ===== PARTE I ===== */}
      <div className="inf-sheet inf-divider"><div className="eb">PARTE I</div><h1>Comprendiendo el test</h1></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 1</span>
        <h2 className="inf-sec">¿Qué es el Test STAI?</h2>
        <p className="inf-tx">El Cuestionario de Ansiedad Estado-Rasgo (STAI) evalúa dos conceptos independientes: <b>Ansiedad Estado (A/E)</b> —cómo se siente la persona ahora mismo— y <b>Ansiedad Rasgo (A/R)</b> —su propensión ansiosa habitual—.</p>
        <p className="inf-tx">Consta de <b>40 preguntas</b> puntuadas de 0 a 3 (máximo 60 por escala), en dos bloques de 20 ítems. La Ansiedad Estado es una condición emocional transitoria; la Rasgo, una disposición relativamente estable.</p>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 2</span>
        <h2 className="inf-sec">Historia y fundamentos del modelo</h2>
        <p className="inf-tx">Creado por <b>C. D. Spielberger, R. L. Gorsuch y R. E. Lushene</b> (Consulting Psychologists Press); adaptación española de la Sección de Estudios de <b>TEA Ediciones</b>.</p>
        <p className="inf-tx"><b>Fiabilidad:</b> consistencia interna (KR-20) entre 0,84 y 0,93. <b>Baremos diferenciados por sexo</b> (muestra de adultos, N=1.109). <b>Categorización</b> en cinco niveles (Bajo a Alto). <b>Análisis factorial:</b> cada escala se descompone en factores "Afirmativos" (tensión, melancolía) y "Negativos" (bienestar, estabilidad).</p>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 3</span>
        <h2 className="inf-sec">Qué NO es (y cómo evitar malos usos)</h2>
        <ul className="inf-nolist">
          <li><span className="xx">✕</span><span><b>No evalúa la ansiedad como un bloque único.</b> Distingue estado puntual vs. propensión estable; incluye ítems directos e inversos para controlar el sesgo de aquiescencia.</span></li>
          <li><span className="xx">✕</span><span><b>Las escalas no se leen aisladas.</b> La relación comparativa entre Estado y Rasgo es la métrica clínica más importante.</span></li>
          <li><span className="xx">✕</span><span><b>No reemplaza el juicio clínico.</b> Lo interpreta un profesional considerando el contexto global de la persona.</span></li>
        </ul>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 4</span>
        <h2 className="inf-sec">Cómo se calcula el resultado</h2>
        <p className="inf-tx">Cada ítem se puntúa de 0 a 3 en dirección-ansiedad; los ítems inversos se invierten (3 − valor). Se obtienen dos puntuaciones directas (0–60), Estado y Rasgo, clasificadas por percentiles según el sexo.</p>
        <div className="inf-callout"><b>Cálculo exacto y sin IA.</b> Además, el modelo descompone los resultados en 4 factores (EA, EN, RA, RN) y compara Estado vs. Rasgo de forma determinista.</div>
      </div></div>

      {/* ===== PARTE II ===== */}
      <div className="inf-sheet inf-divider"><div className="eb">PARTE II</div><h1>Resultados de la evaluación</h1></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 1</span>
        <h2 className="inf-sec">Resultados y clasificación</h2>
        <div className="inf-two">
          <div className="inf-card"><div className="ah"><b>Ansiedad Estado (A/E)</b><span className="pc">{d.pd_estado}<span style={{ fontSize: 13, color: 'var(--muted)' }}>/60</span></span></div><div className="desc">cómo se sentía en el momento</div></div>
          <div className="inf-card"><div className="ah"><b>Ansiedad Rasgo (A/R)</b><span className="pc">{d.pd_rasgo}<span style={{ fontSize: 13, color: 'var(--muted)' }}>/60</span></span></div><div className="desc">cómo se siente en general</div></div>
        </div>
        <p className="inf-tx" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Los baremos difieren por sexo; se muestran ambas clasificaciones.</p>
        <table className="inf-table">
          <thead><tr><th>Escala</th><th>PD</th><th>Cat. (Varón)</th><th>P (V)</th><th>Cat. (Mujer)</th><th>P (M)</th></tr></thead>
          <tbody>
            <tr><td><b>A/E — Estado</b></td><td>{e.pd}</td><td>{e.categoria_varon}</td><td>{e.percentil_varon}</td><td>{e.categoria_mujer}</td><td>{e.percentil_mujer}</td></tr>
            <tr><td><b>A/R — Rasgo</b></td><td>{r.pd}</td><td>{r.categoria_varon}</td><td>{r.percentil_varon}</td><td>{r.categoria_mujer}</td><td>{r.percentil_mujer}</td></tr>
          </tbody>
        </table>
        {d.texto_relacion && (
          <div className="inf-callout" style={{ borderColor: 'rgba(192,57,43,.35)', background: 'rgba(192,57,43,.06)' }}>
            {typeof d.texto_relacion === 'object'
              ? <><b>{d.texto_relacion.titulo}:</b> {d.texto_relacion.texto}</>
              : <><b>Relación Estado–Rasgo:</b> {d.texto_relacion}</>}
          </div>
        )}
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 2</span>
        <h2 className="inf-sec">Interpretación Estado y Rasgo</h2>
        <div className="inf-card"><div className="ah"><b>Ansiedad Estado (A/E)</b></div>
          <p className="g" style={{ marginTop: 6 }}><b>Varón (P{e.percentil_varon} · {e.categoria_varon}):</b> {e.interpretacion_varon}</p>
          <p className="g" style={{ marginTop: 8 }}><b>Mujer (P{e.percentil_mujer} · {e.categoria_mujer}):</b> {e.interpretacion_mujer}</p>
        </div>
        <div className="inf-card"><div className="ah"><b>Ansiedad Rasgo (A/R)</b></div>
          <p className="g" style={{ marginTop: 6 }}><b>Varón (P{r.percentil_varon} · {r.categoria_varon}):</b> {r.interpretacion_varon}</p>
          <p className="g" style={{ marginTop: 8 }}><b>Mujer (P{r.percentil_mujer} · {r.categoria_mujer}):</b> {r.interpretacion_mujer}</p>
        </div>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 3</span>
        <h2 className="inf-sec">Análisis factorial (4 dimensiones)</h2>
        <p className="inf-tx">Cada escala se descompone en un factor afirmativo de ansiedad y uno negativo (bienestar/estabilidad).</p>
        <div className="inf-bars">
          {Object.entries(d.factores || {}).map(([code, f]) => {
            const m = FACT[code] || { nombre: code, desc: '', tipo: 'afir' }
            return (
              <div className="inf-row" key={code}>
                <div className="nm"><div className="t">{code} · {m.nombre}</div><div className="d">{m.desc}</div>
                  <div className="track"><i className={m.tipo === 'nega' ? 'fl-alto' : 'fl-bajo'} style={{ width: `${f.porcentaje}%` }} /></div>
                </div>
                <div className="pd"><b>{f.porcentaje}%</b></div>
              </div>
            )
          })}
        </div>
        <div className="inf-callout" style={{ marginTop: 14 }}>En los factores afirmativos (EA, RA) lo esperable es <b>bajo</b>; en los negativos (EN, RN), <b>alto</b> (mayor bienestar). Los porcentajes altos en afirmativos indican mayor ansiedad.</div>
      </div>
        <div className="inf-foot"><b>{marca?.razon_social || 'ONE'}</b><div>Informe confidencial · generado por ONE Core Analytics</div></div>
      </div>
    </div>
  )
}
