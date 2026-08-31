import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/useAuth";
import { usePersonaAuth } from "../auth/usePersonaAuth";
import Icon from "../components/Icon";

function destinoPorRol(rol) {
  return rol === "superadmin" ? "/admin/empresas-pendientes" : "/empresa/inicio";
}

export default function Login() {
  const { login: loginAdmin, autenticado: autenticadoAdmin, user } = useAuth();
  const { login: loginPersona, autenticado: autenticadoPersona } = usePersonaAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (autenticadoAdmin) {
    return <Navigate to={destinoPorRol(user.rol)} replace />;
  }
  if (autenticadoPersona) {
    return <Navigate to="/candidato" replace />;
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (enviando) return;
    setError("");
    setEnviando(true);
    try {
      // Un solo formulario para empresa/admin y candidato: probamos primero como
      // cuenta de empresa y, si no existe con esas credenciales, como candidato.
      const perfil = await loginAdmin(email, password);
      const destino = location.state?.from || destinoPorRol(perfil.rol);
      navigate(destino, { replace: true });
      return;
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 401) {
        setError(err instanceof ApiError ? err.detail : "No se pudo iniciar sesión");
        setEnviando(false);
        return;
      }
    }
    try {
      await loginPersona(email, password);
      navigate(location.state?.from || "/candidato", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "No se pudo iniciar sesión");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="login-page">
      <div className="login-intro">
        <span className="candidate-register-eyebrow">Bienvenido de nuevo</span>
        <h1>Todo tu proceso de talento, en un solo lugar.</h1>
        <p>Entrá con tu cuenta de empresa o de candidato para seguir donde lo dejaste.</p>
        <ul>
          <Beneficio icono="briefcase" titulo="Una sola cuenta" texto="Postulate a búsquedas o publicalas, según tu perfil." />
          <Beneficio icono="chart" titulo="Seguimiento claro" texto="Consultá el estado de tus postulaciones y evaluaciones." />
          <Beneficio icono="shield" titulo="Datos protegidos" texto="Vos controlás tu información en todo momento." />
        </ul>
      </div>

      <form onSubmit={onSubmit} className="login-form-card">
        <header>
          <div><img src="/one-icon-color.png" alt="" /></div>
          <span><h2>Iniciar sesión</h2><p>Entrá con tu cuenta de empresa o de candidato.</p></span>
        </header>

        <div className="candidate-register-fields">
          <label htmlFor="email-login">Email</label>
          <input
            id="email-login"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input-marca"
            placeholder="tu@email.com"
            autoComplete="username"
            autoFocus
          />

          <label htmlFor="password-login">Contraseña</label>
          <input
            id="password-login"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input-marca"
            placeholder="••••••••"
            autoComplete="current-password"
          />

          {error && (
            <div role="alert" className="login-form-error">
              {error}
            </div>
          )}

          <button type="submit" disabled={enviando} className="boton boton-primario w-full">
            {enviando ? "Ingresando…" : "Ingresar →"}
          </button>
          <p className="text-center text-sm">
            <Link to="/recuperar-password" className="text-acento font-semibold">¿Olvidaste tu contraseña?</Link>
          </p>
          <p className="text-xs text-muted text-center">
            ¿No tenés cuenta?{" "}
            <Link to="/registro-candidato" className="font-semibold text-acento hover:underline">Registrate como postulante</Link>
            {" "}o{" "}
            <Link to="/registro-empresa" className="font-semibold text-acento hover:underline">como empresa</Link>
          </p>
        </div>
      </form>
    </section>
  );
}

function Beneficio({ icono, titulo, texto }) {
  return <li><Icon name={icono} /><span><strong>{titulo}</strong><small>{texto}</small></span></li>;
}
