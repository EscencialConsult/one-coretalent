import { useTheme } from "../theme/ThemeProvider";

/** Lockup de marca: logo de la empresa (si tiene) o el nombre en degradé de ONE. */
export default function Marca({ tamaño = "text-xl" }) {
  const { marca } = useTheme();
  if (marca.logo_url) {
    return <img src={marca.logo_url} alt={marca.razon_social} className="h-9 w-auto" />;
  }
  return (
    <span className={`font-extrabold tracking-tight ${tamaño}`}>
      <span className="marca-texto-gradiente">{marca.razon_social}</span>
    </span>
  );
}
