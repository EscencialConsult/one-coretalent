import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import ProtectedPersonaRoute from "./auth/ProtectedPersonaRoute";
import { PageLoader } from "./components/AsyncState";

const PublicLayout = lazy(() => import("./layout/PublicLayout"));
const PanelLayout = lazy(() => import("./layout/PanelLayout"));
const Landing = lazy(() => import("./pages/publico/Landing"));
const Busquedas = lazy(() => import("./pages/publico/Busquedas"));
const Postular = lazy(() => import("./pages/publico/Postular"));
const RegistroEmpresa = lazy(() => import("./pages/publico/RegistroEmpresa"));
const RegistroCandidato = lazy(() => import("./pages/publico/RegistroCandidato"));
const Login = lazy(() => import("./pages/Login"));
const LoginCandidato = lazy(() => import("./pages/publico/LoginCandidato"));
const RecuperarPassword = lazy(() => import("./pages/publico/RecuperarPassword"));
const RestablecerPassword = lazy(() => import("./pages/publico/RestablecerPassword"));
const PoliticaPrivacidad = lazy(() => import("./pages/publico/PoliticaPrivacidad"));
const TerminosCondiciones = lazy(() => import("./pages/publico/TerminosCondiciones"));
const Vacantes = lazy(() => import("./pages/empresa/Vacantes"));
const VacanteDetalle = lazy(() => import("./pages/empresa/VacanteDetalle"));
const PostulacionEmpresaDetalle = lazy(() => import("./pages/empresa/PostulacionEmpresaDetalle"));
const Postulantes = lazy(() => import("./pages/empresa/Postulantes"));
const EmpresasPendientes = lazy(() => import("./pages/admin/EmpresasPendientes"));
const Empresas = lazy(() => import("./pages/admin/Empresas"));
const EmpresaTests = lazy(() => import("./pages/admin/EmpresaTests"));
const NoEncontrado = lazy(() => import("./pages/NoEncontrado"));
const PortalEvaluado = lazy(() => import("./pages/evaluado/PortalEvaluado"));
const CandidatoLayout = lazy(() => import("./layout/CandidatoLayout"));
const InicioCandidato = lazy(() => import("./pages/candidato/InicioCandidato"));
const MisPostulaciones = lazy(() => import("./pages/candidato/MisPostulaciones"));
const DetallePostulacion = lazy(() => import("./pages/candidato/DetallePostulacion"));
const EvaluacionesCandidato = lazy(() => import("./pages/candidato/EvaluacionesCandidato"));
const RendirEvaluacion = lazy(() => import("./pages/candidato/RendirEvaluacion"));
const ResultadosCandidato = lazy(() => import("./pages/candidato/ResultadosCandidato"));
const DetalleResultado = lazy(() => import("./pages/candidato/DetalleResultado"));
const InformeCandidato = lazy(() => import("./pages/candidato/InformeCandidato"));
const InformeEmpresa = lazy(() => import("./pages/empresa/InformeEmpresa"));
const PerfilCandidato = lazy(() => import("./pages/candidato/PerfilCandidato"));
const SeguridadCandidato = lazy(() => import("./pages/candidato/SeguridadCandidato"));
const PrivacidadCandidato = lazy(() => import("./pages/candidato/PrivacidadCandidato"));

export default function App() {
  return (
    <Suspense fallback={<PageLoader mensaje="Cargando sección…" />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/busquedas" element={<Busquedas />} />
          <Route path="/postular/:vacanteId" element={<Postular />} />
          <Route path="/registro-empresa" element={<RegistroEmpresa />} />
          <Route path="/registro-candidato" element={<RegistroCandidato />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login-candidato" element={<LoginCandidato />} />
          <Route path="/recuperar-password" element={<RecuperarPassword />} />
          <Route path="/restablecer-password" element={<RestablecerPassword />} />
          <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
          <Route path="/terminos-condiciones" element={<TerminosCondiciones />} />
        </Route>

        <Route path="/evaluado" element={<PortalEvaluado />} />
        <Route path="/acceso/:sub/evaluado" element={<PortalEvaluado />} />

        <Route
          path="/candidato"
          element={
            <ProtectedPersonaRoute>
              <CandidatoLayout />
            </ProtectedPersonaRoute>
          }
        >
          <Route index element={<InicioCandidato />} />
          <Route path="busquedas" element={<Busquedas modoCandidato />} />
          <Route path="postulaciones" element={<MisPostulaciones />} />
          <Route path="postulaciones/:id" element={<DetallePostulacion />} />
          <Route path="evaluaciones" element={<EvaluacionesCandidato />} />
          <Route path="evaluaciones/:id" element={<RendirEvaluacion />} />
          <Route path="resultados" element={<ResultadosCandidato />} />
          <Route path="resultados/:id" element={<DetalleResultado />} />
          <Route path="resultados/:id/informe" element={<InformeCandidato />} />
          <Route path="perfil" element={<PerfilCandidato />} />
          <Route path="seguridad" element={<SeguridadCandidato />} />
          <Route path="privacidad" element={<PrivacidadCandidato />} />
        </Route>

        <Route
          path="/empresa"
          element={
            <ProtectedRoute rol="admin_empresa">
              <PanelLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="vacantes" replace />} />
          <Route path="vacantes" element={<Vacantes />} />
          <Route path="vacantes/:id" element={<VacanteDetalle />} />
          <Route path="vacantes/:vacanteId/postulaciones/:postulacionId" element={<PostulacionEmpresaDetalle />} />
          <Route path="postulantes" element={<Postulantes />} />
          <Route path="informe/:id" element={<InformeEmpresa />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute rol="superadmin">
              <PanelLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="empresas-pendientes" replace />} />
          <Route path="empresas-pendientes" element={<EmpresasPendientes />} />
          <Route path="empresas" element={<Empresas />} />
          <Route path="empresas/:empresaId/tests" element={<EmpresaTests />} />
        </Route>

        <Route path="*" element={<NoEncontrado />} />
      </Routes>
    </Suspense>
  );
}
