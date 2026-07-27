import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import InformeRouter from "./InformeRouter";

// Datos reales de un resultado DISC calculado por el motor (Resultado.datos), no un fixture inventado.
const informeDisc = {
  id: "resultado-1",
  test_slug: "disc",
  test_nombre: "Test DISC Profesional",
  fecha: "2026-07-25T15:04:18Z",
  catalogo_version: "abc1234567890",
  algoritmo_version: "def9876543210",
  audiencia: "persona",
  evaluado: { nombre: "Facundo", apellido: "Lazarte" },
  empresa: { razon_social: "EcoNova", logo_url: null, color_acento: "#4d248f" },
  contexto: null,
  configuracion: {},
  aviso: "No constituye por sí solo un diagnóstico clínico.",
  resultado: {
    masScores: { D: 8, I: 14, S: 5, C: 1 },
    menosScores: { D: 1, I: 7, S: 11, C: 9 },
    netoScores: { D: 7, I: 7, S: -6, C: -8 },
    intensidades: { D: 25, I: 25, S: 21, C: 29 },
    pattern: "ID",
    patron_tipo: "Combinado",
    isBalanced: false,
    profileLabel: "Influyente - Entusiasta y Sociable",
    profileDescription: "Personas extrovertidas, optimistas y persuasivas.",
    fortalezas: ["Excelentes habilidades de comunicación interpersonal"],
    ambienteIdeal: "Espacios colaborativos y sociales.",
    estiloTrabajo: "Colaborativo, creativo y orientado a personas.",
    comunicacion: "Expresiva, entusiasta y persuasiva.",
    resumen: {
      masDI: 22, masSC: 6, menosDI: 8, menosSC: 20,
      masDI_pct: 79, masSC_pct: 21, menosDI_pct: 29, menosSC_pct: 71,
      nivel_masDI: "Alto", nivel_masSC: "Moderado", nivel_menosDI: "Moderado", nivel_menosSC: "Alto",
    },
    estabilidad: {
      parte1: { masDI: 9, masSC: 5, menosDI: 4, menosSC: 10 },
      parte2: { masDI: 13, masSC: 1, menosDI: 4, menosSC: 10 },
      dif_total: 4, nivel: "Muy estable",
      texto: "Tu comportamiento es muy consistente entre situaciones normales y bajo presión.",
    },
    detalle: [],
  },
};

describe("InformeRouter", () => {
  it("usa el informe real de DISC (portada, perfil y barras), no el genérico", () => {
    render(<MemoryRouter><InformeRouter informe={informeDisc} /></MemoryRouter>);
    expect(screen.getByText("Informe de Perfil Conductual · DISC")).toBeInTheDocument();
    expect(screen.getAllByText("Influyente - Entusiasta y Sociable").length).toBeGreaterThan(0);
    expect(screen.getByText(/Excelentes habilidades de comunicación/)).toBeInTheDocument();
  });

  it("bloquea explícitamente los tests de Excel (fuera de alcance)", () => {
    render(
      <MemoryRouter>
        <InformeRouter informe={{ ...informeDisc, test_slug: "excel-inicial" }} />
      </MemoryRouter>
    );
    expect(screen.getByRole("alert")).toHaveTextContent("no está habilitado");
  });

  it("muestra un estado explícito cuando el test no tiene diseño de informe propio", () => {
    render(
      <MemoryRouter>
        <InformeRouter informe={{ ...informeDisc, test_slug: "no-existe" }} />
      </MemoryRouter>
    );
    expect(screen.getByText(/todavía no está disponible/)).toBeInTheDocument();
  });
});
