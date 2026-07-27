// Informe Test de Kuder — data-driven, replicando la maqueta aprobada.
import { kind, fmtNivel } from './nivel.js'

export default function InformeKuder({ data }) {
  const d = data.datos || {}
  const ev = data.evaluado
  const marca = data.empresa
  const fecha = data.created_at ? new Date(data.created_at).toLocaleDateString('es-AR') : ''
  const ranking = [...(d.percentiles || [])].sort((a, b) => b.percentil - a.percentil)
  const altas = (d.areasAltas && d.areasAltas.length ? d.areasAltas : ranking.slice(0, 3))
  const invalido = d.estadoValidez && d.estadoValidez !== 'VALIDO'

  return (
    <div className="inf-doc">
      {/* PORTADA */}
      <div className="inf-sheet">
        <div className="inf-cover">
          <div className="top"><span className="brand">{marca?.logo_url ? <img className="inf-logo" src={marca.logo_url} alt={marca.razon_social} /> : (marca?.razon_social || 'ONE')}</span><span className="badge">Informe confidencial</span></div>
          <h1>Informe Vocacional — Test de Kuder</h1><div className="st">Registro de Preferencias Vocacionales · Forma C</div>
        </div>
        <div className="inf-who">
          <div><div className="k">Evaluado/a</div><div className="v">{ev ? `${ev.nombre} ${ev.apellido}` : '—'}</div></div>
          <div><div className="k">Fecha</div><div className="v">{fecha}</div></div>
          <div><div className="k">Código de perfil</div><div className="v" style={{ color: 'var(--brand-acento)' }}>{d.codigoPerfil}</div></div>
        </div>
      </div>

      {/* ===== PARTE I ===== */}
      <div className="inf-sheet inf-divider"><div className="eb">PARTE I</div><h1>Comprendiendo el test</h1></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 1</span>
        <h2 className="inf-sec">¿Qué es el Test de Kuder?</h2>
        <p className="inf-tx">El Test de Kuder (Registro de Preferencias Vocacionales — Forma C) es uno de los instrumentos de <b>orientación vocacional</b> más utilizados a nivel mundial.</p>
        <p className="inf-tx">Evalúa 10 áreas de interés mediante <b>tríadas de elección forzada</b>: en cada grupo de 3 actividades, el evaluado elige la que "más le gusta" y la que "menos le gusta". Este diseño revela las <b>preferencias inventariadas</b>, más allá de las expresadas superficialmente.</p>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 2</span>
        <h2 className="inf-sec">Historia y fundamentos del modelo</h2>
        <p className="inf-tx">Desarrollado por <b>G. Frederic Kuder</b> (Universidad de Ohio), se fundamenta en la cuantificación y jerarquización de los intereses personales.</p>
        <p className="inf-tx"><b>10 áreas:</b> Aire Libre, Mecánico, Cálculo, Científico, Persuasivo, Artístico, Literario, Musical, Asistencial y Administrativo. <b>Baremos:</b> los PD se convierten en percentiles; las dos áreas de mayor percentil forman el "Código de Perfil" (ej. 5-6). <b>Escala de verificación:</b> detecta si se respondió de forma atenta y coherente (rango normal 31–39).</p>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 3</span>
        <h2 className="inf-sec">Qué NO es (y cómo evitar malos usos)</h2>
        <ul className="inf-nolist">
          <li><span className="xx">✕</span><span><b>Mide intereses, no aptitudes ni habilidades reales.</b> Una puntuación alta indica probable satisfacción en esas tareas, pero el éxito depende de formación, ejecución y otras variables.</span></li>
          <li><span className="xx">✕</span><span><b>No debe usarse como instrumento definitivo y solitario.</b> Es orientativo; conviene complementarlo con rendimiento académico, entrevistas y tests de aptitudes.</span></li>
          <li><span className="xx">✕</span><span><b>Su valor se potencia integrado</b> con la evaluación conductual (ej. DISC) y el proceso de coaching, para trazabilidad continua de objetivos.</span></li>
        </ul>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 4</span>
        <h2 className="inf-sec">Cómo se calcula el resultado</h2>
        <p className="inf-tx">Por cada tríada se suma <b>+1</b> al área de la actividad "más" y <b>+1</b> a la "menos". El PD por área se convierte en percentil:</p>
        <table className="inf-table">
          <thead><tr><th>Percentil</th><th>Nivel de interés</th></tr></thead>
          <tbody>
            <tr><td>≥ 90</td><td>Muy alto</td></tr>
            <tr><td>75 – 89</td><td>Alto</td></tr>
            <tr><td>60 – 74</td><td>Promedio alto</td></tr>
            <tr><td>40 – 59</td><td>Promedio</td></tr>
            <tr><td>25 – 39</td><td>Promedio bajo</td></tr>
            <tr><td>&lt; 25</td><td>Bajo</td></tr>
          </tbody>
        </table>
        <div className="inf-callout"><b>Cálculo exacto y sin IA.</b> Las dos áreas de mayor percentil forman el <b>código de perfil</b>. Una escala de verificación controla la coherencia de las respuestas.</div>
      </div></div>

      {/* ===== PARTE II ===== */}
      <div className="inf-sheet inf-divider"><div className="eb">PARTE II</div><h1>Perfil de intereses</h1></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 1</span>
        <h2 className="inf-sec">Validez y código de perfil</h2>
        {invalido && <div className="inf-warn"><b>⚠ Advertencia de validez.</b> Puntuación de verificación: {d.verificacion} (rango normal: 31–39). Se recomienda repetir el test con mayor atención; interpretar con cautela.</div>}
        <div className="inf-codebox" style={{ marginTop: invalido ? 14 : 0 }}>
          <div className="lbl">Código de perfil vocacional</div>
          <div className="code">{(d.codigoPerfil || '').split('-').join(' · ')}</div>
          <div className="desc">{altas.slice(0, 2).map((a) => a.nombre).join(' + ')}</div>
        </div>
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 2</span>
        <h2 className="inf-sec">Áreas de interés preferente</h2>
        {altas.map((a) => (
          <div className="inf-card" key={a.area}>
            <div className="ah"><div><b>{a.nombre}</b><div className="desc" style={{ margin: 0 }}>Puntaje directo: {a.puntajeDirecto} / {a.maxPD}</div></div><span className="pc">P{a.percentil}</span></div>
            <p className="g" style={{ margin: '6px 0 8px' }}>{a.descripcion}</p>
            <div className="track" style={{ margin: '0 0 12px' }}><i className={'fl-' + kind(a.nivel)} style={{ width: `${a.percentil}%` }} /></div>
            {a.profesiones?.length > 0 && <p className="g"><b style={{ color: 'var(--brand-acento)' }}>Profesiones:</b> {a.profesiones.slice(0, 6).join(' · ')}</p>}
          </div>
        ))}
      </div></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">Sección 3</span>
        <h2 className="inf-sec">Análisis por área (las 10)</h2>
        <div className="inf-bars">
          {ranking.map((a) => (
            <div className="inf-row" key={a.area}>
              <div className="nm"><div className="t">{a.nombre}</div><div className="track"><i className={'fl-' + kind(a.nivel)} style={{ width: `${a.percentil}%` }} /></div></div>
              <div className="pd">PD {a.puntajeDirecto} · <b>P{a.percentil}</b></div>
            </div>
          ))}
        </div>
      </div></div>

      {d.profesionesCombinadas?.length > 0 && (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">Sección 4</span>
          <h2 className="inf-sec">Profesiones sugeridas — {d.codigoPerfil}</h2>
          <ul className="inf-list">{d.profesionesCombinadas.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </div>
          <div className="inf-foot"><b>{marca?.razon_social || 'ONE'}</b><div>Informe confidencial · generado por ONE Core Analytics</div></div>
        </div>
      )}
    </div>
  )
}
