import { useEffect, useRef, useState } from "react";

/**
 * Firma manuscrita en canvas (mouse + touch). `onCambio(base64PNG | null)` se llama
 * con `null` cuando el trazo se borra. Reemplaza signature_pad + <canvas> del legacy
 * (postulaciones-empresas), reescrito como componente React reutilizable.
 */
export default function FirmaCanvas({ onCambio }) {
  const canvasRef = useRef(null);
  const dibujando = useRef(false);
  const [vacio, setVacio] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a181d";
  }, []);

  function posicion(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  }

  function empezar(e) {
    e.preventDefault();
    dibujando.current = true;
    const { x, y } = posicion(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function mover(e) {
    if (!dibujando.current) return;
    e.preventDefault();
    const { x, y } = posicion(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
    if (vacio) setVacio(false);
  }

  function terminar() {
    if (!dibujando.current) return;
    dibujando.current = false;
    onCambio(canvasRef.current.toDataURL("image/png").split(",")[1]);
  }

  function limpiar() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setVacio(true);
    onCambio(null);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="w-full h-36 bg-white border border-linea rounded-chico touch-none cursor-crosshair"
        onMouseDown={empezar}
        onMouseMove={mover}
        onMouseUp={terminar}
        onMouseLeave={terminar}
        onTouchStart={empezar}
        onTouchMove={mover}
        onTouchEnd={terminar}
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted">{vacio ? "Firmá arriba con el mouse o el dedo" : "Firma capturada"}</span>
        <button type="button" onClick={limpiar} className="text-xs font-semibold text-rosa">
          Borrar
        </button>
      </div>
    </div>
  );
}
