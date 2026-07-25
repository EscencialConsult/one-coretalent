import { Link } from "react-router-dom";

const secciones = [
  ["1. Responsable y alcance", "ONE Talent Hub, administrada por la Fundación para el Desarrollo Profesional, trata la información cargada o generada mediante la plataforma. Esta política alcanza formularios, cuentas, postulaciones, evaluaciones, resultados, firmas, consentimientos y herramientas de verificación."],
  ["2. Datos tratados", "Podemos tratar datos identificatorios y de contacto, antecedentes laborales y académicos, CV, datos de cuenta, documentación de verificación, firmas, consentimientos, resultados de evaluaciones y registros técnicos mínimos necesarios para operar y proteger el servicio."],
  ["3. Finalidades", "La información se utiliza para gestionar cuentas y postulaciones, habilitar procesos legítimos de reclutamiento y evaluación, verificar identidades, registrar consentimientos, brindar soporte, prevenir fraude, auditar accesos y cumplir obligaciones legales."],
  ["4. Empresas y proveedores", "Las empresas acceden solamente a información vinculada con sus procesos y permisos vigentes. Los proveedores tecnológicos deben tratar los datos exclusivamente para prestar sus servicios y bajo obligaciones razonables de seguridad y confidencialidad."],
  ["5. Evaluaciones psicométricas", "Las respuestas y resultados se procesan con acceso restringido. Los puntajes se calculan en el servidor y los informes deben interpretarse según el alcance del instrumento; no constituyen por sí solos un diagnóstico clínico ni una decisión laboral."],
  ["6. Conservación y seguridad", "Los datos se conservan durante el tiempo necesario para las finalidades informadas, la trazabilidad, obligaciones legales y defensa de derechos. Aplicamos controles de acceso, separación por roles, auditoría y medidas técnicas razonables, aunque ningún sistema puede garantizar seguridad absoluta."],
  ["7. Derechos de las personas", "Conforme a la Ley N.º 25.326, la persona titular puede solicitar información, acceso, rectificación, actualización o supresión de sus datos. Podemos requerir verificación de identidad antes de responder para proteger información de terceros."],
  ["8. Cambios y contacto", "La versión vigente será la publicada en este sitio. Para consultas de privacidad, acceso, rectificación, supresión o baja de cuenta se encuentran disponibles los canales de soporte publicados en la plataforma."],
];

export default function PoliticaPrivacidad() {
  return (
    <article className="legal-page">
      <nav className="legal-page-nav" aria-label="Navegación legal">
        <Link to="/">← Volver al inicio</Link>
        <Link to="/terminos-condiciones">Ver Términos y Condiciones</Link>
      </nav>
      <h1>Política de Privacidad</h1>
      <p className="legal-page-note">Última actualización: julio de 2026.</p>
      {secciones.map(([titulo, contenido]) => <section key={titulo}><h2>{titulo}</h2><p>{contenido}</p></section>)}
    </article>
  );
}
