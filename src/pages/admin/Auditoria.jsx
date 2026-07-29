import { useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { listarAuditoria } from "../../api/admin";
import { ErrorState, PageLoader } from "../../components/AsyncState";
import Icon from "../../components/Icon";

function formatearFecha(iso) {
  return new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

export default function Auditoria() {
  const { token } = useAuth();
  const [eventos, setEventos] = useState(null);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    setError("");
    listarAuditoria(token)
      .then(setEventos)
      .catch((err) => setError(err?.detail || err?.message || "No se pudo cargar la lista."));
  }, [token, intento]);

  if (error) {
    return <ErrorState mensaje={error} onReintentar={() => setIntento((n) => n + 1)} />;
  }
  if (eventos === null) {
    return <PageLoader mensaje="Cargando auditoría…" />;
  }

  return (
    <div>
      <div className="barra-herramientas">
        <span className="text-xs text-muted font-semibold">{eventos?.length ?? "…"} resultado{eventos?.length === 1 ? "" : "s"}</span>
      </div>
      <p className="text-xs text-muted -mt-2 mb-4">
        Traza de acciones sobre evaluaciones y resultados (asignación, inicio, entrega, acceso a informes).
        Se muestran los últimos 500 eventos.
      </p>

      <div className="tarjeta overflow-x-auto" style={{ padding: "4px 0" }}>
        {eventos?.length === 0 && (
          <div className="text-muted text-sm px-5 py-10 text-center">Todavía no hay eventos registrados.</div>
        )}
        {eventos?.length > 0 && (
          <table className="tabla-panel">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Acción</th>
                <th>Empresa</th>
                <th>Persona</th>
                <th>Actor</th>
                <th style={{ paddingRight: 20, textAlign: "right" }}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((ev) => (
                <tr key={ev.id}>
                  <td style={{ paddingLeft: 20 }}>
                    <div className="flex items-center gap-3">
                      <div className="fila-icono" style={{ background: "rgba(180,39,45,.1)" }}><Icon name="clock" className="w-4 h-4" /></div>
                      <b className="text-sm">{ev.accion}</b>
                    </div>
                  </td>
                  <td className="text-sm text-muted">{ev.empresa || "—"}</td>
                  <td className="text-sm text-muted">{ev.persona || "—"}</td>
                  <td className="text-xs text-muted capitalize">{ev.actor_tipo}</td>
                  <td style={{ paddingRight: 20, textAlign: "right" }} className="text-xs text-muted">{formatearFecha(ev.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
