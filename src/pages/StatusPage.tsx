// ============================================================
// TELA 1 — STATUS (AGENTES E CANAIS)
// ============================================================
// Dados vêm de: src/data/mockAgents.ts e src/data/mockChannels.ts
// Para conectar ao backend, substitua as importações mock por
// chamadas fetch/axios às suas APIs REST.
// ============================================================

import { LayoutDashboard, Bot, Radio } from 'lucide-react';
import { mockAgents } from '../data/mockAgents';
import { mockChannels } from '../data/mockChannels';
import { StatusBadge } from '../components/StatusBadge';
import { PageHeader } from '../components/PageHeader';

// Métricas de resumo calculadas a partir dos dados mockados
const totalOnline = mockAgents.filter((a) => a.status === 'online').length;
const totalIdle = mockAgents.filter((a) => a.status === 'idle').length;
const totalOffline = mockAgents.filter((a) => a.status === 'offline').length;

export function StatusPage() {
  return (
    <div className="p-8">
      <PageHeader
        title="Status"
        subtitle="Monitoramento em tempo real de agentes e canais"
        icon={<LayoutDashboard className="w-6 h-6" />}
      />

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Online</p>
          <p className="text-3xl font-bold text-emerald-400">{totalOnline}</p>
          <p className="text-xs text-gray-500 mt-1">agentes ativos</p>
        </div>
        <div className="bg-gray-900 border border-yellow-500/20 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ocioso</p>
          <p className="text-3xl font-bold text-yellow-400">{totalIdle}</p>
          <p className="text-xs text-gray-500 mt-1">aguardando tarefas</p>
        </div>
        <div className="bg-gray-900 border border-red-500/20 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Offline</p>
          <p className="text-3xl font-bold text-red-400">{totalOffline}</p>
          <p className="text-xs text-gray-500 mt-1">sem resposta</p>
        </div>
      </div>

      {/* Tabela de Agentes */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Agentes de IA
          </h2>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Agente</th>
                <th className="text-left px-4 py-3">Modelo</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Última atividade</th>
                <th className="text-right px-4 py-3">Tarefas concluídas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {mockAgents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{agent.name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{agent.model}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={agent.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{agent.lastSeen}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{agent.tasksCompleted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tabela de Canais */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Radio className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Canais de Comunicação
          </h2>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Canal</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Mensagens processadas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {mockChannels.map((channel) => (
                <tr key={channel.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{channel.name}</td>
                  <td className="px-4 py-3 text-gray-400">{channel.type}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={channel.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">
                    {channel.messagesProcessed.toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
