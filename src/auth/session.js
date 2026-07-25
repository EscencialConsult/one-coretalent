export const ADMIN_TOKEN_KEY = "ct_token_admin";
export const PERSONA_TOKEN_KEY = "ct_token_persona";
export const EVALUADO_TOKEN_KEY = "ct_token_evaluado";
export const SESSION_CHANGED_EVENT = "core-talent:session-changed";
export const UNAUTHORIZED_EVENT = "core-talent:unauthorized";

export function leerToken(key) {
  return localStorage.getItem(key);
}

export function guardarToken(key, token) {
  localStorage.setItem(key, token);
  notificarCambio(key);
}

export function eliminarToken(key) {
  localStorage.removeItem(key);
  notificarCambio(key);
}

export function payloadJwt(token) {
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalizado = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (normalizado.length % 4)) % 4);
    return JSON.parse(decodeURIComponent(escape(atob(normalizado + padding))));
  } catch {
    return null;
  }
}

export function tokenExpirado(token, ahoraMs = Date.now()) {
  const payload = payloadJwt(token);
  return !payload?.exp || payload.exp * 1000 <= ahoraMs;
}

export function notificarNoAutorizado(token) {
  window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: { token } }));
}

function notificarCambio(key) {
  window.dispatchEvent(new CustomEvent(SESSION_CHANGED_EVENT, { detail: { key } }));
}
