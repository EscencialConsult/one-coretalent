import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import Fondo from "../components/Fondo";
import Marca from "../components/Marca";
import Icon from "../components/Icon";
import { useAuth } from "../auth/AuthContext";

const NAV_EMPRESA = [{ to: "/empresa/vacantes", icon: "briefcase", label: "Vacantes", titulo: "Vacantes" }];
const NAV_SUPERADMIN = [
  { to: "/admin/empresas-pendientes", icon: "build", label: "Empresas pendientes", titulo: "Empresas pendientes" },
];

function inicialesDe(user) {
  if (!user) return "··";
  const a = (user.nombre || "")[0] || "";
  const b = (user.apellido || "")[0] || "";
  return (a + b).toUpperCase() || user.email?.[0]?.toUpperCase() || "··";
}

export default function PanelLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const esSuperadmin = user?.rol === "superadmin";
  const nav = esSuperadmin ? NAV_SUPERADMIN : NAV_EMPRESA;
  const activo = nav.find((n) => pathname.startsWith(n.to));

  function salir() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="panel-shell">
      <Fondo />
      <aside className="panel-side">
        <div className="flex items-center gap-2.5 px-2 pb-6">
          <Marca tamaño="text-base" />
        </div>
        <nav className="flex flex-col gap-1">
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
          <button onClick={salir} title="Salir" className="ml-auto border-0 bg-transparent cursor-pointer text-muted p-1.5 rounded-chico hover:bg-linea hover:bg-opacity-30 hover:text-tinta transition-colors">
            <Icon name="logout" className="w-5 h-5" />
          </button>
        </div>
      </aside>

      <div className="panel-main">
        <div className="panel-topbar">
          <h1 className="text-xl font-extrabold">{activo?.titulo || "Panel"}</h1>
          <span className="text-xs text-muted font-semibold">{user?.email}</span>
        </div>
        <div className="panel-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
