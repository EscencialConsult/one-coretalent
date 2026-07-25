import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CLAVES_VALOR = ["puntaje", "puntuacion", "score", "total", "promedio", "percentil", "porcentaje", "puntajeDirecto"];
const CLAVES_NOMBRE = ["nombre", "dimension", "escala", "area", "letra", "label"];

export default function InformeGrafico({ titulo, filas }) {
  const claveValor = CLAVES_VALOR.find((clave) => filas.some((fila) => Number.isFinite(Number(fila[clave]))));
  const claveNombre = CLAVES_NOMBRE.find((clave) => filas.some((fila) => fila[clave] != null));
  if (!claveValor || !claveNombre) return null;
  const datos = filas.map((fila) => ({
    nombre: String(fila[claveNombre]),
    valor: Number(fila[claveValor]),
  }));
  return (
    <figure className="informe-seccion informe-grafico" aria-label={`${titulo}. Gráfico de barras`}>
      <figcaption>{titulo}</figcaption>
      <div aria-hidden="true" className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 12, right: 12, left: 0, bottom: 34 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="nombre" angle={-20} textAnchor="end" interval={0} height={60} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="valor" name="Puntaje informado" fill="var(--informe-acento, #4d248f)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Datos alternativos del gráfico</caption>
        <tbody>{datos.map((d) => <tr key={d.nombre}><th>{d.nombre}</th><td>{d.valor}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
