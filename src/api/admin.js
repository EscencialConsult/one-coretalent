import { apiFetch } from "./client";

export const listarEmpresasPendientes = (token) => apiFetch("/admin/empresas-pendientes", { token });
export const aprobarEmpresa = (token, id) =>
  apiFetch(`/admin/empresas-pendientes/${id}/aprobar`, { method: "POST", token });
export const rechazarEmpresa = (token, id) =>
  apiFetch(`/admin/empresas-pendientes/${id}/rechazar`, { method: "POST", token });

// ── Empresas (todas) y sus tests habilitados ────────────────────────────────
export const listarEmpresas = (token) => apiFetch("/empresas", { token });
export const listarTestsEmpresa = (token, empresaId) =>
  apiFetch(`/empresas/${empresaId}/tests`, { token });
export const toggleTestEmpresa = (token, empresaId, slug, habilitado) =>
  apiFetch(`/empresas/${empresaId}/tests/${slug}`, { method: "PUT", token, body: { habilitado } });
export const quitarTestEmpresa = (token, empresaId, slug) =>
  apiFetch(`/empresas/${empresaId}/tests/${slug}`, { method: "DELETE", token });
