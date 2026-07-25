import { apiFetch } from "./client";

export const obtenerInforme = (token, resultadoId, signal) =>
  apiFetch(`/informes/${resultadoId}`, { token, signal });
