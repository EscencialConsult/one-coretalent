import { apiFetch } from "./client";

export const listarEmpresasPendientes = (token) => apiFetch("/admin/empresas-pendientes", { token });
export const aprobarEmpresa = (token, id) =>
  apiFetch(`/admin/empresas-pendientes/${id}/aprobar`, { method: "POST", token });
export const rechazarEmpresa = (token, id) =>
  apiFetch(`/admin/empresas-pendientes/${id}/rechazar`, { method: "POST", token });
