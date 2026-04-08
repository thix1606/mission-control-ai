// ============================================================
// HOOK — Tarefas Agendadas (system crontab + OpenClaw crons)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import type { SystemCron, OpenClawCron, OpenClawConfig } from '../types';
import { fetchOpenClawCrons } from '../services/openclawWs';

async function fetchSystemCrons(config: OpenClawConfig): Promise<SystemCron[]> {
  const url = config.tasksApiUrl ?? window.location.origin;
  const res = await fetch(`${url}/api/crons`, {
    headers: { Authorization: `Bearer ${config.token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar crontab`);
  const data = await res.json();
  return data.crons ?? [];
}

async function saveSystemCrons(config: OpenClawConfig, crons: SystemCron[]): Promise<SystemCron[]> {
  const url = config.tasksApiUrl ?? window.location.origin;
  const res = await fetch(`${url}/api/crons`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.token}` },
    body: JSON.stringify({ crons }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ao salvar crontab`);
  const data = await res.json();
  return data.crons ?? [];
}

export interface UseScheduledTasksReturn {
  systemCrons: SystemCron[];
  openClawCrons: OpenClawCron[];
  loading: boolean;
  systemError: string | null;
  openClawError: string | null;
  refresh: () => void;
  toggleSystemCron: (id: string, enabled: boolean) => Promise<void>;
  updateSystemCron: (id: string, schedule: string) => Promise<void>;
}

export function useScheduledTasks(config: OpenClawConfig): UseScheduledTasksReturn {
  const [systemCrons, setSystemCrons]   = useState<SystemCron[]>([]);
  const [openClawCrons, setOpenClaw]    = useState<OpenClawCron[]>([]);
  const [loading, setLoading]           = useState(false);
  const [systemError, setSystemError]   = useState<string | null>(null);
  const [openClawError, setOpenClawError] = useState<string | null>(null);
  const [tick, setTick]                 = useState(0);

  useEffect(() => {
    if (!config.baseUrl) return;
    setLoading(true);

    Promise.allSettled([
      fetchSystemCrons(config),
      fetchOpenClawCrons(config),
    ]).then(([sys, oc]) => {
      if (sys.status === 'fulfilled') { setSystemCrons(sys.value); setSystemError(null); }
      else setSystemError(sys.reason?.message ?? 'Erro ao buscar crontab do sistema.');
      if (oc.status  === 'fulfilled') { setOpenClaw(oc.value);    setOpenClawError(null); }
      else setOpenClawError(oc.reason?.message ?? 'Erro ao buscar crons do OpenClaw.');
    }).finally(() => setLoading(false));
  }, [config.baseUrl, config.token, config.tasksApiUrl, tick]);

  // Polling a cada 30s
  useEffect(() => {
    if (!config.baseUrl) return;
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, [config.baseUrl, config.token]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const toggleSystemCron = useCallback(async (id: string, enabled: boolean) => {
    const updated = systemCrons.map((c) => c.id === id ? { ...c, enabled } : c);
    const saved = await saveSystemCrons(config, updated);
    setSystemCrons(saved);
  }, [systemCrons, config]);

  const updateSystemCron = useCallback(async (id: string, schedule: string) => {
    const updated = systemCrons.map((c) => c.id === id ? { ...c, schedule } : c);
    const saved = await saveSystemCrons(config, updated);
    setSystemCrons(saved);
  }, [systemCrons, config]);

  return {
    systemCrons, openClawCrons, loading,
    systemError, openClawError,
    refresh, toggleSystemCron, updateSystemCron,
  };
}
