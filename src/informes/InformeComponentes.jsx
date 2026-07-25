import { lazy, Suspense } from "react";

const InformeGrafico = lazy(() => import("./InformeGrafico"));

const humano = (texto) =>
  String(texto)
    .replaceAll("_", " ")
    .replace(/([a-záéíóú])([A-ZÁÉÍÓÚ])/g, "$1 $2")
    .replace(/^./, (letra) => letra.toUpperCase());

const esInterpretacion = (clave) =>
  /(interpret|descripcion|fortaleza|desarrollo|recomend|profesional|conclusion|observacion)/i.test(clave);
const esBaremo = (clave) => /(percentil|baremo|nivel|rango|clasificacion|categor)/i.test(clave);
const esPuntaje = (clave) => /(puntaje|puntuacion|score|total|promedio|indice|porcentaje|pd$)/i.test(clave);

export function EscalaInforme({ etiqueta, puntaje, baremo, interpretacion }) {
  return (
    <article className="informe-escala">
      <h3>{etiqueta}</h3>
      <div className="informe-tres-columnas">
        <Dato titulo="Puntaje" valor={puntaje} />
        <Dato titulo="Baremo" valor={baremo} />
        <Dato titulo="Interpretación" valor={interpretacion} texto />
      </div>
    </article>
  );
}

function Dato({ titulo, valor, texto = false }) {
  return (
    <div className={texto ? "informe-interpretacion" : ""}>
      <span>{titulo}</span>
      <p>{presentar(valor)}</p>
    </div>
  );
}

export function TablaInforme({ titulo, filas }) {
  const columnas = [...new Set(filas.flatMap((fila) => Object.keys(fila)))].slice(0, 8);
  return (
    <section className="informe-seccion">
      <h2>{titulo}</h2>
      <div className="overflow-x-auto">
        <table className="informe-tabla">
          <thead><tr>{columnas.map((c) => <th key={c}>{humano(c)}</th>)}</tr></thead>
          <tbody>
            {filas.map((fila, indice) => (
              <tr key={fila.id || fila.nombre || indice}>
                {columnas.map((c) => <td key={c}>{presentar(fila[c])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function BloqueResultado({ nombre, valor }) {
  if (Array.isArray(valor)) {
    if (valor.length && valor.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
      return (
        <>
          <Suspense fallback={<div className="informe-grafico-placeholder">Preparando gráfico…</div>}>
            <InformeGrafico titulo={humano(nombre)} filas={valor} />
          </Suspense>
          <TablaInforme titulo={`Detalle de ${humano(nombre).toLowerCase()}`} filas={valor} />
        </>
      );
    }
    return <Dato titulo={humano(nombre)} valor={valor} />;
  }
  if (valor && typeof valor === "object") {
    const entradas = Object.entries(valor);
    const puntaje = entradas.find(([k]) => esPuntaje(k))?.[1];
    const baremo = entradas.find(([k]) => esBaremo(k))?.[1];
    const interpretacion = entradas.find(([k]) => esInterpretacion(k))?.[1];
    if (puntaje !== undefined || baremo !== undefined || interpretacion !== undefined) {
      return (
        <EscalaInforme
          etiqueta={humano(nombre)}
          puntaje={puntaje}
          baremo={baremo}
          interpretacion={interpretacion}
        />
      );
    }
    return (
      <section className="informe-seccion">
        <h2>{humano(nombre)}</h2>
        <div className="informe-datos">
          {entradas.map(([clave, contenido]) => <BloqueResultado key={clave} nombre={clave} valor={contenido} />)}
        </div>
      </section>
    );
  }
  return (
    <Dato
      titulo={`${esPuntaje(nombre) ? "Puntaje · " : esBaremo(nombre) ? "Baremo · " : esInterpretacion(nombre) ? "Interpretación · " : ""}${humano(nombre)}`}
      valor={valor}
      texto={esInterpretacion(nombre)}
    />
  );
}

function presentar(valor) {
  if (valor === null || valor === undefined || valor === "") return "No informado";
  if (Array.isArray(valor)) return valor.map((item) => presentar(item)).join(" · ");
  if (typeof valor === "object") {
    return Object.entries(valor).map(([k, v]) => `${humano(k)}: ${presentar(v)}`).join(" · ");
  }
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  return String(valor);
}
