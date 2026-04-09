// ============================================================
// TELA 2 — ORQUESTRAÇÃO (KANBAN DE TAREFAS)
// ============================================================
// Cards arrastáveis entre colunas. Tasks persistidas via
// agents.files.set no workspace de cada agente do OpenClaw.
// ============================================================

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Kanban, Plus, X, Bot } from 'lucide-react';
import { KanbanCard } from '../components/KanbanCard';
import { PageHeader } from '../components/PageHeader';
import { useOpenClawConfig } from '../hooks/useOpenClawConfig';
import { useOpenClawData } from '../hooks/useOpenClawData';
import { useTaskData } from '../hooks/useTaskData';
import type { Task, TaskStatus } from '../types';

// ── Colunas ────────────────────────────────────────────────

const COLUMNS: { status: TaskStatus; label: string; color: string; borderColor: string; bg: string }[] = [
  { status: 'queue',      label: 'Fila de Espera',     color: 'text-blue-400',    borderColor: 'border-blue-500/30',    bg: 'bg-blue-500/5' },
  { status: 'processing', label: 'Em Processamento',   color: 'text-yellow-400',  borderColor: 'border-yellow-500/30',  bg: 'bg-yellow-500/5' },
  { status: 'reviewing',  label: 'Em Revisão',         color: 'text-purple-400',  borderColor: 'border-purple-500/30',  bg: 'bg-purple-500/5' },
  { status: 'done',       label: 'Concluído',          color: 'text-emerald-400', borderColor: 'border-emerald-500/30', bg: 'bg-emerald-500/5' },
  { status: 'failed',     label: 'Falha',              color: 'text-red-400',     borderColor: 'border-red-500/30',     bg: 'bg-red-500/5' },
];

// ── Coluna droppable ───────────────────────────────────────

function DroppableColumn({
  col,
  tasks,
  agents,
  isOver,
  onAssign,
  onDelete,
  onUpdate,
}: {
  col: typeof COLUMNS[number];
  tasks: Task[];
  agents: { id: string; name: string }[];
  isOver: boolean;
  onAssign: (taskId: string, agentId: string | null, agentName: string | null) => void;
  onDelete: (taskId: string) => void;
  onUpdate: (taskId: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
}) {
  const { setNodeRef } = useDroppable({ id: col.status });

  return (
    <div className="flex flex-col min-w-0">
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 mb-3 rounded-lg bg-gray-900 border ${col.borderColor}`}>
        <h3 className={`text-sm font-semibold ${col.color}`}>{col.label}</h3>
        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 flex-1 min-h-20 rounded-lg p-1 transition-colors ${
          isOver ? col.bg + ' ring-1 ring-inset ' + col.borderColor : ''
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-20 border border-dashed border-gray-800 rounded-lg">
              <p className="text-xs text-gray-600">Nenhuma tarefa</p>
            </div>
          )}
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              agents={agents}
              onAssign={(agentId, agentName) => onAssign(task.id, agentId, agentName)}
              onDelete={() => onDelete(task.id)}
              onUpdate={(patch) => onUpdate(task.id, patch)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

// ── Formulário de nova tarefa ──────────────────────────────

interface NewTaskForm {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  agentId: string;
  status: TaskStatus;
}

const EMPTY_FORM: NewTaskForm = {
  title: '',
  description: '',
  priority: 'medium',
  agentId: '',
  status: 'queue',
};

// ── Componente principal ───────────────────────────────────

export function OrchestrationPage() {
  const { config } = useOpenClawConfig();
  const { agents } = useOpenClawData(config);
  const { tasks, loading, addTask, moveTask, assignAgent, deleteTask, updateTask } = useTaskData(config);

  const agentOptions = agents.map((a) => ({ id: a.id, name: a.name }));

  // Drag state
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Resolve o status da coluna a partir de um id (coluna ou card)
  function resolveColumn(id: string | number): TaskStatus | null {
    const idStr = String(id);
    if (COLUMNS.some((c) => c.status === idStr)) return idStr as TaskStatus;
    const task = tasks.find((t) => t.id === idStr);
    return task?.status ?? null;
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    setOverColumn(over ? resolveColumn(over.id) : null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    setOverColumn(null);
    if (!over) return;
    const targetStatus = resolveColumn(over.id);
    if (targetStatus) moveTask(String(active.id), targetStatus);
  }

  // Formulário
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewTaskForm>(EMPTY_FORM);

  // Remove 'reviewing' das opções de criação manual — essa coluna é para uso dos agentes
  const CREATABLE_COLUMNS = COLUMNS.filter((c) => c.status !== 'reviewing');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const agent = agentOptions.find((a) => a.id === form.agentId);
    await addTask({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      priority: form.priority,
      agentId: agent?.id ?? null,
      agentName: agent?.name ?? null,
      status: form.status,
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title="Orquestração"
          subtitle="Kanban de tarefas distribuídas entre os agentes"
          icon={<Kanban className="w-6 h-6" />}
        />
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-colors mt-1"
        >
          <Plus className="w-4 h-4" />
          Nova tarefa
        </button>
      </div>

      {/* Totais */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {COLUMNS.map((col) => {
          const count = tasks.filter((t) => t.status === col.status).length;
          return (
            <div key={col.status} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 border ${col.borderColor}`}>
              <span className={`text-lg font-bold ${col.color}`}>{loading ? '—' : count}</span>
              <span className="text-xs text-gray-400">{col.label}</span>
            </div>
          );
        })}
      </div>

      {/* Kanban */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {COLUMNS.map((col) => (
            <DroppableColumn
              key={col.status}
              col={col}
              tasks={tasks.filter((t) => t.status === col.status)}
              agents={agentOptions}
              isOver={overColumn === col.status}
              onAssign={assignAgent}
              onDelete={deleteTask}
              onUpdate={updateTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="bg-gray-800 border border-indigo-500/60 rounded-lg p-3 shadow-xl opacity-90">
              <p className="text-sm font-medium text-white">{activeTask.title}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Modal: nova tarefa */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Nova tarefa</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Título */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Título *</label>
                <input
                  autoFocus
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Descreva a tarefa..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Descrição (opcional)</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Contexto adicional para o agente..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Prioridade */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Prioridade</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as NewTaskForm['priority'] })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>

                {/* Coluna inicial */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Coluna inicial</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {CREATABLE_COLUMNS.map((c) => (
                      <option key={c.status} value={c.status}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Agente */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  <Bot className="inline w-3 h-3 mr-1" />
                  Agente responsável
                </label>
                <select
                  value={form.agentId}
                  onChange={(e) => setForm({ ...form, agentId: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Sem agente</option>
                  {agentOptions.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!form.title.trim()}
                  className="flex-1 px-4 py-2 rounded-lg text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Criar tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
