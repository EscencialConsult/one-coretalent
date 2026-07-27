import { useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { listarCatalogoTestsEmpresa } from "../../api/empresa";
import Icon from "../../components/Icon";

export default function TestsEmpresa() {
  const { token } = useAuth();
  const [catalogo, setCatalogo] = useState(null);

  useEffect(() => {
    listarCatalogoTestsEmpresa(token).then(setCatalogo).catch(() => setCatalogo([]));
  }, [token]);

  if (!catalogo) return <div className="tarjeta p-8"><p className="text-muted text-sm">Cargando…</p></div>;

  const habilitados = catalogo.filter((t) => t.habilitado && t.disponible && t.tomable);
  const noHabilitados = catalogo.filter((t) => !(t.habilitado && t.disponible && t.tomable));

  return (
    <div>
      <section className="tarjeta p-6 mb-6">
        <span className="text-xs uppercase tracking-wider font-extrabold text-muted">Licencia</span>
        <h2 className="text-lg font-extrabold mt-1">Tests habilitados para tu empresa</h2>
        <p className="text-sm text-muted mt-1">
          Estos son los que podés asignar a postulantes o marcar como requeridos al crear una vacante.
          Si necesitás habilitar uno nuevo, escribile a soporte.
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-3 mb-6">
        {habilitados.map((t) => (
          <article key={t.slug} className="rounded-marca border border-linea bg-white p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-chico grid place-items-center flex-none bg-purple-100 text-acento">
              <Icon name="clipboard" className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-sm">{t.nombre}</h3>
              <p className="text-xs text-muted mt-1">{t.slug}</p>
            </div>
            <span className="pastilla ok">Habilitado</span>
          </article>
        ))}
        {habilitados.length === 0 && (
          <p className="text-sm text-muted col-span-2">Todavía no tenés ningún test habilitado. Escribile a soporte para activar tu licencia.</p>
        )}
      </div>

      {noHabilitados.length > 0 && (
        <section className="tarjeta p-6">
          <h3 className="text-sm font-bold mb-4">Resto del catálogo (sin licencia)</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {noHabilitados.map((t) => (
              <article key={t.slug} className="rounded-marca border border-gray-200 bg-gray-50 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-chico grid place-items-center flex-none bg-gray-200 text-gray-500">
                  <Icon name="lock" className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-sm">{t.nombre}</h3>
                  <p className="text-xs text-muted mt-1">{t.slug}</p>
                </div>
                <span className="pastilla apagado">Sin licencia</span>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
