import { NavLink } from "react-router-dom";
import Icon from "../components/Icon";
import Marca from "../components/Marca";

/** Sidebar compartido por todos los paneles logueados (candidato, empresa, superadmin) —
 * mismo componente para que un cambio de diseño no haya que repetirlo en cada layout. */
export default function AppSidebar({
  navItems,
  abierto,
  onCerrar,
  iniciales,
  nombre,
  subtitulo,
  rolIcono,
  rolEtiqueta,
  onLogout,
}) {
  return (
    <aside className={`app-sidebar ${abierto ? "is-open" : ""}`}>
      <div className="app-sidebar-brand">
        <Marca />
        <button type="button" className="app-sidebar-close" onClick={onCerrar} aria-label="Cerrar navegación">
          <Icon name="x" />
        </button>
      </div>

      <nav className="app-nav" aria-label="Navegación">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? "is-active" : "")}
          >
            <span><Icon name={item.icon} /></span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="app-account">
        <div className="app-avatar-wrap">
          <div className="app-avatar">{iniciales}</div>
          <span className="app-avatar-badge" title={rolEtiqueta}><Icon name={rolIcono} /></span>
        </div>
        <div className="app-account-copy">
          <strong>{nombre}</strong>
          <span>{subtitulo}</span>
        </div>
        <button type="button" onClick={onLogout} aria-label="Cerrar sesión">
          <Icon name="logout" />
        </button>
      </div>
    </aside>
  );
}
