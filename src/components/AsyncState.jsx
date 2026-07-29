import Icon from "./Icon";

export function PageLoader({ mensaje = "Cargando…" }) {
  return (
    <div className="candidate-loader" role="status" aria-live="polite">
      <div className="one-spinwrap" aria-hidden="true">
        <span className="one-ring" />
        <img className="one-spiral" src="/espiral-one.png" alt="" width={104} height={104} />
      </div>
      <span className="sr-only">{mensaje}</span>
    </div>
  );
}

export function ErrorState({
  titulo = "No pudimos cargar esta sección",
  mensaje = "Ocurrió un error inesperado.",
  onReintentar,
}) {
  return (
    <div className="candidate-state is-error" role="alert">
      <div><span>!</span></div>
      <h2>{titulo}</h2>
      <p>{mensaje}</p>
      {onReintentar && (
        <button type="button" onClick={onReintentar} className="boton boton-acento">
          Reintentar
        </button>
      )}
    </div>
  );
}

export function EmptyState({ titulo, mensaje, accion }) {
  return (
    <div className="candidate-state">
      <div><Icon name="search" /></div>
      <h3>{titulo}</h3>
      {mensaje && <p>{mensaje}</p>}
      {accion}
    </div>
  );
}
