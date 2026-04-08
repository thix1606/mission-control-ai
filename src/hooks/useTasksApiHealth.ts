// ============================================================
// HOOK — Health check da Tasks API
// ============================================================
// Roda uma vez na inicialização do app e verifica se a API
// de persistência de tarefas está acessível.
// ============================================================

import { useState, useEffect } from 'react';
import type { OpenClawConfig } from '../types';

export type TasksApiStatus = 'checking' | 'ok' | 'unreachable' | 'unauthorized' | 'unconfigured';

export function useTasksApiHealth(config: OpenClawConfig): TasksApiStatus {
  const [status, setStatus] = useState<TasksApiStatus>('checking');

  useEffect(() => {
    const url = config.tasksApiUrl;
    if (!url) {
      setStatus('unconfigured');
      return;
    }

    setStatus('checking');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    fetch(`${url}/api/tasks`, {
      headers: { Authorization: `Bearer ${config.token}` },
      signal: controller.signal,
    })
      .then((res) => {
        if (res.status === 401) setStatus('unauthorized');
        else if (res.ok) setStatus('ok');
        else setStatus('unreachable');
      })
      .catch(() => setStatus('unreachable'))
      .finally(() => clearTimeout(timeout));

    return () => { controller.abort(); clearTimeout(timeout); };
  }, [config.tasksApiUrl, config.token]);

  return status;
}
