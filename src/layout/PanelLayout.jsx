import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import Fondo from "../components/Fondo";
import Icon from "../components/Icon";
import Marca from "../components/Marca";

const NAV_EMPRESA = [
  { to: "/empresa/vacantes", icon: "briefcase", label: "Vacantes", titulo: "Vacantes" },
  { to: "/empresa/postulantes", icon: "users", label: "Postulantes", titulo: "Postulantes" },
];
const NAV_SUPERADMIN = [
  { to: "/admin/empresas-pendientes", icon: "build", label: "Empresas pendientes", titulo: "Empresas pendientes" },
  { to: "/admin/empresas", icon: "briefcase", label: "Empresas", titulo: "Empresas" },
];

function inicialesDe(user) {
  if (!user) return "··";
  const nombre = (user.nombre || "")[0] || "";
  const apellido = (user.apellido || "")[0] || "";
  return (nombre + apellido).toUpperCase() || user.email?.[0]?.toUpperCase() || "··";
}

export default function PanelLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const esSuperadmin = user?.rol === "superadmin";
  const nav = esSuperadmin ? NAV_SUPERADMIN : NAV_EMPRESA;
  const activo = nav.find((item) => pathname.startsWith(item.to));

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  function salir() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="panel-shell">
      <Fondo />
      {menuAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú al tocar fuera"
          className="panel-overlay"
          onClick={() => setMenuAbierto(false)}
        />
      )}
      <aside className={`panel-side ${menuAbierto ? "abierto" : ""}`}>
        <div className="flex items-center gap-2.5 px-2 pb-6">
          <Marca tamaño="text-base" />
          <button
            type="button"
            aria-label="Cerrar menú"
            className="panel-close ml-auto"
            onClick={() => setMenuAbierto(false)}
          >
            <Icon name="x" />
          </button>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Navegación del panel">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `panel-nav-item ${isActive ? "activo" : ""}`}
            >
              <Icon name={item.icon} className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-linea pt-3.5 flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-chico grid place-items-center text-white font-extrabold flex-none"
            style={{ fontSize: 13, backgroundColor: "var(--brand-acento)" }}
          >
            {inicialesDe(user)}
          </div>
          <div className="min-w-0">
            <b className="block text-sm truncate">{user ? `${user.nombre} ${user.apellido}` : "Usuario"}</b>
            <span className="block text-xs text-muted">{esSuperadmin ? "SuperAdmin" : "Administrador"}</span>
          </div>
          <button
            type="button"
            onClick={salir}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="ml-auto border-0 bg-transparent cursor-pointer text-muted p-1.5 rounded-chico hover:bg-linea hover:bg-opacity-30 hover:text-tinta transition-colors"
          >
            <Icon name="logout" className="w-5 h-5" />
          </button>
        </div>
      </aside>

      <div className="panel-main">
        <div className="panel-topbar">
          <button
            type="button"
            aria-label="Abrir menú"
            className="panel-menu-btn"
            onClick={() => setMenuAbierto(true)}
          >
            <Icon name="menu" />
          </button>
          <h1 className="text-xl font-extrabold">{activo?.titulo || "Panel"}</h1>
          <span className="text-xs text-muted font-semibold truncate">{user?.email}</span>
        </div>
        <div className="panel-content"><Outlet /></div>
      </div>
    </div>
  );
}
