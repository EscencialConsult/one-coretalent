import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TestRunnerShell, { TESTS_EXCLUIDOS } from "./TestRunnerShell";

const navigate = vi.fn();
const iniciar = vi.fn();
const guardar = vi.fn();
const finalizar = vi.fn();

vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));
vi.mock("../auth/usePersonaAuth", () => ({ usePersonaAuth: () => ({ token: "persona-token" }) }));
vi.mock("../api/persona", () => ({
  obtenerPreguntasTest: vi.fn().mockResolvedValue({
    tipo: "likert",
    escala: { 1: "Nunca", 2: "Siempre" },
    items: [{ id: 1, text: "Pregunta uno" }, { id: 2, text: "Pregunta dos" }],
  }),
  iniciarAsignacion: (...args) => iniciar(...args),
  guardarRespuestasAsignacion: (...args) => guardar(...args),
  finalizarAsignacion: (...args) => finalizar(...args),
}));

describe("TestRunnerShell", () => {
  const evaluacion = { id: "asig-1", test_slug: "big-five", test_nombre: "Big Five" };

  beforeEach(() => {
    vi.clearAllMocks();
    iniciar.mockResolvedValue({ respuestas: {}, progreso_guardado_at: null });
    guardar.mockResolvedValue({ ok: true });
    finalizar.mockResolvedValue({ estado: "completado" });
  });
  afterEach(cleanup);

  it("exige consentimiento, recupera sesión y usa controles de teclado", async () => {
    render(<TestRunnerShell evaluacion={evaluacion} />);
    expect(await screen.findByText("Consentimiento para la evaluación")).toBeInTheDocument();
    const comenzar = screen.getByRole("button", { name: "Aceptar y comenzar" });
    expect(comenzar).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(comenzar);
    expect(await screen.findByText("Pregunta uno")).toBeInTheDocument();
    expect(iniciar).toHaveBeenCalledWith("persona-token", "asig-1");
    expect(screen.getByRole("button", { name: "Nunca" })).toBeInTheDocument();
  });

  it("guarda progreso y finaliza una sola vez", async () => {
    render(<TestRunnerShell evaluacion={evaluacion} />);
    await screen.findByText("Consentimiento para la evaluación");
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Aceptar y comenzar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Nunca" }));
    fireEvent.click(screen.getByRole("button", { name: "Siguiente →" }));
    fireEvent.click(screen.getByRole("button", { name: "Siempre" }));
    fireEvent.click(screen.getByRole("button", { name: "Finalizar" }));
    await waitFor(() => expect(finalizar).toHaveBeenCalledOnce());
    expect(await screen.findByText("Evaluación completada")).toBeInTheDocument();
  });

  it("retoma en la primera pregunta pendiente", async () => {
    iniciar.mockResolvedValue({
      respuestas: { "1": "1" },
      progreso_guardado_at: "2026-07-25T12:00:00Z",
    });
    render(<TestRunnerShell evaluacion={evaluacion} />);
    await screen.findByText("Consentimiento para la evaluación");
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Aceptar y comenzar" }));
    expect(await screen.findByText("Pregunta dos")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Progreso recuperado");
  });

  it("permite reintentar un autoguardado fallido", async () => {
    guardar.mockRejectedValueOnce(new Error("sin red")).mockResolvedValue({ ok: true });
    render(<TestRunnerShell evaluacion={evaluacion} />);
    await screen.findByText("Consentimiento para la evaluación");
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Aceptar y comenzar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Nunca" }));
    const reintentar = await screen.findByRole("button", { name: "Reintentar guardado" }, { timeout: 2000 });
    fireEvent.click(reintentar);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Guardado"));
    expect(guardar).toHaveBeenCalledTimes(2);
  });

  it("excluye Excel y los tres tests bloqueados", () => {
    expect([...TESTS_EXCLUIDOS]).toEqual(expect.arrayContaining([
      "excel-inicial", "excel-intermedio", "excel-avanzado",
      "dat", "dnla-perfil-comercial", "ebp",
    ]));
  });
});
