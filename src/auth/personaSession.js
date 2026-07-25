import {
  eliminarToken,
  guardarToken,
  leerToken,
  PERSONA_TOKEN_KEY,
  SESSION_CHANGED_EVENT,
} from "./session";

export function obtenerTokenPersona() {
  return leerToken(PERSONA_TOKEN_KEY);
}

export function guardarTokenPersona(token) {
  guardarToken(PERSONA_TOKEN_KEY, token);
}

export function cerrarSesionPersona() {
  eliminarToken(PERSONA_TOKEN_KEY);
}

export { PERSONA_TOKEN_KEY, SESSION_CHANGED_EVENT as PERSONA_SESSION_EVENT };
