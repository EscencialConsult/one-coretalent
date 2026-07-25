import { useCallback, useEffect, useMemo, useState } from "react";
import { loginPersona, mePersona } from "../api/auth";
import { ApiError } from "../api/client";
import { PersonaAuthContext } from "./PersonaAuthContext";
import {
  eliminarToken,
  guardarToken,
  leerToken,
  PERSONA_TOKEN_KEY,
  SESSION_CHANGED_EVENT,
  tokenExpirado,
  UNAUTHORIZED_EVENT,
} from "./session";

export function PersonaAuthProvider({ children }) {
  const [token, setToken] = useState(() => leerToken(PERSONA_TOKEN_KEY));
  const [persona, setPersona] = useState(null);
  const [cargando, setCargando] = useState(Boolean(token));
  const [errorSesion, setErrorSesion] = useState("");

  const logout = useCallback(() => {
    eliminarToken(PERSONA_TOKEN_KEY);
    setToken(null);
    setPersona(null);
    setErrorSesion("");
    setCargando(false);
  }, []);

  const restaurarSesion = useCallback(async (tokenActual, signal) => {
    if (!tokenActual || tokenExpirado(tokenActual)) {
      logout();
      return;
    }

    setCargando(true);
    setErrorSesion("");
    try {
      const perfil = await mePersona(tokenActual, signal);
      setPersona(perfil);
    } catch (error) {
      if (error.code === "ABORTED") return;
      if (error.status === 401) {
        logout();
        return;
      }
      setPersona(null);
      setErrorSesion(
        error instanceof ApiError ? error.detail : "No se pudo validar la sesión de candidato."
      );
    } finally {
      if (!signal?.aborted) setCargando(false);
    }
  }, [logout]);

  useEffect(() => {
    if (!token) {
      setCargando(false);
      return undefined;
    }
    const controller = new AbortController();
    restaurarSesion(token, controller.signal);
    return () => controller.abort();
  }, [restaurarSesion, token]);

  useEffect(() => {
    function sincronizarSesion(event) {
      if (event.type === "storage" && event.key !== PERSONA_TOKEN_KEY) return;
      if (event.type === SESSION_CHANGED_EVENT && event.detail?.key !== PERSONA_TOKEN_KEY) return;
      const siguiente = leerToken(PERSONA_TOKEN_KEY);
      setToken((actual) => (actual === siguiente ? actual : siguiente));
      if (!siguiente) setPersona(null);
    }

    function manejarNoAutorizado(event) {
      if (event.detail?.token === token) logout();
    }

    window.addEventListener("storage", sincronizarSesion);
    window.addEventListener(SESSION_CHANGED_EVENT, sincronizarSesion);
    window.addEventListener(UNAUTHORIZED_EVENT, manejarNoAutorizado);
    return () => {
      window.removeEventListener("storage", sincronizarSesion);
      window.removeEventListener(SESSION_CHANGED_EVENT, sincronizarSesion);
      window.removeEventListener(UNAUTHORIZED_EVENT, manejarNoAutorizado);
    };
  }, [logout, token]);

  async function login(email, password) {
    const { access_token: accessToken } = await loginPersona(email.trim().toLowerCase(), password);
    const perfil = await mePersona(accessToken);
    guardarToken(PERSONA_TOKEN_KEY, accessToken);
    setToken(accessToken);
    setPersona(perfil);
    setErrorSesion("");
    return perfil;
  }

  const recargarSesion = useCallback(() => {
    if (token) restaurarSesion(token);
  }, [restaurarSesion, token]);

  const value = useMemo(
    () => ({
      token,
      persona,
      cargando,
      errorSesion,
      login,
      logout,
      recargarSesion,
      autenticado: Boolean(persona),
    }),
    [cargando, errorSesion, logout, persona, recargarSesion, token]
  );

  return <PersonaAuthContext.Provider value={value}>{children}</PersonaAuthContext.Provider>;
}
