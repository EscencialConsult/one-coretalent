const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export class ApiError extends Error {
  constructor(status, detail) {
    super(typeof detail === "string" ? detail : "Error de la API");
    this.status = status;
    this.detail = detail;
  }
}

function extraerMensaje(detail) {
  // FastAPI manda 422 como {detail: [{msg, loc}, ...]} y errores de negocio como {detail: "texto"}.
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg).join(" · ");
  }
  return detail || "Ocurrió un error inesperado";
}

/**
 * Cliente HTTP genérico. `token` es opcional (endpoints públicos no lo necesitan).
 * `form` = true manda application/x-www-form-urlencoded (lo que espera OAuth2PasswordRequestForm
 * en /auth/login, /auth/evaluado/login, /auth/persona/login).
 */
export async function apiFetch(path, { method = "GET", body, token, form = false } = {}) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let payload;
  if (form && body) {
    payload = new URLSearchParams(body);
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor. Probá de nuevo en unos segundos.");
  }

  if (res.status === 204) return null;

  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    throw new ApiError(res.status, extraerMensaje(data?.detail ?? data));
  }
  return data;
}
