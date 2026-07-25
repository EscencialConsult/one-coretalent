import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/client";
import { PERSONA_TOKEN_KEY } from "./session";
import { usePersonaAuth } from "./usePersonaAuth";

const mePersonaMock = vi.fn();
vi.mock("../api/auth", () => ({
  loginPersona: vi.fn(),
  mePersona: (...args) => mePersonaMock(...args),
}));

import { PersonaAuthProvider } from "./PersonaAuthProvider";

function tokenVigente() {
  const payload = btoa(JSON.stringify({ sub: "persona-id", exp: Math.floor(Date.now() / 1000) + 3600 }))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `header.${payload}.firma`;
}

function EstadoSesion() {
  const { autenticado, errorSesion } = usePersonaAuth();
  return <div>{autenticado ? "autenticada" : errorSesion || "sin sesión"}</div>;
}

describe("PersonaAuthProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    mePersonaMock.mockReset();
  });

  it("conserva el token si el servidor está temporalmente inaccesible", async () => {
    const token = tokenVigente();
    localStorage.setItem(PERSONA_TOKEN_KEY, token);
    mePersonaMock.mockRejectedValue(new ApiError(0, "Servidor inaccesible", { code: "NETWORK_ERROR" }));

    render(<PersonaAuthProvider><EstadoSesion /></PersonaAuthProvider>);
    expect(await screen.findByText("Servidor inaccesible")).toBeInTheDocument();
    expect(localStorage.getItem(PERSONA_TOKEN_KEY)).toBe(token);
  });

  it("elimina un token rechazado por el servidor", async () => {
    localStorage.setItem(PERSONA_TOKEN_KEY, tokenVigente());
    mePersonaMock.mockRejectedValue(new ApiError(401, "Sesión vencida"));

    render(<PersonaAuthProvider><EstadoSesion /></PersonaAuthProvider>);
    await waitFor(() => expect(localStorage.getItem(PERSONA_TOKEN_KEY)).toBeNull());
    expect(screen.getByText("sin sesión")).toBeInTheDocument();
  });
});
