import { apiFetch } from "../api/client";

export function loginEvaluado(email, password, signal) {
  return apiFetch("/auth/evaluado/login", {
    method: "POST",
    form: true,
    body: { username: email.trim().toLowerCase(), password },
    signal,
  });
}

export function meEvaluado(token, signal) {
  return apiFetch("/yo/me", { token, signal });
}

export function listarAsignacionesEvaluado(token, signal) {
  return apiFetch("/yo/asignaciones", { token, signal });
}

export function guardarResultadoEvaluado(token, slug, respuestas, signal) {
  return apiFetch(`/yo/asignaciones/${encodeURIComponent(slug)}/resultado`, {
    method: "POST",
    token,
    body: { respuestas },
    signal,
  });
}

export function getPreguntas(slug, signal) {
  return apiFetch(`/tests/${encodeURIComponent(slug)}/preguntas`, { signal });
}

export function calcular(slug, respuestas, signal) {
  return apiFetch(`/tests/${encodeURIComponent(slug)}/calcular`, {
    method: "POST",
    body: { respuestas },
    signal,
  });
}
