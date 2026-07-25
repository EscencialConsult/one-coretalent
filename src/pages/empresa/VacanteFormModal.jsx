import { useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { crearVacante } from "../../api/empresa";
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
};

export default function VacanteFormModal({ onClose, onCreada }) {
  const { token } = useAuth();
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  function campo(nombre, valor) {
    setForm((f) => ({ ...f, [nombre]: valor }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const vacante = await crearVacante(token, { ...form, vacantes: Number(form.vacantes) || 1 });
      onCreada(vacante);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "No se pudo crear la vacante");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={onSubmit} className="modal-card" style={{ width: 640 }}>
        <button type="button" onClick={onClose} className="absolute top-4 right-4 border-0 bg-transparent cursor-pointer text-muted">
          <Icon name="x" className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-extrabold mb-1">Nueva vacante</h2>
        <p className="text-muted text-sm mb-6">Se crea como borrador — la activás cuando esté lista.</p>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <Campo label="Puesto" required value={form.puesto} onChange={(v) => campo("puesto", v)} />
          <Campo label="Área" value={form.area} onChange={(v) => campo("area", v)} />
        </div>

        <label className="block text-xs font-bold mb-1.5">Descripción</label>
        <textarea className="input-marca mb-4" rows={3} value={form.descripcion} onChange={(e) => campo("descripcion", e.target.value)} />

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <Campo label="Provincia" value={form.provincia} onChange={(v) => campo("provincia", v)} />
          <Campo label="Localidad" value={form.localidad} onChange={(v) => campo("localidad", v)} />
          <div>
            <label className="block text-xs font-bold mb-1.5">Modalidad</label>
            <select className="input-marca" value={form.modalidad} onChange={(e) => campo("modalidad", e.target.value)}>
              <option value="presencial">Presencial</option>
              <option value="remoto">Remoto</option>
              <option value="hibrido">Híbrido</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <Campo label="Jornada" value={form.jornada} onChange={(v) => campo("jornada", v)} />
          <Campo label="Tipo de contrato" value={form.tipo_contrato} onChange={(v) => campo("tipo_contrato", v)} />
          <Campo label="Vacantes" type="number" value={form.vacantes} onChange={(v) => campo("vacantes", v)} />
        </div>

        <label className="block text-xs font-bold mb-1.5">Requisitos excluyentes</label>
        <textarea className="input-marca mb-4" rows={2} value={form.requisitos_excluyentes} onChange={(e) => campo("requisitos_excluyentes", e.target.value)} />
        <label className="block text-xs font-bold mb-1.5">Requisitos deseables</label>
        <textarea className="input-marca mb-4" rows={2} value={form.requisitos_deseables} onChange={(e) => campo("requisitos_deseables", e.target.value)} />
        <label className="block text-xs font-bold mb-1.5">Habilidades (separadas por coma)</label>
        <textarea className="input-marca mb-4" rows={2} value={form.habilidades} onChange={(e) => campo("habilidades", e.target.value)} />

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <Campo label="Idioma requerido" value={form.idioma_requerido} onChange={(v) => campo("idioma_requerido", v)} />
          <div>
            <label className="block text-xs font-bold mb-1.5">Nivel</label>
            <select className="input-marca" value={form.nivel_idioma} onChange={(e) => campo("nivel_idioma", e.target.value)}>
              <option value="">—</option>
              <option value="basico">Básico</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
              <option value="nativo">Nativo / bilingüe</option>
            </select>
          </div>
        </div>

        <h3 className="text-xs font-extrabold uppercase tracking-wide text-muted mb-3">Preguntas al postulante (opcional)</h3>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Campo label="Pregunta 1" value={form.pregunta_1} onChange={(v) => campo("pregunta_1", v)} />
          <Campo label="Pregunta 2" value={form.pregunta_2} onChange={(v) => campo("pregunta_2", v)} />
        </div>

        {error && <p className="text-sm text-rosa font-semibold mb-4">{error}</p>}

        <div className="flex justify-end gap-2.5 pt-2 border-t border-linea">
          <button type="button" onClick={onClose} className="boton boton-fantasma !py-2.5 mt-4">Cancelar</button>
          <button type="submit" disabled={enviando} className="boton boton-acento !py-2.5 mt-4">
            {enviando ? "Creando…" : "Crear vacante"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Campo({ label, value, onChange, type = "text", required = false }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5">{label}</label>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="input-marca" />
    </div>
  );
}
