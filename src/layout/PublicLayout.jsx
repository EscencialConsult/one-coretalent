import { Outlet, useLocation } from "react-router-dom";
import { usePersonaAuth } from "../auth/usePersonaAuth";
import Fondo from "../components/Fondo";
import PublicNavbar from "../components/PublicNavbar";
import SiteFooter from "../components/SiteFooter";

export default function PublicLayout() {
  const { autenticado: personaAutenticada } = usePersonaAuth();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen relative flex flex-col">
      <Fondo />
      <PublicNavbar personaAutenticada={personaAutenticada} />
      <main className={
        pathname === "/"
          ? "public-main public-main-landing"
          : pathname === "/busquedas"
            ? "public-main public-main-busquedas"
            : "public-main"
      }><Outlet /></main>
      <SiteFooter />
    </div>
  );
}
