import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { obtenerVacante, cambiarEstadoVacante, listarPostulaciones } from "../../api/empresa";
import { ApiError } from "../../api/client";
import Icon from "../../components/Icon";

const ESTADOS = ["borrador", "activa", "pausada", "cerrada"];

export default function VacanteDetalle() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [vacante, setVacante] = useState(null);
  const [postulaciones, setPostulaciones] = useState(null);
  const [cambiando, setCambiando] = useState(false);
  const [error, setError] = useState("");

  function cargar() {
    obtenerVacante(token, id).then(setVacante);
    listarPostulaciones(token, id).then(setPostulaciones);
  }

  useEffect(cargar, [token, id]);

  async function onCambiarEstado(estado) {
    setError("");
    setCambiando(true);
    try {
      const actualizada = await cambiarEstadoVacante(token, id, estado);
      setVacante(actualizada);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "No se pudo cambiar el estado");
    } finally {
      setCambiando(false);
    }
  }

  if (!vacante) return <div className="tarjeta p-8"><p className="text-muted text-sm">Cargando…</p></div>;

  return (
    <div>
      <button onClick={() => navigate("/empresa/vacantes")} className="volver-link">
        <Icon name="chevL" className="w-4 h-4" /> Volver a Vacantes
      </button>

      <div className="tarjeta mb-6" style={{ padding: 22 }}>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-14 h-14 rounded-marca grid place-items-center font-extrabold text-lg flex-none"
              style={{ background: "rgba(77,36,143,.1)", color: "var(--brand-acento)" }}
            >
              <Icon name="briefcase" className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold leading-tight">{vacante.puesto}</h1>
              <p className="text-sm text-muted mt-1">
                {[vacante.area, vacante.localidad || vacante.provincia].filter(Boolean).join(" · ") || "Sin ubicación cargada"}
              </p>
            </div>
          </div>
          <div className="ml-auto">
            <label htmlFor="estado-vacante" className="sr-only">Estado de la vacante</label>
            <select
              id="estado-vacante"
              name="estado"
              value={vacante.estado}
              disabled={cambiando}
              onChange={(e) => onCambiarEstado(e.target.value)}
              className="input-marca font-bold"
              style={{ width: "auto" }}
            >
              {ESTADOS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-rosa font-semibold mt-4">{error}</p>}
        {vacante.estado === "activa" && (
          <p className="text-xs mt-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-chico" style={{ color: "#1b9aa0", background: "rgba(107,225,227,.12)", border: "1px solid rgba(107,225,227,.3)" }}>
            <Icon name="check" className="w-3.5 h-3.5" /> Al quedar activa, se notificó automáticamente a los candidatos compatibles.
          </p>
        )}
        {vacante.descripcion && <p className="text-sm text-tinta text-opacity-80 mt-4 border-t border-linea pt-4">{vacante.descripcion}</p>}
      </div>

      <div className="barra-herramientas">
        <h2 className="text-sm font-bold">Postulaciones ({postulaciones?.length ?? "…"})</h2>
      </div>

      <div className="tarjeta" style={{ padding: "6px 0" }}>
        {postulaciones?.length === 0 && (
          <div className="text-muted text-sm px-5 py-10 text-center">Todavía no hay postulaciones.</div>
        )}
        {postulaciones?.map((p) => (
          <div key={p.id} className="fila-lista" style={{ flexWrap: "wrap" }}>
            <div
              className="w-9 h-9 rounded-chico grid place-items-center font-extrabold flex-none text-white"
              style={{ fontSize: 12, backgroundColor: "var(--brand-acento)" }}
            >
              {p.nombre[0]}{p.apellido[0]}
            </div>
            <div className="min-w-0 flex-1">
              <b className="text-sm block">{p.nombre} {p.apellido}</b>
              <span className="text-xs text-muted">
                {p.email}{p.telefono && ` · ${p.telefono}`}{p.perfil_profesional && ` · ${p.perfil_profesional}`}
              </span>
            </div>
            {p.cv_url && (
              <a
                href={p.cv_url}
                target="_blank"
                rel="noreferrer"
                className="boton boton-fantasma inline-flex items-center gap-1.5 !py-2 !px-3.5 text-xs flex-none"
              >
                <Icon name="file" className="w-3.5 h-3.5" /> Ver CV
              </a>
            )}
            <button
              type="button"
              onClick={() => navigate(`/empresa/vacantes/${id}/postulaciones/${p.id}`)}
              className="boton boton-acento inline-flex items-center gap-1 !py-2 !px-3.5 text-xs flex-none"
            >
              Gestionar <Icon name="chevR" className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
