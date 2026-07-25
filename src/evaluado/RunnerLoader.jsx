export default function RunnerLoader({ label = "Cargando…", full = false }) {
  return (
    <div className={full ? "runner-loader runner-loader--full" : "runner-loader"} role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
