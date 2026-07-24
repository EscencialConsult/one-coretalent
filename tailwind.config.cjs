const brand = require("./src/theme/brand.json");

/**
 * Archivo único de marca: src/theme/brand.json.
 * `acento`/`secundario` se resuelven vía variables CSS (--brand-acento / --brand-secundario),
 * que ThemeProvider actualiza en runtime según la empresa logueada (white-label por tenant,
 * ver src/theme/ThemeProvider.jsx) — el resto de la paleta es la identidad fija de la marca.
 */
module.exports = {
  mode: "jit",
  purge: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: false,
  theme: {
    extend: {
      colors: {
        negro: brand.colores.negro,
        tinta: brand.colores.tinta,
        crema: brand.colores.blanco,
        rosa: brand.colores.rosa,
        cian: brand.colores.cian,
        oro: brand.colores.oro,
        violeta: brand.colores.violeta,
        muted: brand.colores.muted,
        linea: brand.colores.linea,
        fondo: brand.colores.fondo,
        acento: "var(--brand-acento)",
        secundario: "var(--brand-secundario)",
      },
      fontFamily: {
        sans: brand.font.split(",").map((f) => f.trim()),
      },
      borderRadius: {
        marca: brand.radio,
        chico: brand.radioChico,
      },
      boxShadow: {
        marca: brand.sombra,
      },
      backgroundImage: {
        gradiente: brand.gradiente,
      },
    },
  },
  variants: { extend: {} },
  plugins: [require("@tailwindcss/line-clamp")],
};
