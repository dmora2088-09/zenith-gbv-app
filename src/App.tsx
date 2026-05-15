import { Routes, Route } from 'react-router';
import AppLayout from './components/layout/AppLayout';
import Inicio from './pages/Inicio';
import Ingesta from './pages/Ingesta';
import DashboardResumen from './pages/DashboardResumen';
import DiagnosticoDetalle from './pages/DiagnosticoDetalle';
import PlanAccion from './pages/PlanAccion';
import Reportes from './pages/Reportes';
import Metodologia from './pages/Metodologia';

/**
 * ============================================================
 * Zenith GBV — Enrutador principal
 *
 * /                         → Inicio
 * /ingesta                  → Ingesta (Nuevo Analisis)
 * /dashboard                → DashboardResumen (Dashboard Principal)
 * /resultados/diagnostico   → DiagnosticoDetalle (Sala de Rayos X)
 * /resultados/plan-accion   → PlanAccion (Plan Completo)
 *
 * NOTA: ScrollToTop vive dentro de AppLayout.tsx (no aquí),
 * porque necesita el ref del contenedor scrollable real.
 * ============================================================
 */

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/ingesta" element={<Ingesta />} />
        <Route path="/dashboard" element={<DashboardResumen />} />
        <Route path="/resultados/diagnostico" element={<DiagnosticoDetalle />} />
        <Route path="/resultados/plan-accion" element={<PlanAccion />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/metodologia" element={<Metodologia />} />
      </Route>
    </Routes>
  );
}
