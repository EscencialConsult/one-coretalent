import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { restablecerPasswordAdmin, restablecerPasswordPersona } from "../../api/auth";
import { ApiError } from "../../api/client";
import Marca from "../../components/Marca";

export default function RestablecerPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const tipo = params.get("tipo") === "persona" ? "persona" : "usuario";
  const [password, setPassword] = useState("");
  const [repetir, setRepetir] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  const linkLogin = "/login";

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    if (password !== repetir) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!token) {
      setError("El enlace no es válido. Solicitá uno nuevo.");
      return;
    }
    setEnviando(true);
    try {
      const restablecer = tipo === "persona" ? restablecerPasswordPersona : restablecerPasswordAdmin;
      await restablecer(token, password);
      setOk(true);
      window.setTimeout(() => navigate(linkLogin), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "No se pudo restablecer la contraseña.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <div className="tarjeta w-full max-w-sm p-8">
        <div className="mb-6 text-center"><Marca /></div>
        <h1 className="text-xl font-extrabold text-center mb-1">Elegí tu nueva contraseña</h1>

        {ok ? (
          <div className="text-sm text-center px-3.5 py-4 rounded-chico mt-4" style={{ color: "#2b6f8c", background: "rgba(79,173,209,.12)", border: "1px solid rgba(79,173,209,.3)" }}>
            Contraseña actualizada. Te llevamos al login…
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-4">
            <label htmlFor="nueva-password" className="block text-xs font-bold text-tinta mb-1.5">Nueva contraseña</label>
            <input
              id="nueva-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input-marca"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              autoFocus
            />

            <label htmlFor="repetir-password" className="block text-xs font-bold text-tinta mb-1.5 mt-3">Repetir contraseña</label>
            <input
              id="repetir-password"
              type="password"
              required
              minLength={8}
              value={repetir}
              onChange={(event) => setRepetir(event.target.value)}
              className="input-marca"
              placeholder="Repetí la contraseña"
              autoComplete="new-password"
            />

            {error && (
              <div role="alert" className="mt-3.5 text-sm font-semibold px-3.5 py-2.5 rounded-chico" style={{ color: "#c0392b", background: "rgba(192,57,43,.08)", border: "1px solid rgba(192,57,43,.3)" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={enviando} className="boton boton-primario w-full mt-6">
              {enviando ? "Guardando…" : "Guardar contraseña"}
            </button>
          </form>
        )}

        <p className="text-center text-sm mt-5">
          <Link to={linkLogin} className="text-acento font-semibold">← Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
