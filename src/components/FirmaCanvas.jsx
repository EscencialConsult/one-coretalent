import { useEffect, useRef, useState } from "react";
import VerificacionRostro from "./VerificacionRostro";

/**
 * Firma manuscrita en canvas (mouse + touch). `onCambio(base64PNG | null)` se llama
 * con `null` cuando el trazo se borra. Reemplaza signature_pad + <canvas> del legacy
 * (postulaciones-empresas), reescrito como componente React reutilizable.
 *
 * Si `requiereVerificacion` es true, se exige presencia facial antes de firmar.
 * No valida identidad ni constituye una prueba de vida.
 */
export default function FirmaCanvas({ onCambio, requiereVerificacion = false, className = "" }) {
  const canvasRef = useRef(null);
  const dibujando = useRef(false);
  const [vacio, setVacio] = useState(true);
  const [rostroDetectado, setRostroDetectado] = useState(!requiereVerificacion);

  function prepararTrazo() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a181d";
  }

  useEffect(() => {
    const canvas = canvasRef.current;

    // El área de arriba (verificación de rostro por webcam) cambia de tamaño de forma
    // asíncrona cuando el video carga, lo que corre el layout DESPUÉS de montar este
    // canvas. Si el tamaño del lienzo (canvas.width/height) queda fijado con la medida
    // vieja, el trazo se ve chico/distorsionado y el borrado no limpia todo el recuadro
    // visible (CSS estira un bitmap más chico que el área mostrada). Por eso el tamaño
    // se recalcula cada vez que el elemento cambia de tamaño, no solo al montar.
    const ajustarTamaño = () => {
      if (!vacio) return; // no pisar una firma ya dibujada por un reflow tardío
      const ratio = window.devicePixelRatio || 1;
      const ancho = canvas.clientWidth * ratio;
      const alto = canvas.clientHeight * ratio;
      if (canvas.width === ancho && canvas.height === alto) return;
      canvas.width = ancho;
      canvas.height = alto;
      const ctx = canvas.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(ratio, ratio);
      prepararTrazo();
    };

    ajustarTamaño();
    const observer = new ResizeObserver(ajustarTamaño);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [vacio]);

  function posicion(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  }

  function empezar(e) {
    if (!rostroDetectado) return;
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
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // ignora cualquier scale() vigente: limpia el bitmap físico entero
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    setVacio(true);
    onCambio(null);
  }

  return (
    <div>
      {requiereVerificacion && (
        <div className="mb-3">
          <p className="text-xs text-muted mb-2">
            Esta comprobación solo detecta presencia facial para habilitar la firma; no valida tu identidad.
          </p>
          <VerificacionRostro onRostroDetectado={setRostroDetectado} />
        </div>
      )}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Área para dibujar la firma"
        aria-disabled={!rostroDetectado}
        className={`w-full h-36 bg-white border border-linea rounded-chico touch-none ${rostroDetectado ? "cursor-crosshair" : "opacity-50 cursor-not-allowed"} ${className}`}
        onMouseDown={empezar}
        onMouseMove={mover}
        onMouseUp={terminar}
        onMouseLeave={terminar}
        onTouchStart={empezar}
        onTouchMove={mover}
        onTouchEnd={terminar}
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted">
          {!rostroDetectado ? "Mostrá tu rostro para habilitar la firma" : vacio ? "Firmá arriba con el mouse o el dedo" : "Firma capturada"}
        </span>
        <button type="button" onClick={limpiar} className="text-xs font-semibold text-rosa">
          Borrar
        </button>
      </div>
    </div>
  );
}
