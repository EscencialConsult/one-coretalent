import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PostulacionEmpresaDetalle from "./PostulacionEmpresaDetalle";

const api = vi.hoisted(() => ({
  obtenerVacante: vi.fn(),
  listarPostulaciones: vi.fn(),
  listarEvaluacionesPostulacion: vi.fn(),
  listarCatalogoTestsEmpresa: vi.fn(),
  asignarEvaluacionPostulacion: vi.fn(),
  revocarAccesoResultado: vi.fn(),
}));

vi.mock("../../auth/useAuth", () => ({
  useAuth: () => ({ token: "token-empresa" }),
}));

vi.mock("../../api/empresa", () => api);

describe("PostulacionEmpresaDetalle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.obtenerVacante.mockResolvedValue({ id: "vac-1", puesto: "QA S2" });
    api.listarPostulaciones.mockResolvedValue([{
      id: "post-1",
      nombre: "Santiago",
      apellido: "Prueba",
      email: "candidato@example.com",
      perfil_profesional: "QA Automation",
      cv_url: "https://storage.example/cv.pdf",
    }]);
    api.listarEvaluacionesPostulacion.mockResolvedValue([{
      id: "asig-1",
      test_slug: "gds-15",
      test_nombre: "GDS-15",
      estado: "completado",
      reutilizada: true,
      resultado_id: "res-1",
      acceso_resultado_id: "acc-1",
      acceso_revocado: false,
      created_at: "2026-07-25T12:00:00Z",
    }]);
    api.listarCatalogoTestsEmpresa.mockResolvedValue([
      { slug: "gds-15", nombre: "GDS-15", habilitado: true, disponible: true, tomable: true },
      { slug: "disc", nombre: "DISC", habilitado: false, disponible: true, tomable: true },
    ]);
  });

  it("diferencia licencia, duplicados, reutilización e informe disponible", async () => {
    render(
      <MemoryRouter initialEntries={["/empresa/vacantes/vac-1/postulaciones/post-1"]}>
        <Routes>
          <Route
            path="/empresa/vacantes/:vacanteId/postulaciones/:postulacionId"
            element={<PostulacionEmpresaDetalle />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Santiago Prueba" })).toBeInTheDocument();
    expect(screen.getByText("Resultado reutilizado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir informe" })).toHaveAttribute(
      "href",
      "/empresa/informe/res-1",
    );

    const botonesAsignados = screen.getAllByRole("button", { name: "Ya asignada" });
    expect(botonesAsignados).toHaveLength(1);
    expect(botonesAsignados[0]).toBeDisabled();

    const noDisponible = screen.getAllByRole("button", { name: "No disponible" });
    expect(noDisponible).toHaveLength(1);
    expect(noDisponible[0]).toBeDisabled();

    await waitFor(() => expect(api.listarCatalogoTestsEmpresa).toHaveBeenCalledWith("token-empresa"));
  });
});
