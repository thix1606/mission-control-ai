// ============================================================
// APP — ROTEAMENTO E LAYOUT PRINCIPAL
// ============================================================

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TasksApiBanner } from './components/TasksApiBanner';
import { StatusPage } from './pages/StatusPage';
import { OrchestrationPage } from './pages/OrchestrationPage';
import { TelemetryPage } from './pages/TelemetryPage';
import { SettingsPage } from './pages/SettingsPage';
import { SyncStatusProvider } from './context/SyncStatusContext';
import { useOpenClawConfig } from './hooks/useOpenClawConfig';
import { useTasksApiHealth } from './hooks/useTasksApiHealth';

function AppInner() {
  const { config } = useOpenClawConfig();
  const tasksApiStatus = useTasksApiHealth(config);

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TasksApiBanner status={tasksApiStatus} apiUrl={config.tasksApiUrl ?? ''} />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<StatusPage />} />
            <Route path="/orchestration" element={<OrchestrationPage />} />
            <Route path="/telemetry" element={<TelemetryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SyncStatusProvider>
        <AppInner />
      </SyncStatusProvider>
    </BrowserRouter>
  );
}
