// ============================================================
// APP — ROTEAMENTO E LAYOUT PRINCIPAL
// ============================================================

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { useState } from 'react';
import { Menu, Bot } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { config } = useOpenClawConfig();
  const tasksApiStatus = useTasksApiHealth(config);

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden md:ml-64 relative w-full">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">Mission Control</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -mr-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800">
            <Menu className="w-6 h-6" />
          </button>
        </header>
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
