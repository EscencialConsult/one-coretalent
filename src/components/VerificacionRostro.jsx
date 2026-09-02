import { useEffect, useRef, useState } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import Icon from "./Icon";

const MEDIAPIPE_VERSION = "0.10.35";
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const MODELO_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";
const DETECTOR_OPTIONS = {
  baseOptions: { modelAssetPath: MODELO_URL },
  runningMode: "VIDEO",
  minDetectionConfidence: 0.5,
};

export default function VerificacionRostro({ onRostroDetectado }) {
  const videoRef = useRef(null);
  const detectorRef = useRef(null);
  const animFrame = useRef(null);
  const callbackRef = useRef(onRostroDetectado);
  // Arranca "inactivo": la cámara y el modelo de reconocimiento facial (WebGL + WASM, pesados)
  // solo se prenden cuando la persona toca "Habilitar cámara" — no apenas se monta el formulario.
  // Antes arrancaba solo al montar y quedaba corriendo todo el tiempo que la persona estuviera
  // en la página, aunque todavía no hubiera llegado a firmar (hallazgo de rendimiento 2026-09-01).
  const [activadoPorUsuario, setActivadoPorUsuario] = useState(false);
  const [intento, setIntento] = useState(0);
  const [estado, setEstado] = useState("inactivo");
  const [mensaje, setMensaje] = useState("Tocá el botón para habilitar la cámara");

  useEffect(() => {
    callbackRef.current = onRostroDetectado;
  }, [onRostroDetectado]);

  useEffect(() => {
    if (!activadoPorUsuario) return undefined;
    let stream = null;
    let activo = true;
    setEstado("cargando");
    setMensaje("Iniciando cámara…");

    function detectar() {
      if (!detectorRef.current || !videoRef.current || !activo) return;
      const video = videoRef.current;
      if (video.readyState < 2) {
        animFrame.current = requestAnimationFrame(detectar);
        return;
      }

      const resultado = detectorRef.current.detectForVideo(video, performance.now());
      const detectado = Boolean(resultado.detections?.length);
      setEstado(detectado ? "detectado" : "buscando");
      setMensaje(detectado ? "Presencia facial detectada" : "Mostrá tu rostro a la cámara…");
      callbackRef.current?.(detectado);
      animFrame.current = requestAnimationFrame(detectar);
    }

    async function iniciar() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("CAMARA_NO_DISPONIBLE");
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        const detector = await FaceDetector.createFromOptions(vision, DETECTOR_OPTIONS);
        if (!activo) {
          detector.close();
          return;
        }
        detectorRef.current = detector;

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 320, height: 240 },
        });
        if (!activo) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setEstado("buscando");
        setMensaje("Buscando rostro…");
        detectar();
      } catch (error) {
        if (!activo) return;
        callbackRef.current?.(false);
        setEstado("error");
        // Mensajes distintos según la causa real — "no se pudo iniciar" tapaba señales
        // distintas (cámara ocupada por otra app, sin cámara, o el modelo de MediaPipe sin
        // poder bajar de su CDN por una extensión/firewall) bajo un mismo texto genérico,
        // imposible de diagnosticar a distancia (hallazgo 2026-09-02, bloqueaba postularse).
        const mensajes = {
          NotAllowedError: "Permiso de cámara denegado. Habilitá el acceso y volvé a intentar.",
          NotFoundError: "No se encontró ninguna cámara conectada.",
          NotReadableError: "La cámara está siendo usada por otra aplicación o pestaña. Cerrala e intentá de nuevo.",
          OverconstrainedError: "La cámara no admite la configuración pedida.",
        };
        setMensaje(
          mensajes[error.name] ||
            "No se pudo iniciar la verificación (puede ser la conexión, no la cámara). Podés reintentar o continuar sin ella."
        );
      }
    }

    iniciar();
    return () => {
      activo = false;
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
      if (detectorRef.current) detectorRef.current.close();
      if (stream) stream.getTracks().forEach((track) => track.stop());
      callbackRef.current?.(false);
    };
  }, [activadoPorUsuario, intento]);

  const color = estado === "detectado" ? "#2b6f8c" : estado === "error" ? "#c0392b" : "var(--brand-acento)";

  return (
    <div className="border border-linea rounded-chico overflow-hidden" aria-live="polite">
      <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
        {activadoPorUsuario && (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
            aria-label="Vista previa de la cámara"
            style={{ transform: "scaleX(-1)" }}
          />
        )}
        {!activadoPorUsuario ? (
          <button
            type="button"
            onClick={() => setActivadoPorUsuario(true)}
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2 text-white text-xs font-semibold bg-negro/80 hover:bg-negro/90 transition-colors"
          >
            <Icon name="camera" className="w-6 h-6" />
            Habilitar cámara para firmar
          </button>
        ) : (
          <div
            className="absolute bottom-0 inset-x-0 px-3 py-2 flex flex-col gap-2 text-xs font-semibold text-white"
            style={{ background: `${color}dd` }}
          >
            <span className="flex items-center gap-2">
              <Icon name={estado === "detectado" ? "check" : "camera"} className="w-3.5 h-3.5" />
              {mensaje}
            </span>
            {estado === "error" && (
              <span className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIntento((n) => n + 1)}
                  className="underline decoration-dotted"
                >
                  Reintentar
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => {
                    setEstado("detectado");
                    setMensaje("Continuás sin verificación de presencia");
                    callbackRef.current?.(true);
                  }}
                  className="underline decoration-dotted"
                >
                  Continuar sin verificación
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
