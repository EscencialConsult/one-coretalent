import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registrarEmpresa } from "../../api/publico";
import { archivoABase64 } from "../../utils/archivo";
import { ApiError } from "../../api/client";
import CapturaSelfie from "../../components/CapturaSelfie";
import FirmaCanvas from "../../components/FirmaCanvas";
import Icon from "../../components/Icon";

const VACIO = {
  razon_social: "", subdominio: "", email_admin: "", admin_password: "",
  admin_nombre: "", admin_apellido: "", cuit: "", rubro: "", dni: "",
  acepto_terminos: false,
};

// Borrador en localStorage para no perder el formulario si cierran la ventana.
// Nunca guardamos admin_password, y la selfie/firma no se pueden persistir así
// (son captura en vivo) — esas dos se vuelven a hacer si hay que retomar.
const DRAFT_KEY = "registro-empresa-draft";
const CAMPOS_BORRADOR = [
  "razon_social", "subdominio", "email_admin",
  "admin_nombre", "admin_apellido", "cuit", "rubro", "dni", "acepto_terminos",
];

function cargarBorrador() {
  try {
    const guardado = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
    return { ...VACIO, ...guardado };
  } catch {
    return VACIO;
  }
}

export default function RegistroEmpresa() {
  const navigate = useNavigate();
  const [form, setForm] = useState(cargarBorrador);
  const [selfie, setSelfie] = useState(null);
  const [firma, setFirma] = useState(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const borrador = Object.fromEntries(CAMPOS_BORRADOR.map((campo) => [campo, form[campo]]));
    localStorage.setItem(DRAFT_KEY, JSON.stringify(borrador));
  }, [form]);

  const campo = (nombre, valor) => setForm((actual) => ({ ...actual, [nombre]: valor }));

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    if (!selfie) return setError("Falta capturar o subir la selfie del representante.");
    if (!firma) return setError("Falta la firma del representante.");
    if (!form.acepto_terminos) return setError("Tenés que aceptar los términos y la política de privacidad.");
    setEnviando(true);
    try {
      const selfie_base64 = await archivoABase64(selfie);
      await registrarEmpresa({ ...form, selfie_base64, firma_legal_base64: firma });
      localStorage.removeItem(DRAFT_KEY);
      setOk(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "No se pudo completar el registro.");
    } finally {
      setEnviando(false);
    }
  }

  if (ok) {
    return (
      <div className="registro-exito tarjeta">
        <span><Icon name="check" className="w-8 h-8" /></span>
        <h1>¡Registro recibido!</h1>
        <p>Un administrador revisará la información y te avisaremos por email cuando la cuenta esté habilitada.</p>
        <button onClick={() => navigate("/")} className="boton boton-primario">Volver al inicio</button>
      </div>
    );
  }

  return (
    <div className="registro-empresa">
      <header className="registro-hero">
        <span className="badge-estado bg-negro text-white">Alta de empresa</span>
        <h1>Creá el espacio de talento de tu organización</h1>
        <p>Publicá búsquedas, administrá postulantes y asigná evaluaciones desde un entorno profesional y seguro.</p>
      </header>

      <div className="registro-layout">
        <aside className="registro-aside">
          <h2>Antes de comenzar</h2>
          <Paso numero="1" texto="Datos de la organización" />
          <Paso numero="2" texto="Administrador responsable" />
          <Paso numero="3" texto="Verificación de identidad" />
          <div className="registro-seguridad">
            <Icon name="shield" className="w-5 h-5" />
            <p>La cuenta queda pendiente de revisión. Normalmente respondemos dentro de las próximas 24 horas hábiles.</p>
          </div>
        </aside>

        <form onSubmit={onSubmit} className="registro-form" noValidate={false}>
          <Seccion icono="briefcase" titulo="Datos de la empresa" bajada="Información pública e identificación fiscal de la organización.">
            <div className="grid sm:grid-cols-2 gap-4">
              <Campo label="Razón social" required value={form.razon_social} onChange={(v) => campo("razon_social", v)} />
              <Campo label="CUIT" required inputMode="numeric" placeholder="30-12345678-9" value={form.cuit} onChange={(v) => campo("cuit", v)} />
              <Campo label="Rubro" placeholder="Tecnología, salud, industria…" value={form.rubro} onChange={(v) => campo("rubro", v)} />
              <Campo
                label="Subdominio"
                ayuda={form.subdominio ? `${form.subdominio}.one-talent.com` : "Será parte del acceso personalizado"}
                required
                value={form.subdominio}
                onChange={(v) => campo("subdominio", v.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              />
            </div>
          </Seccion>

          <Seccion icono="user" titulo="Administrador de la cuenta" bajada="Será la persona responsable del acceso y la gestión inicial.">
            <div className="grid sm:grid-cols-2 gap-4">
              <Campo label="Nombre" autoComplete="given-name" required value={form.admin_nombre} onChange={(v) => campo("admin_nombre", v)} />
              <Campo label="Apellido" autoComplete="family-name" value={form.admin_apellido} onChange={(v) => campo("admin_apellido", v)} />
              <Campo label="Email corporativo" type="email" autoComplete="email" required value={form.email_admin} onChange={(v) => campo("email_admin", v)} />
              <Campo label="Contraseña" type="password" autoComplete="new-password" ayuda="Mínimo 8 caracteres" required value={form.admin_password} onChange={(v) => campo("admin_password", v)} minLength={8} />
              <Campo label="DNI del representante" inputMode="numeric" pattern="[0-9 .\-]{8,12}" ayuda="Ingresá los 8 dígitos" required value={form.dni} onChange={(v) => campo("dni", v)} />
            </div>
          </Seccion>

          <Seccion icono="camera" titulo="Verificación de identidad" bajada="Necesitamos una selfie actual y la firma del representante.">
            <div className="registro-verificacion-grid">
              <div>
                <h3>Selfie del representante</h3>
                <p className="registro-ayuda">Podés sacar la foto ahora o seleccionar una existente.</p>
                <CapturaSelfie archivo={selfie} onCambio={setSelfie} />
              </div>
              <div>
                <h3>Firma</h3>
                <p className="registro-ayuda">Firmá dentro del recuadro con el mouse o el dedo.</p>
                <FirmaCanvas onCambio={setFirma} className="firma-registro-canvas" />
              </div>
            </div>
          </Seccion>

          <section className="registro-consentimiento">
            <label>
              <input type="checkbox" checked={form.acepto_terminos} onChange={(e) => campo("acepto_terminos", e.target.checked)} required />
              <span>Acepto los <Link to="/terminos-condiciones" target="_blank">Términos y Condiciones</Link> y la <Link to="/politica-privacidad" target="_blank">Política de Privacidad</Link>.</span>
            </label>
          </section>

          {error && <div className="registro-error" role="alert">{error}</div>}
          <button type="submit" disabled={enviando} className="boton boton-primario registro-submit">
            {enviando ? "Enviando registro…" : "Enviar para revisión"}
          </button>
          <p className="registro-login">¿Tu empresa ya está registrada? <Link to="/login">Ingresar al panel</Link></p>
        </form>
      </div>
    </div>
  );
}

function Paso({ numero, texto }) {
  return <div className="registro-paso"><span>{numero}</span><p>{texto}</p></div>;
}

function Seccion({ icono, titulo, bajada, children }) {
  return (
    <section className="registro-seccion">
      <div className="registro-seccion-titulo">
        <span><Icon name={icono} className="w-5 h-5" /></span>
        <div><h2>{titulo}</h2><p>{bajada}</p></div>
      </div>
      {children}
    </section>
  );
}

function Campo({ label, ayuda, value, onChange, type = "text", required = false, ...props }) {
  return (
    <label className="registro-campo">
      <span>{label}{required && <b aria-hidden="true"> *</b>}</span>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="input-marca" {...props} />
      {ayuda && <small>{ayuda}</small>}
    </label>
  );
}
