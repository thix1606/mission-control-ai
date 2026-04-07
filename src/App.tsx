// ============================================================
// APP — ROTEAMENTO E LAYOUT PRINCIPAL
// ============================================================

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { StatusPage } from './pages/StatusPage';
import { OrchestrationPage } from './pages/OrchestrationPage';
import { TelemetryPage } from './pages/TelemetryPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-950 text-gray-100">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<StatusPage />} />
            <Route path="/orchestration" element={<OrchestrationPage />} />
            <Route path="/telemetry" element={<TelemetryPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
