import { useEffect, useState } from "react";
import { actualizarMiCv, actualizarMiPerfil, obtenerMiPerfil } from "../../api/persona";
import { usePersonaAuth } from "../../auth/usePersonaAuth";
import { ErrorState, PageLoader } from "../../components/AsyncState";
import Icon from "../../components/Icon";
import { useApiResource } from "../../hooks/useApiResource";
import { archivoABase64 } from "../../utils/archivo";
import { combinarPerfilConCv } from "../../utils/perfilCandidato";
import { Titulo } from "./MisPostulaciones";

const ETIQUETAS = {
  institucion: "Institución",
  titulo: "Título",
  anio: "Año",
  idioma: "Idioma",
  nivel: "Nivel",
  empresa: "Empresa",
  puesto: "Puesto",
  periodo: "Período",
  descripcion: "Descripción",
};

export default function PerfilCandidato() {
  const { token } = usePersonaAuth();
  const recurso = useApiResource((signal) => obtenerMiPerfil(token, signal), [token]);
  const [form, setForm] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (recurso.data) setForm(recurso.data);
  }, [recurso.data]);

  if (recurso.cargando || !form) return <PageLoader mensaje="Cargando perfil…" />;
  if (recurso.error) return <ErrorState mensaje={recurso.error} onReintentar={recurso.recargar} />;

  const set = (campo, valor) => setForm((actual) => ({ ...actual, [campo]: valor }));

  async function guardar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setError("");
    setMensaje("");
    try {
      const { id: _id, email: _email, cv_nombre: _cvNombre, cv_url: _cvUrl, ...body } = form;
      setForm(await actualizarMiPerfil(token, body));
      setMensaje("Perfil actualizado correctamente.");
    } catch (err) {
      setError(err.detail || err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function subirCv(evento) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;
    setError("");
    setMensaje("");
    if (archivo.type !== "application/pdf" || archivo.size > 5 * 1024 * 1024) {
      setError("El CV debe ser un PDF de hasta 5 MB.");
      return;
    }
    try {
      const base64 = await archivoABase64(archivo);
      const perfilActualizado = await actualizarMiCv(token, { nombre: archivo.name, base64 });
      setForm((actual) => combinarPerfilConCv(actual, perfilActualizado));
      setMensaje("CV actualizado correctamente.");
    } catch (err) {
      setError(err.detail || err.message);
    }
  }

  return (
    <section className="candidate-page">
      <Titulo
        etiqueta="Identidad profesional"
        titulo="Mi perfil"
        bajada="Mantené actualizados tus datos, antecedentes y CV para reutilizarlos en futuras postulaciones."
      />

      {(error || mensaje) && (
        <div className={`candidate-form-message ${error ? "is-error" : "is-success"}`} role={error ? "alert" : "status"}>
          <Icon name={error ? "x" : "check"} />
          <span>{error || mensaje}</span>
        </div>
      )}

      <form onSubmit={guardar} className="candidate-profile-form">
        <FormSection
          icono="user"
          titulo="Datos personales"
          descripcion="Información básica y objetivo profesional."
        >
          <div className="candidate-form-grid">
            <Campo label="Nombre" value={form.nombre} onChange={(valor) => set("nombre", valor)} required />
            <Campo label="Apellido" value={form.apellido} onChange={(valor) => set("apellido", valor)} required />
            <Campo label="Email" value={form.email} disabled ayuda="El email identifica tu cuenta y no puede modificarse." />
            <Campo label="Teléfono" value={form.telefono} onChange={(valor) => set("telefono", valor)} />
            <Campo label="Puesto deseado" value={form.puesto_deseado} onChange={(valor) => set("puesto_deseado", valor)} />
            <Campo label="Perfil profesional" value={form.perfil_profesional} onChange={(valor) => set("perfil_profesional", valor)} />
            <Campo label="Provincia" value={form.provincia} onChange={(valor) => set("provincia", valor)} />
            <Campo label="Ciudad / Código postal" value={form.codigo_postal_ciudad} onChange={(valor) => set("codigo_postal_ciudad", valor)} />
          </div>
          <label className="candidate-field candidate-field-wide">
            <span>Descripción profesional</span>
            <textarea value={form.descripcion_perfil || ""} onChange={(evento) => set("descripcion_perfil", evento.target.value)} rows={5} placeholder="Contá brevemente tu experiencia, fortalezas y objetivo profesional." />
          </label>
        </FormSection>

        <SeccionLista icono="doc" titulo="Formación" descripcion="Estudios, carreras y cursos relevantes." items={form.formacion || []} setItems={(valor) => set("formacion", valor)} campos={["institucion", "titulo", "anio"]} />
        <SeccionLista icono="globe" titulo="Idiomas" descripcion="Idiomas y nivel de dominio." items={form.idiomas || []} setItems={(valor) => set("idiomas", valor)} campos={["idioma", "nivel"]} />
        <SeccionLista icono="briefcase" titulo="Experiencia" descripcion="Experiencias laborales y responsabilidades principales." items={form.experiencias || []} setItems={(valor) => set("experiencias", valor)} campos={["empresa", "puesto", "periodo", "descripcion"]} />

        <FormSection icono="file" titulo="Currículum vitae" descripcion="PDF privado utilizado en tus postulaciones.">
          <div className="candidate-cv-card">
            <div className="candidate-cv-icon"><Icon name="doc" /></div>
            <div>
              <strong>{form.cv_nombre || "Todavía no cargaste un CV"}</strong>
              <span>{form.cv_nombre ? "Documento disponible para tus postulaciones" : "Formato PDF · Tamaño máximo 5 MB"}</span>
            </div>
            {form.cv_url && <a href={form.cv_url} target="_blank" rel="noreferrer">Ver actual</a>}
            <label className="candidate-upload">
              {form.cv_nombre ? "Reemplazar PDF" : "Cargar PDF"}
              <input type="file" accept="application/pdf" className="sr-only" onChange={subirCv} />
            </label>
          </div>
        </FormSection>

        <div className="candidate-save-bar">
          <div><Icon name="shield" /><span>Tus cambios se guardan de forma segura en tu perfil global.</span></div>
          <button type="submit" className="candidate-primary-button" disabled={guardando}>
            <Icon name={guardando ? "clock" : "check"} />
            {guardando ? "Guardando…" : "Guardar perfil"}
          </button>
        </div>
      </form>
    </section>
  );
}

function FormSection({ icono, titulo, descripcion, children }) {
  return (
    <section className="candidate-form-section">
      <header>
        <div><Icon name={icono} /></div>
        <span><h2>{titulo}</h2><p>{descripcion}</p></span>
      </header>
      <div className="candidate-form-body">{children}</div>
    </section>
  );
}

function Campo({ label, value, onChange, ayuda, ...props }) {
  return (
    <label className="candidate-field">
      <span>{label}</span>
      <input value={value || ""} onChange={(evento) => onChange?.(evento.target.value)} {...props} />
      {ayuda && <small>{ayuda}</small>}
    </label>
  );
}

function SeccionLista({ icono, titulo, descripcion, items, setItems, campos }) {
  const actualizar = (indice, campo, valor) =>
    setItems(items.map((item, posicion) => posicion === indice ? { ...item, [campo]: valor } : item));

  return (
    <FormSection icono={icono} titulo={titulo} descripcion={descripcion}>
      {!items.length && <p className="candidate-form-empty">No agregaste información en esta sección.</p>}
      <div className="candidate-repeat-list">
        {items.map((item, indice) => (
          <div className="candidate-repeat-item" key={`${titulo}-${indice}`}>
            <div className="candidate-repeat-number">{indice + 1}</div>
            <div className="candidate-form-grid">
              {campos.map((campo) => (
                <Campo key={campo} label={ETIQUETAS[campo] || campo} value={item[campo]} onChange={(valor) => actualizar(indice, campo, valor)} />
              ))}
            </div>
            <button type="button" className="candidate-remove" onClick={() => setItems(items.filter((_, posicion) => posicion !== indice))}>
              <Icon name="trash" /> Eliminar
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="candidate-add" onClick={() => setItems([...items, Object.fromEntries(campos.map((campo) => [campo, ""]))])}>
        <Icon name="plus" /> Agregar {titulo.toLocaleLowerCase("es")}
      </button>
    </FormSection>
  );
}
