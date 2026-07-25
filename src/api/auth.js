import { apiFetch } from "./client";

// SuperAdmin y Admin de Empresa comparten login (el rol viene en el JWT).
export const loginAdmin = (email, password) =>
  apiFetch("/auth/login", { method: "POST", form: true, body: { username: email, password } });

export const meAdmin = (token, signal) => apiFetch("/auth/me", { token, signal });

export const loginPersona = (email, password) =>
  apiFetch("/auth/persona/login", { method: "POST", form: true, body: { username: email, password } });

export const mePersona = (token, signal) => apiFetch("/auth/persona/me", { token, signal });

// ── Recuperación de contraseña ───────────────────────────────────────────────
export const recuperarPasswordAdmin = (email) =>
  apiFetch("/auth/recuperar", { method: "POST", body: { email } });
export const restablecerPasswordAdmin = (token, password) =>
  apiFetch("/auth/restablecer", { method: "POST", body: { token, password } });

export const recuperarPasswordPersona = (email) =>
  apiFetch("/auth/persona/recuperar", { method: "POST", body: { email } });
export const restablecerPasswordPersona = (token, password) =>
  apiFetch("/auth/persona/restablecer", { method: "POST", body: { token, password } });
