import { useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { cambiarPasswordAdmin } from "../../api/auth";
import { obtenerMiEmpresa } from "../../api/empresa";
import { ApiError } from "../../api/client";
import Icon from "../../components/Icon";

export default function PerfilEmpresa() {
  const { token, user } = useAuth();
  const [empresa, setEmpresa] = useState(null);
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    obtenerMiEmpresa(token).then(setEmpresa).catch(() => setEmpresa(null));
  }, [token]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setOk(false);
    if (nueva !== repetir) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    setEnviando(true);
    try {
      await cambiarPasswordAdmin(token, actual, nueva);
      setOk(true);
      setActual(""); setNueva(""); setRepetir("");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "No se pudo cambiar la contraseña.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-5 items-start">
      <div>
        <section className="tarjeta p-6 mb-5">
          <h3 className="text-sm font-bold mb-4">Tu cuenta</h3>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-marca grid place-items-center bg-purple-100 text-acento font-extrabold text-lg flex-none">
              {(user?.nombre?.[0] || "") + (user?.apellido?.[0] || "")}
            </div>
            <div>
              <b className="text-base block">{user?.nombre} {user?.apellido}</b>
              <span className="text-sm text-muted">{user?.email}</span>
              <span className="pastilla apagado ml-2" style={{ textTransform: "capitalize" }}>{user?.rol?.replace("_", " ")}</span>
            </div>
          </div>
        </section>

        <section className="tarjeta p-6">
          <h3 className="text-sm font-bold mb-4">Empresa</h3>
          {!empresa ? (
            <p className="text-sm text-muted">Cargando…</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><span className="text-xs text-muted block">Razón social</span><b>{empresa.razon_social}</b></div>
              <div><span className="text-xs text-muted block">Subdominio</span><b>{empresa.subdominio}</b></div>
              <div><span className="text-xs text-muted block">Email de contacto</span><b>{empresa.email_admin}</b></div>
              <div><span className="text-xs text-muted block">Estado</span><span className={`pastilla ${empresa.estado === "activo" ? "ok" : "apagado"}`}>{empresa.estado}</span></div>
              <div>
                <span className="text-xs text-muted block mb-1">Color de marca</span>
                <span className="inline-flex items-center gap-2">
                  <span style={{ width: 18, height: 18, borderRadius: 6, background: empresa.color_acento, display: "inline-block", border: "1px solid var(--linea)" }} />
                  {empresa.color_acento}
                </span>
              </div>
            </div>
          )}
          <p className="text-xs text-muted mt-4">Para cambiar estos datos, escribile a soporte.</p>
        </section>
      </div>

      <section className="tarjeta p-6">
        <h3 className="text-sm font-bold mb-4">Cambiar contraseña</h3>
        <form onSubmit={onSubmit} className="max-w-md">
          <label className="block text-xs font-bold text-tinta mb-1.5">Contraseña actual</label>
          <input type="password" required value={actual} onChange={(e) => setActual(e.target.value)} className="input-marca mb-3" autoComplete="current-password" />

          <label className="block text-xs font-bold text-tinta mb-1.5">Contraseña nueva</label>
          <input type="password" required minLength={8} value={nueva} onChange={(e) => setNueva(e.target.value)} className="input-marca mb-3" autoComplete="new-password" />

          <label className="block text-xs font-bold text-tinta mb-1.5">Repetir contraseña nueva</label>
          <input type="password" required minLength={8} value={repetir} onChange={(e) => setRepetir(e.target.value)} className="input-marca" autoComplete="new-password" />

          {error && (
            <div role="alert" className="mt-3.5 text-sm font-semibold px-3.5 py-2.5 rounded-chico" style={{ color: "#c0392b", background: "rgba(192,57,43,.08)", border: "1px solid rgba(192,57,43,.3)" }}>
              {error}
            </div>
          )}
          {ok && (
            <div className="mt-3.5 text-sm font-semibold px-3.5 py-2.5 rounded-chico" style={{ color: "#2b6f8c", background: "rgba(107,225,227,.12)", border: "1px solid rgba(107,225,227,.3)" }}>
              Contraseña actualizada.
            </div>
          )}

          <button type="submit" disabled={enviando} className="boton boton-primario inline-flex items-center gap-2 mt-4">
            <Icon name="lock" className="w-4 h-4" /> {enviando ? "Guardando…" : "Guardar contraseña"}
          </button>
        </form>
      </section>
    </div>
  );
}
