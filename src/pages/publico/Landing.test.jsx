import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Landing from "./Landing";

describe("Landing", () => {
  afterEach(cleanup);

  it("presenta propuestas y llamados a la acción para ambos públicos", () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Conectamos el potencial");
    expect(screen.getByRole("link", { name: /Explorar oportunidades/ })).toHaveAttribute("href", "/busquedas");
    expect(screen.getByRole("heading", { name: "Tu carrera, en un espacio que te representa." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Procesos de selección con criterio y trazabilidad." })).toBeInTheDocument();
  });
});
