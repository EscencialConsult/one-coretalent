import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cerrarSesionPersona,
  guardarTokenPersona,
  obtenerTokenPersona,
  PERSONA_SESSION_EVENT,
} from "./personaSession";

describe("sesión de Persona", () => {
  beforeEach(() => localStorage.clear());

  it("guarda y elimina el token notificando el cambio de sesión", () => {
    const listener = vi.fn();
    window.addEventListener(PERSONA_SESSION_EVENT, listener);

    guardarTokenPersona("token-seguro");
    expect(obtenerTokenPersona()).toBe("token-seguro");

    cerrarSesionPersona();
    expect(obtenerTokenPersona()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);
    window.removeEventListener(PERSONA_SESSION_EVENT, listener);
  });
});
