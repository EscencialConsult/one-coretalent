import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

/** Protege una rama de rutas. `rol` opcional: si se pasa, exige ese rol exacto. */
export default function ProtectedRoute({ rol, children }) {
  const { autenticado, cargando, user } = useAuth();

  if (cargando) {
    return <div className="min-h-screen grid place-items-center text-muted">Cargando…</div>;
  }
  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }
  if (rol && user?.rol !== rol) {
    return <Navigate to="/" replace />;
  }
  return children;
}
