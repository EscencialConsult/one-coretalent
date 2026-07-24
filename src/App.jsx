import { Routes, Route } from "react-router-dom";
import PublicLayout from "./layout/PublicLayout";
import PanelLayout from "./layout/PanelLayout";
import ProtectedRoute from "./auth/ProtectedRoute";

import Landing from "./pages/publico/Landing";
import Busquedas from "./pages/publico/Busquedas";
import Postular from "./pages/publico/Postular";
import RegistroEmpresa from "./pages/publico/RegistroEmpresa";
import Login from "./pages/Login";

import Vacantes from "./pages/empresa/Vacantes";
import VacanteDetalle from "./pages/empresa/VacanteDetalle";

import EmpresasPendientes from "./pages/admin/EmpresasPendientes";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/busquedas" element={<Busquedas />} />
        <Route path="/postular/:vacanteId" element={<Postular />} />
        <Route path="/registro-empresa" element={<RegistroEmpresa />} />
        <Route path="/login" element={<Login />} />
      </Route>

      <Route
        path="/empresa"
        element={
          <ProtectedRoute rol="admin_empresa">
            <PanelLayout />
          </ProtectedRoute>
        }
      >
        <Route path="vacantes" element={<Vacantes />} />
        <Route path="vacantes/:id" element={<VacanteDetalle />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute rol="superadmin">
            <PanelLayout />
          </ProtectedRoute>
        }
      >
        <Route path="empresas-pendientes" element={<EmpresasPendientes />} />
      </Route>
    </Routes>
  );
}
