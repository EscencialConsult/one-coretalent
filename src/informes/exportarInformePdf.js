function lineasResultado(resultado, prefijo = "") {
  return Object.entries(resultado || {}).flatMap(([clave, valor]) => {
    const titulo = `${prefijo}${clave.replaceAll("_", " ")}`;
    if (valor && typeof valor === "object" && !Array.isArray(valor)) {
      return [titulo, ...lineasResultado(valor, `${titulo} · `)];
    }
    const contenido = Array.isArray(valor)
      ? valor.map((item) => typeof item === "object" ? JSON.stringify(item) : item).join(" · ")
      : String(valor ?? "No informado");
    return `${titulo}: ${contenido}`;
  });
}

export async function exportarInformePdf(informe) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const margen = 18;
  const ancho = 174;
  let y = 20;
  const escribir = (texto, tamaño = 10, espacio = 6) => {
    pdf.setFontSize(tamaño);
    const lineas = pdf.splitTextToSize(String(texto), ancho);
    if (y + lineas.length * espacio > 280) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(lineas, margen, y);
    y += lineas.length * espacio;
  };
  escribir(informe.empresa?.razon_social || "ONE CoreTalent", 10, 7);
  escribir(informe.configuracion?.titulo || informe.test_nombre, 18, 8);
  escribir(`${informe.evaluado?.nombre || ""} ${informe.evaluado?.apellido || ""}`.trim(), 12, 7);
  escribir(`Fecha: ${new Date(informe.fecha).toLocaleDateString("es-AR")} · Versión del test: ${informe.catalogo_version || "histórica"}`, 9, 6);
  if (informe.contexto?.puesto) escribir(`Contexto: proceso de selección · ${informe.contexto.puesto}`, 9, 6);
  y += 3;
  lineasResultado(informe.resultado).forEach((linea) => escribir(linea, 9, 5));
  y += 3;
  escribir(informe.aviso, 8, 5);
  pdf.save(`informe-${informe.test_slug}-${informe.id}.pdf`);
}
