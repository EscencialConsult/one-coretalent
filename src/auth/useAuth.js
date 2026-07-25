import { useContext } from "react";
import { AdminAuthContext } from "./AdminAuthContext";

export function useAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAuth() debe usarse dentro de <AuthProvider>");
  return context;
}
