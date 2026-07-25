import { Navigate, useLocation } from "react-router-dom";
import { ErrorState, PageLoader } from "../components/AsyncState";
import { usePersonaAuth } from "./usePersonaAuth";

export default function ProtectedPersonaRoute({ children }) {
  const { autenticado, cargando, errorSesion, recargarSesion } = usePersonaAuth();
  const location = useLocation();

  if (cargando) return <PageLoader mensaje="Validando tu sesión…" />;
  if (errorSesion) {
    return (
      <main className="min-h-screen grid place-items-center px-4">
        <ErrorState mensaje={errorSesion} onReintentar={recargarSesion} />
      </main>
    );
  }
  if (!autenticado) {
    return <Navigate to="/login-candidato" replace state={{ from: location.pathname }} />;
  }
  return children;
}
