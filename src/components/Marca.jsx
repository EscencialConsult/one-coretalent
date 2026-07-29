import { useTheme } from "../theme/useTheme";

/** Lockup de marca: logo de la empresa (si tiene) o el nombre en degradé de ONE. */
export default function Marca({ tamaño = "text-xl" }) {
  const { marca, brand } = useTheme();
  if (marca.logo_url) {
    return <img src={marca.logo_url} alt={marca.razon_social} className="marca-logo" />;
  }
  if (marca.razon_social === brand?.marcaDefault?.razon_social) {
    return <img src="/logo-trim.png" alt="ONE" className="marca-logo" />;
  }
  return (
    <span className={`font-extrabold tracking-tight ${tamaño}`}>
      <span className="marca-texto-gradiente">{marca.razon_social}</span>
    </span>
  );
}
