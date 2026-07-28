import { useState } from "react";
import { Link } from "react-router-dom";
import InformeBaronEQi from "./InformeBaronEQi.jsx";
import InformeBigFive from "./InformeBigFive.jsx";
import InformeCAD from "./InformeCAD.jsx";
import InformeChaside from "./InformeChaside.jsx";
import InformeDisc from "./InformeDisc.jsx";
import InformeDnla from "./InformeDnla.jsx";
import InformeDnlaLeadership from "./InformeDnlaLeadership.jsx";
import InformeDomino from "./InformeDomino.jsx";
import InformeEneagrama from "./InformeEneagrama.jsx";
import InformeGds15 from "./InformeGds15.jsx";
import InformeIppr from "./InformeIppr.jsx";
import InformeKuder from "./InformeKuder.jsx";
import InformeStai from "./InformeStai.jsx";
import InformeToulouse from "./InformeToulouse.jsx";
import InformeWais from "./InformeWais.jsx";
import "./informe.css";

// Excel y el informe integral con IA quedan fuera del alcance de esta plataforma (ver PLATAFORMA.md).
const EXCLUIDOS = new Set(["excel-inicial", "excel-intermedio", "excel-avanzado", "informe-integral-ia"]);

// Mismo diseño y lógica que cada test tenía en la Plataforma ONE original — un componente
// por instrumento, no un renderizador genérico (ver plan de conexión con Facundo).
const INFORMES = {
  "baron-eqi": InformeBaronEQi,
  "big-five": InformeBigFive,
  cad: InformeCAD,
  chaside: InformeChaside,
  disc: InformeDisc,
  "dnla-percepcion-personal": InformeDnla,
  "dnla-leadership": InformeDnlaLeadership,
  "domino-48": InformeDomino,
  eneagrama: InformeEneagrama,
  "gds-15": InformeGds15,
  "ipp-r": InformeIppr,
  kuder: InformeKuder,
  stai: InformeStai,
  "toulouse-pieron": InformeToulouse,
  "wais-iv": InformeWais,
};

function nombreArchivo(informe) {
  const t = (informe?.test_nombre || "Informe").replace(/[^\w\sÁÉÍÓÚáéíóúÑñ-]/g, "").trim().replace(/\s+/g, "-");
  const ev = informe?.evaluado ? `-${informe.evaluado.nombre}-${informe.evaluado.apellido}` : "";
  return `Informe-${t}${ev}`.replace(/[^\w-]/g, "") + ".pdf";
}

export default function InformeRouter({ informe }) {
  const [bajando, setBajando] = useState(false);
  const [errorPdf, setErrorPdf] = useState("");
  const color = informe.empresa?.color_acento || "#B4272D";
  const volver = informe.audiencia === "persona"
    ? "/candidato/resultados"
    : informe.contexto?.vacante_id && informe.contexto?.postulacion_id
      ? `/empresa/vacantes/${informe.contexto.vacante_id}/postulaciones/${informe.contexto.postulacion_id}`
      : "/empresa/postulantes";

  if (EXCLUIDOS.has(informe.test_slug)) {
    return <div role="alert" className="tarjeta p-8">Este tipo de informe no está habilitado.</div>;
  }
  const Informe = INFORMES[informe.test_slug];

  async function descargarPdf() {
    const origen = document.querySelector(".inf-doc");
    if (!origen || bajando) return;
    setBajando(true);
    setErrorPdf("");
    const ANCHO = 760;
    const envoltorio = document.createElement("div");
    envoltorio.style.cssText = `position:fixed; left:0; top:0; width:${ANCHO}px; z-index:99999; background:#ffffff;`;
    const clon = origen.cloneNode(true);
    clon.style.width = `${ANCHO}px`;
    clon.style.maxWidth = `${ANCHO}px`;
    clon.style.margin = "0";
    clon.style.boxSizing = "border-box";
    clon.style.padding = "6px 46px";
    envoltorio.appendChild(clon);
    document.body.appendChild(envoltorio);
    try {
      const mod = await import("html2pdf.js/dist/html2pdf.bundle.min.js");
      const html2pdf = window.html2pdf || mod.default || mod;
      if (typeof html2pdf !== "function") throw new Error("html2pdf no disponible");
      await html2pdf().set({
        margin: [12, 12, 14, 12],
        filename: nombreArchivo(informe),
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"], avoid: [".inf-sheet", ".inf-two", ".inf-cover", ".bf-bar", "tr", ".inf-resultrow"] },
      }).from(clon).save();
    } catch {
      setErrorPdf("No se pudo generar el PDF. Probá de nuevo o usá Imprimir.");
    } finally {
      document.body.removeChild(envoltorio);
      setBajando(false);
    }
  }

  return (
    <div className="inf-body" style={{ "--brand-acento": color }}>
      <div className="inf-toolbar no-imprimir">
        <Link className="inf-back" to={volver}>← Volver</Link>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="inf-back" onClick={() => window.print()}>Imprimir</button>
          <button type="button" className="inf-print" disabled={bajando} onClick={descargarPdf}>
            {bajando ? "Generando PDF…" : "Descargar PDF"}
          </button>
        </div>
      </div>
      {errorPdf && <div className="inf-doc"><div className="inf-sheet"><div className="inf-pad" role="alert">{errorPdf}</div></div></div>}
      {Informe ? (
        <Informe data={{ ...informe, datos: informe.resultado, created_at: informe.fecha }} />
      ) : (
        <div className="inf-doc"><div className="inf-sheet"><div className="inf-pad">
          <h2 className="inf-sec">{informe.test_nombre}</h2>
          <p className="inf-tx">El informe con diseño para este test todavía no está disponible.</p>
        </div></div></div>
      )}
    </div>
  );
}
