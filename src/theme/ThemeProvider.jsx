import { useEffect, useMemo, useState } from "react";
import brand from "./brand.json";
import { ThemeContext } from "./ThemeContext";

/**
 * Contexto de marca: expone `marca` (razon_social/logo/colores) y `setMarca()`.
 * Al cambiar, pisa las variables CSS --brand-acento/--brand-secundario en :root —
 * así cualquier clase Tailwind que use `acento`/`secundario` (ver tailwind.config.cjs)
 * refleja el white-label de la empresa actual sin tocar componentes uno por uno.
 */
export function ThemeProvider({ children }) {
  const [marca, setMarca] = useState(brand.marcaDefault);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand-acento", marca.color_acento || brand.marcaDefault.color_acento);
    root.style.setProperty("--brand-secundario", marca.color_secundario || brand.marcaDefault.color_secundario);
  }, [marca]);

  // El resto de la paleta (rosa/cian/oro/violeta/oscuro/...) es fija de la marca,
  // no cambia por tenant — se pisa una sola vez desde brand.json, la única fuente
  // de verdad para el color de toda la app (Tailwind y el CSS a mano).
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(brand.colores).forEach(([nombre, valor]) => {
      root.style.setProperty(`--${nombre}`, valor);
    });
  }, []);

  const value = useMemo(() => ({ marca, setMarca, brand }), [marca]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
