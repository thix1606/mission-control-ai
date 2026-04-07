// ============================================================
// HOOK — TASKS DO KANBAN (persistidas via OpenClaw agents.files)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskStatus, OpenClawConfig } from '../types';
import { fetchTasks, saveTasks } from '../services/openclawTasks';

interface UseTaskDataReturn {
  tasks: Task[];
  loading: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  moveTask: (taskId: string, status: TaskStatus) => Promise<void>;
  assignAgent: (taskId: string, agentId: string | null, agentName: string | null) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

export function useTaskData(config: OpenClawConfig): UseTaskDataReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchTasks(config)
      .then(setTasks)
      .finally(() => setLoading(false));
  }, [config.baseUrl, config.token]);

  const persist = useCallback(async (updated: Task[]) => {
    setTasks(updated);
    await saveTasks(config, updated);
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

  return { tasks, loading, addTask, moveTask, assignAgent, deleteTask };
}
