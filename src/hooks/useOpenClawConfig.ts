// ============================================================
// HOOK — CONFIGURAÇÃO DO OPENCLAW (persistida em localStorage)
// ============================================================

import { useState, useCallback } from 'react';
import type { OpenClawConfig } from '../types';

const STORAGE_KEY = 'openclaw_config';

function deriveApiUrl(): string {
  try { return window.location.origin; } catch { return 'https://127.0.0.1:3080'; }
}

function deriveOpenClawUrl(): string {
  return deriveApiUrl() + '/openclaw';
}

function loadConfig(): OpenClawConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.tasksApiUrl || parsed.tasksApiUrl.endsWith(':3001')) {
        parsed.tasksApiUrl = deriveApiUrl();
      }
      if (!parsed.baseUrl || parsed.baseUrl.startsWith('http://127.0.0.1:18789')) {
        parsed.baseUrl = deriveOpenClawUrl();
      }
      return parsed;
    }
  } catch {}
  return { baseUrl: deriveOpenClawUrl(), token: '', tasksApiUrl: deriveApiUrl() };
}

export function useOpenClawConfig() {
  const [config, setConfigState] = useState<OpenClawConfig>(loadConfig);
  const saveConfig = useCallback((next: OpenClawConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setConfigState(next);
  }, []);
  return { config, saveConfig };
}
