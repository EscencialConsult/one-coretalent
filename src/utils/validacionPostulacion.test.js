import { describe, expect, it } from "vitest";
import { CV_MAX_BYTES, validarPasoPostulacion } from "./validacionPostulacion";

const formValido = { nombre: "Ana", apellido: "Pérez", email: "ana@example.com", password: "" };
const base = { form: formValido, idiomas: [{ idioma: "", nivel: "" }], cvFile: null, firma: null };

describe("validarPasoPostulacion", () => {
  it("acepta un email válido en el paso de datos personales", () => {
    expect(
      validarPasoPostulacion({
        paso: 0,
        form: { ...formValido, nombre: "Santiago", apellido: "Prueba", email: "candidato@example.com" },
        idiomas: [],
        cvFile: null,
        firma: null,
      }),
    ).toBe("");
  });

  it("impide avanzar sin los datos personales obligatorios", () => {
    expect(validarPasoPostulacion({ ...base, paso: 0, form: { ...formValido, nombre: "" } })).toContain("nombre");
  });

  it("rechaza emails inválidos", () => {
    expect(validarPasoPostulacion({ ...base, paso: 0, form: { ...formValido, email: "incorrecto" } })).toContain("email válido");
  });

  it("exige idioma y nivel como pareja", () => {
    expect(validarPasoPostulacion({ ...base, paso: 2, idiomas: [{ idioma: "Inglés", nivel: "" }] })).toContain("idioma y nivel");
  });

  it("rechaza contraseñas cortas", () => {
    expect(validarPasoPostulacion({ ...base, paso: 4, form: { ...formValido, password: "1234567" } })).toContain("8 caracteres");
  });

  it("solo acepta PDF de hasta 5 MB", () => {
    expect(validarPasoPostulacion({ ...base, paso: 4, cvFile: { type: "image/png", size: 10 } })).toContain("PDF");
    expect(validarPasoPostulacion({ ...base, paso: 4, cvFile: { type: "application/pdf", size: CV_MAX_BYTES + 1 } })).toContain("5 MB");
  });

  it("exige la firma al finalizar", () => {
    expect(validarPasoPostulacion({ ...base, paso: 5 })).toContain("firma");
    expect(validarPasoPostulacion({ ...base, paso: 5, firma: "base64" })).toBe("");
  });
});
