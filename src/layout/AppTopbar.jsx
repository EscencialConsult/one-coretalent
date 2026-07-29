import Icon from "../components/Icon";

/** Shell compartido del topbar (mismo alto, padding y blur en todos los paneles) —
 * el contenido de la derecha/izquierda lo define cada layout vía children. */
export default function AppTopbar({ onAbrirMenu, children }) {
  return (
    <header className="app-topbar">
      <button
        type="button"
        className="app-topbar-menu"
        onClick={onAbrirMenu}
        aria-label="Abrir navegación"
      >
        <Icon name="menu" />
      </button>
      {children}
    </header>
  );
}
