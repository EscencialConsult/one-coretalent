import { Component } from "react";
import { ErrorState } from "./AsyncState";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error("Error no controlado en React", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="min-h-screen grid place-items-center px-4">
          <ErrorState
            titulo="La aplicación encontró un problema"
            mensaje="Recargá la página. Si el problema continúa, contactá a soporte."
            onReintentar={() => window.location.reload()}
          />
        </main>
      );
    }
    return this.props.children;
  }
}
