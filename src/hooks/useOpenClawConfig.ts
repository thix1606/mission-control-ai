// ============================================================
// HOOK — CONFIGURAÇÃO DO OPENCLAW (persistida em localStorage)
// ============================================================

import { useState, useCallback } from 'react';
import type { OpenClawConfig } from '../types';

const STORAGE_KEY = 'openclaw_config';

function loadConfig(): OpenClawConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { baseUrl: 'http://127.0.0.1:18789', token: '' };
}

export function useOpenClawConfig() {
  const [config, setConfigState] = useState<OpenClawConfig>(loadConfig);

  const saveConfig = useCallback((next: OpenClawConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setConfigState(next);
  }, []);

  return { config, saveConfig };
}
