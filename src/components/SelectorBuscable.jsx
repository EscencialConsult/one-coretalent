import { useEffect, useRef, useState } from "react";

// Saca los acentos (vía descomposición Unicode) para que buscar "tucuman" encuentre "Tucumán".
function normalizar(texto) {
  return Array.from(String(texto || "").toLocaleLowerCase("es").normalize("NFD"))
    .filter((caracter) => {
      const codigo = caracter.codePointAt(0);
      return codigo < 0x300 || codigo > 0x36f;
    })
    .join("");
}

// Input de texto + lista desplegable filtrable. El valor guardado (onChange) siempre
// es una opción exacta de `opciones`, salvo que el usuario elija "Otro" (si conOtro).
// Evita que se guarden datos escritos a mano con errores de tipeo/variantes.
export default function SelectorBuscable({
  value,
  onChange,
  opciones,
  placeholder = "Escribí para buscar…",
  otroPlaceholder = "Especificá…",
  conOtro = false,
  disabled = false,
  disabledPlaceholder,
  inputClassName = "",
  id,
}) {
  const enLista = opciones.includes(value);
  const [modoOtro, setModoOtro] = useState(Boolean(value) && !enLista);
  const [texto, setTexto] = useState(enLista ? value || "" : "");
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef(null);

  useEffect(() => {
    const enListaActual = opciones.includes(value);
    setModoOtro(Boolean(value) && !enListaActual);
    setTexto(enListaActual ? value || "" : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, opciones.length]);

  useEffect(() => {
    if (!abierto) return undefined;
    const cerrarSiAfuera = (evento) => {
      if (raiz.current && !raiz.current.contains(evento.target)) setAbierto(false);
    };
    document.addEventListener("mousedown", cerrarSiAfuera);
    return () => document.removeEventListener("mousedown", cerrarSiAfuera);
  }, [abierto]);

  const filtro = normalizar(texto);
  const filtradas = (filtro ? opciones.filter((o) => normalizar(o).includes(filtro)) : opciones).slice(0, 200);

  function elegir(opcion) {
    setTexto(opcion);
    setModoOtro(false);
    setAbierto(false);
    onChange(opcion);
  }

  if (modoOtro) {
    return (
      <div className="selector-buscable">
        <input
          id={id}
          type="text"
          className={inputClassName}
          placeholder={otroPlaceholder}
          value={value || ""}
          onChange={(evento) => onChange(evento.target.value)}
          disabled={disabled}
          autoFocus
        />
        <button
          type="button"
          className="selector-buscable-volver"
          onClick={() => {
            setModoOtro(false);
            setTexto("");
            onChange("");
          }}
        >
          Elegir de la lista
        </button>
      </div>
    );
  }

  return (
    <div className="selector-buscable" ref={raiz}>
      <input
        id={id}
        type="text"
        className={inputClassName}
        placeholder={disabled && disabledPlaceholder ? disabledPlaceholder : placeholder}
        value={texto}
        disabled={disabled}
        autoComplete="off"
        onFocus={() => setAbierto(true)}
        onChange={(evento) => {
          setTexto(evento.target.value);
          setAbierto(true);
        }}
        onBlur={() => {
          setTimeout(() => setTexto(enLista ? value || "" : ""), 150);
        }}
      />
      {abierto && !disabled && (
        <div className="selector-buscable-lista">
          {filtradas.map((opcion) => (
            <div key={opcion} className="selector-buscable-opcion" onMouseDown={() => elegir(opcion)}>
              {opcion}
            </div>
          ))}
          {conOtro && (
            <div
              className="selector-buscable-opcion selector-buscable-otro"
              onMouseDown={() => {
                setModoOtro(true);
                setAbierto(false);
                onChange("");
              }}
            >
              + Otro (especificar)
            </div>
          )}
          {!filtradas.length && !conOtro && <div className="selector-buscable-vacio">Sin resultados</div>}
        </div>
      )}
    </div>
  );
}
