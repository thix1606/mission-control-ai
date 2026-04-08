// ============================================================
// SERVICE — TASKS VIA TASKS API (HTTP REST)
// ============================================================
// Persiste tarefas num servidor HTTP dedicado (tasks-server.mjs).
// Fallback para localStorage quando a API não está disponível.
// ============================================================

import type { Task, OpenClawConfig } from '../types';
import { fetchTasksApi, saveTasksApi, ConflictError } from './tasksApi';

export { ConflictError };

// ── API pública ────────────────────────────────────────────

export async function fetchTasks(
  config: OpenClawConfig,
): Promise<{ tasks: Task[]; hash: string | null }> {
  const apiUrl = config.tasksApiUrl;
  if (!apiUrl) return { tasks: loadFromLocalStorage(), hash: null };

  try {
    const { tasks, hash } = await fetchTasksApi(apiUrl, config.token);
    saveToLocalStorage(tasks);
    return { tasks, hash };
  } catch {
    return { tasks: loadFromLocalStorage(), hash: null };
  }
}

export async function saveTasks(
  config: OpenClawConfig,
  tasks: Task[],
  hash: string | null,
): Promise<{ hash: string | null }> {
  saveToLocalStorage(tasks);
  const apiUrl = config.tasksApiUrl;
  if (!apiUrl) return { hash: null };

  const result = await saveTasksApi(apiUrl, config.token, tasks, hash);
  return { hash: result.hash };
}

// ── Fallback localStorage ──────────────────────────────────

const LS_KEY = 'mc_tasks';

function loadFromLocalStorage(): Task[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToLocalStorage(tasks: Task[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(tasks));
  } catch { /* ignorar */ }
}
