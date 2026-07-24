import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Marca from "../components/Marca";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/client";

export default function Login() {
  const { login, autenticado, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (autenticado) {
    return <Navigate to={user.rol === "superadmin" ? "/admin/empresas-pendientes" : "/empresa/vacantes"} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const perfil = await login(email, password);
      navigate(perfil.rol === "superadmin" ? "/admin/empresas-pendientes" : "/empresa/vacantes");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "No se pudo iniciar sesión");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <form onSubmit={onSubmit} className="tarjeta w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <Marca />
        </div>
        <h1 className="text-xl font-extrabold text-center mb-1">Iniciar sesión</h1>
        <p className="text-sm text-tinta text-opacity-70 text-center mb-6">Accedé a tu panel de ONE Core-Talent.</p>

        <label className="block text-xs font-bold text-tinta mb-1.5 mt-2">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-marca"
          placeholder="tu@empresa.com"
          autoComplete="username"
          autoFocus
        />

        <label className="block text-xs font-bold text-tinta mb-1.5 mt-3">Contraseña</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-marca"
          placeholder="••••••••"
          autoComplete="current-password"
        />

        {error && (
          <div className="mt-3.5 text-sm font-semibold px-3.5 py-2.5 rounded-chico" style={{ color: "#c0392b", background: "rgba(192,57,43,.08)", border: "1px solid rgba(192,57,43,.3)" }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={enviando} className="boton boton-primario w-full mt-6">
          {enviando ? "Ingresando…" : "Ingresar →"}
        </button>
      </form>
    </div>
  );
}
