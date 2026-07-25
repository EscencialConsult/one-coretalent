import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "../api/client";
import { loginEvaluado, meEvaluado } from "../evaluado/api";
import { EvaluadoAuthContext } from "./EvaluadoAuthContext";
import {
  EVALUADO_TOKEN_KEY,
  eliminarToken,
  guardarToken,
  leerToken,
  SESSION_CHANGED_EVENT,
  tokenExpirado,
  UNAUTHORIZED_EVENT,
} from "./session";

export function EvaluadoAuthProvider({ children }) {
  const [token, setToken] = useState(() => leerToken(EVALUADO_TOKEN_KEY));
  const [evaluado, setEvaluado] = useState(null);
  const [cargando, setCargando] = useState(Boolean(token));
  const [errorSesion, setErrorSesion] = useState("");

  const logout = useCallback(() => {
    eliminarToken(EVALUADO_TOKEN_KEY);
    setToken(null);
    setEvaluado(null);
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
      setEvaluado(await meEvaluado(tokenActual, signal));
    } catch (error) {
      if (error.code === "ABORTED") return;
      if (error.status === 401) {
        logout();
        return;
      }
      setEvaluado(null);
      setErrorSesion(
        error instanceof ApiError ? error.detail : "No se pudo validar la sesión del evaluado."
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
    function sincronizar(event) {
      if (event.type === "storage" && event.key !== EVALUADO_TOKEN_KEY) return;
      if (event.type === SESSION_CHANGED_EVENT && event.detail?.key !== EVALUADO_TOKEN_KEY) return;
      const siguiente = leerToken(EVALUADO_TOKEN_KEY);
      setToken((actual) => (actual === siguiente ? actual : siguiente));
      if (!siguiente) setEvaluado(null);
    }
    function noAutorizado(event) {
      if (event.detail?.token === token) logout();
    }
    window.addEventListener("storage", sincronizar);
    window.addEventListener(SESSION_CHANGED_EVENT, sincronizar);
    window.addEventListener(UNAUTHORIZED_EVENT, noAutorizado);
    return () => {
      window.removeEventListener("storage", sincronizar);
      window.removeEventListener(SESSION_CHANGED_EVENT, sincronizar);
      window.removeEventListener(UNAUTHORIZED_EVENT, noAutorizado);
    };
  }, [logout, token]);

  async function login(email, password) {
    const { access_token: accessToken } = await loginEvaluado(email, password);
    const perfil = await meEvaluado(accessToken);
    guardarToken(EVALUADO_TOKEN_KEY, accessToken);
    setToken(accessToken);
    setEvaluado(perfil);
    setErrorSesion("");
  }

  const recargarSesion = useCallback(() => {
    if (token) restaurarSesion(token);
  }, [restaurarSesion, token]);

  const value = useMemo(() => ({
    autenticado: Boolean(evaluado),
    cargando,
    errorSesion,
    evaluado,
    login,
    logout,
    recargarSesion,
    token,
  }), [cargando, errorSesion, evaluado, logout, recargarSesion, token]);

  return <EvaluadoAuthContext.Provider value={value}>{children}</EvaluadoAuthContext.Provider>;
}
