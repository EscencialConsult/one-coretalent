import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import Icon from "./Icon";
import Marca from "./Marca";

const LINKS = [
  { to: "/", label: "Inicio", exact: true },
  { to: "/busquedas", label: "Oportunidades" },
  { to: "/registro-empresa", label: "Para empresas" },
];

export default function PublicNavbar({ personaAutenticada }) {
  const [abierto, setAbierto] = useState(false);
  const location = useLocation();
  useEffect(() => setAbierto(false), [location.pathname]);

  return (
    <header className="public-navbar">
      <div className="public-navbar-inner">
        <Link to="/" className="public-navbar-brand" aria-label="ONE Talent Hub, ir al inicio">
          <Marca /><span>Talent Hub</span>
        </Link>
        <nav className="public-navbar-links" aria-label="Navegación principal">
          {LINKS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.exact} className={({ isActive }) => isActive ? "activo" : ""}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="public-navbar-actions">
          <Link to={personaAutenticada ? "/candidato" : "/login-candidato"} className="public-nav-login">
            {personaAutenticada ? "Mi portal" : "Ingresar"}
          </Link>
          {!personaAutenticada && <Link to="/registro-candidato" className="public-nav-candidate">Crear cuenta</Link>}
          <Link to="/login" className="public-nav-cta">Panel empresa <span aria-hidden="true">→</span></Link>
        </div>
        <button type="button" className="public-navbar-menu" aria-expanded={abierto} aria-controls="menu-publico-movil" aria-label={abierto ? "Cerrar menú" : "Abrir menú"} onClick={() => setAbierto((valor) => !valor)}>
          <Icon name={abierto ? "x" : "menu"} />
        </button>
      </div>
      <div id="menu-publico-movil" className={`public-mobile-menu ${abierto ? "abierto" : ""}`}>
        <nav aria-label="Navegación móvil">
          {LINKS.map((item) => <Link key={item.to} to={item.to}>{item.label}</Link>)}
          <div className="public-mobile-actions">
            <Link to={personaAutenticada ? "/candidato" : "/login-candidato"}>{personaAutenticada ? "Mi portal" : "Ingresar como candidato"}</Link>
            {!personaAutenticada && <Link to="/registro-candidato" className="public-nav-candidate">Registrarme como candidato</Link>}
            <Link to="/login" className="public-nav-cta">Ingresar como empresa</Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
