import { listarMisConsentimientos } from "../../api/persona";
import { usePersonaAuth } from "../../auth/usePersonaAuth";
import { EmptyState, ErrorState, PageLoader } from "../../components/AsyncState";
import Icon from "../../components/Icon";
import { useApiResource } from "../../hooks/useApiResource";
import { Titulo } from "./MisPostulaciones";

export default function PrivacidadCandidato() {
  const { token } = usePersonaAuth();
  const recurso = useApiResource((signal) => listarMisConsentimientos(token, signal), [token]);

  if (recurso.cargando) return <PageLoader mensaje="Cargando consentimientos…" />;
  if (recurso.error) return <ErrorState mensaje={recurso.error} onReintentar={recurso.recargar} />;

  return (
    <section className="candidate-page">
      <Titulo etiqueta="Control de tus datos" titulo="Consentimientos y privacidad" bajada="Revisá de forma transparente dónde autorizaste el uso de tu información." />

      <section className="candidate-privacy-hero">
        <div className="candidate-privacy-icon"><Icon name="shield" /></div>
        <div>
          <span>Privacidad por diseño</span>
          <h2>Tu perfil pertenece a tu identidad global.</h2>
          <p>Cada empresa accede únicamente a la información vinculada con una postulación real. Los resultados psicométricos se calculan en el backend y los accesos compartidos pueden revocarse.</p>
        </div>
      </section>

      <div className="candidate-privacy-principles">
        <Principio icono="lock" titulo="Acceso restringido" texto="Tus datos no quedan disponibles para empresas sin una relación válida." />
        <Principio icono="chart" titulo="Scoring protegido" texto="Los resultados se calculan en el servidor y no se modifican desde el navegador." />
        <Principio icono="shield" titulo="Trazabilidad" texto="Las consultas a información sensible quedan registradas." />
      </div>

      <div className="candidate-consent-heading">
        <div><h2>Historial de consentimientos</h2><p>Autorizaciones asociadas a tus postulaciones.</p></div>
        <span>{recurso.data.length}</span>
      </div>

      {!recurso.data.length ? (
        <EmptyState titulo="No hay consentimientos registrados" mensaje="Los consentimientos aparecerán junto con tus postulaciones." />
      ) : (
        <div className="candidate-consent-list">
          {recurso.data.map((consentimiento) => (
            <article className="candidate-consent-card" key={consentimiento.postulacion_id}>
              <div className="candidate-consent-title">
                <div><Icon name="briefcase" /></div>
                <span><h3>{consentimiento.vacante}</h3><p>{consentimiento.empresa}</p></span>
              </div>
              <div className="candidate-consent-states">
                <Estado label="Consentimiento" fecha={consentimiento.consentimiento_firmado_at} />
                <Estado label="Conformidad" fecha={consentimiento.conformidad_firmada_at} />
                <div className="candidate-consent-state">
                  <span>Evaluaciones autorizadas</span>
                  <strong>{consentimiento.evaluaciones}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Principio({ icono, titulo, texto }) {
  return <article><div><Icon name={icono} /></div><h3>{titulo}</h3><p>{texto}</p></article>;
}

function Estado({ label, fecha }) {
  return (
    <div className="candidate-consent-state">
      <span>{label}</span>
      <strong className={fecha ? "is-signed" : ""}>{fecha ? `Firmado · ${new Date(fecha).toLocaleDateString("es-AR")}` : "No registrado"}</strong>
    </div>
  );
}
