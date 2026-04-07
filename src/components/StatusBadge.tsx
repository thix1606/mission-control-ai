// ============================================================
// COMPONENTE — BADGE DE STATUS (INDICADOR VISUAL)
// ============================================================

import type { AgentStatus, ChannelStatus } from '../types';

type Status = AgentStatus | ChannelStatus;

const CONFIG: Record<Status, { label: string; classes: string; dot: string }> = {
  online: {
    label: 'Online',
    classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-400 animate-pulse',
  },
  idle: {
    label: 'Ocioso',
    classes: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    dot: 'bg-yellow-400',
  },
  offline: {
    label: 'Offline',
    classes: 'bg-red-500/10 text-red-400 border-red-500/20',
    dot: 'bg-red-500',
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const cfg = CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
