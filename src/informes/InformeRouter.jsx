import InformeLayout from "./InformeLayout";

const EXCLUIDOS = new Set([
  "excel-inicial",
  "excel-intermedio",
  "excel-avanzado",
  "informe-integral-ia",
]);

const RENDERERS = {
  "big-five": InformeLayout,
  disc: InformeLayout,
  stai: InformeLayout,
  kuder: InformeLayout,
  "wais-iv": InformeLayout,
  "toulouse-pieron": InformeLayout,
  "domino-48": InformeLayout,
  chaside: InformeLayout,
  "baron-eqi": InformeLayout,
  cad: InformeLayout,
  eneagrama: InformeLayout,
  "gds-15": InformeLayout,
  "ipp-r": InformeLayout,
  "dnla-leadership": InformeLayout,
  "dnla-percepcion-personal": InformeLayout,
};

export default function InformeRouter({ informe }) {
  if (EXCLUIDOS.has(informe.test_slug)) {
    return <div role="alert" className="tarjeta p-8">Este tipo de informe no está habilitado.</div>;
  }
  const Componente = RENDERERS[informe.test_slug] || InformeLayout;
  return <Componente informe={informe} />;
}
