import { createContext, useContext, useEffect, useMemo, useState } from "react";
import brand from "./brand.json";

/**
 * Contexto de marca: expone `marca` (razon_social/logo/colores) y `setMarca()`.
 * Al cambiar, pisa las variables CSS --brand-acento/--brand-secundario en :root —
 * así cualquier clase Tailwind que use `acento`/`secundario` (ver tailwind.config.cjs)
 * refleja el white-label de la empresa actual sin tocar componentes uno por uno.
 */
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [marca, setMarca] = useState(brand.marcaDefault);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand-acento", marca.color_acento || brand.marcaDefault.color_acento);
    root.style.setProperty("--brand-secundario", marca.color_secundario || brand.marcaDefault.color_secundario);
  }, [marca]);

  const value = useMemo(() => ({ marca, setMarca, brand }), [marca]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme() tiene que usarse adentro de <ThemeProvider>");
  return ctx;
}
