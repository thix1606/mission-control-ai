// ============================================================
// TELA — AGENTES (listagem)
// ============================================================

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronRight, Cpu, Clock, Activity } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { useOpenClawConfig } from '../hooks/useOpenClawConfig';
import { useOpenClawData } from '../hooks/useOpenClawData';
import { useTaskData } from '../hooks/useTaskData';
import type { Agent } from '../types';

function StatusDot({ status }: { status: Agent['status'] }) {
  const classes = {
    online:  'bg-emerald-400 animate-pulse',
    idle:    'bg-yellow-400',
    offline: 'bg-gray-600',
  }[status];
  return <span className={`inline-block w-2 h-2 rounded-full ${classes} shrink-0`} />;
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function AgentsPage() {
  const { config }            = useOpenClawConfig();
  const { agents, loading }   = useOpenClawData(config);
  const { tasks }             = useTaskData(config);

  const taskCounts = useMemo(() => {
    const map: Record<string, { queue: number; processing: number }> = {};
    for (const t of tasks) {
      if (!t.agentId) continue;
      if (!map[t.agentId]) map[t.agentId] = { queue: 0, processing: 0 };
      if (t.status === 'queue')      map[t.agentId].queue++;
      if (t.status === 'processing') map[t.agentId].processing++;
    }
    return map;
  }, [tasks]);

  return (
    <div className="p-8">
      <PageHeader
        title="Agentes"
        subtitle="Visão geral e gerenciamento dos agentes"
        icon={<Users className="w-6 h-6" />}
      />

      {loading && agents.length === 0 && (
        <p className="text-sm text-gray-600 text-center py-16">Carregando agentes...</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const counts = taskCounts[agent.id] ?? { queue: 0, processing: 0 };
          return (
            <Link
              key={agent.id}
              to={`/agents/${agent.id}`}
              className="group bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-indigo-600/50 transition-all"
            >
              {/* Nome + status */}
              <div className="flex items-center gap-2 mb-1">
                <StatusDot status={agent.status} />
                <span className="text-sm font-semibold text-white flex-1 truncate">{agent.name}</span>
                {agent.isDefault && (
                  <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded-full">
                    padrão
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-indigo-400 transition-colors" />
              </div>

              {/* Modelo */}
              <p className="text-xs text-gray-500 font-mono mb-4 pl-4 truncate">{agent.model}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-600 mb-0.5">
                    <Activity className="w-3 h-3" />
                  </div>
                  <p className="text-xs text-gray-500">Heartbeat</p>
                  <p className="text-xs font-medium text-gray-300">{agent.heartbeat ?? '—'}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-600 mb-0.5">
                    <Clock className="w-3 h-3" />
                  </div>
                  <p className="text-xs text-gray-500">Visto</p>
                  <p className="text-xs font-medium text-gray-300 truncate">{agent.lastSeen}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-600 mb-0.5">
                    <Cpu className="w-3 h-3" />
                  </div>
                  <p className="text-xs text-gray-500">Sessões</p>
                  <p className="text-xs font-medium text-gray-300">{fmt(agent.tasksCompleted)}</p>
                </div>
              </div>

              {/* Task chips */}
              <div className="flex gap-2">
                <span className="flex-1 text-center py-1 rounded-lg text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {counts.queue} na fila
                </span>
                <span className="flex-1 text-center py-1 rounded-lg text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  {counts.processing} processando
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
