import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import PublicNavbar from "./PublicNavbar";

vi.mock("./Marca", () => ({ default: () => <span>ONE</span> }));

describe("PublicNavbar", () => {
  afterEach(cleanup);

  it("expone navegación y accesos diferenciados", () => {
    render(<MemoryRouter><PublicNavbar personaAutenticada={false} /></MemoryRouter>);
    const navegacion = screen.getByRole("navigation", { name: "Navegación principal" });
    expect(navegacion).toBeInTheDocument();
    expect(navegacion.querySelector('a[href="/busquedas"]')).toHaveTextContent("Oportunidades");
    expect(document.querySelector(".public-navbar-actions a.public-nav-cta")).toHaveAttribute("href", "/login");
  });

  it("abre un menú móvil accesible", () => {
    render(<MemoryRouter><PublicNavbar personaAutenticada={false} /></MemoryRouter>);
    const boton = screen.getByRole("button", { name: "Abrir menú" });
    fireEvent.click(boton);
    expect(screen.getByRole("button", { name: "Cerrar menú" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "Navegación móvil" })).toBeInTheDocument();
  });
});
