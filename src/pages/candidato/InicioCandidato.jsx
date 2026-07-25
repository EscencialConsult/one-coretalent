import { Link } from "react-router-dom";
import { usePersonaAuth } from "../../auth/usePersonaAuth";
import { listarMisEvaluaciones, listarMisPostulaciones, listarMisResultados } from "../../api/persona";
import { ErrorState, PageLoader } from "../../components/AsyncState";
import Icon from "../../components/Icon";
import { useApiResource } from "../../hooks/useApiResource";

export default function InicioCandidato() {
  const { token, persona } = usePersonaAuth();
  const { data, cargando, error, recargar } = useApiResource(async (signal) => {
    const [postulaciones, evaluaciones, resultados] = await Promise.all([
      listarMisPostulaciones(token, signal),
      listarMisEvaluaciones(token, signal),
      listarMisResultados(token, signal),
    ]);
    return { postulaciones, evaluaciones, resultados };
  }, [token]);

  if (cargando) return <PageLoader mensaje="Preparando tu espacio…" />;
  if (error) return <ErrorState mensaje={error} onReintentar={recargar} />;

  const pendientes = data.evaluaciones.filter((item) => item.estado !== "completado").length;
  const enProgreso = data.evaluaciones.filter((item) => item.estado === "en_progreso").length;

  return (
    <div className="candidate-dashboard">
      <section className="candidate-welcome">
        <div>
          <span>Bienvenido a ONE</span>
          <h1>Hola, {persona.nombre}</h1>
          <p>Gestioná tus postulaciones, completá evaluaciones y mantené actualizado tu perfil profesional desde un solo lugar.</p>
        </div>
        <div className="candidate-welcome-visual" aria-hidden="true">
          <div><Icon name="user" /></div>
          <i /><i /><i />
        </div>
      </section>

      <section className="candidate-kpis" aria-label="Resumen de actividad">
        <Kpi icono="briefcase" label="Postulaciones" valor={data.postulaciones.length} tono="purple" />
        <Kpi icono="clipboard" label="Evaluaciones pendientes" valor={pendientes} tono="amber" />
        <Kpi icono="clock" label="En progreso" valor={enProgreso} tono="blue" />
        <Kpi icono="chart" label="Resultados" valor={data.resultados.length} tono="teal" />
      </section>

      <div className="candidate-dashboard-grid">
        <Accion
          icono="clipboard"
          etiqueta="Próximo paso"
          titulo="Continuar evaluaciones"
          texto={pendientes ? `Tenés ${pendientes} ${pendientes === 1 ? "evaluación pendiente" : "evaluaciones pendientes"}.` : "No tenés evaluaciones pendientes."}
          to="/candidato/evaluaciones"
          link="Ir a evaluaciones"
        />
        <Accion
          icono="user"
          etiqueta="Perfil profesional"
          titulo="Completá tu información"
          texto="Mantené al día tu CV, formación, idiomas y experiencia."
          to="/candidato/perfil"
          link="Actualizar perfil"
        />
      </div>
    </div>
  );
}

function Kpi({ icono, label, valor, tono }) {
  return (
    <article className="candidate-kpi">
      <span className={tono}><Icon name={icono} /></span>
      <div><strong>{valor}</strong><p>{label}</p></div>
    </article>
  );
}

function Accion({ icono, etiqueta, titulo, texto, to, link }) {
  return (
    <article className="candidate-action">
      <div className="candidate-action-icon"><Icon name={icono} /></div>
      <span>{etiqueta}</span>
      <h2>{titulo}</h2>
      <p>{texto}</p>
      <Link to={to}>{link} <Icon name="chevR" /></Link>
    </article>
  );
}
