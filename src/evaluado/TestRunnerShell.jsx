import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  finalizarAsignacion,
  guardarRespuestasAsignacion,
  iniciarAsignacion,
  obtenerPreguntasTest,
} from "../api/persona";
import { usePersonaAuth } from "../auth/usePersonaAuth";
import { ErrorState, PageLoader } from "../components/AsyncState";

const DominoRunner = lazy(() => import("./runners/DominoRunner"));
const ToulouseRunner = lazy(() => import("./runners/ToulouseRunner"));

export const TESTS_EXCLUIDOS = new Set([
  "excel-inicial",
  "excel-intermedio",
  "excel-avanzado",
  "dat",
  "dnla-perfil-comercial",
  "ebp",
]);

export default function TestRunnerShell({ evaluacion }) {
  const { token } = usePersonaAuth();
  const navigate = useNavigate();
  const [fase, setFase] = useState("consentimiento");
  const [consentimiento, setConsentimiento] = useState(false);
  const [preguntas, setPreguntas] = useState(null);
  const [respuestas, setRespuestas] = useState({});
  const [indice, setIndice] = useState(0);
  const [error, setError] = useState("");
  const [guardado, setGuardado] = useState("Sin cambios");
  const [enviando, setEnviando] = useState(false);
  const iniciadoRef = useRef(false);
  const finalizadoRef = useRef(false);
  const saveController = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    obtenerPreguntasTest(evaluacion.test_slug, controller.signal)
      .then(setPreguntas)
      .catch((err) => { if (err.code !== "ABORTED") setError(err.detail || err.message); });
    return () => controller.abort();
  }, [evaluacion.test_slug]);

  useEffect(() => {
    if (fase !== "test") return undefined;
    const advertir = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", advertir);
    return () => window.removeEventListener("beforeunload", advertir);
  }, [fase]);

  useEffect(() => {
    if (fase !== "test" || !iniciadoRef.current || Object.keys(respuestas).length === 0) return undefined;
    setGuardado("Guardando…");
    const timeout = setTimeout(async () => {
      saveController.current?.abort();
      saveController.current = new AbortController();
      try {
        await guardarRespuestasAsignacion(
          token,
          evaluacion.id,
          respuestas,
          saveController.current.signal
        );
        setGuardado(`Guardado ${new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`);
      } catch (err) {
        if (err.code !== "ABORTED") setGuardado("No se pudo guardar");
      }
    }, 700);
    return () => clearTimeout(timeout);
  }, [evaluacion.id, fase, respuestas, token]);

  const adaptador = useMemo(() => crearAdaptador(preguntas), [preguntas]);
  if (TESTS_EXCLUIDOS.has(evaluacion.test_slug)) {
    return <ErrorState titulo="Evaluación no habilitada" mensaje="Este test está excluido del portal hasta contar con autorización técnica y psicométrica." onReintentar={() => navigate("/candidato/evaluaciones")} />;
  }
  if (error) return <ErrorState mensaje={error} onReintentar={() => window.location.reload()} />;
  if (!preguntas) return <PageLoader mensaje="Preparando evaluación…" />;

  async function comenzar() {
    if (!consentimiento || iniciadoRef.current) return;
    setEnviando(true);
    try {
      const progreso = await iniciarAsignacion(token, evaluacion.id);
      setRespuestas(progreso.respuestas || {});
      iniciadoRef.current = true;
      setFase("test");
      setGuardado(progreso.progreso_guardado_at ? "Progreso recuperado" : "Sin cambios");
    } catch (err) {
      setError(err.detail || err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function finalizar(respuestasFinales = respuestas) {
    if (finalizadoRef.current) return;
    finalizadoRef.current = true;
    setEnviando(true);
    setError("");
    try {
      await guardarRespuestasAsignacion(token, evaluacion.id, respuestasFinales);
      await finalizarAsignacion(token, evaluacion.id, respuestasFinales);
      setFase("final");
    } catch (err) {
      finalizadoRef.current = false;
      setError(err.detail || err.message);
    } finally {
      setEnviando(false);
    }
  }

  function salir() {
    if (fase === "test" && !window.confirm("Tu progreso está guardado. ¿Querés salir de la evaluación?")) return;
    navigate("/candidato/evaluaciones");
  }

  if (fase === "consentimiento") {
    return <ShellCabecera titulo={evaluacion.test_nombre} onSalir={salir}><section className="max-w-3xl mx-auto tarjeta p-7 sm:p-10"><span className="text-xs font-bold uppercase text-purple-700">Antes de comenzar</span><h1 className="text-2xl font-extrabold mt-2">Consentimiento para la evaluación</h1><div className="mt-5 text-gray-600 space-y-3 text-sm leading-relaxed"><p>Esta evaluación será procesada mediante un algoritmo determinista. La empresa vinculada con tu postulación podrá consultar el resultado.</p><p>Tu progreso se guardará automáticamente. Podés salir y continuar más tarde sin perder las respuestas registradas.</p></div><label className="flex gap-3 mt-6 p-4 bg-purple-50 rounded-xl cursor-pointer"><input type="checkbox" checked={consentimiento} onChange={(e) => setConsentimiento(e.target.checked)} /><span className="text-sm font-semibold">Comprendo el propósito y acepto comenzar esta evaluación.</span></label><button className="btn-primario mt-6" disabled={!consentimiento || enviando} onClick={comenzar}>{enviando ? "Iniciando…" : "Aceptar y comenzar"}</button></section></ShellCabecera>;
  }

  if (fase === "final") {
    return <ShellCabecera titulo={evaluacion.test_nombre}><section className="max-w-2xl mx-auto tarjeta p-10 text-center"><div className="w-16 h-16 rounded-full bg-green-100 text-green-700 grid place-items-center text-3xl mx-auto">✓</div><h1 className="text-2xl font-extrabold mt-5">Evaluación completada</h1><p className="text-gray-500 mt-3">Tus respuestas fueron procesadas y guardadas correctamente.</p><button className="btn-primario mt-7" onClick={() => navigate("/candidato/evaluaciones")}>Volver a mis evaluaciones</button></section></ShellCabecera>;
  }

  if (evaluacion.test_slug === "domino-48" || evaluacion.test_slug === "toulouse-pieron") {
    const Runner = evaluacion.test_slug === "domino-48" ? DominoRunner : ToulouseRunner;
    return <Suspense fallback={<PageLoader mensaje="Cargando runner especializado…" />}><Runner slug={evaluacion.test_slug} empresa={{ razon_social: evaluacion.empresa_nombre, logo_url: evaluacion.empresa_logo_url, color_acento: evaluacion.empresa_color_acento, color_secundario: evaluacion.empresa_color_secundario }} onExit={salir} onSubmit={finalizar} initialAnswers={respuestas} onProgress={setRespuestas} /></Suspense>;
  }

  const total = adaptador.items.length;
  const actual = adaptador.items[indice];
  const respondidas = adaptador.contar(respuestas);
  const completa = adaptador.completa(respuestas);
  return <ShellCabecera titulo={evaluacion.test_nombre} onSalir={salir} estadoGuardado={guardado}><div className="max-w-5xl mx-auto"><div className="tarjeta p-4 sm:p-5 mb-5"><div className="flex justify-between text-sm font-bold"><span>Progreso</span><span>{respondidas}/{total}</span></div><div className="h-2 bg-gray-100 rounded-full mt-3 overflow-hidden"><div className="h-full bg-purple-700 transition-all" style={{ width: `${total ? (respondidas / total) * 100 : 0}%` }} /></div></div><div className="grid lg:grid-cols-[1fr_260px] gap-5"><section className="tarjeta p-6 sm:p-8"><p className="text-xs uppercase text-gray-400 font-bold">Pregunta {indice + 1} de {total}</p><h2 className="text-xl font-extrabold mt-3">{actual.texto}</h2><div className="mt-6">{adaptador.render(actual, respuestas, setRespuestas)}</div>{error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}<div className="flex justify-between gap-3 mt-7"><button className="btn-secundario" disabled={indice === 0} onClick={() => setIndice((x) => Math.max(0, x - 1))}>← Anterior</button>{indice < total - 1 ? <button className="btn-primario" onClick={() => setIndice((x) => Math.min(total - 1, x + 1))}>Siguiente →</button> : <button className="btn-primario" disabled={!completa || enviando} onClick={() => finalizar()}>{enviando ? "Enviando…" : "Finalizar"}</button>}</div></section><aside className="tarjeta p-5 h-fit"><h3 className="font-extrabold text-sm">Navegación</h3><div className="grid grid-cols-5 gap-2 mt-4">{adaptador.items.map((item, i) => <button aria-label={`Ir a pregunta ${i + 1}`} key={item.key} onClick={() => setIndice(i)} className={`h-9 rounded-lg text-xs font-bold ${i === indice ? "bg-purple-800 text-white" : adaptador.respondida(item, respuestas) ? "bg-green-100 text-green-800" : "bg-gray-100"}`}>{i + 1}</button>)}</div></aside></div></div></ShellCabecera>;
}

function ShellCabecera({ titulo, onSalir, estadoGuardado, children }) {
  return <div className="min-h-screen bg-gray-50"><header className="bg-white border-b px-4 sm:px-8 h-16 flex items-center justify-between gap-4"><div><p className="text-xs text-purple-700 font-bold uppercase">ONE · Evaluación</p><h1 className="font-extrabold truncate max-w-[55vw]">{titulo}</h1></div><div className="flex items-center gap-3">{estadoGuardado && <span role="status" className="text-xs text-gray-500">{estadoGuardado}</span>}{onSalir && <button className="btn-secundario" onClick={onSalir}>Salir</button>}</div></header><main className="p-4 sm:p-8">{children}</main></div>;
}

function crearAdaptador(data) {
  if (data?.tipo === "disc") return adaptadorDisc(data);
  if (data?.tipo === "kuder") return adaptadorKuder(data);
  if (data?.tipo === "wais") return adaptadorWais(data);
  return adaptadorSimple(data?.items || [], data?.escala || null);
}

function adaptadorSimple(items, escala) {
  const normalizados = items.map((item) => ({
    key: String(item.id),
    texto: item.text || item.texto || item.question,
    opciones: escala ? Object.entries(
      item.tipo && typeof escala[item.tipo] === "object" ? escala[item.tipo] : escala
    ).map(([value, label]) => ({ value, label })) : (item.options || item.opciones || []).map((label, i) => ({
      value: item.letras?.[i] || String.fromCharCode(97 + i),
      label,
    })),
  }));
  return {
    items: normalizados,
    contar: (r) => normalizados.filter((x) => r[x.key] !== undefined).length,
    completa: (r) => normalizados.every((x) => r[x.key] !== undefined),
    respondida: (x, r) => r[x.key] !== undefined,
    render: (item, r, set) => <div className="space-y-3">{item.opciones.map((o) => <button type="button" key={o.value} onClick={() => set((prev) => ({ ...prev, [item.key]: o.value }))} className={`w-full text-left p-4 rounded-xl border-2 transition ${r[item.key] === o.value ? "border-purple-700 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}>{o.label}</button>)}</div>,
  };
}

function adaptadorDisc(data) {
  const items = data.grupos.map((g) => ({ key: String(g.id), texto: "Elegí la característica que MÁS y la que MENOS te describe.", grupo: g }));
  const valor = (r, tipo, key) => r[tipo]?.[key];
  const elegir = (set, tipo, key, dim) => set((prev) => {
    const otro = tipo === "mas" ? "menos" : "mas";
    return { ...prev, [tipo]: { ...(prev[tipo] || {}), [key]: dim }, [otro]: valor(prev, otro, key) === dim ? { ...(prev[otro] || {}), [key]: undefined } : prev[otro] };
  });
  return { items, contar: (r) => items.filter((x) => valor(r, "mas", x.key) && valor(r, "menos", x.key)).length, completa: (r) => items.every((x) => valor(r, "mas", x.key) && valor(r, "menos", x.key)), respondida: (x, r) => Boolean(valor(r, "mas", x.key) && valor(r, "menos", x.key)), render: (item, r, set) => <div className="grid sm:grid-cols-2 gap-5">{["mas", "menos"].map((tipo) => <fieldset key={tipo}><legend className="font-bold mb-3">{tipo === "mas" ? "MÁS me describe" : "MENOS me describe"}</legend><div className="space-y-2">{["D", "I", "S", "C"].map((d) => <button type="button" key={d} onClick={() => elegir(set, tipo, item.key, d)} className={`w-full text-left p-3 rounded-lg border ${valor(r, tipo, item.key) === d ? "bg-purple-50 border-purple-700" : ""}`}>{item.grupo[d]}</button>)}</div></fieldset>)}</div> };
}

function adaptadorKuder(data) {
  const items = data.triadas.map((t) => ({ key: String(t.n), texto: "Elegí la actividad que MÁS y la que MENOS te gusta.", actividades: t.actividades }));
  const valor = (r, tipo, key) => r[key]?.[tipo];
  const elegir = (set, tipo, key, i) => set((prev) => {
    const otro = tipo === "mas" ? "menos" : "mas";
    return { ...prev, [key]: { ...(prev[key] || {}), [tipo]: i, [otro]: valor(prev, otro, key) === i ? undefined : valor(prev, otro, key) } };
  });
  return { items, contar: (r) => items.filter((x) => valor(r, "mas", x.key) !== undefined && valor(r, "menos", x.key) !== undefined).length, completa: (r) => items.every((x) => valor(r, "mas", x.key) !== undefined && valor(r, "menos", x.key) !== undefined), respondida: (x, r) => valor(r, "mas", x.key) !== undefined && valor(r, "menos", x.key) !== undefined, render: (item, r, set) => <div className="space-y-3">{item.actividades.map((a, i) => <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center border rounded-xl p-3" key={i}><span>{a}</span><button type="button" aria-label={`Más: ${a}`} onClick={() => elegir(set, "mas", item.key, i)} className={`px-3 py-2 rounded ${valor(r, "mas", item.key) === i ? "bg-green-600 text-white" : "bg-gray-100"}`}>MÁS</button><button type="button" aria-label={`Menos: ${a}`} onClick={() => elegir(set, "menos", item.key, i)} className={`px-3 py-2 rounded ${valor(r, "menos", item.key) === i ? "bg-red-600 text-white" : "bg-gray-100"}`}>MENOS</button></div>)}</div> };
}

function adaptadorWais(data) {
  const letras = data.letras || ["a", "b", "c", "d"];
  const items = [...data.parte1.map((x) => ({ ...x, parte: "parte1" })), ...data.parte2.map((x) => ({ ...x, parte: "parte2" }))].map((x) => ({ key: `${x.parte}:${x.id}`, id: String(x.id), parte: x.parte, texto: x.text, opciones: x.options }));
  const valor = (r, x) => r[x.parte]?.[x.id];
  return { items, contar: (r) => items.filter((x) => valor(r, x) !== undefined).length, completa: (r) => items.every((x) => valor(r, x) !== undefined), respondida: (x, r) => valor(r, x) !== undefined, render: (item, r, set) => <div className="space-y-3">{item.opciones.map((o, i) => <button type="button" key={i} onClick={() => set((prev) => ({ ...prev, [item.parte]: { ...(prev[item.parte] || {}), [item.id]: letras[i] } }))} className={`w-full text-left p-4 rounded-xl border-2 ${valor(r, item) === letras[i] ? "border-purple-700 bg-purple-50" : "border-gray-200"}`}>{o}</button>)}</div> };
}
