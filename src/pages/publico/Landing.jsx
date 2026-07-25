import { Link } from "react-router-dom";
import Icon from "../../components/Icon";

const BENEFICIOS = [
  { icono: "user", titulo: "Una identidad profesional", texto: "Tu perfil, CV y resultados disponibles desde una cuenta personal segura." },
  { icono: "chart", titulo: "Evaluaciones confiables", texto: "Scoring determinista en backend, versiones registradas y progreso recuperable." },
  { icono: "shield", titulo: "Privacidad por diseño", texto: "Consentimientos claros, accesos revocables y trazabilidad de consultas sensibles." },
];

export default function Landing() {
  return (
    <div className="landing-profesional">
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <div className="landing-eyebrow"><span /> Tecnología humana para decisiones de talento</div>
          <h1>Conectamos el potencial de las personas con el lugar donde puede <em>crecer.</em></h1>
          <p>Una plataforma integral para descubrir oportunidades, gestionar postulaciones y evaluar talento con información clara, segura y profesional.</p>
          <div className="landing-hero-actions">
            <Link to="/busquedas" className="landing-btn landing-btn-primary">Explorar oportunidades <span aria-hidden="true">→</span></Link>
            <Link to="/registro-empresa" className="landing-btn landing-btn-secondary">Solución para empresas</Link>
          </div>
          <div className="landing-confidence" aria-label="Características principales">
            <span><Icon name="check" /> Perfil reutilizable</span>
            <span><Icon name="check" /> Evaluaciones seguras</span>
            <span><Icon name="check" /> Datos bajo tu control</span>
          </div>
        </div>
        <div className="landing-hero-visual">
          <div className="landing-image-frame">
            <img src="/busqueda-cover.webp" width="1600" height="594" alt="Entrevista profesional entre una candidata y un reclutador" />
            <div className="landing-image-gradient" />
          </div>
          <article className="landing-floating-card landing-floating-top">
            <span className="landing-floating-icon"><Icon name="briefcase" /></span>
            <div><small>Proceso organizado</small><strong>Talento y oportunidades</strong></div>
          </article>
          <article className="landing-floating-card landing-floating-bottom">
            <div className="landing-mini-chart" aria-hidden="true"><i /><i /><i /><i /><i /></div>
            <div><small>Decisiones con contexto</small><strong>Resultados claros y trazables</strong></div>
          </article>
        </div>
      </section>

      <section className="landing-proof" aria-label="Compromisos de la plataforma">
        <div><strong>Un solo perfil</strong><span>para todas tus postulaciones</span></div>
        <div><strong>Scoring en backend</strong><span>sin cálculos sensibles en navegador</span></div>
        <div><strong>Acceso auditable</strong><span>a evaluaciones e informes</span></div>
      </section>

      <section className="landing-section landing-intro">
        <div className="landing-section-heading">
          <span>Una experiencia conectada</span>
          <h2>Más claridad para cada persona involucrada</h2>
          <p>ONE reúne búsqueda laboral, selección y evaluación en un ecosistema donde cada actor sabe qué hacer y conserva el control de su información.</p>
        </div>
        <div className="landing-audiences">
          <Audiencia tipo="candidato" icono="user" etiqueta="Para candidatos" titulo="Tu carrera, en un espacio que te representa." texto="Construí un perfil completo, postulate con confianza y continuá tus evaluaciones sin perder progreso." items={["CV y experiencia centralizados", "Postulaciones y estados visibles", "Resultados disponibles en tu portal"]} to="/busquedas" link="Encontrar oportunidades" />
          <Audiencia tipo="empresa" icono="briefcase" etiqueta="Para empresas" titulo="Procesos de selección con criterio y trazabilidad." texto="Publicá vacantes, organizá postulantes y complementá tus decisiones con evaluaciones profesionales." items={["Gestión centralizada de vacantes", "Catálogo psicométrico licenciado", "Informes seguros y auditables"]} to="/registro-empresa" link="Crear espacio de empresa" />
        </div>
      </section>

      <section className="landing-section landing-benefits">
        <div className="landing-section-heading compacta"><span>Confianza desde la arquitectura</span><h2>Profesional por fuera. Sólida por dentro.</h2></div>
        <div className="landing-benefit-grid">
          {BENEFICIOS.map((item) => <article key={item.titulo}><span><Icon name={item.icono} /></span><h3>{item.titulo}</h3><p>{item.texto}</p></article>)}
        </div>
      </section>

      <section className="landing-section landing-process">
        <div className="landing-process-copy">
          <span className="landing-kicker">Simple de usar</span>
          <h2>De la oportunidad al resultado, sin perder el hilo.</h2>
          <p>Cada paso queda conectado para reducir tareas repetidas y ofrecer una experiencia consistente.</p>
          <Link to="/busquedas" className="landing-btn landing-btn-secondary">Ver búsquedas activas</Link>
        </div>
        <ol className="landing-steps">
          <Paso numero="01" titulo="Creá tu identidad" texto="Completá tu perfil profesional una sola vez." />
          <Paso numero="02" titulo="Conectá con una oportunidad" texto="Postulate y seguí el proceso desde tu portal." />
          <Paso numero="03" titulo="Demostrá tu potencial" texto="Realizá evaluaciones seguras y consultá tus resultados." />
        </ol>
      </section>

      <section className="landing-final-cta">
        <div><span>El próximo paso puede empezar hoy</span><h2>Talento y oportunidades, conectados con propósito.</h2></div>
        <div><Link to="/registro-candidato" className="landing-btn landing-btn-light">Soy candidato</Link><Link to="/registro-empresa" className="landing-btn landing-btn-outline-light">Represento una empresa</Link></div>
      </section>
    </div>
  );
}

function Audiencia({ tipo, icono, etiqueta, titulo, texto, items, to, link }) {
  return <article className={`landing-audience ${tipo}`}><div className="landing-audience-tag"><Icon name={icono} /> {etiqueta}</div><h3>{titulo}</h3><p>{texto}</p><ul>{items.map((item) => <li key={item}><Icon name="check" /> {item}</li>)}</ul><Link to={to}>{link} <span aria-hidden="true">→</span></Link></article>;
}

function Paso({ numero, titulo, texto }) {
  return <li><span>{numero}</span><div><h3>{titulo}</h3><p>{texto}</p></div></li>;
}
