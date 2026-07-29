import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Icon from "../../components/Icon";

const BENEFICIOS = [
  { icono: "user", titulo: "Una identidad profesional", texto: "Tu perfil, CV y resultados disponibles desde una cuenta personal segura." },
  { icono: "chart", titulo: "Evaluaciones confiables", texto: "Scoring determinista en backend, versiones registradas y progreso recuperable." },
  { icono: "shield", titulo: "Privacidad por diseño", texto: "Consentimientos claros, accesos revocables y trazabilidad de consultas sensibles." },
];

export default function Landing() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const destino = document.querySelector(hash);
    if (destino) destino.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  return (
    <div className="landing-profesional">
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <h1>El mismo lugar donde postulás, evaluás y <em>decidís.</em></h1>
          <p>Postulantes arman un perfil único y avanzan con evaluaciones reales. Empresas publican búsquedas, siguen cada candidato y deciden con resultados auditables. Todo en Core-Talent.</p>
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
            <img src="/business-job-interview-concept.webp" width="1600" height="1067" alt="Entrevista profesional entre una candidata y un reclutador" />
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

      <section className="landing-section landing-process" id="como-funciona">
        <div className="landing-section-heading compacta">
          <span className="landing-kicker">Cómo funciona</span>
          <h2>Dos recorridos, la misma plataforma.</h2>
          <p>Postulantes y empresas usan el mismo lugar, cada uno con su propio camino y sin pasos de más.</p>
        </div>
        <div className="landing-process-tracks">
          <div className="landing-process-track">
            <div className="landing-process-track-tag"><Icon name="user" /> Para postulantes</div>
            <ol className="landing-steps">
              <Paso numero="01" titulo="Creá tu perfil" texto="Cargá tu CV, formación y experiencia una sola vez. Lo vas a reutilizar en cada postulación." />
              <Paso numero="02" titulo="Postulate a una búsqueda" texto="Elegí una oportunidad activa y postulate con un clic, sin volver a completar tus datos." />
              <Paso numero="03" titulo="Rendí la evaluación, si corresponde" texto="Si la empresa la pidió, hacés el test online a tu ritmo. El resultado queda en tu portal." />
              <Paso numero="04" titulo="Seguí cada proceso" texto="Consultá el estado de tus postulaciones y tus resultados desde una sola cuenta." />
            </ol>
            <Link to="/registro-candidato" className="landing-btn landing-btn-secondary">Crear cuenta de postulante</Link>
          </div>

          <div className="landing-process-track">
            <div className="landing-process-track-tag"><Icon name="briefcase" /> Para empresas</div>
            <ol className="landing-steps">
              <Paso numero="01" titulo="Publicá tu búsqueda" texto="Cargá el puesto y sus requisitos y, si querés, los tests psicométricos que ya tenés habilitados." />
              <Paso numero="02" titulo="Recibí postulantes organizados" texto="Cada candidato llega con su perfil completo y las respuestas a tus preguntas de filtro." />
              <Paso numero="03" titulo="Los tests se asignan solos" texto="Si configuraste evaluaciones para el puesto, cada postulante nuevo las recibe automáticamente." />
              <Paso numero="04" titulo="Decidí con información" texto="Consultá resultados e informes por candidato antes de avanzar en el proceso." />
            </ol>
            <Link to="/registro-empresa" className="landing-btn landing-btn-secondary">Crear cuenta de empresa</Link>
          </div>
        </div>
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
