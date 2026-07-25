import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CapturaSelfie from "./CapturaSelfie";

describe("CapturaSelfie", () => {
  afterEach(cleanup);
  beforeEach(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn() },
    });
  });

  it("ofrece cámara en vivo y carga manual como alternativa", () => {
    render(<CapturaSelfie archivo={null} onCambio={() => {}} />);
    expect(screen.getByRole("button", { name: "Usar cámara" })).toBeInTheDocument();
    expect(screen.getByText("Subir foto")).toBeInTheDocument();
    expect(screen.getByText("La cámara se utiliza solamente para capturar esta foto. Se apaga al confirmar, cancelar o salir de la página.")).toBeInTheDocument();
  });

  it("explica cómo continuar cuando se deniega el permiso", async () => {
    navigator.mediaDevices.getUserMedia.mockRejectedValue(
      Object.assign(new Error("denegado"), { name: "NotAllowedError" })
    );
    render(<CapturaSelfie archivo={null} onCambio={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Usar cámara" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("No diste permiso"));
    expect(screen.getByText("Subir foto")).toBeInTheDocument();
  });
});
