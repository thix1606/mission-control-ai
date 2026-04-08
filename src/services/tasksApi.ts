// ============================================================
// SERVICE — Cliente HTTP para a Tasks API
// ============================================================

import type { Task } from '../types';

export interface TasksApiResponse {
  tasks: Task[];
  hash: string;
}

export class ConflictError extends Error {
  serverTasks: Task[];
  serverHash: string;

  constructor(tasks: Task[], hash: string) {
    super('Conflito: as tarefas foram alteradas por outra sessão.');
    this.name = 'ConflictError';
    this.serverTasks = tasks;
    this.serverHash = hash;
  }
}

export async function fetchTasksApi(apiUrl: string, token: string): Promise<TasksApiResponse> {
  const res = await fetch(`${apiUrl}/api/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) throw new Error('Token inválido para a Tasks API.');
  if (!res.ok) throw new Error(`Erro ${res.status} ao buscar tarefas.`);

  const data = await res.json();
  return {
    tasks: data.tasks ?? [],
    hash: data.hash ?? res.headers.get('ETag') ?? '',
  };
}

export async function saveTasksApi(
  apiUrl: string,
  token: string,
  tasks: Task[],
  hash: string | null,
): Promise<TasksApiResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  if (hash) headers['If-Match'] = hash;

  const res = await fetch(`${apiUrl}/api/tasks`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ tasks }),
  });

  if (res.status === 409) {
    const data = await res.json();
    throw new ConflictError(data.tasks ?? [], data.hash ?? '');
  }

  if (res.status === 401) throw new Error('Token inválido para a Tasks API.');
  if (!res.ok) throw new Error(`Erro ${res.status} ao salvar tarefas.`);

  const data = await res.json();
  return {
    tasks: data.tasks ?? [],
    hash: data.hash ?? res.headers.get('ETag') ?? '',
  };
}
