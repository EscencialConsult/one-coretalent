import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Marca from "../../components/Marca";
import { ApiError } from "../../api/client";
import { usePersonaAuth } from "../../auth/usePersonaAuth";

export default function LoginCandidato() {
  const navigate = useNavigate();
  const location = useLocation();
  const { autenticado, login } = usePersonaAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (autenticado) return <Navigate to="/candidato" replace />;

  async function onSubmit(event) {
    event.preventDefault();
    if (enviando) return;
    setError("");
    setEnviando(true);
    try {
      await login(email, password);
      navigate(location.state?.from || "/candidato", { replace: true });
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
        <h1 className="text-xl font-extrabold text-center mb-1">Mi cuenta</h1>
        <p className="text-sm text-tinta text-opacity-70 text-center mb-6">
          Ingresá a tu cuenta de candidato.
        </p>

        <label htmlFor="email-candidato" className="block text-xs font-bold text-tinta mb-1.5 mt-2">Email</label>
        <input
          id="email-candidato"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="input-marca"
          placeholder="tu@email.com"
          autoComplete="username"
          autoFocus
        />

        <label htmlFor="password-candidato" className="block text-xs font-bold text-tinta mb-1.5 mt-3">Contraseña</label>
        <input
          id="password-candidato"
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

        <p className="text-xs text-muted text-center mt-5">
          ¿No tenés cuenta?{" "}
          <Link to="/registro-candidato" className="font-semibold text-acento hover:underline">Crear cuenta</Link>
        </p>
      </form>
    </div>
  );
}
