import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/client";
import { EVALUADO_TOKEN_KEY } from "./session";
import { useEvaluadoAuth } from "./useEvaluadoAuth";

const meEvaluadoMock = vi.fn();
vi.mock("../evaluado/api", () => ({
  loginEvaluado: vi.fn(),
  meEvaluado: (...args) => meEvaluadoMock(...args),
}));

import { EvaluadoAuthProvider } from "./EvaluadoAuthProvider";

function tokenVigente() {
  const payload = btoa(JSON.stringify({
    sub: "evaluado-id",
    rol: "evaluado",
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `header.${payload}.firma`;
}

function Estado() {
  const { autenticado, errorSesion } = useEvaluadoAuth();
  return <div>{autenticado ? "autenticado" : errorSesion || "sin sesión"}</div>;
}

describe("EvaluadoAuthProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    meEvaluadoMock.mockReset();
  });

  it("conserva la sesión ante una caída temporal", async () => {
    const token = tokenVigente();
    localStorage.setItem(EVALUADO_TOKEN_KEY, token);
    meEvaluadoMock.mockRejectedValue(new ApiError(0, "Servidor inaccesible", { code: "NETWORK_ERROR" }));

    render(<EvaluadoAuthProvider><Estado /></EvaluadoAuthProvider>);
    expect(await screen.findByText("Servidor inaccesible")).toBeInTheDocument();
    expect(localStorage.getItem(EVALUADO_TOKEN_KEY)).toBe(token);
  });

  it("elimina una sesión rechazada", async () => {
    localStorage.setItem(EVALUADO_TOKEN_KEY, tokenVigente());
    meEvaluadoMock.mockRejectedValue(new ApiError(401, "Sesión vencida"));

    render(<EvaluadoAuthProvider><Estado /></EvaluadoAuthProvider>);
    await waitFor(() => expect(localStorage.getItem(EVALUADO_TOKEN_KEY)).toBeNull());
    expect(screen.getByText("sin sesión")).toBeInTheDocument();
  });
});
