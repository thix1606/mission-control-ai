// ============================================================
// TELA — DETALHE DO AGENTE (tabs: visão geral, tarefas, config, sessões)
// ============================================================

import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Activity, AlertTriangle, Bot, Check, ChevronRight,
  Clock, Cpu, DollarSign, Hash, LayoutList, RefreshCw,
  Settings, X, Zap,
} from 'lucide-react';
import { useOpenClawConfig } from '../hooks/useOpenClawConfig';
import { useOpenClawData } from '../hooks/useOpenClawData';
import { useTaskData } from '../hooks/useTaskData';
import { useAgentSessions } from '../hooks/useAgentSessions';
import type { Agent, TaskStatus } from '../types';

// ── Helpers ────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function StatusDot({ status }: { status: Agent['status'] }) {
  const cls = { online: 'bg-emerald-400 animate-pulse', idle: 'bg-yellow-400', offline: 'bg-gray-600' }[status];
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${cls}`} />;
}

const STATUS_LABELS: Record<TaskStatus, { label: string; color: string }> = {
  queue:      { label: 'Fila de Espera',   color: 'text-blue-400' },
  processing: { label: 'Em Processamento', color: 'text-yellow-400' },
  reviewing:  { label: 'Em Revisão',       color: 'text-purple-400' },
  done:       { label: 'Concluído',        color: 'text-emerald-400' },
  failed:     { label: 'Falha',            color: 'text-red-400' },
};

const PRIORITY_CLASSES = {
  high:   'bg-red-500/10 text-red-400 border-red-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

type Tab = 'overview' | 'tasks' | 'config' | 'sessions';

const TABS: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: 'overview',  label: 'Visão Geral', icon: Activity },
  { id: 'tasks',     label: 'Tarefas',     icon: LayoutList },
  { id: 'config',    label: 'Configuração', icon: Settings },
  { id: 'sessions',  label: 'Sessões',     icon: Zap },
];

// ── Componente principal ───────────────────────────────────

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { config } = useOpenClawConfig();
  const { agents, configuredModels, modelUpdating, modelUpdateError, updateAgentModel } = useOpenClawData(config);
  const { tasks } = useTaskData(config);
  const agent = agents.find((a) => a.id === id);

  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Sessões (carregadas em background desde o mount)
  const { data: sessionsData, loading: sessionsLoading, error: sessionsError } =
    useAgentSessions(config, id ?? '', agent?.name ?? '');

  // Tarefas deste agente
  const agentTasks = useMemo(() => tasks.filter((t) => t.agentId === id), [tasks, id]);

  // Estado do editor de modelo
  const [editingModel, setEditingModel]   = useState(false);
  const [pendingModel, setPendingModel]   = useState('');
  const [confirming, setConfirming]       = useState(false);

  async function handleConfirmModel() {
    if (!agent) return;
    try {
      await updateAgentModel(agent.id, pendingModel);
      setEditingModel(false);
      setConfirming(false);
    } catch { /* modelUpdateError já captura */ }
  }

  if (!agent && agents.length > 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-64 gap-4">
        <Bot className="w-10 h-10 text-gray-700" />
        <p className="text-gray-500">Agente não encontrado.</p>
        <Link to="/agents" className="text-indigo-400 text-sm hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Voltar para Agentes
        </Link>
      </div>
    );
  }

  if (!agent) return null;

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <Link to="/agents" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 mb-4 transition-colors w-fit">
        <ArrowLeft className="w-3.5 h-3.5" />
        Agentes
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-600/30">
          <Bot className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <StatusDot status={agent.status} />
            <h1 className="text-xl font-bold text-white">{agent.name}</h1>
            {agent.isDefault && (
              <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">padrão</span>
            )}
          </div>
          <p className="text-xs text-gray-500 font-mono mt-0.5">{agent.model}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 mb-6 gap-1">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tabId
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Visão Geral ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'Sessões', value: fmt(sessionsData?.sessionCount ?? agent.tasksCompleted), icon: Zap, color: 'text-indigo-400' },
              { label: 'Custo Total', value: `$${(sessionsData?.totalCost ?? 0).toFixed(4)}`, icon: DollarSign, color: 'text-white' },
              { label: 'Tokens', value: fmt(sessionsData?.totalTokens ?? 0), icon: Cpu, color: 'text-white' },
              { label: 'Na Fila', value: String(agentTasks.filter((t) => t.status === 'queue').length), icon: LayoutList, color: 'text-blue-400' },
              { label: 'Em Revisão', value: String(agentTasks.filter((t) => t.status === 'reviewing').length), icon: RefreshCw, color: 'text-purple-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Info adicional */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
            {[
              { label: 'ID', value: agent.id, mono: true },
              { label: 'Heartbeat', value: agent.heartbeat ?? '—', mono: false },
              { label: 'Última atividade', value: agent.lastSeen, mono: false },
              { label: 'Status', value: agent.status, mono: false },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-gray-500">{label}</span>
                <span className={`text-xs text-gray-300 ${mono ? 'font-mono' : ''}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Tarefas ── */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {agentTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-600 gap-3">
              <LayoutList className="w-8 h-8" />
              <p className="text-sm">Nenhuma tarefa atribuída a este agente.</p>
              <Link to="/orchestration" className="text-indigo-400 text-xs hover:underline flex items-center gap-1">
                Ir para Orquestração <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          )}
          {(['queue', 'processing', 'reviewing', 'done', 'failed'] as TaskStatus[]).map((status) => {
            const group = agentTasks.filter((t) => t.status === status);
            if (group.length === 0) return null;
            const { label, color } = STATUS_LABELS[status];
            return (
              <div key={status}>
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${color}`}>{label} ({group.length})</h3>
                <div className="space-y-2">
                  {group.map((task) => (
                    <div key={task.id} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{task.title}</p>
                        {task.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>}
                        <p className="text-xs text-gray-600 mt-1">{new Date(task.createdAt).toLocaleString('pt-BR')}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${PRIORITY_CLASSES[task.priority]}`}>
                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tab: Configuração ── */}
      {activeTab === 'config' && (
        <div className="space-y-6 max-w-xl">
          {/* Modelo */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> Modelo de IA
            </h3>

            {!editingModel ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-300 font-mono">{agent.model}</p>
                <button
                  onClick={() => { setEditingModel(true); setPendingModel(agent.model); setConfirming(false); }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Alterar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  value={pendingModel}
                  onChange={(e) => { setPendingModel(e.target.value); setConfirming(false); }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {configuredModels.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
                  ))}
                </select>

                {!confirming ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirming(true)}
                      disabled={pendingModel === agent.model}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Confirmar
                    </button>
                    <button
                      onClick={() => { setEditingModel(false); setConfirming(false); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-yellow-400">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Trocar o modelo reiniciará o gateway. Confirmar?
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleConfirmModel}
                        disabled={modelUpdating === agent.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-yellow-600 text-white hover:bg-yellow-500 disabled:opacity-40 transition-colors"
                      >
                        {modelUpdating === agent.id
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : <Check className="w-3.5 h-3.5" />}
                        Sim, trocar
                      </button>
                      <button
                        onClick={() => setConfirming(false)}
                        className="text-xs text-gray-400 hover:text-white px-3 py-1.5 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {modelUpdateError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {modelUpdateError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Info read-only */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
            {[
              { label: 'ID', value: agent.id, icon: Hash },
              { label: 'Heartbeat', value: agent.heartbeat ?? '—', icon: Activity },
              { label: 'Última atividade', value: agent.lastSeen, icon: Clock },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3">
                <Icon className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                <span className="text-xs text-gray-500 flex-1">{label}</span>
                <span className="text-xs text-gray-300 font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Sessões ── */}
      {activeTab === 'sessions' && (
        <div>
          {sessionsLoading && (
            <p className="text-sm text-gray-600 text-center py-12">Carregando sessões...</p>
          )}
          {sessionsError && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              {sessionsError}
            </div>
          )}
          {!sessionsLoading && !sessionsError && sessionsData?.sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-600 gap-3">
              <Zap className="w-8 h-8" />
              <p className="text-sm">Nenhuma sessão encontrada para este agente.</p>
            </div>
          )}
          {!sessionsLoading && sessionsData && sessionsData.sessions.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {/* Totais */}
              <div className="grid grid-cols-3 divide-x divide-gray-800 border-b border-gray-800">
                {[
                  { label: 'Sessões', value: fmt(sessionsData.sessionCount) },
                  { label: 'Tokens totais', value: fmt(sessionsData.totalTokens) },
                  { label: 'Custo total', value: `$${sessionsData.totalCost.toFixed(4)}` },
                ].map(({ label, value }) => (
                  <div key={label} className="px-5 py-4">
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="text-lg font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>

              {/* Lista */}
              <div className="divide-y divide-gray-800 max-h-[480px] overflow-y-auto">
                {sessionsData.sessions.map((s) => (
                  <div key={s.sessionId} className="flex items-center justify-between px-5 py-3 hover:bg-gray-800/40 transition-colors">
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-gray-400 truncate">{s.sessionId || s.name}</p>
                      {s.modelUsage.length > 0 && (
                        <p className="text-xs text-gray-600 mt-0.5">{s.modelUsage[0].model}</p>
                      )}
                    </div>
                    <div className="flex gap-4 shrink-0 text-right">
                      <div>
                        <p className="text-xs text-gray-600">Tokens</p>
                        <p className="text-xs text-gray-300 font-mono">{fmt(s.totalTokens)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Custo</p>
                        <p className="text-xs text-white font-mono">${s.totalCost.toFixed(4)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
