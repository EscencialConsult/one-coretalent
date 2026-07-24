/** Fondo decorativo compartido (blobs + velo) — misma identidad visual en toda la app. */
export default function Fondo() {
  return (
    <>
      <div className="fondo-blobs">
        <span className="blob a" />
        <span className="blob b" />
        <span className="blob c" />
        <span className="blob d" />
      </div>
      <div className="velo" />
    </>
  );
}
