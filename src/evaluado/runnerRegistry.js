import { lazy } from "react";

const TestRunner = lazy(() => import("./runners/TestRunner"));
const DominoRunner = lazy(() => import("./runners/DominoRunner"));
const KuderRunner = lazy(() => import("./runners/KuderRunner"));
const StaiRunner = lazy(() => import("./runners/StaiRunner"));
const ToulouseRunner = lazy(() => import("./runners/ToulouseRunner"));
const WaisRunner = lazy(() => import("./runners/WaisRunner"));
const DiscRunner = lazy(() => import("./runners/DiscRunner"));

export const TESTS_RENDIBLES = new Set([
  "big-five",
  "chaside",
  "dnla-percepcion-personal",
  "baron-eqi",
  "ipp-r",
  "gds-15",
  "domino-48",
  "kuder",
  "stai",
  "dnla-leadership",
  "toulouse-pieron",
  "wais-iv",
  "disc",
  "eneagrama",
  "cad",
]);

export function obtenerRunner(slug) {
  if (slug === "domino-48") return DominoRunner;
  if (slug === "kuder") return KuderRunner;
  if (slug === "stai") return StaiRunner;
  if (slug === "toulouse-pieron") return ToulouseRunner;
  if (slug === "wais-iv") return WaisRunner;
  if (slug === "disc") return DiscRunner;
  return TestRunner;
}
