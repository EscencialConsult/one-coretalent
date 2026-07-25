import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { listarEmpresas } from "../../api/admin";
import Icon from "../../components/Icon";

function sigla(nombre) {
  return (nombre || "?").split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export default function Empresas() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState(null);

  useEffect(() => {
    listarEmpresas(token).then(setEmpresas);
  }, [token]);

  return (
    <div>
      <div className="barra-herramientas">
        <h3 className="text-sm font-bold">Empresas ({empresas?.length ?? "…"})</h3>
      </div>

      <div className="tarjeta" style={{ padding: "4px 0" }}>
        {empresas?.length === 0 && (
          <div className="text-muted text-sm px-5 py-10 text-center">Todavía no hay empresas cargadas.</div>
        )}
        {empresas?.length > 0 && (
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
              {empresas.map((e) => (
                <tr key={e.id}>
                  <td style={{ paddingLeft: 20 }}>
                    <div className="flex items-center gap-3">
                      <div className="fila-icono" style={{ background: "rgba(77,36,143,.1)" }}>{sigla(e.razon_social)}</div>
                      <div>
                        <b className="text-sm block">{e.razon_social}</b>
                        <span className="text-xs text-muted">{e.email_admin}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className={`pastilla ${e.estado === "activo" ? "ok" : e.estado === "suspendido" ? "rojo" : "apagado"}`}>{e.estado}</span></td>
                  <td className="text-sm">{e.tests_habilitados}</td>
                  <td style={{ paddingRight: 20, textAlign: "right" }}>
                    <button
                      onClick={() => navigate(`/admin/empresas/${e.id}/tests`)}
                      className="boton boton-fantasma inline-flex items-center gap-1.5 !py-2 !px-3.5 text-xs"
                    >
                      <Icon name="build" className="w-3.5 h-3.5" /> Gestionar tests
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
