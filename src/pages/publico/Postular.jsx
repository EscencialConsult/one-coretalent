import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { vacantesPublicas, postular } from "../../api/publico";
import { archivoABase64 } from "../../utils/archivo";
import { ApiError } from "../../api/client";
import FirmaCanvas from "../../components/FirmaCanvas";

const VACIO = {
  email: "",
  nombre: "",
  apellido: "",
  telefono: "",
  puesto_deseado: "",
  fecha_nacimiento: "",
  identificacion: "",
  provincia: "",
  codigo_postal_ciudad: "",
  perfil_profesional: "",
  descripcion_perfil: "",
  disp_viajar: false,
  disp_cambio_residencia: false,
  primer_empleo: false,
  password: "",
  respuesta_pregunta_1: "",
  respuesta_pregunta_2: "",
};

export default function Postular() {
  const { vacanteId } = useParams();
  const navigate = useNavigate();
  const [vacante, setVacante] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [idiomas, setIdiomas] = useState([{ idioma: "", nivel: "" }]);
  const [experiencias, setExperiencias] = useState([{ puesto: "", empresa: "", descripcion: "" }]);
  const [cvFile, setCvFile] = useState(null);
  const [firma, setFirma] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    vacantesPublicas().then((lista) => setVacante(lista.find((v) => v.id === vacanteId) || null));
  }, [vacanteId]);

  function campo(nombre, valor) {
    setForm((f) => ({ ...f, [nombre]: valor }));
  }

  function actualizarFila(lista, setLista, i, campo, valor) {
    setLista(lista.map((f, idx) => (idx === i ? { ...f, [campo]: valor } : f)));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!firma) {
      setError("Falta la firma de consentimiento.");
      return;
    }
    setEnviando(true);
    try {
      const cv_base64 = cvFile ? await archivoABase64(cvFile) : undefined;
      await postular({
        vacante_id: vacanteId,
        ...form,
        password: form.password || undefined,
        idiomas: idiomas.filter((i) => i.idioma),
        experiencias: experiencias.filter((e) => e.puesto || e.empresa),
        cv_base64,
        cv_nombre: cvFile?.name,
        firma_consentimiento_base64: firma,
      });
      setOk(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "No se pudo enviar la postulación");
    } finally {
      setEnviando(false);
    }
  }

  if (ok) {
    return (
      <div className="tarjeta p-10 text-center">
        <h1 className="text-2xl font-extrabold mb-2">¡Listo, {form.nombre}!</h1>
        <p className="text-muted mb-6">Tu postulación se envió correctamente. Te vamos a contactar por email.</p>
        <button onClick={() => navigate("/busquedas")} className="boton boton-primario">
          Ver más búsquedas
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="tarjeta p-6 md:p-10">
      <h1 className="text-2xl font-extrabold mb-1">Postularme</h1>
      <p className="text-muted text-sm mb-8">
        {vacante ? vacante.puesto : "Cargando la búsqueda…"}
      </p>

      <Seccion titulo="Tus datos">
        <div className="grid md:grid-cols-2 gap-4">
          <Campo label="Nombre" required value={form.nombre} onChange={(v) => campo("nombre", v)} />
          <Campo label="Apellido" required value={form.apellido} onChange={(v) => campo("apellido", v)} />
          <Campo label="Email" type="email" required value={form.email} onChange={(v) => campo("email", v)} />
          <Campo label="Teléfono" value={form.telefono} onChange={(v) => campo("telefono", v)} />
          <Campo label="Fecha de nacimiento" type="date" value={form.fecha_nacimiento} onChange={(v) => campo("fecha_nacimiento", v)} />
          <Campo label="DNI" value={form.identificacion} onChange={(v) => campo("identificacion", v)} />
          <Campo label="Provincia" value={form.provincia} onChange={(v) => campo("provincia", v)} />
          <Campo label="Localidad" value={form.codigo_postal_ciudad} onChange={(v) => campo("codigo_postal_ciudad", v)} />
        </div>
      </Seccion>

      <Seccion titulo="Perfil profesional">
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <Campo label="Puesto deseado" value={form.puesto_deseado} onChange={(v) => campo("puesto_deseado", v)} />
          <Campo label="Perfil profesional" value={form.perfil_profesional} onChange={(v) => campo("perfil_profesional", v)} />
        </div>
        <label className="block text-xs font-semibold mb-1.5">Contanos sobre vos</label>
        <textarea
          className="input-marca mb-4"
          rows={3}
          value={form.descripcion_perfil}
          onChange={(e) => campo("descripcion_perfil", e.target.value)}
        />
        <div className="flex flex-wrap gap-6 mb-2">
          <Check label="Disponibilidad para viajar" checked={form.disp_viajar} onChange={(v) => campo("disp_viajar", v)} />
          <Check label="Disponibilidad para cambiar de residencia" checked={form.disp_cambio_residencia} onChange={(v) => campo("disp_cambio_residencia", v)} />
          <Check label="Es mi primer empleo" checked={form.primer_empleo} onChange={(v) => campo("primer_empleo", v)} />
        </div>
      </Seccion>

      <Seccion titulo="Idiomas">
        {idiomas.map((it, i) => (
          <div key={i} className="grid grid-cols-2 gap-3 mb-2">
            <input
              placeholder="Idioma"
              className="input-marca"
              value={it.idioma}
              onChange={(e) => actualizarFila(idiomas, setIdiomas, i, "idioma", e.target.value)}
            />
            <select
              className="input-marca"
              value={it.nivel}
              onChange={(e) => actualizarFila(idiomas, setIdiomas, i, "nivel", e.target.value)}
            >
              <option value="">Nivel</option>
              <option value="basico">Básico</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
              <option value="nativo">Nativo / bilingüe</option>
            </select>
          </div>
        ))}
        <button type="button" className="text-xs font-semibold text-acento" onClick={() => setIdiomas([...idiomas, { idioma: "", nivel: "" }])}>
          + Agregar idioma
        </button>
      </Seccion>

      <Seccion titulo="Experiencia laboral">
        {experiencias.map((it, i) => (
          <div key={i} className="grid md:grid-cols-3 gap-3 mb-2">
            <input placeholder="Puesto" className="input-marca" value={it.puesto} onChange={(e) => actualizarFila(experiencias, setExperiencias, i, "puesto", e.target.value)} />
            <input placeholder="Empresa" className="input-marca" value={it.empresa} onChange={(e) => actualizarFila(experiencias, setExperiencias, i, "empresa", e.target.value)} />
            <input placeholder="Descripción breve" className="input-marca" value={it.descripcion} onChange={(e) => actualizarFila(experiencias, setExperiencias, i, "descripcion", e.target.value)} />
          </div>
        ))}
        <button type="button" className="text-xs font-semibold text-acento" onClick={() => setExperiencias([...experiencias, { puesto: "", empresa: "", descripcion: "" }])}>
          + Agregar experiencia
        </button>
      </Seccion>

      {vacante?.pregunta_1 && (
        <Seccion titulo="Preguntas de la búsqueda">
          <label className="block text-xs font-semibold mb-1.5">{vacante.pregunta_1}</label>
          <textarea className="input-marca mb-4" rows={2} value={form.respuesta_pregunta_1} onChange={(e) => campo("respuesta_pregunta_1", e.target.value)} />
          {vacante.pregunta_2 && (
            <>
              <label className="block text-xs font-semibold mb-1.5">{vacante.pregunta_2}</label>
              <textarea className="input-marca" rows={2} value={form.respuesta_pregunta_2} onChange={(e) => campo("respuesta_pregunta_2", e.target.value)} />
            </>
          )}
        </Seccion>
      )}

      <Seccion titulo="CV y cuenta">
        <label className="block text-xs font-semibold mb-1.5">Currículum (PDF)</label>
        <input type="file" accept="application/pdf" onChange={(e) => setCvFile(e.target.files?.[0] || null)} className="mb-4 text-sm" />
        <label className="block text-xs font-semibold mb-1.5">
          Contraseña (opcional — te permite volver a entrar y ver el estado de tus postulaciones)
        </label>
        <input type="password" className="input-marca" value={form.password} onChange={(e) => campo("password", e.target.value)} minLength={8} />
      </Seccion>

      <Seccion titulo="Firma de consentimiento">
        <p className="text-xs text-muted mb-3">
          Al firmar, confirmás que los datos son correctos y aceptás que la empresa acceda a tu perfil.
        </p>
        <FirmaCanvas onCambio={setFirma} />
      </Seccion>

      {error && <p className="text-sm text-rosa font-semibold mt-6">{error}</p>}

      <button type="submit" disabled={enviando} className="boton boton-primario w-full mt-8">
        {enviando ? "Enviando…" : "Enviar postulación"}
      </button>
    </form>
  );
}

function Seccion({ titulo, children }) {
  return (
    <div className="mb-8 pb-8 border-b border-linea border-opacity-60 last:border-0 last:mb-0 last:pb-0">
      <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted mb-4">{titulo}</h2>
      {children}
    </div>
  );
}

function Campo({ label, value, onChange, type = "text", required = false }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5">{label}</label>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="input-marca" />
    </div>
  );
}

function Check({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4"
        style={{ accentColor: "var(--brand-acento)" }}
      />
      {label}
    </label>
  );
}
