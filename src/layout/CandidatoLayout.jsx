import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { usePersonaAuth } from "../auth/usePersonaAuth";
import Icon from "../components/Icon";
import Marca from "../components/Marca";

const enlaces = [
  ["Inicio", "/candidato", "home"],
  ["Buscar oportunidades", "/candidato/busquedas", "search"],
  ["Mis postulaciones", "/candidato/postulaciones", "briefcase"],
  ["Evaluaciones", "/candidato/evaluaciones", "clipboard"],
  ["Resultados", "/candidato/resultados", "chart"],
  ["Mi perfil", "/candidato/perfil", "user"],
  ["Seguridad", "/candidato/seguridad", "lock"],
  ["Privacidad", "/candidato/privacidad", "shield"],
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
        <button
          type="button"
          aria-label="Cerrar menú"
          className="candidate-overlay"
          onClick={() => setAbierto(false)}
        />
      )}

      <aside className={`candidate-sidebar ${abierto ? "is-open" : ""}`}>
        <div className="candidate-brand">
          <Marca />
          <button
            type="button"
            className="candidate-close"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar navegación"
          >
            <Icon name="x" />
          </button>
        </div>

        <div className="candidate-sidebar-label">Mi espacio profesional</div>
        <nav className="candidate-nav" aria-label="Portal del candidato">
          {enlaces.map(([label, to, icono]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/candidato"}
              className={({ isActive }) => isActive ? "is-active" : ""}
            >
              <span><Icon name={icono} /></span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="candidate-account">
          <div className="candidate-avatar">{iniciales(persona)}</div>
          <div className="candidate-account-copy">
            <strong>{persona?.nombre} {persona?.apellido}</strong>
            <span>{persona?.email}</span>
          </div>
          <button type="button" onClick={logout} aria-label="Cerrar sesión">
            <Icon name="logout" />
          </button>
        </div>
      </aside>

      <div className="candidate-main">
        <header className="candidate-topbar">
          <button
            type="button"
            className="candidate-menu"
            onClick={() => setAbierto(true)}
            aria-label="Abrir navegación"
          >
            <Icon name="menu" />
          </button>
          <div>
            <span>Portal del candidato</span>
            <strong>{persona?.nombre} {persona?.apellido}</strong>
          </div>
          <NavLink to="/candidato/busquedas" className="candidate-opportunities">
            Explorar oportunidades <Icon name="chevR" />
          </NavLink>
        </header>

        <main className="candidate-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
