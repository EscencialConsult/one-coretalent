import { Link } from "react-router-dom";
import Fondo from "../components/Fondo";
import Marca from "../components/Marca";

export default function NoEncontrado() {
  return (
    <main className="min-h-screen grid place-items-center px-4 relative">
      <Fondo />
      <div className="tarjeta max-w-md w-full p-10 text-center">
        <Marca />
        <p className="text-6xl font-extrabold text-acento mt-8 mb-2">404</p>
        <h1 className="text-xl font-extrabold mb-2">Página no encontrada</h1>
        <p className="text-sm text-muted mb-6">La dirección no existe o fue movida.</p>
        <Link to="/" className="boton boton-primario inline-block">Volver al inicio</Link>
      </div>
    </main>
  );
}
