function celda(valor) {
  const texto = valor === null || valor === undefined ? "" : String(valor);
  return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/** Arma un CSV a partir de encabezados + filas (array de arrays) y dispara la descarga. */
export function descargarCsv(nombreArchivo, encabezados, filas) {
  const lineas = [encabezados, ...filas].map((fila) => fila.map(celda).join(","));
  const csv = "﻿" + lineas.join("\r\n"); // BOM para que Excel detecte UTF-8
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
