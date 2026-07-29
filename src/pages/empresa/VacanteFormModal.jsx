import { useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { crearVacante, actualizarVacante, listarCatalogoTestsEmpresa } from "../../api/empresa";
import { ApiError } from "../../api/client";
import Icon from "../../components/Icon";

const VACIO = {
  puesto: "",
  area: "",
  descripcion: "",
  provincia: "",
  localidad: "",
  modalidad: "presencial",
  jornada: "",
  tipo_contrato: "",
  vacantes: 1,
  requisitos_excluyentes: "",
  requisitos_deseables: "",
  habilidades: "",
  idioma_requerido: "",
  nivel_idioma: "",
  pregunta_1: "",
  pregunta_2: "",
  tests_requeridos: [],
};

export default function VacanteFormModal({ onClose, onCreada, vacante }) {
  const { token } = useAuth();
  const editando = Boolean(vacante);
  const [form, setForm] = useState(() =>
    editando ? { ...VACIO, ...vacante, tests_requeridos: vacante.tests_requeridos || [] } : VACIO
  );
  const [catalogo, setCatalogo] = useState([]);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    listarCatalogoTestsEmpresa(token).then(setCatalogo).catch(() => setCatalogo([]));
  }, [token]);

  function campo(nombre, valor) {
    setForm((f) => ({ ...f, [nombre]: valor }));
  }

  function alternarTest(slug) {
    setForm((f) => ({
      ...f,
      tests_requeridos: f.tests_requeridos.includes(slug)
        ? f.tests_requeridos.filter((s) => s !== slug)
        : [...f.tests_requeridos, slug],
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const datos = { ...form, vacantes: Number(form.vacantes) || 1 };
      const resultado = editando
        ? await actualizarVacante(token, vacante.id, datos)
        : await crearVacante(token, datos);
      onCreada(resultado);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : `No se pudo ${editando ? "guardar" : "crear"} la vacante`);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={onSubmit} className="modal-card" style={{ width: 640 }}>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 border-0 bg-transparent cursor-pointer text-muted"
          aria-label="Cerrar formulario"
        >
          <Icon name="x" className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-extrabold mb-1">{editando ? "Editar vacante" : "Nueva vacante"}</h2>
        <p className="text-muted text-sm mb-6">
          {editando ? "Los cambios se aplican de inmediato." : "Se crea como borrador — la activás cuando esté lista."}
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <Campo id="vacante-puesto" name="puesto" label="Puesto" required value={form.puesto} onChange={(v) => campo("puesto", v)} />
          <Campo id="vacante-area" name="area" label="Área" value={form.area} onChange={(v) => campo("area", v)} />
        </div>

        <label htmlFor="vacante-descripcion" className="block text-xs font-bold mb-1.5">Descripción</label>
        <textarea id="vacante-descripcion" name="descripcion" className="input-marca mb-4" rows={3} value={form.descripcion} onChange={(e) => campo("descripcion", e.target.value)} />

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <Campo id="vacante-provincia" name="provincia" label="Provincia" value={form.provincia} onChange={(v) => campo("provincia", v)} />
          <Campo id="vacante-localidad" name="localidad" label="Localidad" value={form.localidad} onChange={(v) => campo("localidad", v)} />
          <div>
            <label htmlFor="vacante-modalidad" className="block text-xs font-bold mb-1.5">Modalidad</label>
            <select id="vacante-modalidad" name="modalidad" className="input-marca" value={form.modalidad} onChange={(e) => campo("modalidad", e.target.value)}>
              <option value="presencial">Presencial</option>
              <option value="remoto">Remoto</option>
              <option value="hibrido">Híbrido</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <Campo id="vacante-jornada" name="jornada" label="Jornada" value={form.jornada} onChange={(v) => campo("jornada", v)} />
          <Campo id="vacante-tipo-contrato" name="tipo_contrato" label="Tipo de contrato" value={form.tipo_contrato} onChange={(v) => campo("tipo_contrato", v)} />
          <Campo id="vacante-cantidad" name="vacantes" label="Vacantes" type="number" value={form.vacantes} onChange={(v) => campo("vacantes", v)} />
        </div>

        <label htmlFor="vacante-requisitos-excluyentes" className="block text-xs font-bold mb-1.5">Requisitos excluyentes</label>
        <textarea id="vacante-requisitos-excluyentes" name="requisitos_excluyentes" className="input-marca mb-4" rows={2} value={form.requisitos_excluyentes} onChange={(e) => campo("requisitos_excluyentes", e.target.value)} />
        <label htmlFor="vacante-requisitos-deseables" className="block text-xs font-bold mb-1.5">Requisitos deseables</label>
        <textarea id="vacante-requisitos-deseables" name="requisitos_deseables" className="input-marca mb-4" rows={2} value={form.requisitos_deseables} onChange={(e) => campo("requisitos_deseables", e.target.value)} />
        <label htmlFor="vacante-habilidades" className="block text-xs font-bold mb-1.5">Habilidades (separadas por coma)</label>
        <textarea id="vacante-habilidades" name="habilidades" className="input-marca mb-4" rows={2} value={form.habilidades} onChange={(e) => campo("habilidades", e.target.value)} />

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <Campo id="vacante-idioma" name="idioma_requerido" label="Idioma requerido" value={form.idioma_requerido} onChange={(v) => campo("idioma_requerido", v)} />
          <div>
            <label htmlFor="vacante-nivel-idioma" className="block text-xs font-bold mb-1.5">Nivel</label>
            <select id="vacante-nivel-idioma" name="nivel_idioma" className="input-marca" value={form.nivel_idioma} onChange={(e) => campo("nivel_idioma", e.target.value)}>
              <option value="">—</option>
              <option value="basico">Básico</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
              <option value="nativo">Nativo / bilingüe</option>
            </select>
          </div>
        </div>

        <h3 className="text-xs font-extrabold uppercase tracking-wide text-muted mb-1">Tests requeridos para este puesto (opcional)</h3>
        <p className="text-xs text-muted mb-3">Se van a asignar solos a cada persona que postule — no hace falta asignarlos uno por uno.</p>
        {catalogo.some((t) => t.habilitado && t.disponible && t.tomable) ? (
          <div className="grid md:grid-cols-2 gap-2 mb-6">
            {catalogo.filter((t) => t.habilitado && t.disponible && t.tomable).map((t) => (
              <div key={t.slug} className="vacante-test-fila">
                <span>{t.nombre}</span>
                <button
                  type="button"
                  className={`interruptor ${form.tests_requeridos.includes(t.slug) ? "on" : ""}`}
                  aria-pressed={form.tests_requeridos.includes(t.slug)}
                  aria-label={`Requerir ${t.nombre}`}
                  onClick={() => alternarTest(t.slug)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="vacante-test-vacio mb-6">
            <Icon name="lock" className="w-4 h-4" />
            Todavía no tenés tests aprobados para usar en tus vacantes. Podés publicar igual — cuando tu cuenta
            tenga tests habilitados vas a poder pedirlos acá, sin tener que asignarlos uno por uno.
          </div>
        )}

        <h3 className="text-xs font-extrabold uppercase tracking-wide text-muted mb-3">Preguntas al postulante (opcional)</h3>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Campo id="vacante-pregunta-1" name="pregunta_1" label="Pregunta 1" value={form.pregunta_1} onChange={(v) => campo("pregunta_1", v)} />
          <Campo id="vacante-pregunta-2" name="pregunta_2" label="Pregunta 2" value={form.pregunta_2} onChange={(v) => campo("pregunta_2", v)} />
        </div>

        {error && <p className="text-sm text-rosa font-semibold mb-4">{error}</p>}

        <div className="flex justify-end gap-2.5 pt-2 border-t border-linea">
          <button type="button" onClick={onClose} className="boton boton-fantasma !py-2.5 mt-4">Cancelar</button>
          <button type="submit" disabled={enviando} className="boton boton-acento !py-2.5 mt-4">
            {enviando ? "Guardando…" : editando ? "Guardar cambios" : "Crear vacante"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Campo({ id, name, label, value, onChange, type = "text", required = false }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold mb-1.5">{label}</label>
      <input id={id} name={name} type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="input-marca" />
    </div>
  );
}
