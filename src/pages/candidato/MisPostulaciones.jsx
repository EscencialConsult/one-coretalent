import { Link } from "react-router-dom";
import { listarMisPostulaciones } from "../../api/persona";
import { usePersonaAuth } from "../../auth/usePersonaAuth";
import { EmptyState, ErrorState, PageLoader } from "../../components/AsyncState";
import Icon from "../../components/Icon";
import { useApiResource } from "../../hooks/useApiResource";

export default function MisPostulaciones() {
  const { token } = usePersonaAuth();
  const recurso = useApiResource((signal) => listarMisPostulaciones(token, signal), [token]);

  if (recurso.cargando) return <PageLoader mensaje="Cargando postulaciones…" />;
  if (recurso.error) return <ErrorState mensaje={recurso.error} onReintentar={recurso.recargar} />;

  const postulaciones = recurso.data;
  const pendientes = postulaciones.reduce((total, item) => total + (item.evaluaciones_pendientes || 0), 0);
  const activas = postulaciones.filter((item) => item.estado_vacante === "activa").length;

  return (
    <section className="candidate-page">
      <Titulo
        etiqueta="Tu actividad"
        titulo="Mis postulaciones"
        bajada="Seguí todas las búsquedas a las que te postulaste y revisá sus evaluaciones asociadas."
        accion={<Link to="/candidato/busquedas" className="candidate-page-action">Explorar oportunidades <Icon name="chevR" /></Link>}
      />
      {!postulaciones.length ? (
        <EmptyState titulo="Todavía no tenés postulaciones" mensaje="Explorá las búsquedas disponibles y encontrá tu próxima oportunidad." />
      ) : (
        <>
          <div className="candidate-application-summary" aria-label="Resumen de postulaciones">
            <Resumen icono="briefcase" valor={postulaciones.length} etiqueta="Postulaciones enviadas" tono="purple" />
            <Resumen icono="search" valor={activas} etiqueta="Búsquedas activas" tono="teal" />
            <Resumen icono="clipboard" valor={pendientes} etiqueta="Evaluaciones pendientes" tono="amber" />
          </div>
          <div className="candidate-applications-panel">
            <header>
              <div>
                <span>Historial de actividad</span>
                <h2>Tus procesos de selección</h2>
                <p>Ingresá a una postulación para consultar su detalle y las evaluaciones relacionadas.</p>
              </div>
              <span className="candidate-application-count">{postulaciones.length}</span>
            </header>
            <div className="candidate-list">
              {postulaciones.map((postulacion) => (
                <Link key={postulacion.id} to={`/candidato/postulaciones/${postulacion.id}`} className="candidate-list-card">
                  <div className="candidate-list-icon"><Icon name="briefcase" /></div>
                  <div className="candidate-list-copy">
                    <span>{postulacion.empresa}</span>
                    <h3>{postulacion.puesto}</h3>
                    <p><Icon name="clock" /> Postulación enviada el {new Date(postulacion.created_at).toLocaleDateString("es-AR")}</p>
                  </div>
                  <div className="candidate-list-status">
                    <EstadoVacante estado={postulacion.estado_vacante} />
                    {postulacion.evaluaciones_pendientes > 0 && (
                      <span className="is-pending">{postulacion.evaluaciones_pendientes} {postulacion.evaluaciones_pendientes === 1 ? "evaluación pendiente" : "evaluaciones pendientes"}</span>
                    )}
                  </div>
                  <span className="candidate-list-open">Ver detalle <Icon name="chevR" /></span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function Resumen({ icono, valor, etiqueta, tono }) {
  return <article className="candidate-application-stat"><div className={tono}><Icon name={icono} /></div><span><strong>{valor}</strong><small>{etiqueta}</small></span></article>;
}

function EstadoVacante({ estado }) {
  const etiqueta = String(estado || "sin estado").replaceAll("_", " ");
  return <span className={`candidate-status is-${estado || "unknown"}`}>{etiqueta}</span>;
}

export function Titulo({ etiqueta = "Mi espacio", titulo, bajada, accion }) {
  return (
    <header className="candidate-page-header">
      <div>
        <span>{etiqueta}</span>
        <h1>{titulo}</h1>
        <p>{bajada}</p>
      </div>
      {accion}
    </header>
  );
}
