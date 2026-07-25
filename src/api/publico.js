import { apiFetch } from "./client";

export const marcaPorSubdominio = (subdominio) => apiFetch(`/publico/marca/${subdominio}`);
export const vacantesPublicas = () => apiFetch("/publico/vacantes");
export const registrarEmpresa = (data) => apiFetch("/publico/registro-empresa", { method: "POST", body: data });
export const registrarCandidato = (data) => apiFetch("/publico/registro-candidato", { method: "POST", body: data });
export const postular = (data) => apiFetch("/publico/postular", { method: "POST", body: data });
