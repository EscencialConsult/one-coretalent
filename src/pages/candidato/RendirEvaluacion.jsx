import { useParams } from "react-router-dom";
import { listarMisEvaluaciones } from "../../api/persona";
import { usePersonaAuth } from "../../auth/usePersonaAuth";
import { ErrorState, PageLoader } from "../../components/AsyncState";
import TestRunnerShell from "../../evaluado/TestRunnerShell";
import { useApiResource } from "../../hooks/useApiResource";

export default function RendirEvaluacion() {
  const { id } = useParams();
  const { token } = usePersonaAuth();
  const r = useApiResource((signal) => listarMisEvaluaciones(token, signal), [token]);
  if (r.cargando) return <PageLoader mensaje="Buscando evaluación…" />;
  if (r.error) return <ErrorState mensaje={r.error} onReintentar={r.recargar} />;
  const evaluacion = r.data.find((x) => x.id === id);
  if (!evaluacion) return <ErrorState titulo="Evaluación no encontrada" mensaje="La evaluación no existe o ya no está disponible." />;
  if (evaluacion.estado === "completado") return <ErrorState titulo="Evaluación completada" mensaje="Esta evaluación ya fue finalizada y no puede recalcularse." />;
  return <TestRunnerShell evaluacion={evaluacion} />;
}
