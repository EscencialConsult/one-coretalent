import PlexusSvg from "../components/PlexusSvg";

// Fondo del portal del evaluado: blobs propios (colores de esta sección) + la misma
// red de puntos animada que usa el resto de la plataforma (ver components/PlexusSvg.jsx).
export default function Plexus() {
  return (
    <>
      <div className="bg">
        <div className="blob a" />
        <div className="blob b" />
        <div className="blob c" />
        <div className="blob d" />
      </div>
      <div className="veil" />
      <PlexusSvg />
    </>
  );
}
