import { useState } from "react";
import { Link } from "react-router-dom";
import { BloqueResultado } from "./InformeComponentes";

export default function InformeLayout({ informe }) {
  const [exportando, setExportando] = useState(false);
  const color = informe.empresa?.color_acento || "#4d248f";
  const volver = informe.audiencia === "persona" ? "/candidato/resultados" : "/empresa/postulantes";

  async function descargar() {
    setExportando(true);
    try {
      const { exportarInformePdf } = await import("./exportarInformePdf");
      await exportarInformePdf(informe);
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
      <article className="informe-documento">
        <header className="informe-cabecera">
          <div>
            <p className="informe-marca">{informe.empresa?.razon_social || "ONE CoreTalent"}</p>
            <h1>{informe.configuracion?.titulo || informe.test_nombre}</h1>
            {informe.configuracion?.subtitulo && <p>{informe.configuracion.subtitulo}</p>}
          </div>
          {informe.empresa?.logo_url && <img src={informe.empresa.logo_url} alt={`Logo de ${informe.empresa.razon_social}`} />}
        </header>
        <section className="informe-meta" aria-label="Datos del informe">
          <div><span>Evaluado</span><strong>{informe.evaluado?.nombre} {informe.evaluado?.apellido}</strong></div>
          <div><span>Fecha</span><strong>{new Date(informe.fecha).toLocaleDateString("es-AR")}</strong></div>
          <div><span>Versión del test</span><strong title={informe.catalogo_version}>{informe.catalogo_version?.slice(0, 12) || "Histórica"}</strong></div>
          <div><span>Contexto</span><strong>{informe.contexto?.puesto ? `Selección · ${informe.contexto.puesto}` : "Evaluación individual"}</strong></div>
        </section>
        <section className="informe-seccion">
          <h2>Resultados</h2>
          <p className="informe-aclaracion">Los puntajes fueron calculados por el servidor. Se presentan por separado del baremo y de su interpretación.</p>
          <div className="informe-datos">
            {Object.entries(informe.resultado || {}).map(([nombre, valor]) => (
              <BloqueResultado key={nombre} nombre={nombre} valor={valor} />
            ))}
          </div>
        </section>
        <footer className="informe-aviso">{informe.aviso}</footer>
      </article>
    </main>
  );
}
