import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { usePersonaAuth } from "../auth/usePersonaAuth";
import Icon from "../components/Icon";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";

const NAV_CANDIDATO = [
  { to: "/candidato", icon: "home", label: "Inicio", end: true },
  { to: "/candidato/busquedas", icon: "search", label: "Buscar oportunidades" },
  { to: "/candidato/postulaciones", icon: "briefcase", label: "Mis postulaciones" },
  { to: "/candidato/evaluaciones", icon: "clipboard", label: "Evaluaciones" },
  { to: "/candidato/resultados", icon: "chart", label: "Resultados" },
  { to: "/candidato/perfil", icon: "user", label: "Mi perfil" },
  { to: "/candidato/seguridad", icon: "lock", label: "Seguridad" },
  { to: "/candidato/privacidad", icon: "shield", label: "Privacidad" },
];

const iniciales = (persona) =>
  [persona?.nombre, persona?.apellido]
    .filter(Boolean)
    .map((parte) => parte[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "PE";

export default function CandidatoLayout() {
  const { persona, logout } = usePersonaAuth();
  const [abierto, setAbierto] = useState(false);
  const location = useLocation();

  useEffect(() => setAbierto(false), [location.pathname]);

  return (
    <div className="candidate-app">
      {abierto && (
        <button type="button" aria-label="Cerrar menú" className="app-overlay" onClick={() => setAbierto(false)} />
      )}

      <AppSidebar
        navItems={NAV_CANDIDATO}
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        iniciales={iniciales(persona)}
        nombre={`${persona?.nombre || ""} ${persona?.apellido || ""}`.trim()}
        subtitulo={persona?.email}
        rolIcono="user"
        rolEtiqueta="Candidato"
        onLogout={logout}
      />

      <div className="candidate-main">
        <AppTopbar onAbrirMenu={() => setAbierto(true)}>
          <div className="app-topbar-user">
            <span className="app-role-tag"><Icon name="user" className="w-3.5 h-3.5" />Candidato</span>
            <strong>{persona?.nombre} {persona?.apellido}</strong>
          </div>
          <NavLink to="/candidato/busquedas" className="candidate-opportunities">
            Explorar oportunidades <Icon name="chevR" />
          </NavLink>
        </AppTopbar>

        <main className="candidate-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
