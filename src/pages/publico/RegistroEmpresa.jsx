import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registrarEmpresa } from "../../api/publico";
import { archivoABase64 } from "../../utils/archivo";
import { ApiError } from "../../api/client";
import FirmaCanvas from "../../components/FirmaCanvas";

const VACIO = {
  razon_social: "",
  subdominio: "",
  email_admin: "",
  admin_password: "",
  admin_nombre: "",
  admin_apellido: "",
  cuit: "",
  rubro: "",
  dni: "",
  acepto_terminos: false,
};

export default function RegistroEmpresa() {
  const navigate = useNavigate();
  const [form, setForm] = useState(VACIO);
  const [selfie, setSelfie] = useState(null);
  const [firma, setFirma] = useState(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);

  function campo(nombre, valor) {
    setForm((f) => ({ ...f, [nombre]: valor }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!selfie) return setError("Falta subir una foto tuya (selfie), la usamos para verificar tu identidad.");
    if (!firma) return setError("Falta la firma.");
    setEnviando(true);
    try {
      const selfie_base64 = await archivoABase64(selfie);
      await registrarEmpresa({ ...form, selfie_base64, firma_legal_base64: firma });
      setOk(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "No se pudo completar el registro");
    } finally {
      setEnviando(false);
    }
  }

  if (ok) {
    return (
      <div className="tarjeta p-10 text-center">
        <h1 className="text-2xl font-extrabold mb-2">¡Registro recibido!</h1>
        <p className="text-muted mb-6">
          Un administrador va a revisar tu cuenta y te vamos a avisar por email cuando esté habilitada.
        </p>
        <button onClick={() => navigate("/")} className="boton boton-primario">
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="tarjeta p-6 md:p-10 max-w-xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">Registrar mi empresa</h1>
      <p className="text-muted text-sm mb-8">
        Publicá búsquedas y evaluá candidatos. Tu cuenta queda pendiente de revisión hasta que la
        aprobemos (usualmente en menos de 24hs).
      </p>

      <div className="grid gap-4 mb-6">
        <Campo label="Razón social" required value={form.razon_social} onChange={(v) => campo("razon_social", v)} />
        <Campo
          label="Subdominio (para tu link de acceso)"
          required
          value={form.subdominio}
          onChange={(v) => campo("subdominio", v.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
        />
        <Campo label="CUIT" required value={form.cuit} onChange={(v) => campo("cuit", v)} />
        <Campo label="Rubro" value={form.rubro} onChange={(v) => campo("rubro", v)} />
      </div>

      <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted mb-4">Administrador de la cuenta</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Campo label="Nombre" required value={form.admin_nombre} onChange={(v) => campo("admin_nombre", v)} />
        <Campo label="Apellido" value={form.admin_apellido} onChange={(v) => campo("admin_apellido", v)} />
        <Campo label="Email" type="email" required value={form.email_admin} onChange={(v) => campo("email_admin", v)} />
        <Campo label="Contraseña" type="password" required value={form.admin_password} onChange={(v) => campo("admin_password", v)} minLength={8} />
        <Campo label="DNI del representante" required value={form.dni} onChange={(v) => campo("dni", v)} />
      </div>

      <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted mb-4">Verificación de identidad</h2>
      <label className="block text-xs font-semibold mb-1.5">Selfie del representante</label>
      <input type="file" accept="image/*" onChange={(e) => setSelfie(e.target.files?.[0] || null)} className="mb-4 text-sm" />

      <label className="block text-xs font-semibold mb-1.5">Firma</label>
      <FirmaCanvas onCambio={setFirma} />

      <label className="flex items-start gap-2 text-sm mt-6 cursor-pointer">
        <input
          type="checkbox"
          checked={form.acepto_terminos}
          onChange={(e) => campo("acepto_terminos", e.target.checked)}
          className="w-4 h-4 mt-0.5"
          style={{ accentColor: "var(--brand-acento)" }}
        />
        Acepto los términos y condiciones y la política de privacidad.
      </label>

      {error && <p className="text-sm text-rosa font-semibold mt-4">{error}</p>}

      <button type="submit" disabled={enviando} className="boton boton-primario w-full mt-6">
        {enviando ? "Enviando…" : "Crear cuenta"}
      </button>
    </form>
  );
}

function Campo({ label, value, onChange, type = "text", required = false, minLength }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5">{label}</label>
      <input
        type={type}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-marca"
      />
    </div>
  );
}
