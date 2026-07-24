import { Link, Outlet } from "react-router-dom";
import Fondo from "../components/Fondo";
import Marca from "../components/Marca";

export default function PublicLayout() {
  return (
    <div className="min-h-screen relative">
      <Fondo />
      <header className="flex items-center justify-between px-6 md:px-10 py-4 bg-white bg-opacity-70 backdrop-blur-md border-b border-linea border-opacity-60 sticky top-0 z-10">
        <Link to="/">
          <Marca />
        </Link>
        <nav className="flex items-center gap-3 md:gap-5 text-sm font-semibold">
          <Link to="/busquedas" className="hover:text-acento transition-colors">
            Búsquedas
          </Link>
          <Link to="/registro-empresa" className="hover:text-acento transition-colors">
            Soy empresa
          </Link>
          <Link to="/login" className="boton boton-fantasma !py-2.5 !px-5">
            Ingresar
          </Link>
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        <Outlet />
      </main>
      <footer className="text-center text-xs text-muted py-10">
        © {new Date().getFullYear()} ONE Core-Talent
      </footer>
    </div>
  );
}
