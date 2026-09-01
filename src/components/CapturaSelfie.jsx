import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

export default function CapturaSelfie({
  archivo,
  onCambio,
  titulo = "Tu selfie aparecerá acá",
  ayuda = "Buscá buena luz y mirá de frente a la cámara.",
  altCapturada = "Selfie capturada del representante",
  mensajeListo = "Selfie lista para enviar",
  prefijoArchivo = "selfie",
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!archivo) {
      setPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(archivo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  useEffect(() => () => detenerCamara(), []);

  function detenerCamara() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamaraActiva(false);
  }

  async function iniciarCamara() {
    setIniciando(true);
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("CAMARA_NO_DISPONIBLE");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCamaraActiva(true);
    } catch (err) {
      setError(
        err.name === "NotAllowedError"
          ? "No diste permiso para usar la cámara. Podés habilitarlo en el navegador o subir una foto."
          : "No pudimos iniciar la cámara. Podés continuar subiendo una foto desde tu dispositivo."
      );
      detenerCamara();
    } finally {
      setIniciando(false);
    }
  }

  function capturar() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const maxAncho = 1280;
    const escala = Math.min(1, maxAncho / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * escala);
    canvas.height = Math.round(video.videoHeight * escala);
    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setError("No se pudo capturar la imagen. Intentá nuevamente.");
        return;
      }
      onCambio(new File([blob], `${prefijoArchivo}-${Date.now()}.jpg`, { type: "image/jpeg" }));
      detenerCamara();
      setError("");
    }, "image/jpeg", 0.9);
  }

  function elegirArchivo(event) {
    const seleccionado = event.target.files?.[0] || null;
    if (seleccionado && seleccionado.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar los 5 MB.");
      event.target.value = "";
      return;
    }
    detenerCamara();
    onCambio(seleccionado);
    setError("");
  }

  return (
    <div className="selfie-captura">
      <div className="selfie-visor">
        <video
          ref={videoRef}
          muted
          playsInline
          aria-label="Vista previa en vivo de la cámara frontal"
          className={camaraActiva ? "selfie-video visible" : "selfie-video"}
        />
        {!camaraActiva && preview && <img src={preview} alt={altCapturada} />}
        {!camaraActiva && !preview && (
          <div className="selfie-placeholder">
            <span><Icon name="camera" className="w-7 h-7" /></span>
            <strong>{titulo}</strong>
            <small>{ayuda}</small>
          </div>
        )}
        {camaraActiva && <div className="selfie-guia" aria-hidden="true" />}
      </div>

      <div className="selfie-acciones">
        {camaraActiva ? (
          <>
            <button type="button" className="boton boton-primario" onClick={capturar}>
              <Icon name="camera" className="w-4 h-4" /> Sacar foto
            </button>
            <button type="button" className="boton boton-fantasma" onClick={detenerCamara}>Cancelar</button>
          </>
        ) : (
          <>
            <button type="button" className="boton boton-acento" onClick={iniciarCamara} disabled={iniciando}>
              <Icon name="camera" className="w-4 h-4" />
              {iniciando ? "Iniciando cámara…" : preview ? "Repetir con cámara" : "Usar cámara"}
            </button>
            <label className="boton boton-fantasma selfie-subir">
              Subir foto
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={elegirArchivo} />
            </label>
          </>
        )}
      </div>
      {preview && !camaraActiva && <p className="selfie-ok"><Icon name="check" className="w-4 h-4" /> {mensajeListo}</p>}
      {error && <p className="selfie-error" role="alert">{error}</p>}
      <p className="selfie-privacidad">La cámara se utiliza solamente para capturar esta foto. Se apaga al confirmar, cancelar o salir de la página.</p>
    </div>
  );
}
