import { Suspense, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useEvaluadoAuth } from "../../auth/useEvaluadoAuth";
import { ErrorState, PageLoader } from "../../components/AsyncState";
import { guardarResultadoEvaluado, listarAsignacionesEvaluado } from "../../evaluado/api";
import Plexus from "../../evaluado/Plexus";
import { obtenerRunner, TESTS_RENDIBLES } from "../../evaluado/runnerRegistry";
import "../../evaluado/runners.css";
import "../../evaluado/portal.css";

const COLORES = {
  clinico: "var(--violeta)",
  psicometrico: "var(--rosa)",
  psicotecnico: "var(--cian)",
  vocacional: "var(--oro)",
};

export default function PortalEvaluado() {
  const auth = useEvaluadoAuth();
  const [asignaciones, setAsignaciones] = useState(null);
  const [error, setError] = useState("");
  const [activo, setActivo] = useState(null);

  const cargar = useCallback(async (signal) => {
    setError("");
    try {
      setAsignaciones(await listarAsignacionesEvaluado(auth.token, signal));
    } catch (err) {
      if (err.code !== "ABORTED" && err.status !== 401) setError(err.detail || err.message);
    }
  }, [auth.token]);

  useEffect(() => {
    if (!auth.autenticado) return undefined;
    const controller = new AbortController();
    cargar(controller.signal);
    return () => controller.abort();
  }, [auth.autenticado, cargar]);

  if (!auth.token) return <LoginEvaluado login={auth.login} />;
  if (auth.cargando) return <PageLoader mensaje="Validando tu sesión…" />;
  if (auth.errorSesion) {
    return <ErrorState titulo="No pudimos validar tu sesión" mensaje={auth.errorSesion} onReintentar={auth.recargarSesion} />;
  }
  if (!auth.evaluado) return <LoginEvaluado login={auth.login} />;

  if (activo) {
    const Runner = obtenerRunner(activo);
    return (
      <Suspense fallback={<PageLoader mensaje="Preparando la evaluación…" />}>
        <Runner
          slug={activo}
          empresa={auth.evaluado.empresa}
          onExit={() => {
            setActivo(null);
            cargar();
          }}
          onSubmit={(respuestas) => guardarResultadoEvaluado(auth.token, activo, respuestas)}
        />
      </Suspense>
    );
  }

  const completadas = (asignaciones || []).filter((item) => item.estado === "completado").length;
  const pendientes = (asignaciones?.length || 0) - completadas;
  const empresa = auth.evaluado.empresa;
  const tema = empresa ? {
    "--violeta": empresa.color_acento,
    "--grad": empresa.color_acento,
    "--acento2": empresa.color_secundario || "#6be1e3",
    "--rosa": empresa.color_secundario || "#6be1e3",
  } : undefined;

  return (
    <div className="app" style={tema}>
      <Plexus />
      <nav className="pe-nav" aria-label="Portal del evaluado">
        <Marca empresa={empresa} />
        <div className="pe-user">
          <span className="pe-pill">
            <span className="av">{iniciales(auth.evaluado)}</span>
            <span className="nm">{auth.evaluado.nombre} {auth.evaluado.apellido}</span>
          </span>
          <button className="pe-out" type="button" onClick={auth.logout}>Salir</button>
        </div>
      </nav>

      <main className="pe-wrap">
        <section className="card pe-hello">
          <span className="eb">MIS PRUEBAS</span>
          <h1>Hola, {auth.evaluado.nombre}</h1>
          <p>
            Este es tu espacio privado de evaluación. Podés realizar las pruebas asignadas en el
            orden que prefieras. Los resultados se procesan de forma confidencial.
          </p>
          {asignaciones?.length > 0 && (
            <div className="pe-stats" aria-label="Resumen de evaluaciones">
              <Resumen cantidad={pendientes} etiqueta="Pendientes" color="var(--oro)" />
              <Resumen cantidad={completadas} etiqueta="Completadas" color="var(--cian)" />
              <Resumen cantidad={asignaciones.length} etiqueta="En total" color="var(--rosa)" />
            </div>
          )}
        </section>

        {error && <ErrorState mensaje={error} onReintentar={() => cargar()} />}
        {!asignaciones ? (
          <PageLoader mensaje="Cargando tus evaluaciones…" />
        ) : asignaciones.length === 0 ? (
          <section className="card pe-empty">
            Todavía no tenés pruebas asignadas. Cuando una empresa te asigne una, aparecerá acá.
          </section>
        ) : (
          <>
            <h2 className="pe-sec">Pruebas asignadas</h2>
            <div className="pe-grid">
              {asignaciones.map((asignacion) => (
                <TarjetaAsignacion
                  key={asignacion.id}
                  asignacion={asignacion}
                  onComenzar={() => setActivo(asignacion.test_slug)}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function LoginEvaluado({ login }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(event) {
    event.preventDefault();
    if (enviando) return;
    setError("");
    setEnviando(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.detail || err.message || "No se pudo iniciar sesión.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="app">
      <Plexus />
      <main className="login-wrap">
        <form className="card login-card" onSubmit={enviar}>
          <span className="login-brand"><span className="logo">O<b>NE</b></span></span>
          <h1 className="login-h">Portal del evaluado</h1>
          <p className="login-sub">Ingresá con los datos proporcionados por la empresa.</p>
          <label className="login-lbl" htmlFor="evaluado-email">Email</label>
          <input id="evaluado-email" className="login-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required />
          <label className="login-lbl" htmlFor="evaluado-password">Contraseña</label>
          <input id="evaluado-password" className="login-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          {error && <div className="login-error" role="alert">{error}</div>}
          <button className="btn prim" type="submit" disabled={enviando}>
            {enviando ? "Ingresando…" : "Ingresar"}
          </button>
          <Link to="/" className="login-volver">← Volver al inicio</Link>
        </form>
      </main>
    </div>
  );
}

function TarjetaAsignacion({ asignacion, onComenzar }) {
  const completada = asignacion.estado === "completado";
  const disponible = asignacion.tomable && TESTS_RENDIBLES.has(asignacion.test_slug);
  return (
    <article className={`pe-card${completada ? " done" : disponible ? " can" : ""}`}>
      <span className="pe-cat">{capitalizar(asignacion.categoria) || "Evaluación"}</span>
      <h3>{asignacion.nombre}</h3>
      <div className="pe-meta">
        {asignacion.n_items ? (
          <span className="pe-chip">
            <span className="dot" style={{ background: COLORES[asignacion.categoria] || "var(--rosa)" }} />
            {asignacion.n_items} preguntas
          </span>
        ) : null}
        <span className="pe-chip">{completada ? "Finalizada" : "Sin comenzar"}</span>
      </div>
      <div className="pe-foot">
        <span className={`pe-estado ${asignacion.estado}`}>{completada ? "Completada" : "Pendiente"}</span>
        <button className={`pe-btn ${disponible && !completada ? "prim" : "ghost"}`} type="button" disabled={completada || !disponible} onClick={onComenzar}>
          {completada ? "Completada ✓" : disponible ? "Comenzar →" : "No disponible"}
        </button>
      </div>
    </article>
  );
}

function Resumen({ cantidad, etiqueta, color }) {
  return (
    <div className="pe-stat">
      <span className="dotc" style={{ background: color }} />
      <div><div className="n">{cantidad}</div><div className="l">{etiqueta}</div></div>
    </div>
  );
}

function Marca({ empresa }) {
  if (empresa?.logo_url) return <img className="pe-logoimg" src={empresa.logo_url} alt={empresa.razon_social} />;
  return <img className="pe-logoimg" src="/logo-trim.png" alt="ONE" />;
}

function iniciales(evaluado) {
  return `${evaluado.nombre?.[0] || ""}${evaluado.apellido?.[0] || ""}`.toUpperCase();
}

function capitalizar(texto) {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "";
}
