import { apiFetch } from "./client";

// ── Vacantes (panel de empresa) ─────────────────────────────────────────────
export const listarVacantes = (token) => apiFetch("/vacantes", { token });
export const obtenerVacante = (token, id) => apiFetch(`/vacantes/${id}`, { token });
export const crearVacante = (token, data) => apiFetch("/vacantes", { method: "POST", token, body: data });
export const actualizarVacante = (token, id, data) =>
  apiFetch(`/vacantes/${id}`, { method: "PUT", token, body: data });
export const cambiarEstadoVacante = (token, id, estado) =>
  apiFetch(`/vacantes/${id}/estado`, { method: "PATCH", token, body: { estado } });
export const eliminarVacante = (token, id) => apiFetch(`/vacantes/${id}`, { method: "DELETE", token });

// ── Postulaciones ────────────────────────────────────────────────────────────
export const listarPostulaciones = (token, vacanteId) =>
  apiFetch(`/vacantes/${vacanteId}/postulaciones`, { token });
export const listarTodasPostulaciones = (token) =>
  apiFetch("/postulaciones", { token });
