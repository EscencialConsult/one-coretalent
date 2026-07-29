import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { obtenerResumenAdmin, listarEmpresasPendientes } from "../../api/admin";
import { ErrorState, PageLoader } from "../../components/AsyncState";
import Icon from "../../components/Icon";

export default function InicioAdmin() {
  const { token, user } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [pendientes, setPendientes] = useState(null);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!token) return;
    setError("");
    Promise.all([obtenerResumenAdmin(token), listarEmpresasPendientes(token)])
      .then(([r, p]) => {
        setResumen(r);
        setPendientes(p);
      })
      .catch((err) => setError(err?.detail || err?.message || "No se pudo cargar el resumen."));
  }, [token, intento]);

  if (error) {
    return <ErrorState mensaje={error} onReintentar={() => setIntento((n) => n + 1)} />;
  }
  if (!resumen) {
    return <PageLoader mensaje="Cargando resumen…" />;
  }

  return (
    <div>
      <h1 className="text-xl font-extrabold mb-1">Hola, {user?.nombre || "SuperAdmin"}</h1>
      <p className="text-sm text-muted mb-6">Un vistazo general de toda la plataforma.</p>

      {pendientes?.length > 0 && (
        <Link to="/admin/empresas?estado=pendiente_verificacion" className="admin-aviso-pendientes mb-6">
          <Icon name="build" className="w-4 h-4" />
          <span>
            <b>{pendientes.length} empresa{pendientes.length === 1 ? "" : "s"}</b> esperando revisión
          </span>
          <Icon name="chevR" className="w-3.5 h-3.5" style={{ marginLeft: "auto" }} />
        </Link>
      )}

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon v"><Icon name="briefcase" className="w-5 h-5" /></div>
          <div className="kpi-numero">{resumen?.empresas ?? "—"}</div>
          <div className="kpi-etiqueta">Empresas</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon r"><Icon name="check" className="w-5 h-5" /></div>
          <div className="kpi-numero">{resumen?.empresas_activas ?? "—"}</div>
          <div className="kpi-etiqueta">Empresas activas</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon c"><Icon name="users" className="w-5 h-5" /></div>
          <div className="kpi-numero">{resumen?.evaluados ?? "—"}</div>
          <div className="kpi-etiqueta">Evaluados</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon o"><Icon name="doc" className="w-5 h-5" /></div>
          <div className="kpi-numero">{resumen?.resultados ?? "—"}</div>
          <div className="kpi-etiqueta">Resultados generados</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon v"><Icon name="clipboard" className="w-5 h-5" /></div>
          <div className="kpi-numero">{resumen?.tests_tomables ?? "—"} / {resumen?.tests_catalogo ?? "—"}</div>
          <div className="kpi-etiqueta">Tests tomables / catálogo</div>
        </div>
      </div>

      {resumen?.tests_mas_usados?.length > 0 && (
        <div className="tarjeta mt-6" style={{ padding: "1.25rem 1.5rem" }}>
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-muted mb-3">Tests más usados</h3>
          <div className="grid gap-2">
            {resumen.tests_mas_usados.map((t) => (
              <div key={t.slug} className="flex items-center justify-between text-sm">
                <span>{t.nombre}</span>
                <b>{t.n}</b>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
