import { describe, expect, it } from "vitest";
import { obtenerRunner, TESTS_RENDIBLES } from "./runnerRegistry";

describe("registro de runners psicométricos", () => {
  it("expone los 15 tests autorizados y excluye Excel", () => {
    expect(TESTS_RENDIBLES.size).toBe(15);
    expect(TESTS_RENDIBLES).toEqual(expect.objectContaining(new Set([
      "big-five",
      "disc",
      "domino-48",
      "wais-iv",
      "toulouse-pieron",
    ])));
    expect(TESTS_RENDIBLES.has("excel-inicial")).toBe(false);
  });

  it("resuelve runner especializado y genérico", () => {
    expect(obtenerRunner("disc")).not.toBe(obtenerRunner("big-five"));
    expect(obtenerRunner("big-five")).toBe(obtenerRunner("cad"));
  });
});
