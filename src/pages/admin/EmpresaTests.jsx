import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { listarTestsEmpresa, toggleTestEmpresa } from "../../api/admin";
import Icon from "../../components/Icon";

// Excluidos del alcance de esta plataforma (ver PLATAFORMA.md) — no se ofrecen a ninguna empresa.
const TESTS_EXCLUIDOS = ["excel-inicial", "excel-intermedio", "excel-avanzado"];

export default function EmpresaTests() {
  const { empresaId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState(null);
  const [cambiando, setCambiando] = useState(null);

  function cargar() {
    listarTestsEmpresa(token, empresaId).then((lista) =>
      setTests(lista.filter((t) => !TESTS_EXCLUIDOS.includes(t.slug)))
    );
  }

  useEffect(cargar, [token, empresaId]);

  async function onToggle(slug, habilitado) {
    setCambiando(slug);
    try {
      await toggleTestEmpresa(token, empresaId, slug, habilitado);
      setTests((actual) => actual.map((t) => (t.slug === slug ? { ...t, en_alcance: true, habilitado } : t)));
    } finally {
      setCambiando(null);
    }
  }

  return (
    <div>
      <button onClick={() => navigate("/admin/empresas")} className="volver-link">
        <Icon name="chevL" className="w-4 h-4" /> Volver a Empresas
      </button>

      <div className="barra-herramientas">
        <h3 className="text-sm font-bold">Tests habilitados para esta empresa</h3>
      </div>

      <div className="tarjeta" style={{ padding: "4px 0" }}>
        {tests === null && <div className="text-muted text-sm px-5 py-10 text-center">Cargando…</div>}
        {tests?.length > 0 && (
          <table className="tabla-panel">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Test</th>
                <th>Estado</th>
                <th style={{ paddingRight: 20, textAlign: "right" }}>Habilitado</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t) => (
                <tr key={t.slug}>
                  <td style={{ paddingLeft: 20 }}>
                    <b className="text-sm block">{t.nombre}</b>
                    <span className="text-xs text-muted">{t.slug}</span>
                  </td>
                  <td>
                    {!t.disponible ? (
                      <span className="pastilla apagado">No disponible aún</span>
                    ) : t.habilitado ? (
                      <span className="pastilla ok">Habilitado</span>
                    ) : (
                      <span className="pastilla apagado">Deshabilitado</span>
                    )}
                  </td>
                  <td style={{ paddingRight: 20, textAlign: "right" }}>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(t.habilitado)}
                        disabled={!t.disponible || cambiando === t.slug}
                        onChange={(ev) => onToggle(t.slug, ev.target.checked)}
                        className="w-4 h-4"
                        style={{ accentColor: "var(--brand-acento)" }}
                      />
                    </label>
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
