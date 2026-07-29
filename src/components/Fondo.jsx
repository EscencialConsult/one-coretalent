import PlexusSvg from "./PlexusSvg";

/** Fondo decorativo compartido (blobs + velo + red de puntos) — misma identidad
 * visual en toda la app, el mismo fondo animado de ONE Core Analytics. */
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
      <PlexusSvg />
    </>
  );
}
