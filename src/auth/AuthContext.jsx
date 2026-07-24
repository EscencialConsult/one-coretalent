import { createContext, useContext, useEffect, useState } from "react";
import { loginAdmin, meAdmin } from "../api/auth";

const TOKEN_KEY = "ct_token_admin";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!token) {
      setCargando(false);
      return;
    }
    meAdmin(token)
      .then(setUser)
      .catch(() => {
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setCargando(false));
  }, [token]);

  async function login(email, password) {
    const { access_token } = await loginAdmin(email, password);
    localStorage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    const perfil = await meAdmin(access_token);
    setUser(perfil);
    return perfil;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, cargando, login, logout, autenticado: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() tiene que usarse adentro de <AuthProvider>");
  return ctx;
}
