import { Link } from "react-router-dom";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M16 3.2A12.8 12.8 0 0 0 5.1 22.7L3.7 28.8l6.2-1.6A12.8 12.8 0 1 0 16 3.2Zm0 23.1c-2.1 0-4.1-.6-5.8-1.8l-.4-.2-3.7 1 1-3.6-.3-.4A10.3 10.3 0 1 1 16 26.3Zm5.8-7.7c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.3 1.4 3.5c.2.2 2.4 3.7 5.9 5.1.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5-.2-.2-.5-.3-.8-.4Z" />
    </svg>
  );
}

export default function SiteFooter() {
  return (
    <footer className="site-footer" aria-label="Pie de página">
      <div className="site-footer-columns">
        <div className="site-footer-brand">
          <Link className="site-footer-brand-row" to="/" aria-label="ONE Talent Hub, ir al inicio">
            <img className="site-footer-logo" src="/logo2-trim.png" alt="" />
            <span>Talent Hub</span>
          </Link>
          <p>Una plataforma para conectar postulantes, empresas y oportunidades laborales en un solo lugar.</p>
        </div>

        <nav className="site-footer-col" aria-label="Plataforma">
          <h2>Plataforma</h2>
          <Link to="/login-candidato">Postulantes</Link>
          <Link to="/registro-empresa">Empresas</Link>
          <Link to="/busquedas">Búsquedas activas</Link>
        </nav>

        <nav className="site-footer-col" aria-label="Legal">
          <h2>Legal</h2>
          <Link to="/politica-privacidad">Política de Privacidad</Link>
          <Link to="/terminos-condiciones">Términos y Condiciones</Link>
        </nav>

        <div className="site-footer-col">
          <h2>Soporte</h2>
          <a
            className="site-footer-contact"
            href="https://wa.me/message/IKT5STIPRP56J1"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contactar al soporte por WhatsApp, abre en una pestaña nueva"
          >
            <WhatsAppIcon />
            WhatsApp
          </a>
        </div>
      </div>

      <div className="site-footer-bottom">
        <p>Desarrollado por <strong>ONE</strong></p>
        <p>Contribución de <strong>Fundación para el Desarrollo Profesional</strong></p>
      </div>
    </footer>
  );
}
