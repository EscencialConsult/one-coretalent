import { useState } from "react";
import { cambiarMiPassword } from "../../api/persona";
import { usePersonaAuth } from "../../auth/usePersonaAuth";
import Icon from "../../components/Icon";
import { Titulo } from "./MisPostulaciones";

export default function SeguridadCandidato() {
  const { token, logout } = usePersonaAuth();
  const [form, setForm] = useState({ password_actual: "", password_nueva: "", repetir: "" });
  const [estado, setEstado] = useState({ error: "", ok: "", enviando: false });

  async function submit(evento) {
    evento.preventDefault();
    if (form.password_nueva !== form.repetir) {
      setEstado({ error: "Las contraseñas nuevas no coinciden.", ok: "", enviando: false });
      return;
    }
    setEstado({ error: "", ok: "", enviando: true });
    try {
      await cambiarMiPassword(token, { password_actual: form.password_actual, password_nueva: form.password_nueva });
      setForm({ password_actual: "", password_nueva: "", repetir: "" });
      setEstado({ error: "", ok: "Contraseña actualizada correctamente.", enviando: false });
    } catch (err) {
      setEstado({ error: err.detail || err.message, ok: "", enviando: false });
    }
  }

  return (
    <section className="candidate-page">
      <Titulo etiqueta="Protección de la cuenta" titulo="Seguridad" bajada="Administrá tu contraseña y las sesiones abiertas de tu cuenta personal." />
      <div className="candidate-security-grid">
        <form className="candidate-security-card" onSubmit={submit}>
          <CardHeading icono="lock" titulo="Cambiar contraseña" descripcion="Usá una contraseña única que no utilices en otros servicios." />
          <div className="candidate-security-fields">
            <Password label="Contraseña actual" autoComplete="current-password" value={form.password_actual} set={(valor) => setForm({ ...form, password_actual: valor })} />
            <Password label="Nueva contraseña" autoComplete="new-password" value={form.password_nueva} set={(valor) => setForm({ ...form, password_nueva: valor })} />
            <Password label="Repetir nueva contraseña" autoComplete="new-password" value={form.repetir} set={(valor) => setForm({ ...form, repetir: valor })} />
          </div>
          <div className="candidate-password-hint"><Icon name="shield" /><span>Mínimo 8 caracteres. Recomendamos combinar letras, números y símbolos.</span></div>
          {estado.error && <p role="alert" className="candidate-inline-message is-error">{estado.error}</p>}
          {estado.ok && <p role="status" className="candidate-inline-message is-success">{estado.ok}</p>}
          <button className="candidate-primary-button" disabled={estado.enviando}>
            <Icon name={estado.enviando ? "clock" : "lock"} />
            {estado.enviando ? "Actualizando…" : "Actualizar contraseña"}
          </button>
        </form>

        <div className="candidate-security-stack">
          <section className="candidate-security-card">
            <CardHeading icono="shield" titulo="Estado de seguridad" descripcion="Tu información se protege mediante acceso autenticado." />
            <ul className="candidate-security-list">
              <li><Icon name="check" /><span><strong>Contraseña protegida</strong><small>Se almacena mediante hash irreversible.</small></span></li>
              <li><Icon name="check" /><span><strong>Datos privados</strong><small>El acceso se limita según tu identidad y postulaciones.</small></span></li>
              <li><Icon name="check" /><span><strong>Resultados restringidos</strong><small>Los informes sensibles requieren autorización.</small></span></li>
            </ul>
          </section>
          <section className="candidate-session-card">
            <div><Icon name="logout" /></div>
            <span><h2>Cerrar esta sesión</h2><p>Usá esta opción si estás en un dispositivo compartido.</p></span>
            <button type="button" onClick={logout}>Cerrar sesión</button>
          </section>
        </div>
      </div>
    </section>
  );
}

function CardHeading({ icono, titulo, descripcion }) {
  return <header className="candidate-card-heading"><div><Icon name={icono} /></div><span><h2>{titulo}</h2><p>{descripcion}</p></span></header>;
}

function Password({ label, value, set, autoComplete }) {
  return <label className="candidate-field"><span>{label}</span><input type="password" minLength={8} required value={value} onChange={(evento) => set(evento.target.value)} autoComplete={autoComplete} /></label>;
}
