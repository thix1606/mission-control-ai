// ============================================================
// COMPONENTE — CARD DO KANBAN
// ============================================================

import type { Task } from '../types';
import { Bot, Clock } from 'lucide-react';

const PRIORITY_CONFIG = {
  high: { label: 'Alta', classes: 'bg-red-500/10 text-red-400 border-red-500/20' },
  medium: { label: 'Média', classes: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  low: { label: 'Baixa', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
};

interface KanbanCardProps {
  task: Task;
}

export function KanbanCard({ task }: KanbanCardProps) {
  const priority = PRIORITY_CONFIG[task.priority];
  const createdAt = new Date(task.createdAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-2 hover:border-indigo-600/50 transition-colors cursor-default">
      <p className="text-sm font-medium text-white leading-snug">{task.title}</p>
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Bot className="w-3 h-3" />
        <span className="truncate">{task.agentName}</span>
      </div>
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${priority.classes}`}
        >
          {priority.label}
        </span>
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Clock className="w-3 h-3" />
          <span>{createdAt}</span>
        </div>
      </div>
    </div>
  );
}
