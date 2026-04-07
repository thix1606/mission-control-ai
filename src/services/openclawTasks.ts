// ============================================================
// SERVICE — TASKS VIA OPENCLAW agents.files RPC
// ============================================================
// tasks.json é gravado no workspace de cada agente para que
// todos tenham acesso às tarefas no contexto do sistema prompt.
// ============================================================

import type { Task, OpenClawConfig } from '../types';

const TASKS_FILE = 'tasks.json';

// ── Helpers ────────────────────────────────────────────────

function serializeTasks(tasks: Task[]): string {
  return JSON.stringify({ _note: 'Tasks gerenciadas pelo Mission Control.', tasks }, null, 2);
}

function deserializeTasks(content: string): Task[] {
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : (parsed?.tasks ?? []);
  } catch {
    return [];
  }
}

// ── Importa o helper de sessão do serviço WS principal ─────
// Reexportamos openClawSession via uma função wrapper para não
// duplicar a lógica de autenticação.

import { readAgentFile, writeAgentFile, listAgentIds } from './openclawWs';

// ── API pública ────────────────────────────────────────────

export async function fetchTasks(config: OpenClawConfig): Promise<Task[]> {
  try {
    // Lê do workspace do primeiro agente disponível (todos têm o mesmo arquivo)
    const agentIds = await listAgentIds(config);
    if (agentIds.length === 0) return loadFromLocalStorage();

    const content = await readAgentFile(config, agentIds[0], TASKS_FILE);
    if (!content) return loadFromLocalStorage();

    const tasks = deserializeTasks(content);
    saveToLocalStorage(tasks);
    return tasks;
  } catch {
    return loadFromLocalStorage();
  }
}

export async function saveTasks(config: OpenClawConfig, tasks: Task[]): Promise<void> {
  saveToLocalStorage(tasks);
  try {
    const content = serializeTasks(tasks);
    const agentIds = await listAgentIds(config);
    // Grava em todos os agentes (workspace independentes)
    await Promise.all(agentIds.map((id) => writeAgentFile(config, id, TASKS_FILE, content)));
  } catch (err) {
    console.warn('[Tasks] Falha ao persistir no OpenClaw, mantido em localStorage:', err);
  }
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
