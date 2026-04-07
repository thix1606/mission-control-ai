// ============================================================
// TELA 1 — STATUS (AGENTES E CANAIS)
// ============================================================
// Dados obtidos dinamicamente do OpenClaw via hook useOpenClawData.
// Configure a URL e o token em: Configurações (/settings)
// ============================================================

import { LayoutDashboard, Bot, Radio, RefreshCw, AlertTriangle, Settings, Pencil, Check, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { PageHeader } from '../components/PageHeader';
import { useOpenClawConfig } from '../hooks/useOpenClawConfig';
import { useOpenClawData } from '../hooks/useOpenClawData';

// ── Modelos disponíveis ────────────────────────────────────

const AVAILABLE_MODELS = [
  { group: 'Anthropic', models: [
    { id: 'claude-opus-4-6',           label: 'Claude Opus 4.6' },
    { id: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6' },
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
    { id: 'claude-opus-4-5',           label: 'Claude Opus 4.5' },
  ]},
  { group: 'OpenAI', models: [
    { id: 'gpt-4o',      label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { id: 'o3',          label: 'o3' },
    { id: 'o4-mini',     label: 'o4-mini' },
  ]},
  { group: 'Google', models: [
    { id: 'gemini-2.5-pro',        label: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.0-flash',      label: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
    { id: 'gemini-1.5-pro',        label: 'Gemini 1.5 Pro' },
  ]},
];

const MODEL_OVERRIDES_KEY = 'mc_model_overrides';

function loadOverrides(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(MODEL_OVERRIDES_KEY) ?? '{}'); }
  catch { return {}; }
}

// ── Componente ─────────────────────────────────────────────

export function StatusPage() {
  const { config } = useOpenClawConfig();
  const { agents, channels, loading, error, refresh } = useOpenClawData(config);

  const isConfigured = config.baseUrl && config.token;

  const totalOnline  = agents.filter((a) => a.status === 'online').length;
  const totalIdle    = agents.filter((a) => a.status === 'idle').length;
  const totalOffline = agents.filter((a) => a.status === 'offline').length;

  // ── Model overrides ──────────────────────────────────────
  const [modelOverrides, setModelOverrides] = useState<Record<string, string>>(loadOverrides);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [pendingModel, setPendingModel] = useState<string>('');

  function startEdit(agentId: string, currentModel: string) {
    setEditingModelId(agentId);
    setPendingModel(modelOverrides[agentId] ?? currentModel);
  }

  function cancelEdit() {
    setEditingModelId(null);
    setPendingModel('');
  }

  function confirmEdit(agentId: string) {
    const updated = { ...modelOverrides, [agentId]: pendingModel };
    setModelOverrides(updated);
    localStorage.setItem(MODEL_OVERRIDES_KEY, JSON.stringify(updated));
    setEditingModelId(null);
    setPendingModel('');
  }

  function getEffectiveModel(agentId: string, originalModel: string) {
    return modelOverrides[agentId] ?? originalModel;
  }

  const allModelIds = AVAILABLE_MODELS.flatMap((g) => g.models.map((m) => m.id));

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
              {agents.map((agent) => {
                const effectiveModel = getEffectiveModel(agent.id, agent.model);
                const isOverridden = modelOverrides[agent.id] != null && modelOverrides[agent.id] !== agent.model;

                return (
                  <tr key={agent.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">
                      {agent.name}
                      {agent.isDefault && (
                        <span className="ml-2 text-xs text-indigo-400 font-normal">padrão</span>
                      )}
                    </td>

                    {/* Célula de modelo — editável */}
                    <td className="px-4 py-3">
                      {editingModelId === agent.id ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            autoFocus
                            value={pendingModel}
                            onChange={(e) => setPendingModel(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') confirmEdit(agent.id);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="bg-gray-800 border border-indigo-500/60 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-indigo-400"
                          >
                            {AVAILABLE_MODELS.map((group) => (
                              <optgroup key={group.group} label={group.group}>
                                {group.models.map((m) => (
                                  <option key={m.id} value={m.id}>{m.label}</option>
                                ))}
                              </optgroup>
                            ))}
                            {!allModelIds.includes(pendingModel) && (
                              <option value={pendingModel}>{pendingModel}</option>
                            )}
                          </select>
                          <button
                            onClick={() => confirmEdit(agent.id)}
                            className="p-1 rounded text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                            title="Confirmar"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-700 transition-colors"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(agent.id, agent.model)}
                          className="group flex items-center gap-1.5 text-gray-400 font-mono text-xs hover:text-white transition-colors"
                          title="Clique para alterar o modelo"
                        >
                          <span className={isOverridden ? 'text-indigo-300' : ''}>{effectiveModel}</span>
                          {isOverridden && (
                            <span className="text-indigo-400/60 font-sans text-[10px]" title={`Original: ${agent.model}`}>
                              (editado)
                            </span>
                          )}
                          <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                        </button>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={agent.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {agent.heartbeat ? `a cada ${agent.heartbeat}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{agent.lastSeen}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{agent.tasksCompleted}</td>
                  </tr>
                );
              })}
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
