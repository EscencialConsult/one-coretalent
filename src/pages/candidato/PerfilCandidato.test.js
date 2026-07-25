import { describe, expect, it } from "vitest";
import { combinarPerfilConCv } from "../../utils/perfilCandidato";

describe("combinarPerfilConCv", () => {
  it("actualiza el CV sin perder cambios del perfil todavía no guardados", () => {
    const perfilEnEdicion = {
      telefono: "+54 11 5555 0101",
      formacion: [{ institucion: "Instituto E2E" }],
      experiencias: [{ puesto: "QA Analyst" }],
      cv_nombre: null,
      cv_url: null,
    };

    const resultado = combinarPerfilConCv(perfilEnEdicion, {
      telefono: null,
      formacion: [],
      experiencias: [],
      cv_nombre: "cv-prueba.pdf",
      cv_url: "https://storage.example/cv-prueba.pdf",
    });

    expect(resultado).toEqual({
      ...perfilEnEdicion,
      cv_nombre: "cv-prueba.pdf",
      cv_url: "https://storage.example/cv-prueba.pdf",
    });
  });
});
