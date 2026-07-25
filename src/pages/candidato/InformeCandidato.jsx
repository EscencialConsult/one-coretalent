import { useParams } from "react-router-dom";
import { usePersonaAuth } from "../../auth/usePersonaAuth";
import { obtenerInforme } from "../../api/informes";
import { ErrorState, PageLoader } from "../../components/AsyncState";
import { useApiResource } from "../../hooks/useApiResource";
import InformeRouter from "../../informes/InformeRouter";

export default function InformeCandidato() {
  const { id } = useParams();
  const { token } = usePersonaAuth();
  const recurso = useApiResource((signal) => obtenerInforme(token, id, signal), [token, id]);
  if (recurso.cargando) return <PageLoader mensaje="Preparando informe…" />;
  if (recurso.error) return <ErrorState mensaje={recurso.error} onReintentar={() => recurso.recargar()} />;
  return <InformeRouter informe={recurso.data} />;
}
