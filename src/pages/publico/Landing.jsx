import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="tarjeta text-center py-14 px-6 md:px-12">
      <span className="badge-estado bg-negro text-white">ONE Core-Talent</span>
      <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mt-4 mb-4">
        Conectamos <span className="marca-texto-gradiente">talento</span> con oportunidades
      </h1>
      <p className="text-tinta text-opacity-80 max-w-lg mx-auto mb-8 leading-relaxed">
        Postulate a búsquedas activas o publicá tus propias vacantes y evaluá candidatos con
        pruebas psicométricas, todo en un mismo lugar.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link to="/busquedas" className="boton boton-primario min-w-[220px]">
          Buscar empleo
        </Link>
        <Link to="/registro-empresa" className="boton boton-fantasma min-w-[220px]">
          Soy una empresa
        </Link>
      </div>
    </div>
  );
}
