import { useState } from "react";
import { Link } from "react-router-dom";
import { BloqueResultado } from "./InformeComponentes";

export default function InformeLayout({ informe }) {
  const [exportando, setExportando] = useState(false);
  const [errorExportacion, setErrorExportacion] = useState("");
  const color = informe.empresa?.color_acento || "#4d248f";
  const volver = informe.audiencia === "persona"
    ? "/candidato/resultados"
    : informe.contexto?.vacante_id && informe.contexto?.postulacion_id
      ? `/empresa/vacantes/${informe.contexto.vacante_id}/postulaciones/${informe.contexto.postulacion_id}`
      : "/empresa/postulantes";

  async function descargar() {
    setExportando(true);
    setErrorExportacion("");
    try {
      const { exportarInformePdf } = await import("./exportarInformePdf");
      await exportarInformePdf(informe);
    } catch {
      setErrorExportacion("No se pudo generar el PDF. Podés reintentar o usar la opción Imprimir.");
    } finally {
      setExportando(false);
    }
  }

  return (
    <main className="informe-pagina" style={{ "--informe-acento": color }}>
      <nav className="informe-acciones no-imprimir" aria-label="Acciones del informe">
        <Link to={volver}>← Volver</Link>
        <button type="button" onClick={() => window.print()}>Imprimir</button>
        <button type="button" onClick={descargar} disabled={exportando}>
          {exportando ? "Generando PDF…" : "Descargar PDF"}
        </button>
      </nav>
      {errorExportacion && <p className="informe-error no-imprimir" role="alert">{errorExportacion}</p>}
      <article className="informe-documento">
        <header className="informe-cabecera">
          <div>
            <p className="informe-marca">{informe.empresa?.razon_social || "ONE CoreTalent"}</p>
            <h1>{informe.configuracion?.titulo || informe.test_nombre}</h1>
            {informe.configuracion?.subtitulo && <p>{informe.configuracion.subtitulo}</p>}
            <p className="informe-audiencia">
              {informe.audiencia === "persona" ? "Informe personal" : "Informe para la empresa"}
            </p>
          </div>
          {informe.empresa?.logo_url && <img src={informe.empresa.logo_url} alt={`Logo de ${informe.empresa.razon_social}`} />}
        </header>
        <section className="informe-meta" aria-label="Datos del informe">
          <div><span>Evaluado</span><strong>{informe.evaluado?.nombre} {informe.evaluado?.apellido}</strong></div>
          <div><span>Fecha</span><strong>{new Date(informe.fecha).toLocaleDateString("es-AR")}</strong></div>
          <div><span>Versión del test</span><strong title={informe.catalogo_version}>{informe.catalogo_version?.slice(0, 12) || "Histórica"}</strong></div>
          <div><span>Versión del algoritmo</span><strong title={informe.algoritmo_version}>{informe.algoritmo_version?.slice(0, 12) || "Histórica"}</strong></div>
          <div><span>Contexto</span><strong>{informe.contexto?.puesto ? `Selección · ${informe.contexto.puesto}` : "Evaluación individual"}</strong></div>
        </section>
        <section className="informe-seccion">
          <h2>Resultados</h2>
          <p className="informe-aclaracion">Los puntajes fueron calculados por el servidor. Se presentan por separado del baremo y de su interpretación.</p>
          {!Object.keys(informe.resultado || {}).length ? (
            <p className="informe-vacio">Este resultado no contiene datos presentables.</p>
          ) : <div className="informe-datos">
            {Object.entries(informe.resultado).map(([nombre, valor]) => (
              <BloqueResultado key={nombre} nombre={nombre} valor={valor} />
            ))}
          </div>}
        </section>
        <footer className="informe-aviso">{informe.aviso}</footer>
      </article>
    </main>
  );
}
