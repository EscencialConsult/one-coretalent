import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { recuperarPasswordAdmin, recuperarPasswordPersona } from "../../api/auth";
import { ApiError } from "../../api/client";
import Marca from "../../components/Marca";

export default function RecuperarPassword() {
  const [params] = useSearchParams();
  const tipo = params.get("tipo") === "persona" ? "persona" : "usuario";
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const solicitar = tipo === "persona" ? recuperarPasswordPersona : recuperarPasswordAdmin;
      await solicitar(email.trim().toLowerCase());
      setOk(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "No se pudo procesar la solicitud.");
    } finally {
      setEnviando(false);
    }
  }

  const linkLogin = tipo === "persona" ? "/login-candidato" : "/login";

  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <div className="tarjeta w-full max-w-sm p-8">
        <div className="mb-6 text-center"><Marca /></div>
        <h1 className="text-xl font-extrabold text-center mb-1">Recuperar contraseña</h1>
        <p className="text-sm text-tinta text-opacity-70 text-center mb-6">
          Ingresá tu email y te mandamos un enlace para elegir una nueva.
        </p>

        {ok ? (
          <div className="text-sm text-center px-3.5 py-4 rounded-chico" style={{ color: "#1b9aa0", background: "rgba(107,225,227,.12)", border: "1px solid rgba(107,225,227,.3)" }}>
            Si el email existe en nuestro sistema, vas a recibir un enlace para restablecer tu contraseña en los próximos minutos.
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <label htmlFor="email-recuperar" className="block text-xs font-bold text-tinta mb-1.5">Email</label>
            <input
              id="email-recuperar"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-marca"
              placeholder="tu@email.com"
              autoComplete="username"
              autoFocus
            />

            {error && (
              <div role="alert" className="mt-3.5 text-sm font-semibold px-3.5 py-2.5 rounded-chico" style={{ color: "#c0392b", background: "rgba(192,57,43,.08)", border: "1px solid rgba(192,57,43,.3)" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={enviando} className="boton boton-primario w-full mt-6">
              {enviando ? "Enviando…" : "Enviar enlace"}
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
