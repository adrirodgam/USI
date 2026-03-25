import { createBrowserRouter } from "react-router-dom";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Customers";
import Piezas from "./pages/Pieces";
import GenerarCOC from "./pages/GenerateCOC";
import Checklists from "./pages/Checklists";
import ComingSoon from "./pages/ComingSoon";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "clientes", Component: Clientes },
      { path: "piezas/:clientId", Component: Piezas },
      { path: "generar-coc/:partNumber", Component: GenerarCOC },
      { path: "generar-coc", Component: GenerarCOC },
      { path: "checklists/:clientId", Component: Checklists },
      { path: "ncr", Component: ComingSoon },
      { path: "auditoria", Component: ComingSoon },
      { path: "analiticas", Component: ComingSoon },
      { path: "trazabilidad", Component: ComingSoon },
      { path: "usuarios", Component: ComingSoon },
      { path: "configuracion", Component: ComingSoon },
    ],
  },
  { path: "/login", Component: Login },
]);