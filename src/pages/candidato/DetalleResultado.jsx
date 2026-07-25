import { Link, useParams } from "react-router-dom";
import { obtenerResultado } from "../../api/persona";
import { usePersonaAuth } from "../../auth/usePersonaAuth";
import { ErrorState, PageLoader } from "../../components/AsyncState";
import { useApiResource } from "../../hooks/useApiResource";

export default function DetalleResultado() {
  const { id } = useParams();
  const { token } = usePersonaAuth();
  const r = useApiResource((signal) => obtenerResultado(token, id, signal), [token, id]);
  if (r.cargando) return <PageLoader mensaje="Cargando resultado…" />;
  if (r.error) return <ErrorState mensaje={r.error} onReintentar={r.recargar} />;
  return <div><Link to="/candidato/resultados" className="text-sm text-purple-700 font-bold">← Volver</Link><section className="tarjeta p-6 sm:p-8 mt-5"><p className="text-xs text-gray-400 uppercase font-bold">Resultado psicométrico</p><h1 className="text-2xl font-extrabold mt-2">{r.data.test_nombre}</h1><p className="text-sm text-gray-500 mt-1">Realizado el {new Date(r.data.created_at).toLocaleDateString("es-AR")}</p><p className="text-sm text-gray-600 mt-6">Consultá el informe profesional para ver puntajes, baremos e interpretaciones con el contexto y la versión del instrumento.</p><Link className="btn-primario inline-block mt-5" to={`/candidato/resultados/${id}/informe`}>Abrir informe profesional</Link><details className="mt-7 text-xs text-gray-400"><summary>Información técnica</summary><p className="mt-2">Catálogo: {r.data.catalogo_version || "histórico"}</p><p>Algoritmo: {r.data.algoritmo_version || "histórico"}</p></details></section></div>;
}
