import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ADMIN_TOKEN_KEY,
  eliminarToken,
  guardarToken,
  leerToken,
  payloadJwt,
  SESSION_CHANGED_EVENT,
  tokenExpirado,
} from "./session";

function tokenCon(payload) {
  const encoded = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `header.${encoded}.firma`;
}

describe("infraestructura de sesión", () => {
  beforeEach(() => localStorage.clear());

  it("decodifica claims y detecta expiración", () => {
    const vigente = tokenCon({ sub: "123", exp: 2_000 });
    expect(payloadJwt(vigente)).toMatchObject({ sub: "123", exp: 2_000 });
    expect(tokenExpirado(vigente, 1_000_000)).toBe(false);
    expect(tokenExpirado(vigente, 2_000_000)).toBe(true);
    expect(tokenExpirado("token-invalido")).toBe(true);
  });

  it("persiste y elimina tokens notificando el tipo de sesión", () => {
    const listener = vi.fn();
    window.addEventListener(SESSION_CHANGED_EVENT, listener);
    guardarToken(ADMIN_TOKEN_KEY, "token");
    expect(leerToken(ADMIN_TOKEN_KEY)).toBe("token");
    eliminarToken(ADMIN_TOKEN_KEY);
    expect(leerToken(ADMIN_TOKEN_KEY)).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[0][0].detail.key).toBe(ADMIN_TOKEN_KEY);
    window.removeEventListener(SESSION_CHANGED_EVENT, listener);
  });
});
