import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import Fondo from "../components/Fondo";
import Icon from "../components/Icon";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";

const NAV_EMPRESA = [
  { to: "/empresa/inicio", icon: "home", label: "Inicio", titulo: "Inicio" },
  { to: "/empresa/vacantes", icon: "briefcase", label: "Vacantes", titulo: "Vacantes" },
  { to: "/empresa/postulantes", icon: "users", label: "Postulantes", titulo: "Postulantes" },
  { to: "/empresa/tests", icon: "clipboard", label: "Tests", titulo: "Tests" },
  { to: "/empresa/perfil", icon: "user", label: "Mi perfil", titulo: "Mi perfil" },
];
const NAV_SUPERADMIN = [
  { to: "/admin/inicio", icon: "home", label: "Inicio", titulo: "Inicio" },
  { to: "/admin/empresas", icon: "briefcase", label: "Empresas", titulo: "Empresas", descripcion: "Altas, aprobaciones y acceso a tests por empresa." },
  { to: "/admin/postulantes", icon: "users", label: "Postulantes", titulo: "Postulantes", descripcion: "Todos los candidatos registrados en la plataforma." },
  { to: "/admin/busquedas", icon: "clipboard", label: "Búsquedas", titulo: "Búsquedas", descripcion: "Vacantes publicadas por cualquier empresa." },
  { to: "/admin/auditoria", icon: "clock", label: "Auditoría", titulo: "Auditoría", descripcion: "Registro de acciones sobre evaluaciones y resultados." },
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
        <button type="button" aria-label="Cerrar menú al tocar fuera" className="app-overlay" onClick={() => setMenuAbierto(false)} />
      )}

      <AppSidebar
        navItems={nav}
        abierto={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
        iniciales={inicialesDe(user)}
        nombre={user ? `${user.nombre} ${user.apellido}` : "Usuario"}
        subtitulo={esSuperadmin ? "SuperAdmin" : "Administrador"}
        rolIcono={esSuperadmin ? "shield" : "briefcase"}
        rolEtiqueta={esSuperadmin ? "SuperAdmin" : "Empresa"}
        onLogout={salir}
      />

      <div className="panel-main">
        <AppTopbar onAbrirMenu={() => setMenuAbierto(true)}>
          <div className="app-topbar-heading">
            <span className="app-topbar-heading-icon"><Icon name={activo?.icon || "grid"} className="w-4 h-4" /></span>
            <div>
              <h1>{activo?.titulo || "Panel"}</h1>
              {activo?.descripcion && <p>{activo.descripcion}</p>}
            </div>
          </div>
          <div className="app-topbar-user" style={{ marginLeft: "auto" }}>
            <span className="app-role-tag">
              <Icon name={esSuperadmin ? "shield" : "briefcase"} className="w-3.5 h-3.5" />
              {esSuperadmin ? "SuperAdmin" : "Empresa"}
            </span>
            <span className="text-xs text-muted font-semibold truncate">{user?.email}</span>
          </div>
        </AppTopbar>
        <div className="panel-content"><Outlet /></div>
      </div>
    </div>
  );
}
