import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import InformeRouter from "./InformeRouter";

const base = {
  id: "resultado-1",
  test_slug: "big-five",
  test_nombre: "Big Five",
  fecha: "2026-07-24T12:00:00Z",
  catalogo_version: "abc1234567890",
  algoritmo_version: "def9876543210",
  audiencia: "persona",
  evaluado: { nombre: "Santiago", apellido: "Test" },
  empresa: null,
  contexto: { tipo: "seleccion", puesto: "Analista" },
  configuracion: { titulo: "Informe Big Five" },
  aviso: "No constituye un diagnóstico clínico.",
  resultado: {
    escala_principal: {
      puntuacion: 32,
      percentil: 70,
      interpretacion: "Nivel informado por el instrumento.",
    },
  },
};

describe("InformeRouter", () => {
  it("presenta puntaje, baremo e interpretación como conceptos separados", () => {
    render(<MemoryRouter><InformeRouter informe={base} /></MemoryRouter>);
    expect(screen.getByText("Puntaje")).toBeInTheDocument();
    expect(screen.getByText("Baremo")).toBeInTheDocument();
    expect(screen.getByText("Interpretación")).toBeInTheDocument();
    expect(screen.getByText(/No constituye un diagnóstico/)).toBeInTheDocument();
    expect(screen.getByText("Versión del algoritmo")).toBeInTheDocument();
    expect(screen.getByText("Informe personal")).toBeInTheDocument();
  });

  it("bloquea explícitamente InformeExcel", () => {
    render(
      <MemoryRouter>
        <InformeRouter informe={{ ...base, test_slug: "excel-inicial" }} />
      </MemoryRouter>
    );
    expect(screen.getByRole("alert")).toHaveTextContent("no está habilitado");
  });

  it("presenta un estado explícito cuando no hay datos informables", () => {
    render(
      <MemoryRouter>
        <InformeRouter informe={{ ...base, resultado: {} }} />
      </MemoryRouter>
    );
    expect(screen.getByText("Este resultado no contiene datos presentables.")).toBeInTheDocument();
  });
});
