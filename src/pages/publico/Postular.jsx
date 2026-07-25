import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { vacantesPublicas, postular } from "../../api/publico";
import { obtenerMiPerfil } from "../../api/persona";
import { usePersonaAuth } from "../../auth/usePersonaAuth";
import { archivoABase64 } from "../../utils/archivo";
import { ApiError } from "../../api/client";
import FirmaCanvas from "../../components/FirmaCanvas";
import Icon from "../../components/Icon";
import { validarPasoPostulacion } from "../../utils/validacionPostulacion";

const PASOS = [
  { key: "datos", titulo: "Tus datos", icon: "user" },
  { key: "perfil", titulo: "Perfil profesional", icon: "briefcase" },
  { key: "idiomas", titulo: "Idiomas", icon: "globe" },
  { key: "experiencia", titulo: "Experiencia", icon: "clock" },
  { key: "documentos", titulo: "CV y cuenta", icon: "file" },
  { key: "firma", titulo: "Firma", icon: "edit" },
];

export const RUTA_BUSQUEDAS_TRAS_POSTULACION = "/candidato/busquedas";

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
  const { autenticado, token } = usePersonaAuth();
  const [vacante, setVacante] = useState(null);
  const [paso, setPaso] = useState(0);
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

  useEffect(() => {
    if (!autenticado || !token) return;
    obtenerMiPerfil(token)
      .then((perfil) => {
        setForm((actual) => ({
          ...actual,
          email: perfil.email || "",
          nombre: perfil.nombre || "",
          apellido: perfil.apellido || "",
          telefono: perfil.telefono || "",
          puesto_deseado: perfil.puesto_deseado || "",
          fecha_nacimiento: perfil.fecha_nacimiento || "",
          identificacion: perfil.identificacion || "",
          provincia: perfil.provincia || "",
          codigo_postal_ciudad: perfil.codigo_postal_ciudad || "",
          perfil_profesional: perfil.perfil_profesional || "",
          descripcion_perfil: perfil.descripcion_perfil || "",
          formacion: perfil.formacion || [],
          disp_viajar: Boolean(perfil.disp_viajar),
          disp_cambio_residencia: Boolean(perfil.disp_cambio_residencia),
          primer_empleo: Boolean(perfil.primer_empleo),
        }));
        setIdiomas(
          perfil.idiomas?.length
            ? perfil.idiomas.map((item) => ({
                ...item,
                nivel: String(item.nivel || "").toLocaleLowerCase("es"),
              }))
            : [{ idioma: "", nivel: "" }],
        );
        setExperiencias(
          perfil.experiencias?.length
            ? perfil.experiencias
            : [{ puesto: "", empresa: "", descripcion: "" }],
        );
      })
      .catch(() => setError("No pudimos reutilizar tu perfil. Recargá la página para volver a intentarlo."));
  }, [autenticado, token]);

  function campo(nombre, valor) {
    setForm((f) => ({ ...f, [nombre]: valor }));
  }

  function actualizarFila(lista, setLista, i, campo, valor) {
    setLista(lista.map((f, idx) => (idx === i ? { ...f, [campo]: valor } : f)));
  }

  const totalPasos = PASOS.length;
  const esUltimo = paso === totalPasos - 1;

  function avanzar() {
    const mensaje = validarPasoPostulacion({ paso, form, idiomas, cvFile, firma });
    if (mensaje) {
      setError(mensaje);
      return;
    }
    if (paso < totalPasos - 1) {
      setError("");
      setPaso(paso + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function retroceder() {
    if (paso > 0) {
      setError("");
      setPaso(paso - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    const mensaje = validarPasoPostulacion({ paso: totalPasos - 1, form, idiomas, cvFile, firma });
    if (mensaje) {
      setError(mensaje);
      setPaso(totalPasos - 1);
      return;
    }
    if (enviando) return;
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
      }, token);
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
        <div className="w-16 h-16 rounded-full mx-auto mb-4 grid place-items-center" style={{ background: "rgba(107,225,227,.15)", color: "#1b9aa0" }}>
          <Icon name="check" className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold mb-2">¡Listo, {form.nombre}!</h1>
        <p className="text-muted mb-6">Tu postulación se envió correctamente. Te vamos a contactar por email.</p>
        <Link to={RUTA_BUSQUEDAS_TRAS_POSTULACION} className="boton boton-primario inline-flex justify-center">
          Ver más búsquedas
        </Link>
      </div>
    );
  }

  return (
    <div className="tarjeta p-6 md:p-10">
      <h1 className="text-2xl font-extrabold mb-1">Postularme</h1>
      <p className="text-muted text-sm mb-6">
        {vacante ? vacante.puesto : "Cargando la búsqueda…"}
      </p>

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {PASOS.map((p, i) => (
          <div key={p.key} className="flex items-center">
            <button
              type="button"
              onClick={() => i <= paso && setPaso(i)}
              className={`flex items-center gap-2 px-3 py-2 rounded-chico text-xs font-bold whitespace-nowrap transition-colors ${
                i === paso
                  ? "bg-white border border-acento text-acento"
                  : i < paso
                    ? "bg-white border border-linea text-tinta cursor-pointer hover:bg-gray-50"
                    : "bg-gray-100 border border-linea text-muted cursor-default"
              }`}
              disabled={i > paso}
            >
              <span className={`w-5 h-5 rounded-full grid place-items-center text-[10px] font-extrabold ${
                i < paso ? "bg-ok text-white" : i === paso ? "text-white" : "bg-linea text-muted"
              }`} style={i === paso ? { background: "var(--brand-acento)" } : {}}>
                {i < paso ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline">{p.titulo}</span>
            </button>
            {i < totalPasos - 1 && <div className="w-4 h-px bg-linea mx-1 flex-none" />}
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} noValidate>
        {/* Paso 0: Datos personales */}
        {paso === 0 && (
          <PasoWrapper titulo="Tus datos">
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
          </PasoWrapper>
        )}

        {/* Paso 1: Perfil profesional */}
        {paso === 1 && (
          <PasoWrapper titulo="Perfil profesional">
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
            {vacante?.pregunta_1 && (
              <div className="mt-4 border-t border-linea pt-4">
                <label className="block text-xs font-semibold mb-1.5">{vacante.pregunta_1}</label>
                <textarea className="input-marca mb-4" rows={2} value={form.respuesta_pregunta_1} onChange={(e) => campo("respuesta_pregunta_1", e.target.value)} />
                {vacante.pregunta_2 && (
                  <>
                    <label className="block text-xs font-semibold mb-1.5">{vacante.pregunta_2}</label>
                    <textarea className="input-marca" rows={2} value={form.respuesta_pregunta_2} onChange={(e) => campo("respuesta_pregunta_2", e.target.value)} />
                  </>
                )}
              </div>
            )}
          </PasoWrapper>
        )}

        {/* Paso 2: Idiomas */}
        {paso === 2 && (
          <PasoWrapper titulo="Idiomas">
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
          </PasoWrapper>
        )}

        {/* Paso 3: Experiencia */}
        {paso === 3 && (
          <PasoWrapper titulo="Experiencia laboral">
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
          </PasoWrapper>
        )}

        {/* Paso 4: CV y cuenta */}
        {paso === 4 && (
          <PasoWrapper titulo="CV y cuenta">
            <label className="block text-xs font-semibold mb-1.5">Currículum (PDF, máximo 5 MB)</label>
            <input type="file" accept="application/pdf,.pdf" onChange={(e) => setCvFile(e.target.files?.[0] || null)} className="mb-4 text-sm" />
            <label className="block text-xs font-semibold mb-1.5">
              Contraseña (opcional — te permite volver a entrar y ver el estado de tus postulaciones)
            </label>
            <input type="password" className="input-marca" value={form.password} onChange={(e) => campo("password", e.target.value)} minLength={8} />
          </PasoWrapper>
        )}

        {/* Paso 5: Firma */}
        {paso === 5 && (
          <PasoWrapper titulo="Firma de consentimiento">
            <p className="text-xs text-muted mb-3">
              Al firmar, confirmás que los datos son correctos y aceptás que la empresa acceda a tu perfil.
            </p>
            <FirmaCanvas onCambio={setFirma} requiereVerificacion />
          </PasoWrapper>
        )}

        {error && (
          <div className="mt-4 text-sm font-semibold px-3.5 py-2.5 rounded-chico" style={{ color: "#c0392b", background: "rgba(192,57,43,.08)", border: "1px solid rgba(192,57,43,.3)" }}>
            {error}
          </div>
        )}

        {/* Navegación */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-linea">
          {paso > 0 ? (
            <button type="button" onClick={retroceder} className="boton boton-fantasma inline-flex items-center gap-2">
              <Icon name="chevL" className="w-4 h-4" /> Anterior
            </button>
          ) : <div />}

          {esUltimo ? (
            <button type="submit" disabled={enviando} className="boton boton-primario inline-flex items-center gap-2">
              {enviando ? "Enviando…" : "Enviar postulación"}
            </button>
          ) : (
            <button type="button" onClick={avanzar} className="boton boton-acento inline-flex items-center gap-2">
              Siguiente <Icon name="chevR" className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function PasoWrapper({ titulo, children }) {
  return (
    <div>
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
