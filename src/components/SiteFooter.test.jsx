import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import SiteFooter from "./SiteFooter";

describe("SiteFooter", () => {
  it("expone navegación, legales, soporte y créditos sin enlaces rotos", () => {
    render(<MemoryRouter><SiteFooter /></MemoryRouter>);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Plataforma" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Legal" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Política de Privacidad" })).toHaveAttribute("href", "/politica-privacidad");
    expect(screen.getByRole("link", { name: "Términos y Condiciones" })).toHaveAttribute("href", "/terminos-condiciones");
    expect(screen.getByRole("link", { name: /Contactar al soporte por WhatsApp/ })).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Fundación para el Desarrollo Profesional")).toBeInTheDocument();
  });
});
