import { useCallback, useEffect, useMemo, useState } from "react";
import { loginAdmin, meAdmin } from "../api/auth";
import { ApiError } from "../api/client";
import { AdminAuthContext } from "./AdminAuthContext";
import {
  ADMIN_TOKEN_KEY,
  eliminarToken,
  guardarToken,
  leerToken,
  SESSION_CHANGED_EVENT,
  tokenExpirado,
  UNAUTHORIZED_EVENT,
} from "./session";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => leerToken(ADMIN_TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [cargando, setCargando] = useState(Boolean(token));
  const [errorSesion, setErrorSesion] = useState("");

  const logout = useCallback(() => {
    eliminarToken(ADMIN_TOKEN_KEY);
    setToken(null);
    setUser(null);
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
      const perfil = await meAdmin(tokenActual, signal);
      setUser(perfil);
    } catch (error) {
      if (error.code === "ABORTED") return;
      if (error.status === 401) {
        logout();
        return;
      }
      setUser(null);
      setErrorSesion(
        error instanceof ApiError ? error.detail : "No se pudo validar la sesión de administración."
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
  }, [token, restaurarSesion]);

  useEffect(() => {
    function sincronizarSesion(event) {
      if (event.type === "storage" && event.key !== ADMIN_TOKEN_KEY) return;
      if (event.type === SESSION_CHANGED_EVENT && event.detail?.key !== ADMIN_TOKEN_KEY) return;
      const siguiente = leerToken(ADMIN_TOKEN_KEY);
      setToken((actual) => (actual === siguiente ? actual : siguiente));
      if (!siguiente) setUser(null);
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
    const { access_token: accessToken } = await loginAdmin(email.trim().toLowerCase(), password);
    const perfil = await meAdmin(accessToken);
    guardarToken(ADMIN_TOKEN_KEY, accessToken);
    setToken(accessToken);
    setUser(perfil);
    setErrorSesion("");
    return perfil;
  }

  const recargarSesion = useCallback(() => {
    if (token) restaurarSesion(token);
  }, [restaurarSesion, token]);

  const value = useMemo(
    () => ({
      token,
      user,
      cargando,
      errorSesion,
      login,
      logout,
      recargarSesion,
      autenticado: Boolean(user),
    }),
    [cargando, errorSesion, logout, recargarSesion, token, user]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
