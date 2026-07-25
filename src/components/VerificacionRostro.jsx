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
  const [estado, setEstado] = useState("cargando");
  const [mensaje, setMensaje] = useState("Iniciando cámara…");

  useEffect(() => {
    callbackRef.current = onRostroDetectado;
  }, [onRostroDetectado]);

  useEffect(() => {
    let stream = null;
    let activo = true;

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
        setMensaje(
          error.name === "NotAllowedError"
            ? "Permiso de cámara denegado. Habilitá el acceso y recargá."
            : "No se pudo iniciar la comprobación de presencia."
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
  }, []);

  const color = estado === "detectado" ? "#1b9aa0" : estado === "error" ? "#c0392b" : "var(--brand-acento)";

  return (
    <div className="border border-linea rounded-chico overflow-hidden" aria-live="polite">
      <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          aria-label="Vista previa de la cámara"
          style={{ transform: "scaleX(-1)" }}
        />
        <div
          className="absolute bottom-0 inset-x-0 px-3 py-2 flex items-center gap-2 text-xs font-semibold text-white"
          style={{ background: `${color}dd` }}
        >
          <Icon name={estado === "detectado" ? "check" : "camera"} className="w-3.5 h-3.5" />
          {mensaje}
        </div>
      </div>
    </div>
  );
}
