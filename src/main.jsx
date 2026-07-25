import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import { PersonaAuthProvider } from "./auth/PersonaAuthProvider.jsx";
import { EvaluadoAuthProvider } from "./auth/EvaluadoAuthProvider.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css";
import { ThemeProvider } from "./theme/ThemeProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <PersonaAuthProvider>
              <EvaluadoAuthProvider>
                <App />
              </EvaluadoAuthProvider>
            </PersonaAuthProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
