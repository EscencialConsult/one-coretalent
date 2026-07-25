import { beforeEach, describe, expect, it, vi } from "vitest";
import { UNAUTHORIZED_EVENT } from "../auth/session";
import { apiFetch, ApiError } from "./client";

function respuesta({ status = 200, data = {}, headers = {} } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (key) => headers[key.toLowerCase()] || (key === "content-type" ? "application/json" : null) },
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(""),
  };
}

describe("apiFetch", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("envía token, JSON y signal", async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn().mockResolvedValue(respuesta({ data: { ok: true } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiFetch("/recurso", { method: "POST", token: "jwt", body: { nombre: "Ana" }, signal: controller.signal })
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/recurso"),
      expect.objectContaining({
        method: "POST",
        signal: controller.signal,
        body: JSON.stringify({ nombre: "Ana" }),
        headers: expect.objectContaining({ Authorization: "Bearer jwt", "Content-Type": "application/json" }),
      })
    );
  });

  it("propaga request id y notifica un 401 autenticado", async () => {
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        respuesta({
          status: 401,
          data: { detail: "Sesión vencida" },
          headers: { "x-request-id": "req-123" },
        })
      )
    );

    const error = await apiFetch("/privado", { token: "jwt" }).catch((caught) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, detail: "Sesión vencida", requestId: "req-123" });
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });

  it("diferencia cancelación de un error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("cancelada", "AbortError")));
    await expect(apiFetch("/cancelado")).rejects.toMatchObject({ code: "ABORTED" });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(apiFetch("/offline")).rejects.toMatchObject({ code: "NETWORK_ERROR" });
  });
});
