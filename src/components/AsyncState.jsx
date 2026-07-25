import Icon from "./Icon";

export function PageLoader({ mensaje = "Cargando…" }) {
  return (
    <div className="candidate-loader" role="status" aria-live="polite">
      <div className="spinner-marca" aria-hidden="true" />
      <p>{mensaje}</p>
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
