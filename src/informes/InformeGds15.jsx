// Informe GDS-15 — data-driven, replicando la maqueta aprobada.
const REF = [
  { c: 'n', rg: '0 – 4', nm: 'Normal', nivel: 'normal' },
  { c: 'l', rg: '5 – 8', nm: 'Dep. leve', nivel: 'leve' },
  { c: 'm', rg: '9 – 11', nm: 'Dep. moderada', nivel: 'moderada' },
  { c: 'g', rg: '12 – 15', nm: 'Dep. grave', nivel: 'grave' },
]
// color del bloque de clasificación según nivel (normal = sano = verde)
const clasKind = (n) => (n === 'normal' ? 'alto' : n === 'leve' ? 'medio' : 'bajo')

export default function InformeGds15({ data }) {
  const d = data.datos || {}
  const ev = data.evaluado
  const marca = data.empresa
  const fecha = data.created_at ? new Date(data.created_at).toLocaleDateString('es-AR') : ''
  const pctSint = Math.round(((d.puntuacion_total || 0) / 15) * 100)

  return (
    <div className="inf-doc">
      {/* PORTADA */}
      <div className="inf-sheet">
        <div className="inf-cover">
          <div className="top"><span className="brand">{marca?.logo_url ? <img className="inf-logo" src={marca.logo_url} alt={marca.razon_social} /> : (marca?.razon_social || 'ONE')}</span><span className="badge">Informe confidencial</span></div>
          <h1>Informe GDS-15</h1><div className="st">Escala de Depresión Geriátrica · Yesavage et al. (1983)</div>
        </div>
        <div className="inf-who">
          <div><div className="k">Evaluado/a</div><div className="v">{ev ? `${ev.nombre} ${ev.apellido}` : '—'}</div></div>
          <div><div className="k">Fecha</div><div className="v">{fecha}</div></div>
          <div><div className="k">Resultado</div><div className={'v pin-' + clasKind(d.nivel)}>{d.nombre_nivel} · {d.puntuacion_total}/15</div></div>
        </div>
      </div>

      {/* ===== PARTE I ===== */}
      <div className="inf-sheet inf-divider"><div className="eb">PARTE I</div><h1>Comprendiendo el test</h1></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 1</span>
        <h2 className="inf-sec">¿Qué es el Test GDS-15?</h2>
        <p className="inf-tx">La Escala de Depresión Geriátrica (GDS-15) es uno de los instrumentos de <b>cribado</b> más utilizados a nivel mundial para la detección de depresión en adultos mayores.</p>
        <p className="inf-tx">Consta de <b>15 preguntas dicotómicas (Sí / No)</b> sobre cómo se ha sentido la persona durante la última semana. Se enfoca en los aspectos cognitivos y conductuales del estado de ánimo, evitando los ítems somáticos que podrían confundirse con patologías propias del envejecimiento.</p>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 2</span>
        <h2 className="inf-sec">Historia y fundamentos</h2>
        <p className="inf-tx">Desarrollada por <b>J. A. Yesavage</b> y colaboradores en 1983, y abreviada a 15 ítems por <b>Sheikh y Yesavage (1986)</b>.</p>
        <p className="inf-tx"><b>Alta precisión:</b> sensibilidad 81% y especificidad 78%, con fiabilidad test-retest de 0,85. <b>Puntuación de riesgo:</b> cada respuesta que coincide con un síntoma suma 1 punto. <b>Subdimensiones:</b> Estado de Ánimo General, Actividad e Interés, Cognición Negativa y Ansiedad y Preocupación.</p>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 3</span>
        <h2 className="inf-sec">Qué NO es (y cómo evitar malos usos)</h2>
        <ul className="inf-nolist">
          <li><span className="xx">✕</span><span><b>No es un diagnóstico clínico especializado ni definitivo.</b> Es una herramienta de cribado; no reemplaza la evaluación médica, psicológica o psiquiátrica.</span></li>
          <li><span className="xx">✕</span><span><b>No debe analizarse de forma aislada.</b> Siempre lo interpreta un profesional de la salud, considerando el contexto clínico global.</span></li>
          <li><span className="xx">✕</span><span><b>Ante depresión moderada o grave, no subestimar.</b> Requiere derivación a evaluación especializada (URGENTE en casos graves, por riesgo de autolesión) y un plan terapéutico.</span></li>
        </ul>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 4</span>
        <h2 className="inf-sec">Cómo se calcula el resultado</h2>
        <p className="inf-tx">Cada ítem suma <b>1 punto</b> cuando la respuesta coincide con el síntoma depresivo. El puntaje total (0–15) determina la clasificación:</p>
        <table className="inf-table">
          <thead><tr><th>Puntaje</th><th>Clasificación</th></tr></thead>
          <tbody>
            <tr><td>0 – 4</td><td>Normal</td></tr>
            <tr><td>5 – 8</td><td>Depresión leve</td></tr>
            <tr><td>9 – 11</td><td>Depresión moderada</td></tr>
            <tr><td>12 – 15</td><td>Depresión grave</td></tr>
          </tbody>
        </table>
        <div className="inf-callout"><b>Cálculo exacto y sin IA.</b> El puntaje es la suma directa de las respuestas sintomáticas; la clasificación surge de la tabla de referencia.</div>
      </div></div>

      {/* ===== PARTE II ===== */}
      <div className="inf-sheet inf-divider"><div className="eb">PARTE II</div><h1>Resultados de la evaluación</h1></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 1</span>
        <h2 className="inf-sec">Resultado general</h2>
        <div className="inf-resultrow">
          <div className="inf-scorebox"><div className="k">Puntaje total</div><div className="v">{d.puntuacion_total}</div><div className="sub">de 15 puntos posibles</div></div>
          <div className={'inf-clasbox ' + clasKind(d.nivel)}><div className="k">Clasificación</div><div className="lvl">{d.nombre_nivel}</div><div className="pct">{pctSint}% de síntomas presentes</div></div>
        </div>
        <h3 className="inf-subh" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--muted)', margin: '22px 0 4px' }}>Escala de referencia GDS-15</h3>
        <div className="inf-escala">
          {REF.map((x) => <div key={x.c} className={'inf-ref ' + x.c + (d.nivel === x.nivel ? ' on' : '')}><div className="rg">{x.rg}</div><div className="nm">{x.nm}</div></div>)}
        </div>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 2</span>
        <h2 className="inf-sec">Interpretación clínica y recomendación</h2>
        <div className="inf-interp">
          <b>{d.nombre_nivel} — Puntaje {d.puntuacion_total}/15</b>
          {d.descripcion && <p>{d.descripcion}</p>}
        </div>
        {d.recomendacion && <div className="inf-reco"><b>Recomendación profesional</b><p>{d.recomendacion}</p></div>}
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 3</span>
        <h2 className="inf-sec">Desglose</h2>
        {d.desglose && (
          <div className="inf-stats">
            <div className="inf-stat"><div className="k">Respondidas</div><div className="v">{d.desglose.respondidas}</div><div className="sub">de 15 ítems</div></div>
            <div className="inf-stat"><div className="k">Síntomas presentes</div><div className="v">{d.desglose.sintomaticas}</div><div className="sub">respuestas sintomáticas</div></div>
            <div className="inf-stat"><div className="k">Sin responder</div><div className="v">{d.desglose.sin_responder}</div><div className="sub">ítems omitidos</div></div>
          </div>
        )}
        <div className="inf-callout"><b>Sobre el GDS-15.</b> Instrumento de cribado de depresión geriátrica (Yesavage et al., 1983; abreviado por Sheikh y Yesavage, 1986). Sensibilidad 81%, especificidad 78%, fiabilidad 0,85. Debe interpretarlo un profesional de la salud en el contexto clínico global; no reemplaza el diagnóstico especializado.</div>
      </div>
        <div className="inf-foot"><b>{marca?.razon_social || 'ONE'}</b><div>Informe confidencial · generado por ONE Core Analytics</div></div>
      </div>
    </div>
  )
}
