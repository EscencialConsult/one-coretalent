import { Link } from "react-router-dom";
import { listarMisResultados } from "../../api/persona";
import { usePersonaAuth } from "../../auth/usePersonaAuth";
import { EmptyState, ErrorState, PageLoader } from "../../components/AsyncState";
import Icon from "../../components/Icon";
import { useApiResource } from "../../hooks/useApiResource";
import { Titulo } from "./MisPostulaciones";

export default function ResultadosCandidato() {
  const { token } = usePersonaAuth();
  const recurso = useApiResource((signal) => listarMisResultados(token, signal), [token]);

  if (recurso.cargando) return <PageLoader mensaje="Cargando resultados…" />;
  if (recurso.error) return <ErrorState mensaje={recurso.error} onReintentar={recurso.recargar} />;

  return (
    <section className="candidate-page">
      <Titulo
        etiqueta="Evaluaciones completadas"
        titulo="Resultados disponibles"
        bajada="Consultá tus resultados e informes profesionales desde un espacio privado."
      />
      {!recurso.data.length ? (
        <EmptyState titulo="Todavía no hay resultados" mensaje="Los resultados aparecerán cuando finalices una evaluación." />
      ) : (
        <div className="candidate-result-grid">
          {recurso.data.map((resultado) => (
            <Link to={`/candidato/resultados/${resultado.id}`} key={resultado.id} className="candidate-result-card">
              <div className="candidate-result-icon"><Icon name="chart" /></div>
              <span>{new Date(resultado.created_at).toLocaleDateString("es-AR")}</span>
              <h2>{resultado.test_nombre}</h2>
              <p>Resultado calculado y disponible para consulta.</p>
              <strong>Ver resultado <Icon name="chevR" /></strong>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
