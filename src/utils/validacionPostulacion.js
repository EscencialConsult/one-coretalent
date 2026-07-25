export const CV_MAX_BYTES = 5 * 1024 * 1024;

export function validarPasoPostulacion({ paso, form, idiomas, cvFile, firma }) {
  if (paso === 0) {
    if (!form.nombre.trim() || !form.apellido.trim() || !form.email.trim()) {
      return "Completá nombre, apellido y email para continuar.";
    }
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(form.email.trim())) {
      return "Ingresá un email válido.";
    }
  }

  if (paso === 2) {
    const idiomaIncompleto = idiomas.some(
      (item) => Boolean(item.idioma.trim()) !== Boolean(item.nivel)
    );
    if (idiomaIncompleto) {
      return "Completá idioma y nivel, o dejá ambos campos vacíos.";
    }
  }

  if (paso === 4) {
    if (form.password && form.password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres.";
    }
    if (cvFile && cvFile.type !== "application/pdf") {
      return "El currículum debe ser un archivo PDF.";
    }
    if (cvFile && cvFile.size > CV_MAX_BYTES) {
      return "El currículum no puede superar los 5 MB.";
    }
  }

  if (paso === 5 && !firma) {
    return "Falta la firma de consentimiento.";
  }

  return "";
}
