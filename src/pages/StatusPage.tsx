// ============================================================
// TELA 1 — STATUS (AGENTES E CANAIS)
// ============================================================
// Dados obtidos dinamicamente do OpenClaw via hook useOpenClawData.
// Configure a URL e o token em: Configurações (/settings)
// ============================================================

import { LayoutDashboard, Bot, Radio, RefreshCw, AlertTriangle, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { PageHeader } from '../components/PageHeader';
import { useOpenClawConfig } from '../hooks/useOpenClawConfig';
import { useOpenClawData } from '../hooks/useOpenClawData';

export function StatusPage() {
  const { config } = useOpenClawConfig();
  const { agents, channels, loading, error, refresh } = useOpenClawData(config);

  const isConfigured = config.baseUrl && config.token;

  const totalOnline = agents.filter((a) => a.status === 'online').length;
  const totalIdle = agents.filter((a) => a.status === 'idle').length;
  const totalOffline = agents.filter((a) => a.status === 'offline').length;

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title="Status"
          subtitle="Monitoramento em tempo real de agentes e canais"
          icon={<LayoutDashboard className="w-6 h-6" />}
        />
        {isConfigured && (
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-40 transition-colors mt-1"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        )}
      </div>

      {/* Aviso: não configurado */}
      {!isConfigured && (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">OpenClaw não configurado.</p>
            <p className="text-yellow-500/70 mt-0.5">
              Acesse{' '}
              <Link to="/settings" className="underline hover:text-yellow-300">
                Configurações
              </Link>{' '}
              para informar a URL e o token do seu servidor OpenClaw.
            </p>
          </div>
          <Link
            to="/settings"
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 transition-colors text-xs font-medium whitespace-nowrap"
          >
            <Settings className="w-3.5 h-3.5" />
            Configurar
          </Link>
        </div>
      )}

      {/* Aviso: erro de conexão */}
      {error && (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Erro ao buscar dados do OpenClaw.</p>
            <p className="text-red-400/70 mt-0.5 font-mono text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Online</p>
          <p className="text-3xl font-bold text-emerald-400">{loading ? '—' : totalOnline}</p>
          <p className="text-xs text-gray-500 mt-1">agentes ativos</p>
        </div>
        <div className="bg-gray-900 border border-yellow-500/20 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ocioso</p>
          <p className="text-3xl font-bold text-yellow-400">{loading ? '—' : totalIdle}</p>
          <p className="text-xs text-gray-500 mt-1">aguardando tarefas</p>
        </div>
        <div className="bg-gray-900 border border-red-500/20 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Offline</p>
          <p className="text-3xl font-bold text-red-400">{loading ? '—' : totalOffline}</p>
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
                <th className="text-left px-4 py-3">Heartbeat</th>
                <th className="text-left px-4 py-3">Última atividade</th>
                <th className="text-right px-4 py-3">Sessões</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-600 text-sm">
                    Carregando...
                  </td>
                </tr>
              )}
              {!loading && agents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-600 text-sm">
                    {isConfigured ? 'Nenhum agente encontrado.' : 'Configure o OpenClaw para listar agentes.'}
                  </td>
                </tr>
              )}
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">
                    {agent.name}
                    {agent.isDefault && (
                      <span className="ml-2 text-xs text-indigo-400 font-normal">padrão</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{agent.model}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={agent.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {agent.heartbeat ? `a cada ${agent.heartbeat}` : '—'}
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
                <th className="text-left px-4 py-3">Conta</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Agentes</th>
                <th className="text-right px-4 py-3">Última atividade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-600 text-sm">
                    Carregando...
                  </td>
                </tr>
              )}
              {!loading && channels.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-600 text-sm">
                    {isConfigured ? 'Nenhum canal encontrado.' : 'Configure o OpenClaw para listar canais.'}
                  </td>
                </tr>
              )}
              {channels.map((channel) => (
                <tr key={channel.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{channel.name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{channel.account ?? '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={channel.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {channel.agents.length > 0 ? channel.agents.join(', ') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">
                    {channel.lastActivity}
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
