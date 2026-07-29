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
export const cambiarEstadoEmpresa = (token, empresaId, estado) =>
  apiFetch(`/empresas/${empresaId}`, { method: "PATCH", token, body: { estado } });

// ── Postulantes / vacantes / auditoría global (equivalente al admin.html legacy) ──
export const listarPostulantesGlobal = (token, q) =>
  apiFetch(`/admin/postulantes${q ? `?q=${encodeURIComponent(q)}` : ""}`, { token });
export const listarVacantesGlobal = (token, q) =>
  apiFetch(`/admin/vacantes${q ? `?q=${encodeURIComponent(q)}` : ""}`, { token });
export const listarAuditoria = (token) => apiFetch("/admin/auditoria", { token });
export const obtenerResumenAdmin = (token) => apiFetch("/admin/resumen", { token });
