// ============================================================
// HOOK — CONFIGURAÇÃO DO OPENCLAW (persistida em localStorage)
// ============================================================

import { useState, useCallback } from 'react';
import type { OpenClawConfig } from '../types';

const STORAGE_KEY = 'openclaw_config';

// Usa a mesma origem do app — o nginx faz proxy de /api/tasks → 127.0.0.1:3001
function deriveTasksApiUrl(): string {
  try {
    return window.location.origin;
  } catch {
    return 'http://127.0.0.1:3080';
  }
}

function loadConfig(): OpenClawConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Limpa tasksApiUrls antigas com porta :3001 e re-deriva
      if (!parsed.tasksApiUrl || parsed.tasksApiUrl.endsWith(':3001')) {
        parsed.tasksApiUrl = deriveTasksApiUrl();
      }
      return parsed;
    }
  } catch {}
  return { baseUrl: 'http://127.0.0.1:18789', token: '', tasksApiUrl: deriveTasksApiUrl() };
}

export function useOpenClawConfig() {
  const [config, setConfigState] = useState<OpenClawConfig>(loadConfig);

  const saveConfig = useCallback((next: OpenClawConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setConfigState(next);
  }, []);

  return { config, saveConfig };
}
