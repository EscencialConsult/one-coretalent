import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { vacantesPublicas } from "../../api/publico";
import { listarMisPostulaciones } from "../../api/persona";
import { PersonaAuthContext } from "../../auth/PersonaAuthContext";
import Icon from "../../components/Icon";

const FILTROS_INICIALES = {
  texto: "",
  ubicacion: "",
  modalidad: "",
  area: "",
  contrato: "",
  idioma: "",
  salario: "",
  orden: "recientes",
};

const normalizar = (valor) =>
  String(valor || "")
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const opciones = (vacantes, campo) =>
  [...new Set(vacantes.map((vacante) => vacante[campo]).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "es"));

const monto = (valor) =>
  Number(valor || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 });

function salarioVacante(vacante) {
  if (vacante.ocultar_salario || (!vacante.salario_min && !vacante.salario_max)) return "A convenir";
  if (vacante.salario_min && vacante.salario_max) {
    return `$${monto(vacante.salario_min)} – $${monto(vacante.salario_max)}`;
  }
  return `$${monto(vacante.salario_min || vacante.salario_max)}`;
}

function antiguedad(fecha) {
  const dias = Math.max(0, Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000));
  if (dias === 0) return "Publicada hoy";
  if (dias === 1) return "Publicada ayer";
  return `Publicada hace ${dias} días`;
}

export default function Busquedas({ modoCandidato = false }) {
  const { autenticado = false, persona = null, token = null } = useContext(PersonaAuthContext) || {};
  const personalizada = modoCandidato && autenticado;
  const [vacantes, setVacantes] = useState(null);
  const [postulacionesPorVacante, setPostulacionesPorVacante] = useState({});
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [seleccionada, setSeleccionada] = useState(null);
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);

  const cargar = useCallback(() => {
    setError("");
    setVacantes(null);
    vacantesPublicas()
      .then(setVacantes)
      .catch(() => {
        setVacantes([]);
        setError("No pudimos cargar las búsquedas. Probá de nuevo en un momento.");
      });
  }, []);

  useEffect(cargar, [cargar]);

  // Para marcar en el listado las búsquedas a las que ya postulaste.
  useEffect(() => {
    if (!token) return setPostulacionesPorVacante({});
    listarMisPostulaciones(token)
      .then((lista) => {
        const mapa = {};
        (lista || []).forEach((p) => { mapa[p.vacante_id] = p; });
        setPostulacionesPorVacante(mapa);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!seleccionada) return undefined;
    const cerrarConEscape = (evento) => evento.key === "Escape" && setSeleccionada(null);
    document.addEventListener("keydown", cerrarConEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = "";
    };
  }, [seleccionada]);

  const lista = useMemo(() => {
    if (!vacantes) return [];
    const texto = normalizar(filtros.texto);
    const ubicacion = normalizar(filtros.ubicacion);
    const salarioMinimo = Number(filtros.salario || 0);

    return vacantes
      .filter((vacante) => {
        const textoCompleto = normalizar([
          vacante.puesto,
          vacante.empresa,
          vacante.area,
          vacante.descripcion,
          vacante.responsabilidades,
          vacante.requisitos_excluyentes,
          vacante.requisitos_deseables,
          vacante.habilidades,
        ].join(" "));
        const ubicacionCompleta = normalizar([vacante.localidad, vacante.provincia, vacante.zona].join(" "));
        const salarioMaximo = Math.max(Number(vacante.salario_min || 0), Number(vacante.salario_max || 0));

        return (!texto || textoCompleto.includes(texto))
          && (!ubicacion || ubicacionCompleta.includes(ubicacion))
          && (!filtros.modalidad || vacante.modalidad === filtros.modalidad)
          && (!filtros.area || vacante.area === filtros.area)
          && (!filtros.contrato || vacante.tipo_contrato === filtros.contrato)
          && (!filtros.idioma || vacante.idioma_requerido === filtros.idioma)
          && (!salarioMinimo || (!vacante.ocultar_salario && salarioMaximo >= salarioMinimo));
      })
      .sort((a, b) => {
        if (filtros.orden === "puesto") return a.puesto.localeCompare(b.puesto, "es");
        if (filtros.orden === "empresa") return (a.empresa || "").localeCompare(b.empresa || "", "es");
        if (filtros.orden === "salario") {
          return Math.max(Number(b.salario_max || 0), Number(b.salario_min || 0))
            - Math.max(Number(a.salario_max || 0), Number(a.salario_min || 0));
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [vacantes, filtros]);

  const filtrosActivos = Object.entries(filtros)
    .some(([clave, valor]) => clave !== "orden" && Boolean(valor));

  const cambiar = (campo) => (evento) =>
    setFiltros((actuales) => ({ ...actuales, [campo]: evento.target.value }));

  const limpiar = () => setFiltros(FILTROS_INICIALES);
  const nombrePersona = persona?.nombre || persona?.nombre_completo?.split(" ")[0] || "Candidato";

  const copiarLink = async () => {
    const url = `${window.location.origin}/postular/${seleccionada.id}`;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      const auxiliar = document.createElement("textarea");
      auxiliar.value = url;
      auxiliar.style.position = "fixed";
      auxiliar.style.opacity = "0";
      document.body.appendChild(auxiliar);
      auxiliar.select();
      document.execCommand("copy");
      auxiliar.remove();
    }
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 2200);
  };

  return (
    <div className={`jobs-page ${personalizada ? "is-candidate" : ""}`}>
      <header className={personalizada ? "candidate-jobs-header" : "jobs-hero"}>
        <div className={personalizada ? "candidate-jobs-header-inner" : "jobs-hero-inner"}>
          {personalizada ? (
            <div className="candidate-jobs-heading">
              <div>
                <span>Oportunidades activas</span>
                <h1>Buscar oportunidades</h1>
                <p>Hola, {nombrePersona}. Encontrá búsquedas acordes a tu próximo paso profesional.</p>
              </div>
              <Link to="/candidato/postulaciones"><Icon name="briefcase" /> Ver mis postulaciones</Link>
            </div>
          ) : (
            <>
              <img className="jobs-hero-marca" src="/one-icon-negro.png" alt="" aria-hidden="true" />
              <span className="jobs-eyebrow"><span /> Oportunidades activas</span>
              <h1>Encontrá un trabajo que acompañe tu próximo paso.</h1>
              <p>Explorá búsquedas de empresas y consultoras, conocé cada propuesta y postulate con un perfil que podés reutilizar.</p>
            </>
          )}
          <div className="jobs-hero-search">
            <Icon name="search" />
            <label className="sr-only" htmlFor="busqueda-principal">Buscar oportunidades</label>
            <input
              id="busqueda-principal"
              type="search"
              value={filtros.texto}
              onChange={cambiar("texto")}
              placeholder="Puesto, empresa, área o habilidad"
            />
            <span>{vacantes?.length ?? "–"} activas</span>
          </div>
        </div>
      </header>

      <div className="jobs-shell">
        <aside className="jobs-filters" aria-label="Filtros de búsquedas">
          <div className="jobs-filters-title">
            <div>
              <span>Personalizá tu búsqueda</span>
              <h2>Filtros</h2>
            </div>
            <button type="button" onClick={limpiar} disabled={!filtrosActivos}>Limpiar</button>
          </div>

          <CampoBusqueda
            id="ubicacion"
            label="Ubicación"
            icono="map"
            value={filtros.ubicacion}
            onChange={cambiar("ubicacion")}
            placeholder="Provincia o localidad"
          />
          <CampoSelect id="modalidad" label="Modalidad" value={filtros.modalidad} onChange={cambiar("modalidad")} items={opciones(vacantes || [], "modalidad")} todos="Todas" />
          <CampoSelect id="area" label="Área" value={filtros.area} onChange={cambiar("area")} items={opciones(vacantes || [], "area")} todos="Todas" />
          <CampoSelect id="contrato" label="Tipo de contratación" value={filtros.contrato} onChange={cambiar("contrato")} items={opciones(vacantes || [], "tipo_contrato")} todos="Todos" />
          <CampoSelect id="idioma" label="Idioma" value={filtros.idioma} onChange={cambiar("idioma")} items={opciones(vacantes || [], "idioma_requerido")} todos="Todos" />
          <div className="jobs-field">
            <label htmlFor="salario">Salario mínimo pretendido</label>
            <div className="jobs-input-prefix">
              <span>$</span>
              <input id="salario" type="number" min="0" step="10000" value={filtros.salario} onChange={cambiar("salario")} placeholder="Ej: 800000" />
            </div>
          </div>
        </aside>

        <section className="jobs-results" aria-live="polite">
          <div className="jobs-results-head">
            <div>
              <span>Resultados</span>
              <h2>{vacantes === null ? "Buscando oportunidades…" : `${lista.length} ${lista.length === 1 ? "búsqueda encontrada" : "búsquedas encontradas"}`}</h2>
            </div>
            <div className="jobs-sort">
              <label htmlFor="orden">Ordenar</label>
              <select id="orden" value={filtros.orden} onChange={cambiar("orden")}>
                <option value="recientes">Más recientes</option>
                <option value="puesto">Puesto A–Z</option>
                <option value="empresa">Empresa A–Z</option>
                <option value="salario">Mejor salario</option>
              </select>
            </div>
          </div>

          {vacantes === null && <Cargando />}
          {error && (
            <Estado
              titulo="No pudimos cargar las oportunidades"
              texto={error}
              accion={<button type="button" onClick={cargar}>Intentar nuevamente</button>}
            />
          )}
          {vacantes && !error && lista.length === 0 && (
            <Estado
              titulo={filtrosActivos ? "No encontramos coincidencias" : "Todavía no hay búsquedas activas"}
              texto={filtrosActivos ? "Probá ampliando la ubicación o quitando alguno de los filtros." : "Volvé pronto para conocer nuevas oportunidades."}
              accion={filtrosActivos ? <button type="button" onClick={limpiar}>Limpiar filtros</button> : null}
            />
          )}

          {vacantes && lista.length > 0 && (
            <div className="jobs-grid">
              {lista.map((vacante) => (
                <VacanteCard
                  key={vacante.id}
                  vacante={vacante}
                  autenticado={personalizada}
                  postulacion={postulacionesPorVacante[vacante.id]}
                  onOpen={() => setSeleccionada(vacante)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {seleccionada && (
        <DetalleVacante
          vacante={seleccionada}
          copiado={copiado}
          autenticado={personalizada}
          postulacion={postulacionesPorVacante[seleccionada.id]}
          onCopy={copiarLink}
          onClose={() => setSeleccionada(null)}
        />
      )}
    </div>
  );
}

function CampoBusqueda({ id, label, icono, ...inputProps }) {
  return (
    <div className="jobs-field">
      <label htmlFor={id}>{label}</label>
      <div className="jobs-input-icon">
        <Icon name={icono} />
        <input id={id} type="search" {...inputProps} />
      </div>
    </div>
  );
}

function CampoSelect({ id, label, items, todos, ...selectProps }) {
  return (
    <div className="jobs-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} {...selectProps}>
        <option value="">{todos}</option>
        {items.map((item) => <option value={item} key={item}>{item}</option>)}
      </select>
    </div>
  );
}

function VacanteCard({ vacante, autenticado, postulacion, onOpen }) {
  const ubicacion = [vacante.localidad || vacante.provincia, vacante.modalidad].filter(Boolean);
  return (
    <article className="job-card">
      <button type="button" className="job-card-main" onClick={onOpen} aria-label={`Ver detalle de ${vacante.puesto}`}>
        <div className="job-card-cover">
          <span>{vacante.area || "Nueva oportunidad"}</span>
          {postulacion ? <small className="job-postulado-badge">Ya postulado</small> : <small>{antiguedad(vacante.created_at)}</small>}
        </div>
        <div className="job-card-body">
          <div className="job-company-mark">{(vacante.empresa || "ONE").slice(0, 2).toUpperCase()}</div>
          <p className="job-company">{vacante.empresa || "Empresa confidencial"}</p>
          <h3>{vacante.puesto}</h3>
          <div className="job-meta">
            {ubicacion.length > 0 && <span><Icon name="map" /> {ubicacion.join(" · ")}</span>}
            {vacante.tipo_contrato && <span><Icon name="clock" /> {vacante.tipo_contrato}</span>}
          </div>
          <p className="job-description">{vacante.descripcion || vacante.responsabilidades || "Conocé los detalles de esta oportunidad."}</p>
          <div className="job-card-bottom">
            <span className="job-salary">{salarioVacante(vacante)}</span>
            <span className="job-open">
              {postulacion ? "Ya postulado" : autenticado ? "Ver y postularme" : "Ver oportunidad"} <Icon name="chevR" />
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}

function DetalleVacante({ vacante, autenticado, postulacion, copiado, onCopy, onClose }) {
  const habilidades = String(vacante.habilidades || "").split(",").map((item) => item.trim()).filter(Boolean);
  const beneficios = String(vacante.beneficios || "").split(",").map((item) => item.trim()).filter(Boolean);
  return (
    <div className="job-dialog-backdrop" role="presentation" onMouseDown={(evento) => evento.target === evento.currentTarget && onClose()}>
      <section className="job-dialog" role="dialog" aria-modal="true" aria-labelledby="detalle-vacante-titulo">
        <button type="button" className="job-dialog-close" onClick={onClose} aria-label="Cerrar detalle" autoFocus><Icon name="x" /></button>
        <div className="job-dialog-cover">
          <span>{vacante.area || "Oportunidad laboral"}</span>
        </div>
        <div className="job-dialog-body">
          <p className="job-dialog-company">{vacante.empresa || "Empresa confidencial"}</p>
          <h2 id="detalle-vacante-titulo">{vacante.puesto}</h2>
          <div className="job-dialog-chips">
            {[vacante.modalidad, vacante.tipo_contrato, vacante.localidad || vacante.provincia, vacante.jornada]
              .filter(Boolean).map((item) => <span key={item}>{item}</span>)}
          </div>
          <Seccion titulo="Descripción" contenido={vacante.descripcion} />
          <Seccion titulo="Responsabilidades" contenido={vacante.responsabilidades} />
          <Seccion titulo="Requisitos excluyentes" contenido={vacante.requisitos_excluyentes} />
          <Seccion titulo="Requisitos deseables" contenido={vacante.requisitos_deseables} />
          {habilidades.length > 0 && <Tags titulo="Habilidades clave" items={habilidades} />}
          <Seccion titulo="Idioma requerido" contenido={[vacante.idioma_requerido, vacante.nivel_idioma].filter(Boolean).join(" · ")} />
          <Seccion titulo="Salario" contenido={salarioVacante(vacante)} />
          <Seccion titulo="Horario" contenido={vacante.horario} />
          {beneficios.length > 0 && <Tags titulo="Beneficios" items={beneficios} />}
          {postulacion ? (
            <div className="job-profile-ready">
              <Icon name="check" />
              <span><strong>Ya te postulaste a esta búsqueda</strong><small>Podés seguir el estado desde tus postulaciones.</small></span>
            </div>
          ) : autenticado && (
            <div className="job-profile-ready">
              <Icon name="check" />
              <span><strong>Tu perfil está listo</strong><small>Vamos a reutilizar tus datos profesionales para agilizar la postulación.</small></span>
            </div>
          )}
          <div className="job-dialog-actions">
            {postulacion ? (
              <Link to={`/candidato/postulaciones/${postulacion.id}`} className="jobs-primary-action">
                Ver mi postulación <Icon name="chevR" />
              </Link>
            ) : (
              <Link to={`/postular/${vacante.id}`} className="jobs-primary-action">
                {autenticado ? "Postularme con mi perfil" : "Postularme ahora"} <Icon name="chevR" />
              </Link>
            )}
            <button type="button" className="jobs-copy-action" onClick={onCopy}><Icon name="doc" /> {copiado ? "Link copiado" : "Copiar link"}</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Seccion({ titulo, contenido }) {
  return contenido ? <section className="job-detail-section"><h3>{titulo}</h3><p>{contenido}</p></section> : null;
}

function Tags({ titulo, items }) {
  return <section className="job-detail-section"><h3>{titulo}</h3><div className="job-tags">{items.map((item) => <span key={item}>{item}</span>)}</div></section>;
}

function Cargando() {
  return <div className="jobs-grid" aria-label="Cargando búsquedas">{[1, 2, 3, 4].map((item) => <div className="job-card job-card-loading" key={item}><div /><span /><span /><span /></div>)}</div>;
}

function Estado({ titulo, texto, accion }) {
  return <div className="jobs-empty"><div><Icon name="search" /></div><h3>{titulo}</h3><p>{texto}</p>{accion}</div>;
}
