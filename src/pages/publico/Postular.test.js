import { describe, expect, it } from "vitest";
import { RUTA_BUSQUEDAS_TRAS_POSTULACION } from "./Postular";

describe("cierre de postulación", () => {
  it("regresa a las búsquedas internas del portal candidato", () => {
    expect(RUTA_BUSQUEDAS_TRAS_POSTULACION).toBe("/candidato/busquedas");
  });
});
