import { Link } from "react-router-dom";

const secciones = [
  ["1. Aceptación", "El acceso, registro o uso de ONE Talent Hub implica aceptar estos términos, la Política de Privacidad y las reglas operativas informadas. Quien actúa por una organización declara contar con facultades suficientes."],
  ["2. Objeto", "La plataforma facilita perfiles laborales, postulaciones, evaluaciones, consentimientos e informes para procesos de talento. No garantiza entrevistas, contrataciones, continuidad de procesos ni decisiones empresariales determinadas."],
  ["3. Responsabilidades de los usuarios", "Cada usuario debe proporcionar información verdadera, proteger sus credenciales, respetar la confidencialidad y utilizar la plataforma de buena fe. Las empresas deben tratar los datos exclusivamente para procesos legítimos de reclutamiento, evaluación o contratación."],
  ["4. Usos prohibidos", "Está prohibido acceder a recursos no autorizados, extraer datos masivamente, compartir credenciales, manipular evaluaciones o consentimientos, suplantar identidades y utilizar la plataforma para fraude, discriminación, acoso o finalidades ilegales."],
  ["5. Evaluaciones e informes", "Las evaluaciones son herramientas de apoyo. Sus resultados deben interpretarse dentro de su contexto y alcance técnico; no reemplazan criterio profesional, evaluación integral, diagnóstico clínico ni obligaciones legales de selección no discriminatoria."],
  ["6. Moderación y baja", "La administración puede requerir información, limitar, suspender o eliminar cuentas ante incumplimientos, riesgos, reclamos o requerimientos legales. Las solicitudes de baja y tratamiento de datos se gestionan conforme a la Política de Privacidad."],
  ["7. Propiedad intelectual y disponibilidad", "La marca, interfaz, código y documentación pertenecen a sus titulares o licenciantes. El servicio puede actualizarse o interrumpirse por razones técnicas, operativas, legales o de seguridad, sin garantizar disponibilidad permanente."],
  ["8. Ley aplicable y contacto", "Estos términos se rigen por las leyes de la República Argentina. Para consultas sobre cuentas, postulaciones, evaluaciones o privacidad se encuentran disponibles los canales de soporte publicados en la plataforma."],
];

export default function TerminosCondiciones() {
  return (
    <article className="legal-page">
      <nav className="legal-page-nav" aria-label="Navegación legal">
        <Link to="/">← Volver al inicio</Link>
        <Link to="/politica-privacidad">Ver Política de Privacidad</Link>
      </nav>
      <h1>Términos y Condiciones</h1>
      <p className="legal-page-note">Última actualización: julio de 2026.</p>
      {secciones.map(([titulo, contenido]) => <section key={titulo}><h2>{titulo}</h2><p>{contenido}</p></section>)}
    </article>
  );
}
