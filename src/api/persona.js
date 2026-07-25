import { apiFetch } from "./client";

export const obtenerMiPerfil = (token, signal) =>
  apiFetch("/personas/me/perfil", { token, signal });
export const actualizarMiPerfil = (token, body) =>
  apiFetch("/personas/me/perfil", { method: "PUT", token, body });
export const actualizarMiCv = (token, body) =>
  apiFetch("/personas/me/cv", { method: "POST", token, body });
export const cambiarMiPassword = (token, body) =>
  apiFetch("/personas/me/password", { method: "POST", token, body });
export const listarMisPostulaciones = (token, signal) =>
  apiFetch("/personas/me/postulaciones", { token, signal });
export const obtenerMiPostulacion = (token, id, signal) =>
  apiFetch(`/personas/me/postulaciones/${id}`, { token, signal });
export const listarMisConsentimientos = (token, signal) =>
  apiFetch("/personas/me/consentimientos", { token, signal });
export const listarMisEvaluaciones = (token, signal) =>
  apiFetch("/personas/me/evaluaciones", { token, signal });
export const listarMisResultados = (token, signal) =>
  apiFetch("/personas/me/resultados", { token, signal });
export const obtenerResultado = (token, id, signal) =>
  apiFetch(`/resultados/${id}`, { token, signal });
export const iniciarAsignacion = (token, id) =>
  apiFetch(`/asignaciones/${id}/iniciar`, {
    method: "POST",
    token,
    body: { acepta_consentimiento: true },
  });
export const guardarRespuestasAsignacion = (token, id, respuestas, signal) =>
  apiFetch(`/asignaciones/${id}/respuestas`, {
    method: "POST",
    token,
    body: { respuestas },
    signal,
  });
export const finalizarAsignacion = (token, id, respuestas) =>
  apiFetch(`/asignaciones/${id}/finalizar`, {
    method: "POST",
    token,
    body: { respuestas },
  });
export const obtenerPreguntasTest = (slug, signal) =>
  apiFetch(`/tests/${encodeURIComponent(slug)}/preguntas`, { signal });
