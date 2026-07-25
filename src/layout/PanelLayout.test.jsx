import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({
    user: { nombre: "Ana", apellido: "Pérez", email: "ana@empresa.com", rol: "admin_empresa" },
    logout: vi.fn(),
  }),
}));

vi.mock("../theme/useTheme", () => ({
  useTheme: () => ({
    marca: { razon_social: "ONE Core-Talent", logo_url: null },
  }),
}));

import PanelLayout from "./PanelLayout";

describe("PanelLayout", () => {
  it("abre y cierra el menú lateral accesible", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/empresa/vacantes"]}>
        <PanelLayout />
      </MemoryRouter>
    );

    const aside = container.querySelector(".panel-side");
    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    expect(aside).toHaveClass("abierto");
    fireEvent.click(screen.getByRole("button", { name: "Cerrar menú" }));
    expect(aside).not.toHaveClass("abierto");
  });
});
