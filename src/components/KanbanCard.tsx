// ============================================================
// COMPONENTE — CARD DO KANBAN (arrastável, com atribuição)
// ============================================================

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bot, Clock, GripVertical, Trash2 } from 'lucide-react';
import type { Task } from '../types';

const PRIORITY_CONFIG = {
  high:   { label: 'Alta',   classes: 'bg-red-500/10 text-red-400 border-red-500/20' },
  medium: { label: 'Média',  classes: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  low:    { label: 'Baixa',  classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
};

interface KanbanCardProps {
  task: Task;
  agents: { id: string; name: string }[];
  onAssign: (agentId: string | null, agentName: string | null) => void;
  onDelete: () => void;
}

export function KanbanCard({ task, agents, onAssign, onDelete }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const priority = PRIORITY_CONFIG[task.priority];
  const createdAt = new Date(task.createdAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-2 hover:border-indigo-600/50 transition-colors"
    >
      {/* Header: grip + título + delete */}
      <div className="flex items-start gap-1.5">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 shrink-0 text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing"
          title="Arrastar"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <p className="flex-1 text-sm font-medium text-white leading-snug">{task.title}</p>
        <button
          onClick={onDelete}
          className="shrink-0 text-gray-700 hover:text-red-400 transition-colors"
          title="Remover tarefa"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Descrição */}
      {task.description && (
        <p className="text-xs text-gray-500 leading-snug pl-5">{task.description}</p>
      )}

      {/* Atribuição de agente */}
      <div className="flex items-center gap-1.5 pl-5">
        <Bot className="w-3 h-3 text-gray-600 shrink-0" />
        <select
          value={task.agentId ?? ''}
          onChange={(e) => {
            const agent = agents.find((a) => a.id === e.target.value);
            onAssign(agent?.id ?? null, agent?.name ?? null);
          }}
          className="flex-1 bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="">Sem agente</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Prioridade + hora */}
      <div className="flex items-center justify-between pl-5">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${priority.classes}`}>
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
