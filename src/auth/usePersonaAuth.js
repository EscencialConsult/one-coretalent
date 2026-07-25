import { useContext } from "react";
import { PersonaAuthContext } from "./PersonaAuthContext";

export function usePersonaAuth() {
  const context = useContext(PersonaAuthContext);
  if (!context) throw new Error("usePersonaAuth() debe usarse dentro de <PersonaAuthProvider>");
  return context;
}
