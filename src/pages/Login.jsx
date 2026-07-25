import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/useAuth";
import Marca from "../components/Marca";

function destinoPorRol(rol) {
  return rol === "superadmin" ? "/admin/empresas-pendientes" : "/empresa/vacantes";
}

export default function Login() {
  const { login, autenticado, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (autenticado) {
    return <Navigate to={destinoPorRol(user.rol)} replace />;
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (enviando) return;
    setError("");
    setEnviando(true);
    try {
      const perfil = await login(email, password);
      const destino = location.state?.from || destinoPorRol(perfil.rol);
      navigate(destino, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "No se pudo iniciar sesión");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <form onSubmit={onSubmit} className="tarjeta w-full max-w-sm p-8">
        <div className="mb-6 text-center"><Marca /></div>
        <h1 className="text-xl font-extrabold text-center mb-1">Iniciar sesión</h1>
        <p className="text-sm text-tinta text-opacity-70 text-center mb-6">
          Accedé a tu panel de ONE Core-Talent.
        </p>

        <label htmlFor="email-admin" className="block text-xs font-bold text-tinta mb-1.5 mt-2">Email</label>
        <input
          id="email-admin"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="input-marca"
          placeholder="tu@empresa.com"
          autoComplete="username"
          autoFocus
        />

        <label htmlFor="password-admin" className="block text-xs font-bold text-tinta mb-1.5 mt-3">Contraseña</label>
        <input
          id="password-admin"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="input-marca"
          placeholder="••••••••"
          autoComplete="current-password"
        />

        {error && (
          <div role="alert" className="mt-3.5 text-sm font-semibold px-3.5 py-2.5 rounded-chico" style={{ color: "#c0392b", background: "rgba(192,57,43,.08)", border: "1px solid rgba(192,57,43,.3)" }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={enviando} className="boton boton-primario w-full mt-6">
          {enviando ? "Ingresando…" : "Ingresar →"}
        </button>
        <p className="text-center text-sm mt-4">
          <Link to="/recuperar-password?tipo=usuario" className="text-acento font-semibold">¿Olvidaste tu contraseña?</Link>
        </p>
      </form>
    </div>
  );
}
