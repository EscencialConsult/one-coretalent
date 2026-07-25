import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import RegistroEmpresa from "./RegistroEmpresa";

vi.mock("../../components/FirmaCanvas", () => ({
  default: () => <div aria-label="Firma del representante" />,
}));

describe("RegistroEmpresa", () => {
  afterEach(cleanup);
  it("organiza el alta en empresa, administrador y verificación", () => {
    render(<MemoryRouter><RegistroEmpresa /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Datos de la empresa" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Administrador de la cuenta" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Verificación de identidad" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Usar cámara" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar para revisión" })).toBeInTheDocument();
  });
});
