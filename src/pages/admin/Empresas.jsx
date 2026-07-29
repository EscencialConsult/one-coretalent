import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { listarEmpresas, listarEmpresasPendientes, aprobarEmpresa, rechazarEmpresa, cambiarEstadoEmpresa } from "../../api/admin";
import { ErrorState, PageLoader } from "../../components/AsyncState";
import Icon from "../../components/Icon";

function sigla(nombre) {
  return (nombre || "?").split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

const FILTROS = [
  { valor: "", label: "Todas" },
  { valor: "pendiente_verificacion", label: "Pendientes" },
  { valor: "activo", label: "Activas" },
  { valor: "suspendido", label: "Suspendidas" },
];

export default function Empresas() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const estadoFiltro = params.get("estado") || "";
  const [empresas, setEmpresas] = useState(null);
  const [docsPorId, setDocsPorId] = useState({});
  const [procesando, setProcesando] = useState(null);
  const [verDocs, setVerDocs] = useState(null);
  const [error, setError] = useState("");

  function cargar() {
    setError("");
    listarEmpresas(token)
      .then(setEmpresas)
      .catch((err) => setError(err?.detail || err?.message || "No se pudo cargar la lista."));
    listarEmpresasPendientes(token).then((pend) => {
      setDocsPorId(Object.fromEntries(pend.map((e) => [e.id, e])));
    });
  }

  useEffect(cargar, [token]);

  const filtradas = useMemo(
    () => (empresas || []).filter((e) => !estadoFiltro || e.estado === estadoFiltro),
    [empresas, estadoFiltro]
  );

  if (error) {
    return <ErrorState mensaje={error} onReintentar={cargar} />;
  }
  if (empresas === null) {
    return <PageLoader mensaje="Cargando empresas…" />;
  }

  async function accion(id, fn) {
    setProcesando(id);
    try {
      await fn(token, id);
      cargar();
    } finally {
      setProcesando(null);
    }
  }

  function cambiarEstado(id, estado) {
    return accion(id, (tok, empresaId) => cambiarEstadoEmpresa(tok, empresaId, estado));
  }

  return (
    <div>
      <div className="barra-herramientas">
        <span className="text-xs text-muted font-semibold">{filtradas.length} resultado{filtradas.length === 1 ? "" : "s"}</span>
        <div className="flex items-center gap-1.5" style={{ marginLeft: "auto" }}>
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              onClick={() => setParams(f.valor ? { estado: f.valor } : {})}
              className={`chip ${estadoFiltro === f.valor ? "chip-activo" : ""}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tarjeta overflow-x-auto" style={{ padding: "4px 0" }}>
        {filtradas.length === 0 && (
          <div className="text-muted text-sm px-5 py-10 text-center">No hay empresas para este filtro.</div>
        )}
        {filtradas.length > 0 && (
          <table className="tabla-panel">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Empresa</th>
                <th>Estado</th>
                <th>Tests habilitados</th>
                <th style={{ paddingRight: 20, textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((e) => {
                const pendiente = e.estado === "pendiente_verificacion";
                const docs = docsPorId[e.id];
                return (
                  <tr key={e.id}>
                    <td style={{ paddingLeft: 20 }}>
                      <div className="flex items-center gap-3">
                        <div className="fila-icono" style={{ background: "rgba(180,39,45,.1)" }}>{sigla(e.razon_social)}</div>
                        <div>
                          <b className="text-sm block">{e.razon_social}</b>
                          <span className="text-xs text-muted">{e.email_admin}{docs?.rubro && ` · ${docs.rubro}`}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className={`pastilla ${e.estado === "activo" ? "ok" : e.estado === "suspendido" ? "rojo" : "apagado"}`}>{e.estado}</span></td>
                    <td className="text-sm">{e.tests_habilitados}</td>
                    <td style={{ paddingRight: 20, textAlign: "right" }}>
                      <div className="flex justify-end gap-2">
                        {pendiente && docs && (
                          <button onClick={() => setVerDocs(docs)} className="chip">
                            <Icon name="doc" className="w-4 h-4" /> Ver documentos
                          </button>
                        )}
                        {pendiente && (
                          <>
                            <button
                              disabled={procesando === e.id}
                              onClick={() => accion(e.id, rechazarEmpresa)}
                              className="boton boton-fantasma !py-2 !px-3.5 text-xs"
                            >
                              Rechazar
                            </button>
                            <button
                              disabled={procesando === e.id}
                              onClick={() => accion(e.id, aprobarEmpresa)}
                              className="boton boton-acento !py-2 !px-3.5 text-xs"
                            >
                              Aprobar
                            </button>
                          </>
                        )}
                        {!pendiente && e.estado === "activo" && (
                          <button
                            disabled={procesando === e.id}
                            onClick={() => cambiarEstado(e.id, "suspendido")}
                            className="boton boton-fantasma !py-2 !px-3.5 text-xs"
                          >
                            Suspender
                          </button>
                        )}
                        {!pendiente && e.estado === "suspendido" && (
                          <button
                            disabled={procesando === e.id}
                            onClick={() => cambiarEstado(e.id, "activo")}
                            className="boton boton-acento !py-2 !px-3.5 text-xs"
                          >
                            Activar
                          </button>
                        )}
                        {!pendiente && (
                          <button
                            onClick={() => navigate(`/admin/empresas/${e.id}/tests`)}
                            className="boton boton-fantasma inline-flex items-center gap-1.5 !py-2 !px-3.5 text-xs"
                          >
                            <Icon name="build" className="w-3.5 h-3.5" /> Gestionar tests
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {verDocs && (
        <div className="modal-overlay" onClick={(ev) => ev.target === ev.currentTarget && setVerDocs(null)}>
          <div className="modal-card">
            <button onClick={() => setVerDocs(null)} className="absolute top-4 right-4 border-0 bg-transparent cursor-pointer text-muted">
              <Icon name="x" className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-extrabold mb-1">Documentos de verificación</h2>
            <p className="text-muted text-sm mb-6">{verDocs.razon_social}</p>
            <div className="flex flex-col gap-2">
              {verDocs.selfie_url && <DocLink label="Selfie del representante" url={verDocs.selfie_url} />}
              {verDocs.firma_legal_url && <DocLink label="Firma" url={verDocs.firma_legal_url} />}
              {verDocs.dni_frente_url && <DocLink label="DNI (frente)" url={verDocs.dni_frente_url} />}
              {verDocs.dni_dorso_url && <DocLink label="DNI (dorso)" url={verDocs.dni_dorso_url} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocLink({ label, url }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="fila-lista" style={{ borderRadius: 12, border: "1px solid var(--linea)", textDecoration: "none" }}>
      <div className="fila-icono"><Icon name="file" className="w-4 h-4" /></div>
      <b className="text-sm text-tinta flex-1">{label}</b>
      <Icon name="chevR" className="w-4 h-4" style={{ color: "var(--brand-acento)" }} />
    </a>
  );
}
