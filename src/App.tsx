// ============================================================
// APP — ROTEAMENTO E LAYOUT PRINCIPAL
// ============================================================

import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Menu, Bot } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { TasksApiBanner } from './components/TasksApiBanner';
import { StatusPage } from './pages/StatusPage';
import { AgentsPage } from './pages/AgentsPage';
import { AgentDetailPage } from './pages/AgentDetailPage';
import { OrchestrationPage } from './pages/OrchestrationPage';
import { TelemetryPage } from './pages/TelemetryPage';
import { SettingsPage } from './pages/SettingsPage';
import { ScheduledTasksPage } from './pages/ScheduledTasksPage';
import { SyncStatusProvider } from './context/SyncStatusContext';
import { useOpenClawConfig } from './hooks/useOpenClawConfig';
import { useTasksApiHealth } from './hooks/useTasksApiHealth';

function AppInner() {
  const { config } = useOpenClawConfig();
  const tasksApiStatus = useTasksApiHealth(config);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      {/* Backdrop — mobile only, fecha a sidebar ao clicar fora */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        {/* Barra superior mobile com hambúrguer e logo */}
        <div className="flex items-center gap-3 h-14 px-4 bg-gray-900 border-b border-gray-800 md:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">Mission Control</span>
          </div>
        </div>

        <TasksApiBanner status={tasksApiStatus} apiUrl={config.tasksApiUrl ?? ''} />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<StatusPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/agents/:id" element={<AgentDetailPage />} />
            <Route path="/orchestration" element={<OrchestrationPage />} />
            <Route path="/telemetry" element={<TelemetryPage />} />
            <Route path="/scheduled" element={<ScheduledTasksPage />} />
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
