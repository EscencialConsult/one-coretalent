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
export const listarCatalogoTestsEmpresa = (token) =>
  apiFetch("/empresa/catalogo-tests", { token });
export const listarMisTestsEmpresa = (token) => apiFetch("/empresa/tests", { token });
export const listarEvaluacionesPostulacion = (token, vacanteId, postulacionId) =>
  apiFetch(`/vacantes/${vacanteId}/postulaciones/${postulacionId}/evaluaciones`, { token });
// Todas las evaluaciones de todas las postulaciones de la empresa, en 1 sola llamada — usar
// esta en listados (Postulantes.jsx), no la de arriba en un loop (era N llamados en paralelo).
export const listarEvaluacionesTodasPostulaciones = (token) =>
  apiFetch("/postulaciones/evaluaciones", { token });
export const asignarEvaluacionPostulacion = (token, vacanteId, postulacionId, testSlug) =>
  apiFetch(`/vacantes/${vacanteId}/postulaciones/${postulacionId}/evaluaciones`, {
    method: "POST",
    token,
    body: { test_slug: testSlug },
  });
export const revocarAccesoResultado = (token, accesoId) =>
  apiFetch(`/accesos-resultados/${accesoId}/revocar`, {
    method: "POST",
    token,
  });
export const aplicarTestsRequeridos = (token, vacanteId) =>
  apiFetch(`/vacantes/${vacanteId}/evaluaciones/aplicar-requeridos`, {
    method: "POST",
    token,
  });

// ── Panel de la empresa ───────────────────────────────────────────────────────
export const obtenerResumenEmpresa = (token) => apiFetch("/empresa/resumen", { token });
export const obtenerMiEmpresa = (token) => apiFetch("/empresa/me", { token });
