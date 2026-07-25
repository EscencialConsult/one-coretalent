import { useCallback, useEffect, useState } from "react";

export function useApiResource(loader, dependencies = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async (signal) => {
    setCargando(true);
    setError("");
    try {
      setData(await loader(signal));
    } catch (err) {
      if (err.code !== "ABORTED") setError(err.detail || err.message || "No se pudo cargar la información.");
    } finally {
      if (!signal?.aborted) setCargando(false);
    }
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const controller = new AbortController();
    recargar(controller.signal);
    return () => controller.abort();
  }, [recargar]);

  return { data, error, cargando, recargar, setData };
}
