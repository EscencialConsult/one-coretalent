import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { registrarCandidato } from "../../api/publico";
import { ApiError } from "../../api/client";
import { usePersonaAuth } from "../../auth/usePersonaAuth";
import Icon from "../../components/Icon";

const INICIAL = {
  nombre: "", apellido: "", email: "", password: "", repetir: "", acepto_terminos: false,
};

// Guardamos un borrador en localStorage (no sessionStorage: tiene que sobrevivir
// a que la persona cierre la ventana y vuelva más tarde). Nunca la contraseña.
const DRAFT_KEY = "registro-candidato-draft";
const CAMPOS_BORRADOR = ["nombre", "apellido", "email", "acepto_terminos"];

function cargarBorrador() {
  try {
    const guardado = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
    return { ...INICIAL, ...guardado };
  } catch {
    return INICIAL;
  }
}

export default function RegistroCandidato() {
  const navigate = useNavigate();
  const { autenticado, login } = usePersonaAuth();
  const [form, setForm] = useState(cargarBorrador);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const borrador = Object.fromEntries(CAMPOS_BORRADOR.map((campo) => [campo, form[campo]]));
    localStorage.setItem(DRAFT_KEY, JSON.stringify(borrador));
  }, [form]);

  if (autenticado) return <Navigate to="/candidato" replace />;

  const cambiar = (campo) => (evento) =>
    setForm((actual) => ({
      ...actual,
      [campo]: evento.target.type === "checkbox" ? evento.target.checked : evento.target.value,
    }));

  async function submit(evento) {
    evento.preventDefault();
    if (enviando) return;
    if (form.password !== form.repetir) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setError("");
    setEnviando(true);
    try {
      await registrarCandidato({
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        password: form.password,
        acepto_terminos: form.acepto_terminos,
      });
      localStorage.removeItem(DRAFT_KEY);
      await login(form.email, form.password);
      navigate("/candidato", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "No se pudo crear la cuenta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="candidate-register-page">
      <div className="candidate-register-intro">
        <span className="candidate-register-eyebrow">Tu identidad profesional</span>
        <h1>Creá tu perfil y encontrá tu próxima oportunidad.</h1>
        <p>Centralizá tus datos, reutilizá tu CV y seguí todas tus postulaciones desde un único espacio seguro.</p>
        <ul>
          <Beneficio icono="check" titulo="Un único perfil" texto="Actualizalo una vez y reutilizalo en futuras búsquedas." />
          <Beneficio icono="check" titulo="Seguimiento claro" texto="Consultá postulaciones, evaluaciones y resultados." />
          <Beneficio icono="shield" titulo="Datos protegidos" texto="Vos controlás tu información profesional." />
        </ul>
      </div>

      <form className="candidate-register-form" onSubmit={submit}>
        <header>
          <div><img src="/one-icon-color.png" alt="" /></div>
          <span><h2>Crear cuenta de candidato</h2><p>Completá tus datos básicos para comenzar.</p></span>
        </header>
        <div className="candidate-register-fields">
          <div className="candidate-register-grid">
            <Campo label="Nombre" value={form.nombre} onChange={cambiar("nombre")} autoComplete="given-name" autoFocus />
            <Campo label="Apellido" value={form.apellido} onChange={cambiar("apellido")} autoComplete="family-name" />
          </div>
          <Campo label="Email" type="email" value={form.email} onChange={cambiar("email")} autoComplete="email" />
          <Campo label="Contraseña" type="password" value={form.password} onChange={cambiar("password")} autoComplete="new-password" minLength={8} ayuda="Mínimo 8 caracteres." />
          <Campo label="Repetir contraseña" type="password" value={form.repetir} onChange={cambiar("repetir")} autoComplete="new-password" minLength={8} />
          <label className="candidate-register-consent">
            <input type="checkbox" checked={form.acepto_terminos} onChange={cambiar("acepto_terminos")} required />
            <span>Acepto los <Link to="/terminos-condiciones" target="_blank">Términos y Condiciones</Link> y la <Link to="/politica-privacidad" target="_blank">Política de Privacidad</Link>.</span>
          </label>
          {error && <div className="candidate-register-error" role="alert">{error}</div>}
          <button type="submit" className="candidate-register-submit" disabled={enviando}>
            {enviando ? "Creando cuenta…" : "Crear mi cuenta"} <Icon name="chevR" />
          </button>
          <p className="candidate-register-login">¿Ya tenés una cuenta? <Link to="/login">Ingresar al portal</Link></p>
        </div>
      </form>
    </section>
  );
}

function Campo({ label, ayuda, type = "text", ...props }) {
  return <label className="candidate-register-field"><span>{label}</span><input type={type} required {...props} />{ayuda && <small>{ayuda}</small>}</label>;
}

function Beneficio({ icono, titulo, texto }) {
  return <li><Icon name={icono} /><span><strong>{titulo}</strong><small>{texto}</small></span></li>;
}
