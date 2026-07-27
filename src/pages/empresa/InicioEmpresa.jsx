import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { obtenerResumenEmpresa } from "../../api/empresa";
import { ErrorState, PageLoader } from "../../components/AsyncState";
import Icon from "../../components/Icon";

const ESTADO_LABEL = {
  sin_asignar: "Sin evaluación asignada",
  sin_iniciar: "Asignada, sin empezar",
  en_curso: "En curso",
  completado: "Completado",
};

export default function InicioEmpresa() {
  const { token, user } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState(false);

  function cargar() {
    setError(false);
    setResumen(null);
    obtenerResumenEmpresa(token).then(setResumen).catch(() => setError(true));
  }

  useEffect(cargar, [token]);

  if (error) return <ErrorState mensaje="No pudimos cargar el resumen de tu empresa." onReintentar={cargar} />;
  if (!resumen) return <PageLoader mensaje="Cargando tu resumen…" />;

  const maxMes = Math.max(1, ...(resumen?.completadas_por_mes || []).map((m) => m.n));

  return (
    <div>
      <p className="text-sm text-muted mb-1">Hola, {user?.nombre || "administrador/a"}.</p>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon v"><Icon name="users" className="w-5 h-5" /></div>
          <div className="kpi-numero">{resumen?.evaluados ?? "—"}</div>
          <div className="kpi-etiqueta">Postulantes evaluados</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon r"><Icon name="send" className="w-5 h-5" /></div>
          <div className="kpi-numero">{resumen?.asignadas ?? "—"}</div>
          <div className="kpi-etiqueta">Evaluaciones asignadas</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon c"><Icon name="check" className="w-5 h-5" /></div>
          <div className="kpi-numero">{resumen?.completadas ?? "—"}</div>
          <div className="kpi-etiqueta">Completadas</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon o"><Icon name="clock" className="w-5 h-5" /></div>
          <div className="kpi-numero">{resumen?.pendientes ?? "—"}</div>
          <div className="kpi-etiqueta">Pendientes</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-2">
        <section className="tarjeta p-5">
          <h3 className="text-sm font-bold mb-4">Evaluaciones completadas por mes</h3>
          {!resumen?.completadas_por_mes?.length ? (
            <p className="text-sm text-muted">Todavía no hay datos.</p>
          ) : (
            <div className="flex items-end gap-3" style={{ height: 140 }}>
              {resumen.completadas_por_mes.map((m) => (
                <div key={m.label} className="flex-1 flex flex-col items-center justify-end h-full">
                  <span className="text-xs font-bold mb-1">{m.n || ""}</span>
                  <div
                    style={{
                      width: "100%",
                      height: `${Math.max(4, (m.n / maxMes) * 100)}%`,
                      background: "var(--brand-acento)",
                      borderRadius: 6,
                      opacity: m.n ? 1 : 0.15,
                    }}
                  />
                  <span className="text-[11px] text-muted mt-1.5">{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="tarjeta p-5">
          <h3 className="text-sm font-bold mb-4">Tests más asignados</h3>
          {!resumen?.mas_asignadas?.length ? (
            <p className="text-sm text-muted">Todavía no asignaste evaluaciones.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {resumen.mas_asignadas.map((t) => (
                <div key={t.slug} className="flex items-center justify-between text-sm">
                  <span>{t.nombre}</span>
                  <span className="pastilla apagado">{t.n}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="tarjeta mt-5" style={{ padding: "4px 0" }}>
        <h3 className="text-sm font-bold px-5 pt-4 pb-2">Actividad reciente</h3>
        {!resumen?.actividad_reciente?.length ? (
          <div className="text-muted text-sm px-5 py-8 text-center">Todavía no hay resultados calculados.</div>
        ) : (
          resumen.actividad_reciente.map((a) => (
            <Link
              key={a.resultado_id}
              to={`/empresa/informe/${a.resultado_id}`}
              className="fila-lista"
              style={{ textDecoration: "none" }}
            >
              <div className="fila-icono"><Icon name="doc" className="w-4 h-4" /></div>
              <div className="min-w-0 flex-1">
                <b className="text-sm block">{a.evaluado}</b>
                <span className="text-xs text-muted">{a.test_nombre}</span>
              </div>
              <span className="text-xs text-muted flex-none">{new Date(a.fecha).toLocaleDateString("es-AR")}</span>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
