import { Link, useParams } from "react-router-dom";
import { obtenerMiPostulacion, listarMisEvaluaciones } from "../../api/persona";
import { usePersonaAuth } from "../../auth/usePersonaAuth";
import { ErrorState, PageLoader } from "../../components/AsyncState";
import Icon from "../../components/Icon";
import { useApiResource } from "../../hooks/useApiResource";
import { Titulo } from "./MisPostulaciones";

export default function DetallePostulacion() {
  const { id } = useParams();
  const { token } = usePersonaAuth();
  const r = useApiResource((signal) => obtenerMiPostulacion(token, id, signal), [token, id]);
  const evals = useApiResource((signal) => listarMisEvaluaciones(token, signal), [token]);
  if (r.cargando) return <PageLoader mensaje="Cargando postulación…" />;
  if (r.error) return <ErrorState mensaje={r.error} onReintentar={r.recargar} />;
  const p = r.data;
  const evaluaciones = (evals.data || []).filter((e) => e.postulacion_id === id);
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

          {p.evaluaciones_total === 0 ? (
            <p className="candidate-group-empty" style={{ marginTop: "1rem" }}>
              Todavía no te asignaron ninguna evaluación para esta postulación.
            </p>
          ) : (
            <div className="candidate-postulacion-tests">
              {evaluaciones.map((ev) => (
                <div key={ev.id} className="candidate-postulacion-test-row">
                  <div>
                    <b>{ev.test_nombre}</b>
                    <span className={`candidate-evaluation-status is-${ev.estado}`} style={{ position: "static", display: "inline-block", marginLeft: ".5rem" }}>
                      {ev.estado === "en_progreso" ? "En progreso" : ev.estado === "completado" ? "Completada" : "Pendiente"}
                    </span>
                  </div>
                  {ev.estado !== "completado" && (
                    <Link className="candidate-evaluation-action" to={`/candidato/evaluaciones/${ev.id}`}>
                      {ev.estado === "en_progreso" ? "Continuar" : "Hacer test"} <Icon name="chevR" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          <Link to="/candidato/evaluaciones" className="candidate-primary-button">Ver todas mis evaluaciones <Icon name="chevR" /></Link>
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
