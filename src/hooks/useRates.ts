// ============================================================
// HOOK — Cotações do dia (lidas de rates.json no workspace)
// ============================================================

import { useState, useEffect } from 'react';
import type { OpenClawConfig } from '../types';
import { readAgentFile } from '../services/openclawWs';

export interface Rates {
  updatedAt: string;
  USDBRL: number;
  EURBRL: number;
  BTCBRL: number;
  ETHBRL: number;
}

export function useRates(config: OpenClawConfig): { rates: Rates | null; loading: boolean } {
  const [rates, setRates]   = useState<Rates | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!config.baseUrl) return;
    setLoading(true);
    readAgentFile(config, 'main', 'rates.json')
      .then((content) => {
        if (!content) return;
        const parsed = JSON.parse(content);
        setRates(parsed);
      })
      .catch(() => { /* arquivo pode não existir ainda */ })
      .finally(() => setLoading(false));
  }, [config.baseUrl, config.token]);

  return { rates, loading };
}
