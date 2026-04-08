// ============================================================
// HOOK — CONFIGURAÇÃO DO OPENCLAW (persistida em localStorage)
// ============================================================

import { useState, useCallback } from 'react';
import type { OpenClawConfig } from '../types';

const STORAGE_KEY = 'openclaw_config';

function deriveTasksApiUrl(baseUrl: string): string {
  try {
    const u = new URL(baseUrl);
    return `${u.protocol}//${u.hostname}:3001`;
  } catch {
    return 'http://127.0.0.1:3001';
  }
}

function loadConfig(): OpenClawConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Deriva tasksApiUrl automaticamente se não estiver salvo
      if (!parsed.tasksApiUrl) {
        parsed.tasksApiUrl = deriveTasksApiUrl(parsed.baseUrl ?? 'http://127.0.0.1:18789');
      }
      return parsed;
    }
  } catch {}
  const baseUrl = 'http://127.0.0.1:18789';
  return { baseUrl, token: '', tasksApiUrl: deriveTasksApiUrl(baseUrl) };
}

export function useOpenClawConfig() {
  const [config, setConfigState] = useState<OpenClawConfig>(loadConfig);

  const saveConfig = useCallback((next: OpenClawConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setConfigState(next);
  }, []);

  return { config, saveConfig };
}
