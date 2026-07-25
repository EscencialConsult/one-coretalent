import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { listarTodasPostulaciones } from "../../api/empresa";
import Icon from "../../components/Icon";
import { ApiError } from "../../api/client";

export default function Postulantes() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [postulaciones, setPostulaciones] = useState(null);
  const [filtro, setFiltro] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    setError("");
    listarTodasPostulaciones(token)
      .then((data) => {
        if (activo) setPostulaciones(data);
      })
      .catch((err) => {
        if (activo) setError(err instanceof ApiError ? err.detail : "No se pudieron cargar las postulaciones.");
      });
    return () => {
      activo = false;
    };
  }, [token]);

  const filtradas = postulaciones?.filter((p) => {
    if (!filtro) return true;
    const buscar = filtro.toLowerCase();
    return (
      p.nombre?.toLowerCase().includes(buscar) ||
      p.apellido?.toLowerCase().includes(buscar) ||
      p.email?.toLowerCase().includes(buscar) ||
      p.vacante_puesto?.toLowerCase().includes(buscar)
    );
  });

  return (
    <div>
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="kpi-card">
          <div className="kpi-icon v"><Icon name="users" className="w-5 h-5" /></div>
          <div className="kpi-numero">{postulaciones?.length ?? "—"}</div>
          <div className="kpi-etiqueta">Total postulaciones</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon r"><Icon name="file" className="w-5 h-5" /></div>
          <div className="kpi-numero">{postulaciones?.filter((p) => p.cv_url).length ?? "—"}</div>
          <div className="kpi-etiqueta">Con CV</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon c"><Icon name="clock" className="w-5 h-5" /></div>
          <div className="kpi-numero">
            {postulaciones?.length
              ? new Set(postulaciones.map((p) => p.email)).size
              : "—"}
          </div>
          <div className="kpi-etiqueta">Candidatos únicos</div>
        </div>
      </div>

      <div className="barra-herramientas">
        <h3 className="text-sm font-bold">Todas las postulaciones</h3>
        <div className="panel-search">
          <Icon name="search" className="w-4 h-4 text-muted" />
          <input
            placeholder="Buscar por nombre, email o puesto…"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      </div>

{error && (
        <div role="alert" className="mb-4 text-sm font-semibold px-4 py-3 rounded-chico" style={{ color: "#c0392b", background: "rgba(192,57,43,.08)", border: "1px solid rgba(192,57,43,.3)" }}>
          {error}
        </div>
      )}

      <div className="tarjeta overflow-x-auto" style={{ padding: "4px 0" }}>
        {postulaciones === null && !error && (
          <div className="text-muted text-sm px-5 py-10 text-center">Cargando postulaciones…</div>
        )}
        {postulaciones?.length === 0 && (
          <div className="text-muted text-sm px-5 py-10 text-center">Todavía no hay postulaciones.</div>
        )}
        {filtradas?.length === 0 && postulaciones?.length > 0 && (
          <div className="text-muted text-sm px-5 py-10 text-center">No se encontraron resultados para "{filtro}".</div>
        )}
        {filtradas?.length > 0 && (
          <table className="tabla-panel">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Candidato</th>
                <th>Vacante</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((p) => (
                <tr key={p.id} className="clic" onClick={() => navigate(`/empresa/vacantes/${p.vacante_id}`)}>
                  <td style={{ paddingLeft: 20 }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-chico grid place-items-center font-extrabold flex-none text-white"
                        style={{ fontSize: 12, backgroundColor: "var(--brand-acento)" }}
                      >
                        {p.nombre[0]}{p.apellido[0]}
                      </div>
                      <div className="min-w-0">
                        <b className="text-sm block">{p.nombre} {p.apellido}</b>
                        <span className="text-xs text-muted">{p.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm">{p.vacante_puesto}</span>
                  </td>
                  <td>
                    <span className="text-xs text-muted">
                      {new Date(p.created_at).toLocaleDateString("es-AR")}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", paddingRight: 20 }}>
                    {p.cv_url && (
                      <a
                        href={p.cv_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="boton boton-fantasma inline-flex items-center gap-1.5 !py-2 !px-3.5 text-xs"
                      >
                        <Icon name="file" className="w-3.5 h-3.5" /> CV
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
