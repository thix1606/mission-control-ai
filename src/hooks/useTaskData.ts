// ============================================================
// HOOK — TASKS DO KANBAN (persistidas via Tasks API HTTP)
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Task, TaskStatus, OpenClawConfig } from '../types';
import { fetchTasks, saveTasks, ConflictError } from '../services/openclawTasks';

interface UseTaskDataReturn {
  tasks: Task[];
  loading: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  moveTask: (taskId: string, status: TaskStatus) => Promise<void>;
  assignAgent: (taskId: string, agentId: string | null, agentName: string | null) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  updateTask: (taskId: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<void>;
}

export function useTaskData(config: OpenClawConfig): UseTaskDataReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const hashRef = useRef<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchTasks(config)
      .then(({ tasks: t, hash }) => {
        setTasks(t);
        hashRef.current = hash;
      })
      .finally(() => setLoading(false));
  }, [config.baseUrl, config.token, config.tasksApiUrl]);

  const persist = useCallback(async (updated: Task[]) => {
    setTasks(updated);
    try {
      const { hash } = await saveTasks(config, updated, hashRef.current);
      hashRef.current = hash;
    } catch (err) {
      if (err instanceof ConflictError) {
        // Conflito: outra sessão alterou as tarefas — recarrega do servidor
        setTasks(err.serverTasks);
        hashRef.current = err.serverHash;
        console.warn('[Tasks] Conflito detectado — recarregado do servidor.');
      }
    }
  }, [config]);

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    await persist([...tasks, newTask]);
  }, [tasks, persist]);

  const moveTask = useCallback(async (taskId: string, status: TaskStatus) => {
    await persist(tasks.map((t) => t.id === taskId ? { ...t, status } : t));
  }, [tasks, persist]);

  const assignAgent = useCallback(async (
    taskId: string,
    agentId: string | null,
    agentName: string | null,
  ) => {
    await persist(tasks.map((t) => t.id === taskId ? { ...t, agentId, agentName } : t));
  }, [tasks, persist]);

  const deleteTask = useCallback(async (taskId: string) => {
    await persist(tasks.filter((t) => t.id !== taskId));
  }, [tasks, persist]);

  const updateTask = useCallback(async (
    taskId: string,
    patch: Partial<Omit<Task, 'id' | 'createdAt'>>,
  ) => {
    await persist(tasks.map((t) => t.id === taskId ? { ...t, ...patch } : t));
  }, [tasks, persist]);

  return { tasks, loading, addTask, moveTask, assignAgent, deleteTask, updateTask };
}
