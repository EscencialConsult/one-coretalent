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

    const aside = container.querySelector(".app-sidebar");
    fireEvent.click(screen.getByRole("button", { name: "Abrir navegación" }));
    expect(aside).toHaveClass("is-open");
    fireEvent.click(screen.getByRole("button", { name: "Cerrar navegación" }));
    expect(aside).not.toHaveClass("is-open");
  });
});
