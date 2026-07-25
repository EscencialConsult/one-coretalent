import { useContext } from "react";
import { EvaluadoAuthContext } from "./EvaluadoAuthContext";

export function useEvaluadoAuth() {
  const context = useContext(EvaluadoAuthContext);
  if (!context) throw new Error("useEvaluadoAuth() debe usarse dentro de <EvaluadoAuthProvider>");
  return context;
}
