import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { vacantesPublicas } from "../../api/publico";
import Busquedas from "./Busquedas";

vi.mock("../../api/publico", () => ({
  vacantesPublicas: vi.fn(),
}));

const VACANTES = [
  {
    id: "vacante-1",
    empresa: "Empresa Demo",
    puesto: "Analista de Datos",
    area: "Datos",
    localidad: "CABA",
    provincia: "Buenos Aires",
    modalidad: "hibrido",
    tipo_contrato: "Relación de dependencia",
    descripcion: "Análisis y visualización de información.",
    salario_min: 1000000,
    salario_max: 1500000,
    ocultar_salario: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "vacante-2",
    empresa: "Producto Demo",
    puesto: "Frontend React",
    area: "Tecnología",
    localidad: "Córdoba",
    provincia: "Córdoba",
    modalidad: "remoto",
    tipo_contrato: "Freelance",
    descripcion: "Experiencias web accesibles.",
    ocultar_salario: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

describe("Busquedas", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("filtra oportunidades y permite abrir el detalle accesible", async () => {
    vacantesPublicas.mockResolvedValue(VACANTES);
    render(<MemoryRouter><Busquedas /></MemoryRouter>);

    expect(await screen.findByRole("heading", { name: "Analista de Datos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Frontend React" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Buscar oportunidades"), { target: { value: "datos" } });
    expect(screen.getByRole("heading", { name: "Analista de Datos" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Frontend React" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ver detalle de Analista de Datos" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Postularme ahora/ })).toHaveAttribute("href", "/postular/vacante-1");
  });

  it("ofrece reintentar cuando la carga falla", async () => {
    vacantesPublicas.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(VACANTES);
    render(<MemoryRouter><Busquedas /></MemoryRouter>);

    expect(await screen.findByText("No pudimos cargar las oportunidades")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Intentar nuevamente" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Analista de Datos" })).toBeInTheDocument());
  });
});
