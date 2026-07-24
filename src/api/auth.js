import { apiFetch } from "./client";

// SuperAdmin y Admin de Empresa comparten login (el rol viene en el JWT).
export const loginAdmin = (email, password) =>
  apiFetch("/auth/login", { method: "POST", form: true, body: { username: email, password } });

export const meAdmin = (token) => apiFetch("/auth/me", { token });

export const loginPersona = (email, password) =>
  apiFetch("/auth/persona/login", { method: "POST", form: true, body: { username: email, password } });
