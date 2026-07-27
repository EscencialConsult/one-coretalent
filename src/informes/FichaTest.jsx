// Parte I "educativa" común a todos los informes (¿Qué es? · Historia · tipologías ·
// Qué NO es · Cómo se calcula). El contenido por test vive en fichas.js. Se inserta al
// inicio de cada informe (dentro de su .inf-doc), con el mismo estilo que el Big Five.
import { FICHAS } from './fichas.js'

function Tabla({ cols, filas }) {
  return (
    <table className="inf-table">
      <thead><tr>{cols.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
      <tbody>
        {filas.map((f, i) => (
          <tr key={i}>{f.map((celda, j) => <td key={j}>{j === 0 ? <span className="dn">{celda}</span> : celda}</td>)}</tr>
        ))}
      </tbody>
    </table>
  )
}

export default function FichaTest({ slug }) {
  const f = FICHAS[slug]
  if (!f) return null

  // Numeración dinámica de secciones según lo que tenga cada ficha.
  let n = 0
  const sec = () => `Sección ${++n}`

  return (
    <>
      <div className="inf-sheet inf-divider"><div className="eb">PARTE I</div><h1>{f.titulo || 'Comprendiendo el test'}</h1></div>

      <div className="inf-sheet"><div className="inf-pad">
        <span className="inf-eyebrow">{sec()}</span>
        <h2 className="inf-sec">{f.queEsTitulo || '¿Qué es este test?'}</h2>
        {(f.queEs || []).map((p, i) => <p className="inf-tx" key={i}>{p}</p>)}
      </div></div>

      {(f.historia?.length) ? (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">{sec()}</span>
          <h2 className="inf-sec">Historia y fundamentos</h2>
          {f.historia.map((p, i) => <p className="inf-tx" key={i}>{p}</p>)}
        </div></div>
      ) : null}

      {f.tabla ? (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">{sec()}</span>
          <h2 className="inf-sec">{f.tabla.titulo}</h2>
          {f.tabla.intro && <p className="inf-tx">{f.tabla.intro}</p>}
          <Tabla cols={f.tabla.cols} filas={f.tabla.filas} />
        </div></div>
      ) : null}

      {(f.queNoEs?.length) ? (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">{sec()}</span>
          <h2 className="inf-sec">Qué NO es (y cómo evitar malos usos)</h2>
          <ul className="inf-nolist">
            {f.queNoEs.map((x, i) => (
              <li key={i}><span className="xx">✕</span><span><b>{x.t}</b>{x.d ? <>: {x.d}</> : null}</span></li>
            ))}
          </ul>
          {f.resumen && <div className="inf-callout"><b>En resumen:</b> {f.resumen}</div>}
        </div></div>
      ) : null}

      {f.comoSeCalcula ? (
        <div className="inf-sheet"><div className="inf-pad">
          <span className="inf-eyebrow">{sec()}</span>
          <h2 className="inf-sec">Cómo se calcula el resultado</h2>
          {(Array.isArray(f.comoSeCalcula.intro) ? f.comoSeCalcula.intro : [f.comoSeCalcula.intro]).filter(Boolean).map((p, i) => <p className="inf-tx" key={i}>{p}</p>)}
          {f.comoSeCalcula.tabla && <Tabla cols={f.comoSeCalcula.tabla.cols} filas={f.comoSeCalcula.tabla.filas} />}
          <div className="inf-callout"><b>Cálculo exacto y sin IA:</b> {f.comoSeCalcula.nota || 'los resultados se calculan de forma determinista a partir de las respuestas.'}</div>
        </div></div>
      ) : null}

      <div className="inf-sheet inf-divider"><div className="eb">PARTE II</div><h1>{f.parteII || 'Perfil personalizado'}</h1></div>
    </>
  )
}
