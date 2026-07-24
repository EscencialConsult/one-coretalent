import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { listarEmpresasPendientes, aprobarEmpresa, rechazarEmpresa } from "../../api/admin";
import Icon from "../../components/Icon";

function sigla(nombre) {
  return (nombre || "?").split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export default function EmpresasPendientes() {
  const { token } = useAuth();
  const [empresas, setEmpresas] = useState(null);
  const [procesando, setProcesando] = useState(null);
  const [verDocs, setVerDocs] = useState(null);

  function cargar() {
    listarEmpresasPendientes(token).then(setEmpresas);
  }

  useEffect(cargar, [token]);

  async function accion(id, fn) {
    setProcesando(id);
    try {
      await fn(token, id);
      cargar();
    } finally {
      setProcesando(null);
    }
  }

  return (
    <div>
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(1, minmax(0, 220px))" }}>
        <div className="kpi-card">
          <div className="kpi-icon v"><Icon name="build" className="w-5 h-5" /></div>
          <div className="kpi-numero">{empresas?.length ?? "—"}</div>
          <div className="kpi-etiqueta">Esperando revisión</div>
        </div>
      </div>

      <div className="tarjeta" style={{ padding: "4px 0" }}>
        {empresas?.length === 0 && (
          <div className="text-muted text-sm px-5 py-10 text-center">No hay empresas pendientes de aprobación.</div>
        )}
        {empresas?.length > 0 && (
          <table className="tabla-panel">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Empresa</th>
                <th>CUIT / DNI</th>
                <th>Documentos</th>
                <th style={{ paddingRight: 20, textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empresas?.map((e) => (
                <tr key={e.id}>
                  <td style={{ paddingLeft: 20 }}>
                    <div className="flex items-center gap-3">
                      <div className="fila-icono" style={{ background: "rgba(77,36,143,.1)" }}>{sigla(e.razon_social)}</div>
                      <div>
                        <b className="text-sm block">{e.razon_social}</b>
                        <span className="text-xs text-muted">{e.email_admin}{e.rubro && ` · ${e.rubro}`}</span>
                      </div>
                    </div>
                  </td>
                  <td className="text-xs text-muted">
                    {e.cuit}<br />DNI {e.dni}
                  </td>
                  <td>
                    <button onClick={() => setVerDocs(e)} className="chip">
                      <Icon name="doc" className="w-4 h-4" /> Ver documentos
                    </button>
                  </td>
                  <td style={{ paddingRight: 20, textAlign: "right" }}>
                    <div className="flex justify-end gap-2">
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
                    </div>
                  </td>
                </tr>
              ))}
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
