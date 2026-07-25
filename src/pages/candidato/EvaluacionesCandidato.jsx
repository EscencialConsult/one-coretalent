import { Link } from "react-router-dom";
import { listarMisEvaluaciones } from "../../api/persona";
import { usePersonaAuth } from "../../auth/usePersonaAuth";
import { EmptyState, ErrorState, PageLoader } from "../../components/AsyncState";
import Icon from "../../components/Icon";
import { useApiResource } from "../../hooks/useApiResource";
import { Titulo } from "./MisPostulaciones";

export default function EvaluacionesCandidato() {
  const { token } = usePersonaAuth();
  const recurso = useApiResource((signal) => listarMisEvaluaciones(token, signal), [token]);

  if (recurso.cargando) return <PageLoader mensaje="Cargando evaluaciones…" />;
  if (recurso.error) return <ErrorState mensaje={recurso.error} onReintentar={recurso.recargar} />;

  const activas = recurso.data.filter((evaluacion) => evaluacion.estado !== "completado");
  const completadas = recurso.data.filter((evaluacion) => evaluacion.estado === "completado");

  return (
    <section className="candidate-page">
      <Titulo
        etiqueta="Tu proceso"
        titulo="Evaluaciones"
        bajada="Encontrá tus pruebas pendientes, recuperá el progreso guardado y revisá las que ya completaste."
      />
      {!recurso.data.length ? (
        <EmptyState titulo="No tenés evaluaciones asignadas" mensaje="Cuando una empresa te asigne una prueba, aparecerá en esta sección." />
      ) : (
        <div className="candidate-evaluation-groups">
          <Grupo titulo="Pendientes y en progreso" items={activas} acciones />
          <Grupo titulo="Completadas" items={completadas} />
        </div>
      )}
    </section>
  );
}

function Grupo({ titulo, items, acciones }) {
  return (
    <section className="candidate-evaluation-group">
      <div className="candidate-group-heading">
        <h2>{titulo}</h2>
        <span>{items.length}</span>
      </div>
      {!items.length ? (
        <p className="candidate-group-empty">No hay elementos en esta sección.</p>
      ) : (
        <div className="candidate-result-grid">
          {items.map((evaluacion) => (
            <article className="candidate-evaluation-card" key={evaluacion.id}>
              <div className="candidate-result-icon"><Icon name="clipboard" /></div>
              <EstadoEvaluacion estado={evaluacion.estado} />
              <h3>{evaluacion.test_nombre}</h3>
              {evaluacion.reutilizada && <p className="candidate-reused"><Icon name="check" /> Resultado reutilizado</p>}
              {evaluacion.progreso_guardado_at && (
                <p className="candidate-saved">Último guardado: {new Date(evaluacion.progreso_guardado_at).toLocaleString("es-AR")}</p>
              )}
              {acciones && (
                <Link className="candidate-evaluation-action" to={`/candidato/evaluaciones/${evaluacion.id}`}>
                  {evaluacion.estado === "en_progreso" ? "Continuar evaluación" : "Comenzar evaluación"}
                  <Icon name="chevR" />
                </Link>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function EstadoEvaluacion({ estado }) {
  const texto = estado === "en_progreso" ? "En progreso" : estado === "completado" ? "Completada" : "Pendiente";
  return <span className={`candidate-evaluation-status is-${estado}`}>{texto}</span>;
}
