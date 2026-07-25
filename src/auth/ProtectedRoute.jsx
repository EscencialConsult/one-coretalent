import { Navigate, useLocation } from "react-router-dom";
import { ErrorState, PageLoader } from "../components/AsyncState";
import { useAuth } from "./useAuth";

/** Protege una rama de rutas. `rol` opcional: si se pasa, exige ese rol exacto. */
export default function ProtectedRoute({ rol, children }) {
  const { autenticado, cargando, errorSesion, recargarSesion, user } = useAuth();
  const location = useLocation();

  if (cargando) return <PageLoader mensaje="Validando sesión…" />;
  if (errorSesion) {
    return (
      <main className="min-h-screen grid place-items-center px-4">
        <ErrorState mensaje={errorSesion} onReintentar={recargarSesion} />
      </main>
    );
  }
  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (rol && user?.rol !== rol) {
    return <Navigate to="/" replace />;
  }
  return children;
}
