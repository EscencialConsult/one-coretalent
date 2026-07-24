import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { vacantesPublicas } from "../../api/publico";

export default function Busquedas() {
  const [vacantes, setVacantes] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    vacantesPublicas()
      .then(setVacantes)
      .catch(() => setError("No pudimos cargar las búsquedas. Probá de nuevo en un momento."));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1">Búsquedas activas</h1>
      <p className="text-muted text-sm mb-8">{vacantes?.length ?? "…"} oportunidades disponibles ahora</p>

      {error && <p className="text-rosa font-semibold">{error}</p>}
      {vacantes && vacantes.length === 0 && (
        <div className="tarjeta p-10 text-center text-muted">No hay búsquedas activas en este momento.</div>
      )}

      <div className="grid gap-4">
        {vacantes?.map((v) => (
          <Link key={v.id} to={`/postular/${v.id}`} className="tarjeta p-6 block hover:-translate-y-0.5 transition-transform">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-bold text-lg mb-1">{v.puesto}</h2>
                <p className="text-sm text-muted">
                  {[v.area, v.localidad || v.provincia, v.modalidad].filter(Boolean).join(" · ")}
                </p>
              </div>
              {v.modalidad && <span className="chip">{v.modalidad}</span>}
            </div>
            {v.descripcion && <p className="text-sm text-tinta text-opacity-80 mt-3 line-clamp-2">{v.descripcion}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
