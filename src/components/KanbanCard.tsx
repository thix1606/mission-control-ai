// ============================================================
// COMPONENTE — CARD DO KANBAN (arrastável, com atribuição e edição)
// ============================================================

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bot, Clock, Trash2, Pencil, X, Check } from 'lucide-react';
import type { Task } from '../types';

const PRIORITY_CONFIG = {
  high:   { label: 'Alta',   classes: 'bg-red-500/10 text-red-400 border-red-500/20' },
  medium: { label: 'Média',  classes: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  low:    { label: 'Baixa',  classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
};

// Colunas onde o card pode ser editado manualmente
const EDITABLE_STATUSES: Task['status'][] = ['queue', 'failed', 'reviewing'];

// Bloqueia o sensor do dnd-kit em elementos interativos
function stopDrag(e: React.PointerEvent) { e.stopPropagation(); }

interface KanbanCardProps {
  task: Task;
  agents: { id: string; name: string }[];
  onAssign: (agentId: string | null, agentName: string | null) => void;
  onDelete: () => void;
  onUpdate?: (patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
}

export function KanbanCard({ task, agents, onAssign, onDelete, onUpdate }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description ?? '');
  const [editPriority, setEditPriority] = useState(task.priority);

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
  const canEdit = EDITABLE_STATUSES.includes(task.status) && !!onUpdate;

  function handleEditOpen(e: React.PointerEvent) {
    stopDrag(e);
    setEditTitle(task.title);
    setEditDesc(task.description ?? '');
    setEditPriority(task.priority);
    setEditing(true);
  }

  function handleEditSave(e: React.PointerEvent) {
    stopDrag(e);
    if (!editTitle.trim()) return;
    onUpdate?.({
      title: editTitle.trim(),
      description: editDesc.trim() || undefined,
      priority: editPriority,
    });
    setEditing(false);
  }

  function handleEditCancel(e: React.PointerEvent) {
    stopDrag(e);
    setEditing(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-2 hover:border-indigo-600/50 transition-colors cursor-grab active:cursor-grabbing"
    >
      {/* Modo edição */}
      {editing ? (
        <div className="space-y-2" onPointerDown={stopDrag}>
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Título da tarefa"
            className="w-full bg-gray-900 border border-indigo-500/60 rounded px-2 py-1 text-sm text-white focus:outline-none"
          />
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            placeholder="Descrição (opcional)"
            rows={2}
            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none resize-none"
          />
          <select
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value as Task['priority'])}
            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none"
          >
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
          <div className="flex gap-1.5">
            <button
              onPointerDown={handleEditSave}
              disabled={!editTitle.trim()}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors"
            >
              <Check className="w-3 h-3" /> Salvar
            </button>
            <button
              onPointerDown={handleEditCancel}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <X className="w-3 h-3" /> Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Header: título + ações */}
          <div className="flex items-start gap-1.5">
            <p className="flex-1 text-sm font-medium text-white leading-snug">{task.title}</p>
            {canEdit && (
              <button
                onPointerDown={handleEditOpen}
                className="shrink-0 text-gray-600 hover:text-indigo-400 transition-colors"
                title="Editar tarefa"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
            <button
              onPointerDown={stopDrag}
              onClick={onDelete}
              className="shrink-0 text-gray-700 hover:text-red-400 transition-colors"
              title="Remover tarefa"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          {/* Descrição */}
          {task.description && (
            <p className="text-xs text-gray-500 leading-snug">{task.description}</p>
          )}

          {/* Atribuição de agente */}
          <div className="flex items-center gap-1.5">
            <Bot className="w-3 h-3 text-gray-600 shrink-0" />
            <select
              value={task.agentId ?? ''}
              onPointerDown={stopDrag}
              onChange={(e) => {
                const agent = agents.find((a) => a.id === e.target.value);
                onAssign(agent?.id ?? null, agent?.name ?? null);
              }}
              className="flex-1 bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">Sem agente</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Prioridade + hora */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${priority.classes}`}>
              {priority.label}
            </span>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Clock className="w-3 h-3" />
              <span>{createdAt}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
