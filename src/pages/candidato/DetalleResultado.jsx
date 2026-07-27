import { Link, useParams } from "react-router-dom";
import { obtenerResultado } from "../../api/persona";
import { usePersonaAuth } from "../../auth/usePersonaAuth";
import { ErrorState, PageLoader } from "../../components/AsyncState";
import Icon from "../../components/Icon";
import { useApiResource } from "../../hooks/useApiResource";

export default function DetalleResultado() {
  const { id } = useParams();
  const { token } = usePersonaAuth();
  const r = useApiResource((signal) => obtenerResultado(token, id, signal), [token, id]);
  if (r.cargando) return <PageLoader mensaje="Cargando resultado…" />;
  if (r.error) return <ErrorState mensaje={r.error} onReintentar={r.recargar} />;
  const dato = r.data;
  return (
    <section className="candidate-page">
      <Link to="/candidato/resultados" className="candidate-back-link"><Icon name="chevL" /> Volver a mis resultados</Link>
      <section className="tarjeta p-6 sm:p-8 mt-2">
        <p className="text-xs text-gray-400 uppercase font-bold">Resultado psicométrico</p>
        <h1 className="text-2xl font-extrabold mt-2">{dato.test_nombre}</h1>
        <p className="text-sm text-gray-500 mt-1">Realizado el {new Date(dato.created_at).toLocaleDateString("es-AR")}</p>
        <p className="text-sm text-gray-600 mt-6">Consultá el informe profesional para ver puntajes, baremos e interpretaciones con el contexto y la versión del instrumento.</p>
        <Link className="candidate-primary-button mt-5" to={`/candidato/resultados/${id}/informe`}>
          Abrir informe profesional <Icon name="chevR" />
        </Link>
        <details className="mt-7 text-xs text-gray-400">
          <summary>Información técnica</summary>
          <p className="mt-2">Catálogo: {dato.catalogo_version || "histórico"}</p>
          <p>Algoritmo: {dato.algoritmo_version || "histórico"}</p>
        </details>
      </section>
    </section>
  );
}
