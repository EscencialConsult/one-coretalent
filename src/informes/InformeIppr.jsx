// Informe IPP-R — data-driven, replicando la maqueta aprobada.
import { kind } from './nivel.js'

export default function InformeIppr({ data }) {
  const d = data.datos || {}
  const ev = data.evaluado
  const marca = data.empresa
  const fecha = data.created_at ? new Date(data.created_at).toLocaleDateString('es-AR') : ''
  const campos = Object.values(d.puntuaciones || {}).sort((a, b) => b.pd_total - a.pd_total)
  const analisis = d.analisis || {}
  const validez = d.validez || {}
  const primarios = analisis.primarios || campos.slice(0, 3)
  const rechazos = analisis.rechazos || []
  const desconocidos = analisis.desconocidos || []

  return (
    <div className="inf-doc">
      {/* PORTADA */}
      <div className="inf-sheet">
        <div className="inf-cover">
          <div className="top"><span className="brand">{marca?.logo_url ? <img className="inf-logo" src={marca.logo_url} alt={marca.razon_social} /> : (marca?.razon_social || 'ONE')}</span><span className="badge">Informe confidencial</span></div>
          <h1>Informe IPP-R</h1><div className="st">Intereses y Preferencias Profesionales — Revisado · TEA Ediciones</div>
        </div>
        <div className="inf-who">
          <div><div className="k">Evaluado/a</div><div className="v">{ev ? `${ev.nombre} ${ev.apellido}` : '—'}</div></div>
          <div><div className="k">Fecha</div><div className="v">{fecha}</div></div>
          <div><div className="k">Validez</div><div className="v" style={{ color: '#0f7a57' }}>{validez.etiqueta}</div></div>
          <div><div className="k">Perfil</div><div className="v" style={{ color: 'var(--brand-acento)' }}>{analisis.tipoPerfil}</div></div>
        </div>
      </div>

      {/* ===== PARTE I ===== */}
      <div className="inf-sheet inf-divider"><div className="eb">PARTE I</div><h1>Comprendiendo el test</h1></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 1</span>
        <h2 className="inf-sec">¿Qué es el Test IPP-R?</h2>
        <p className="inf-tx">El Inventario de Intereses y Preferencias Profesionales — Revisado (IPP-R) evalúa las <b>preferencias personales hacia diversos campos profesionales</b>.</p>
        <p className="inf-tx">Se compone de <b>180 ítems</b> en <b>15 campos</b> (12 por campo: 6 de "actividades" y 6 de "profesiones"), con escala de 4 puntos: <i>No Conozco (0), Desagrado (1), Indiferencia (2) y Agrado (3)</i>.</p>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 2</span>
        <h2 className="inf-sec">Historia y fundamentos del modelo</h2>
        <p className="inf-tx">Desarrollado por <b>M.ª Victoria de la Cruz López</b> y publicado por <b>TEA Ediciones (2004/2010)</b>.</p>
        <p className="inf-tx"><b>Muestra normativa:</b> ESO-Bachillerato (N=1.256). <b>Puntuación:</b> PD por campo (máx. 36), clasificada en seis niveles (de "Muy alto" a "Muy bajo / Rechazo"). <b>Tipología de perfiles:</b> Plano, Alto generalizado, Diferenciado o Disperso. <b>Discrepancias y desconocimiento:</b> aísla áreas primarias/rechazo, compara actividad vs. profesión y señala los campos con muchos "No Conozco" (falta de información, no de interés).</p>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 3</span>
        <h2 className="inf-sec">Qué NO es (y cómo evitar malos usos)</h2>
        <ul className="inf-nolist">
          <li><span className="xx">✕</span><span><b>No evalúa aptitudes, inteligencia ni probabilidad de éxito.</b> Identifica exclusivamente las áreas de mayor motivación e interés.</span></li>
          <li><span className="xx">✕</span><span><b>No es una conclusión definitiva.</b> Los intereses pueden evolucionar; es un punto de partida, no un veredicto.</span></li>
          <li><span className="xx">✕</span><span><b>No debe usarse aislado.</b> Lo interpreta un profesional y conviene complementarlo con entrevistas y, si hace falta, evaluación de aptitudes.</span></li>
        </ul>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 4</span>
        <h2 className="inf-sec">Cómo se calcula el resultado</h2>
        <p className="inf-tx">Cada campo suma sus 12 ítems → <b>PD</b> de 0 a 36, clasificada en un nivel:</p>
        <table className="inf-table">
          <thead><tr><th>PD por campo</th><th>Nivel</th></tr></thead>
          <tbody>
            <tr><td>31 – 36</td><td>Muy alto</td></tr>
            <tr><td>25 – 30</td><td>Alto</td></tr>
            <tr><td>19 – 24</td><td>Medio-alto</td></tr>
            <tr><td>13 – 18</td><td>Medio</td></tr>
            <tr><td>7 – 12</td><td>Bajo</td></tr>
            <tr><td>0 – 6</td><td>Muy bajo / Rechazo</td></tr>
          </tbody>
        </table>
        <div className="inf-callout"><b>Cálculo exacto y sin IA.</b> Cada campo se desglosa en Actividades (AC, 0–18) y Profesiones (PR, 0–18), y se cuentan los "No Conozco" (NC).</div>
      </div></div>

      {/* ===== PARTE II ===== */}
      <div className="inf-sheet inf-divider"><div className="eb">PARTE II</div><h1>Perfil de intereses</h1></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 1</span>
        <h2 className="inf-sec">Validez y tipo de perfil</h2>
        <p className="inf-tx"><b>Validez: {validez.etiqueta}.</b> {validez.respondidos}/{validez.total} ítems ({validez.pct}%). Ítems "No Conozco": {validez.nc} ({validez.pctNC}%).</p>
        {validez.alertaTiempo && <div className="inf-draft">⚠ {validez.alertaTiempo}</div>}
        {analisis.descPerfil && <div className="inf-callout" style={{ marginTop: 10 }}><b>Perfil {analisis.tipoPerfil}.</b> {analisis.descPerfil}</div>}
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 2</span>
        <h2 className="inf-sec">Campos de interés principal</h2>
        <p className="inf-tx">Los campos con mayor puntuación directa constituyen el perfil vocacional primario.</p>
        {primarios.map((c) => (
          <div className="inf-card" key={c.codigo}>
            <div className="ah"><div><b>{c.emoji} {c.nombre}</b></div><span className="pc">{c.porcentaje}%</span></div>
            <div className="desc">{c.descripcion}</div>
            <div className="track" style={{ margin: '4px 0 12px' }}><i className={'fl-' + kind(c.nivel)} style={{ width: `${c.porcentaje}%` }} /></div>
            {c.actividades && <p className="g" style={{ marginBottom: 6 }}><b style={{ color: 'var(--brand-acento)' }}>Actividades:</b> {c.actividades}</p>}
            {c.carreras?.length > 0 && <p className="g"><b style={{ color: 'var(--brand-acento)' }}>Carreras:</b> {c.carreras.slice(0, 6).join(' · ')}</p>}
            <div className="inf-foot-note" style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8 }}>PD Actividades: {c.pd_ac}/18 · PD Profesiones: {c.pd_pr}/18 · "No Conozco": {c.n_nc}</div>
          </div>
        ))}
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 3</span>
        <h2 className="inf-sec">Perfil completo — 15 campos</h2>
        <table className="inf-table">
          <thead><tr><th>Campo</th><th>PD</th><th>Nivel</th><th>AC / PR / NC</th></tr></thead>
          <tbody>
            {campos.map((c) => (
              <tr key={c.codigo}>
                <td>{c.emoji} {c.nombre}</td>
                <td><b>{c.pd_total}/36</b></td>
                <td><span className={'lvlbadge ' + kind(c.nivel)}>{c.nivel}</span></td>
                <td>{c.pd_ac} / {c.pd_pr} / {c.n_nc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="inf-tx" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>AC = Actividades (0–18) · PR = Profesiones (0–18) · NC = ítems "No Conozco".</p>
      </div></div>

      {(rechazos.length > 0 || desconocidos.length > 0) && (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">Sección 4</span>
          <h2 className="inf-sec">Rechazo y desconocimiento</h2>
          {rechazos.length > 0 && <p className="inf-tx"><b style={{ color: '#c0392b' }}>Campos de rechazo:</b> {rechazos.map((c) => c.nombre).join(' · ')}. Esto no implica incapacidad, sino menor motivación actual.</p>}
          {desconocidos.length > 0 && <div className="inf-warn"><b>📚 Desconocimiento importante.</b> Con 3+ ítems "No Conozco" (falta de información, no de interés), conviene explorarlos antes de descartarlos: {desconocidos.map((c) => `${c.nombre} (${c.n_nc})`).join(' · ')}.</div>}
        </div></div>
      )}

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Cierre</span>
        <h2 className="inf-sec">Consideraciones para la orientación</h2>
        <p className="inf-tx">Los resultados del IPP-R son el <b>punto de partida</b> de un proceso de orientación, no su conclusión. Conviene complementarlos con entrevistas individuales, exploración directa de las áreas de interés y, cuando sea pertinente, evaluación de aptitudes.</p>
        <div className="inf-callout"><b>Nota técnica.</b> IPP-R (M.ª Victoria de la Cruz López, TEA Ediciones, 2004/2010). Niveles en PD sobre 36 por campo; baremos ESO–Bachillerato (N=1.256). No evalúa aptitudes ni probabilidad de éxito; debe interpretarlo un profesional.</div>
      </div>
        <div className="inf-foot"><b>{marca?.razon_social || 'ONE'}</b><div>Informe confidencial · generado por ONE Core Analytics</div></div>
      </div>
    </div>
  )
}
