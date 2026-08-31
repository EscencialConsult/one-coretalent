import { useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { listarPostulantesGlobal } from "../../api/admin";
import { ErrorState, PageLoader } from "../../components/AsyncState";
import Icon from "../../components/Icon";
import { descargarCsv } from "../../utils/csv";

function sigla(nombre, apellido) {
  return `${(nombre || "?")[0] || ""}${(apellido || "")[0] || ""}`.toUpperCase() || "?";
}

export default function Postulantes() {
  const { token } = useAuth();
  const [postulantes, setPostulantes] = useState(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controlador = setTimeout(() => {
      setError("");
      listarPostulantesGlobal(token, q)
        .then(setPostulantes)
        .catch((err) => setError(err?.detail || err?.message || "No se pudo cargar la lista."));
    }, 300);
    return () => clearTimeout(controlador);
  }, [token, q, intento]);

  if (error) {
    return <ErrorState mensaje={error} onReintentar={() => setIntento((n) => n + 1)} />;
  }
  if (postulantes === null) {
    return <PageLoader mensaje="Cargando postulantes…" />;
  }

  function exportar() {
    descargarCsv(
      "postulantes.csv",
      ["Nombre", "Apellido", "Email", "Teléfono", "Puesto deseado", "Provincia", "Postulaciones"],
      (postulantes || []).map((p) => [
        p.nombre, p.apellido, p.email, p.telefono || "", p.puesto_deseado || "", p.provincia || "", p.postulaciones,
      ])
    );
  }

  return (
    <div>
      <div className="barra-herramientas">
        <span className="text-xs text-muted font-semibold">{postulantes?.length ?? "…"} resultado{postulantes?.length === 1 ? "" : "s"}</span>
        <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center", gap: 10 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, email, puesto…"
            className="input-marca"
            style={{ width: 260, flex: "none", minHeight: "auto", padding: "8px 12px" }}
          />
          <button onClick={exportar} disabled={!postulantes?.length} className="boton boton-fantasma inline-flex items-center gap-1.5 whitespace-nowrap !py-2 !px-3.5 text-xs" style={{ flex: "none" }}>
            <Icon name="doc" className="w-3.5 h-3.5" /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="tarjeta overflow-x-auto" style={{ padding: "4px 0" }}>
        {postulantes?.length === 0 && (
          <div className="text-muted text-sm px-5 py-10 text-center">
            {q ? "No hay postulantes que coincidan con la búsqueda." : "Todavía no hay postulantes cargados."}
          </div>
        )}
        {postulantes?.length > 0 && (
          <table className="tabla-panel">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Postulante</th>
                <th>Puesto deseado</th>
                <th>Email</th>
                <th style={{ paddingRight: 20, textAlign: "right" }}>Postulaciones</th>
              </tr>
            </thead>
            <tbody>
              {postulantes.map((p) => (
                <tr key={p.id}>
                  <td style={{ paddingLeft: 20 }}>
                    <div className="flex items-center gap-3">
                      <div className="fila-icono" style={{ background: "rgba(77,36,143,.1)" }}>{sigla(p.nombre, p.apellido)}</div>
                      <div>
                        <b className="text-sm block">{p.nombre} {p.apellido}</b>
                        <span className="text-xs text-muted">{p.provincia || "Sin provincia"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm">{p.puesto_deseado ? <span className="pastilla">{p.puesto_deseado}</span> : <span className="text-muted text-xs">—</span>}</td>
                  <td className="text-xs text-muted">{p.email}</td>
                  <td style={{ paddingRight: 20, textAlign: "right" }} className="text-sm font-bold">{p.postulaciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
