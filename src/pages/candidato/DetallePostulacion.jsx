import { Link, useParams } from "react-router-dom";
import { obtenerMiPostulacion } from "../../api/persona";
import { usePersonaAuth } from "../../auth/usePersonaAuth";
import { ErrorState, PageLoader } from "../../components/AsyncState";
import Icon from "../../components/Icon";
import { useApiResource } from "../../hooks/useApiResource";
import { Titulo } from "./MisPostulaciones";

export default function DetallePostulacion() {
  const { id } = useParams();
  const { token } = usePersonaAuth();
  const r = useApiResource((signal) => obtenerMiPostulacion(token, id, signal), [token, id]);
  if (r.cargando) return <PageLoader mensaje="Cargando postulación…" />;
  if (r.error) return <ErrorState mensaje={r.error} onReintentar={r.recargar} />;
  const p = r.data;
  return (
    <section className="candidate-page">
      <Link to="/candidato/postulaciones" className="candidate-back-link"><Icon name="chevL" /> Volver a mis postulaciones</Link>
      <Titulo etiqueta={p.empresa} titulo={p.puesto} bajada={`Postulación enviada el ${new Date(p.created_at).toLocaleDateString("es-AR")}`} />
      <div className="candidate-application-detail">
        <section className="candidate-detail-main">
          <header><div><Icon name="briefcase" /></div><span><h2>Sobre la búsqueda</h2><p>Información de la oportunidad laboral</p></span></header>
          <div className="candidate-detail-description">{p.descripcion || "Sin descripción disponible."}</div>
          <dl className="candidate-detail-data">
            <Dato icono="globe" k="Modalidad" v={p.modalidad} />
            <Dato icono="map" k="Ubicación" v={[p.localidad, p.provincia].filter(Boolean).join(", ")} />
            <Dato icono="clock" k="Estado de la búsqueda" v={p.estado_vacante} />
            <Dato icono="clipboard" k="Fecha de postulación" v={new Date(p.created_at).toLocaleDateString("es-AR")} />
          </dl>
        </section>
        <aside className="candidate-detail-side">
          <header><div><Icon name="clipboard" /></div><span><h2>Evaluaciones</h2><p>Progreso de esta postulación</p></span></header>
          <div className="candidate-evaluation-total"><strong>{p.evaluaciones_total}</strong><span>evaluaciones asignadas</span></div>
          <div className="candidate-evaluation-breakdown">
            <span><i className="is-pending" />Pendientes <strong>{p.evaluaciones_pendientes}</strong></span>
            <span><i className="is-complete" />Completadas <strong>{p.evaluaciones_completadas}</strong></span>
          </div>
          <Link to="/candidato/evaluaciones" className="candidate-primary-button">Ver evaluaciones <Icon name="chevR" /></Link>
          <div className="candidate-consent-summary">
            <EstadoDocumento titulo="Consentimiento" fecha={p.consentimiento_firmado_at} />
            <EstadoDocumento titulo="Conformidad" fecha={p.conformidad_firmada_at} />
          </div>
        </aside>
      </div>
    </section>
  );
}
function Dato({ icono, k, v }) { return <div><Icon name={icono} /><span><dt>{k}</dt><dd>{v || "No informado"}</dd></span></div>; }
function EstadoDocumento({ titulo, fecha }) {
  return <div><Icon name={fecha ? "check" : "clock"} /><span><strong>{titulo}</strong><small>{fecha ? `Firmado el ${new Date(fecha).toLocaleDateString("es-AR")}` : "No registrado"}</small></span></div>;
}
