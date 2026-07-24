/** Lee un File del navegador y devuelve su contenido en base64 (sin el prefijo data:...;base64,). */
export function archivoABase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
