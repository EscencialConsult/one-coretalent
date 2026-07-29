import { useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { listarVacantesGlobal } from "../../api/admin";
import { ErrorState, PageLoader } from "../../components/AsyncState";
import Icon from "../../components/Icon";
import { descargarCsv } from "../../utils/csv";

const ESTADO_CLASE = { activa: "ok", pausada: "apagado", cerrada: "rojo", borrador: "apagado" };

export default function Busquedas() {
  const { token } = useAuth();
  const [vacantes, setVacantes] = useState(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controlador = setTimeout(() => {
      setError("");
      listarVacantesGlobal(token, q)
        .then(setVacantes)
        .catch((err) => setError(err?.detail || err?.message || "No se pudo cargar la lista."));
    }, 300);
    return () => clearTimeout(controlador);
  }, [token, q, intento]);

  if (error) {
    return <ErrorState mensaje={error} onReintentar={() => setIntento((n) => n + 1)} />;
  }
  if (vacantes === null) {
    return <PageLoader mensaje="Cargando búsquedas…" />;
  }

  function exportar() {
    descargarCsv(
      "busquedas.csv",
      ["Puesto", "Empresa", "Estado", "Modalidad", "Provincia", "Localidad", "Vacantes", "Postulaciones"],
      (vacantes || []).map((v) => [
        v.puesto, v.empresa, v.estado, v.modalidad || "", v.provincia || "", v.localidad || "", v.vacantes, v.postulaciones,
      ])
    );
  }

  return (
    <div>
      <div className="barra-herramientas">
        <span className="text-xs text-muted font-semibold">{vacantes?.length ?? "…"} resultado{vacantes?.length === 1 ? "" : "s"}</span>
        <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center", gap: 10 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por puesto o empresa…"
            className="input-marca"
            style={{ width: 260, flex: "none", minHeight: "auto", padding: "8px 12px" }}
          />
          <button onClick={exportar} disabled={!vacantes?.length} className="boton boton-fantasma inline-flex items-center gap-1.5 whitespace-nowrap !py-2 !px-3.5 text-xs" style={{ flex: "none" }}>
            <Icon name="doc" className="w-3.5 h-3.5" /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="tarjeta overflow-x-auto" style={{ padding: "4px 0" }}>
        {vacantes?.length === 0 && (
          <div className="text-muted text-sm px-5 py-10 text-center">
            {q ? "No hay búsquedas que coincidan con la búsqueda." : "Todavía no hay búsquedas publicadas."}
          </div>
        )}
        {vacantes?.length > 0 && (
          <table className="tabla-panel">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Puesto</th>
                <th>Empresa</th>
                <th>Estado</th>
                <th>Ubicación</th>
                <th style={{ paddingRight: 20, textAlign: "right" }}>Postulaciones</th>
              </tr>
            </thead>
            <tbody>
              {vacantes.map((v) => (
                <tr key={v.id}>
                  <td style={{ paddingLeft: 20 }}>
                    <div className="flex items-center gap-3">
                      <div className="fila-icono" style={{ background: "rgba(180,39,45,.1)" }}><Icon name="briefcase" className="w-4 h-4" /></div>
                      <b className="text-sm">{v.puesto}</b>
                    </div>
                  </td>
                  <td className="text-sm text-muted">{v.empresa}</td>
                  <td><span className={`pastilla ${ESTADO_CLASE[v.estado] || "apagado"}`}>{v.estado}</span></td>
                  <td className="text-xs text-muted">{[v.localidad, v.provincia].filter(Boolean).join(", ") || "—"}</td>
                  <td style={{ paddingRight: 20, textAlign: "right" }} className="text-sm font-bold">{v.postulaciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
