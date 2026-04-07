// ============================================================
// COMPONENTE — SIDEBAR (MENU LATERAL)
// ============================================================
// Para adicionar novos itens ao menu, edite o array NAV_ITEMS.
// Cada item precisa de: label, path e icon (lucide-react).
// ============================================================

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Kanban,
  Activity,
  Bot,
  ChevronRight,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { useSyncStatus } from '../context/SyncStatusContext';

const NAV_ITEMS = [
  {
    label: 'Status',
    path: '/',
    icon: LayoutDashboard,
    description: 'Agentes e Canais',
  },
  {
    label: 'Orquestração',
    path: '/orchestration',
    icon: Kanban,
    description: 'Kanban de Tarefas',
  },
  {
    label: 'Telemetria',
    path: '/telemetry',
    icon: Activity,
    description: 'Métricas e Clima',
  },
];

export function Sidebar() {
  const { refreshing, lastSync } = useSyncStatus();

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-gray-900 border-r border-gray-800 shrink-0">
      {/* Logo / Título */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-600">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">Mission Control</p>
          <p className="text-xs text-gray-500">AI Orchestration</p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Painéis
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.label}</p>
                <p className="text-xs text-gray-500 truncate group-hover:text-gray-400">
                  {item.description}
                </p>
              </div>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          );
        })}

        {/* Configurações — separado no final */}
        <div className="pt-4 mt-4 border-t border-gray-800">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Settings className="w-4 h-4 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">Configurações</p>
              <p className="text-xs text-gray-500 truncate group-hover:text-gray-400">
                OpenClaw & Integrações
              </p>
            </div>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        </div>
      </nav>

      {/* Indicador de sincronização */}
      <div className="px-6 py-3 border-t border-gray-800/60">
        {refreshing ? (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
            <span>Sincronizando...</span>
          </div>
        ) : lastSync ? (
          <p className="text-xs text-gray-700">
            Atualizado às {lastSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        ) : null}
      </div>

      {/* Rodapé */}
      <div className="px-6 py-4 border-t border-gray-800">
        <p className="text-xs text-gray-600">Mission Control v1.0 <span className="font-mono text-gray-700">{__APP_COMMIT__}</span></p>
        <p className="text-xs text-gray-700">by Thiago Santos</p>
      </div>
    </aside>
  );
}
