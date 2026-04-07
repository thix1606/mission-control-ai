// ============================================================
// TELA 2 — ORQUESTRAÇÃO (KANBAN DE TAREFAS)
// ============================================================
// Dados vêm de: src/data/mockTasks.ts
// Para conectar ao backend, substitua a importação mock por
// chamadas fetch/axios: GET /api/v1/tasks
// ============================================================

import { Kanban } from 'lucide-react';
import { mockTasks } from '../data/mockTasks';
import { KanbanCard } from '../components/KanbanCard';
import { PageHeader } from '../components/PageHeader';
import type { Task, TaskStatus } from '../types';

const COLUMNS: { status: TaskStatus; label: string; color: string; borderColor: string }[] = [
  {
    status: 'queue',
    label: 'Fila de Espera',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
  },
  {
    status: 'processing',
    label: 'Em Processamento',
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
  },
  {
    status: 'done',
    label: 'Concluído',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
  },
  {
    status: 'failed',
    label: 'Falha',
    color: 'text-red-400',
    borderColor: 'border-red-500/30',
  },
];

function getTasksByStatus(status: TaskStatus): Task[] {
  return mockTasks.filter((t) => t.status === status);
}

export function OrchestrationPage() {
  return (
    <div className="p-8">
      <PageHeader
        title="Orquestração"
        subtitle="Kanban de tarefas distribuídas entre os agentes"
        icon={<Kanban className="w-6 h-6" />}
      />

      {/* Resumo de totais */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {COLUMNS.map((col) => {
          const count = getTasksByStatus(col.status).length;
          return (
            <div
              key={col.status}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 border ${col.borderColor}`}
            >
              <span className={`text-lg font-bold ${col.color}`}>{count}</span>
              <span className="text-xs text-gray-400">{col.label}</span>
            </div>
          );
        })}
      </div>

      {/* Colunas do Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const tasks = getTasksByStatus(col.status);
          return (
            <div key={col.status} className="flex flex-col">
              {/* Header da coluna */}
              <div
                className={`flex items-center justify-between px-3 py-2 mb-3 rounded-lg bg-gray-900 border ${col.borderColor}`}
              >
                <h3 className={`text-sm font-semibold ${col.color}`}>{col.label}</h3>
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                  {tasks.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 flex-1">
                {tasks.length === 0 ? (
                  <div className="flex items-center justify-center h-20 border border-dashed border-gray-800 rounded-lg">
                    <p className="text-xs text-gray-600">Nenhuma tarefa</p>
                  </div>
                ) : (
                  tasks.map((task) => <KanbanCard key={task.id} task={task} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
