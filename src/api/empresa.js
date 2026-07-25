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

// ── Tests / evaluaciones ─────────────────────────────────────────────────────
export const misTests = (token) => apiFetch("/empresa/tests", { token });
export const listarEvaluacionesPostulante = (token, vacanteId, postulacionId) =>
  apiFetch(`/vacantes/${vacanteId}/postulaciones/${postulacionId}/evaluaciones`, { token });
export const asignarEvaluacionPostulante = (token, vacanteId, postulacionId, testSlug) =>
  apiFetch(`/vacantes/${vacanteId}/postulaciones/${postulacionId}/evaluaciones`, {
    method: "POST",
    token,
    body: { test_slug: testSlug },
  });
