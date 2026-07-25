import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import {
  asignarEvaluacionPostulacion,
  listarCatalogoTestsEmpresa,
  listarEvaluacionesPostulacion,
  listarPostulaciones,
  obtenerVacante,
  revocarAccesoResultado,
} from "../../api/empresa";
import { ApiError } from "../../api/client";
import { ErrorState, PageLoader } from "../../components/AsyncState";
import Icon from "../../components/Icon";

const ETIQUETAS_ESTADO = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completada",
};

export default function PostulacionEmpresaDetalle() {
  const { vacanteId, postulacionId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState("");
  const [confirmacion, setConfirmacion] = useState(null);
  const cargaActual = useRef(0);

  const cargar = useCallback(async () => {
    const cargaId = ++cargaActual.current;
    setError("");
    try {
      const [vacante, postulaciones, evaluaciones, catalogo] = await Promise.all([
        obtenerVacante(token, vacanteId),
        listarPostulaciones(token, vacanteId),
        listarEvaluacionesPostulacion(token, vacanteId, postulacionId),
        listarCatalogoTestsEmpresa(token),
      ]);
      if (cargaId !== cargaActual.current) return;
      const postulacion = postulaciones.find((item) => item.id === postulacionId);
      if (!postulacion) throw new ApiError(404, "La postulación no pertenece a esta vacante.");
      setDatos({ vacante, postulacion, evaluaciones, catalogo });
      setError("");
    } catch (err) {
      if (cargaId !== cargaActual.current) return;
      setError(err instanceof ApiError ? err.detail : "No se pudo cargar la postulación.");
    }
  }, [token, vacanteId, postulacionId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const asignados = useMemo(
    () => new Set(datos?.evaluaciones.map((item) => item.test_slug) || []),
    [datos?.evaluaciones],
  );

  async function asignar(test) {
    if (procesando || !test.habilitado || asignados.has(test.slug)) return;
    setProcesando(`asignar:${test.slug}`);
    setError("");
    try {
      const evaluacion = await asignarEvaluacionPostulacion(
        token,
        vacanteId,
        postulacionId,
        test.slug,
      );
      setDatos((actual) => ({
        ...actual,
        evaluaciones: [evaluacion, ...actual.evaluaciones],
      }));
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "No se pudo asignar la evaluación.");
    } finally {
      setProcesando("");
    }
  }

  async function revocar(evaluacion) {
    setProcesando(`revocar:${evaluacion.id}`);
    setError("");
    try {
      const actualizada = await revocarAccesoResultado(token, evaluacion.acceso_resultado_id);
      setDatos((actual) => ({
        ...actual,
        evaluaciones: actual.evaluaciones.map((item) =>
          item.id === actualizada.id ? actualizada : item
        ),
      }));
      setConfirmacion(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "No se pudo revocar el acceso.");
    } finally {
      setProcesando("");
    }
  }

  if (error && !datos) {
    return <ErrorState titulo="No pudimos abrir la postulación" mensaje={error} onReintentar={cargar} />;
  }
  if (!datos) return <PageLoader mensaje="Cargando postulación y evaluaciones…" />;

  const { vacante, postulacion, evaluaciones, catalogo } = datos;

  return (
    <div className="max-w-5xl">
      <button onClick={() => navigate(`/empresa/vacantes/${vacanteId}`)} className="volver-link">
        <Icon name="chevL" className="w-4 h-4" /> Volver a la vacante
      </button>

      <section className="tarjeta mb-6 p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-5">
          <div className="w-14 h-14 rounded-marca grid place-items-center bg-purple-100 text-acento font-extrabold text-lg flex-none">
            {iniciales(postulacion)}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs uppercase tracking-wider font-extrabold text-muted">Postulación a {vacante.puesto}</span>
            <h1 className="text-2xl font-extrabold mt-1">{postulacion.nombre} {postulacion.apellido}</h1>
            <p className="text-sm text-muted mt-1">{postulacion.email}{postulacion.telefono ? ` · ${postulacion.telefono}` : ""}</p>
            {postulacion.perfil_profesional && <p className="text-sm mt-3">{postulacion.perfil_profesional}</p>}
          </div>
          {postulacion.cv_url && (
            <a href={postulacion.cv_url} target="_blank" rel="noreferrer" className="boton boton-fantasma inline-flex items-center gap-2">
              <Icon name="file" className="w-4 h-4" /> Abrir CV
            </a>
          )}
        </div>
      </section>

      {error && <div role="alert" className="mb-5 rounded-chico border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      <section className="tarjeta mb-6 p-6" aria-labelledby="evaluaciones-asignadas">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <span className="text-xs uppercase tracking-wider font-extrabold text-muted">Seguimiento</span>
            <h2 id="evaluaciones-asignadas" className="text-lg font-extrabold mt-1">Evaluaciones asignadas</h2>
          </div>
          <span className="pastilla apagado">{evaluaciones.length}</span>
        </div>

        {!evaluaciones.length ? (
          <div className="rounded-marca border border-dashed border-linea p-8 text-center">
            <Icon name="clipboard" className="w-8 h-8 mx-auto text-muted" />
            <h3 className="font-extrabold mt-3">Sin evaluaciones asignadas</h3>
            <p className="text-sm text-muted mt-1">Elegí un instrumento habilitado en el catálogo de la empresa.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {evaluaciones.map((evaluacion) => (
              <EvaluacionCard
                key={evaluacion.id}
                evaluacion={evaluacion}
                procesando={procesando}
                onRevocar={() => setConfirmacion(evaluacion)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="tarjeta p-6" aria-labelledby="catalogo-evaluaciones">
        <div className="mb-5">
          <span className="text-xs uppercase tracking-wider font-extrabold text-muted">Catálogo psicométrico</span>
          <h2 id="catalogo-evaluaciones" className="text-lg font-extrabold mt-1">Asignar una evaluación</h2>
          <p className="text-sm text-muted mt-1">Los instrumentos sin licencia se muestran como referencia, pero no pueden asignarse.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {catalogo.map((test) => {
            const asignado = asignados.has(test.slug);
            const disponible = test.disponible && test.tomable;
            const deshabilitado = !test.habilitado || !disponible || asignado || Boolean(procesando);
            return (
              <article key={test.slug} className={`rounded-marca border p-4 ${test.habilitado ? "border-linea bg-white" : "border-gray-200 bg-gray-50"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-chico grid place-items-center flex-none ${test.habilitado ? "bg-purple-100 text-acento" : "bg-gray-200 text-gray-500"}`}>
                    <Icon name={test.habilitado ? "clipboard" : "lock"} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-sm">{test.nombre}</h3>
                    <p className="text-xs text-muted mt-1">{test.slug}</p>
                  </div>
                  <EstadoCatalogo test={test} asignado={asignado} />
                </div>
                <button
                  type="button"
                  disabled={deshabilitado}
                  onClick={() => asignar(test)}
                  className={`w-full mt-4 boton ${deshabilitado ? "boton-fantasma" : "boton-acento"}`}
                >
                  {procesando === `asignar:${test.slug}` ? "Asignando…" : asignado ? "Ya asignada" : test.habilitado && disponible ? "Asignar evaluación" : "No disponible"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {confirmacion && (
        <div className="modal-overlay" role="presentation">
          <section className="modal-card max-w-md" role="dialog" aria-modal="true" aria-labelledby="revocar-titulo">
            <h2 id="revocar-titulo" className="text-xl font-extrabold">Revocar acceso al informe</h2>
            <p className="text-sm text-muted mt-3">
              La empresa dejará de poder abrir el resultado de <strong>{confirmacion.test_nombre}</strong>. La evaluación y el resultado global del candidato no se eliminan.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" className="boton boton-fantasma" onClick={() => setConfirmacion(null)}>Cancelar</button>
              <button type="button" className="boton bg-red-600 text-white" disabled={Boolean(procesando)} onClick={() => revocar(confirmacion)}>
                {procesando ? "Revocando…" : "Confirmar revocación"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function EvaluacionCard({ evaluacion, procesando, onRevocar }) {
  const revocada = evaluacion.acceso_revocado;
  return (
    <article className="rounded-marca border border-linea p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-10 h-10 rounded-chico grid place-items-center bg-purple-100 text-acento flex-none">
          <Icon name={evaluacion.estado === "completado" ? "check" : "clock"} className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-extrabold">{evaluacion.test_nombre}</h3>
            <span className={`pastilla ${evaluacion.estado === "completado" ? "ok" : evaluacion.estado === "en_progreso" ? "alerta" : "apagado"}`}>
              {ETIQUETAS_ESTADO[evaluacion.estado] || evaluacion.estado}
            </span>
            {evaluacion.reutilizada && <span className="pastilla ok">Resultado reutilizado</span>}
            {revocada && <span className="pastilla rojo">Acceso revocado</span>}
          </div>
          <p className="text-xs text-muted mt-1">
            Asignada el {new Date(evaluacion.created_at).toLocaleDateString("es-AR")}
            {evaluacion.progreso_guardado_at ? ` · Progreso guardado ${new Date(evaluacion.progreso_guardado_at).toLocaleString("es-AR")}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {evaluacion.resultado_id && !revocada && (
            <Link className="boton boton-acento !py-2 !px-3.5 text-xs" to={`/empresa/informe/${evaluacion.resultado_id}`}>
              Abrir informe
            </Link>
          )}
          {evaluacion.acceso_resultado_id && !revocada && (
            <button type="button" className="boton boton-fantasma !py-2 !px-3.5 text-xs" disabled={Boolean(procesando)} onClick={onRevocar}>
              Revocar acceso
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function EstadoCatalogo({ test, asignado }) {
  if (asignado) return <span className="pastilla ok">Asignada</span>;
  if (!test.disponible || !test.tomable) return <span className="pastilla alerta">No disponible</span>;
  if (!test.habilitado) return <span className="pastilla apagado">Sin licencia</span>;
  return <span className="pastilla ok">Habilitada</span>;
}

function iniciales(postulacion) {
  return `${postulacion.nombre?.[0] || ""}${postulacion.apellido?.[0] || ""}`.toUpperCase();
}
