import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { listarVacantes } from "../../api/empresa";
import { ErrorState, PageLoader } from "../../components/AsyncState";
import Icon from "../../components/Icon";
import VacanteFormModal from "./VacanteFormModal";

const PASTILLA = {
  borrador: "apagado",
  activa: "ok",
  pausada: "alerta",
  cerrada: "rojo",
};

export default function Vacantes() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [vacantes, setVacantes] = useState(null);
  const [error, setError] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  function cargar() {
    setError(false);
    setVacantes(null);
    listarVacantes(token).then(setVacantes).catch(() => setError(true));
  }

  useEffect(cargar, [token]);

  if (error) return <ErrorState mensaje="No pudimos cargar las vacantes." onReintentar={cargar} />;
  if (!vacantes) return <PageLoader mensaje="Cargando vacantes…" />;

  const activas = vacantes.filter((v) => v.estado === "activa").length;
  const borrador = vacantes.filter((v) => v.estado === "borrador").length;
  const cerradas = vacantes.filter((v) => v.estado === "cerrada" || v.estado === "pausada").length;

  return (
    <div>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon v"><Icon name="briefcase" className="w-5 h-5" /></div>
          <div className="kpi-numero">{vacantes.length}</div>
          <div className="kpi-etiqueta">Vacantes totales</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon r"><Icon name="send" className="w-5 h-5" /></div>
          <div className="kpi-numero">{activas}</div>
          <div className="kpi-etiqueta">Activas</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon c"><Icon name="file" className="w-5 h-5" /></div>
          <div className="kpi-numero">{borrador}</div>
          <div className="kpi-etiqueta">En borrador</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon o"><Icon name="clock" className="w-5 h-5" /></div>
          <div className="kpi-numero">{cerradas}</div>
          <div className="kpi-etiqueta">Pausadas / cerradas</div>
        </div>
      </div>

      <div className="barra-herramientas">
        <div>
          <h3 className="text-sm font-bold">Todas las vacantes</h3>
        </div>
        <button onClick={() => setModalAbierto(true)} className="boton boton-acento inline-flex items-center gap-2 !py-2.5">
          <Icon name="plus" className="w-4 h-4" /> Nueva vacante
        </button>
      </div>

      <div className="tarjeta" style={{ padding: "4px 0" }}>
        {vacantes.length === 0 && (
          <div className="text-muted text-sm px-5 py-10 text-center">Todavía no publicaste ninguna vacante.</div>
        )}
        {vacantes.length > 0 && (
          <table className="tabla-panel">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Puesto</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {vacantes.map((v) => (
                <tr key={v.id} className="clic" onClick={() => navigate(`/empresa/vacantes/${v.id}`)}>
                  <td style={{ paddingLeft: 20 }}>
                    <div className="flex items-center gap-3">
                      <div className="fila-icono"><Icon name="briefcase" className="w-4 h-4" /></div>
                      <b className="text-sm">{v.puesto}</b>
                    </div>
                  </td>
                  <td>{[v.area, v.localidad || v.provincia].filter(Boolean).join(" · ") || "—"}</td>
                  <td>
                    <span className={`pastilla ${PASTILLA[v.estado]}`}>{v.estado}</span>
                  </td>
                  <td style={{ textAlign: "right", paddingRight: 20 }}>
                    <Icon name="chevR" className="w-4 h-4" style={{ color: "var(--brand-acento)" }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAbierto && (
        <VacanteFormModal
          onClose={() => setModalAbierto(false)}
          onCreada={(v) => navigate(`/empresa/vacantes/${v.id}`)}
        />
      )}
    </div>
  );
}
