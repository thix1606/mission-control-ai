// ============================================================
// HOOK — Cotações do dia (lidas de rates.json no workspace)
// ============================================================
// O arquivo é escrito por cron no workspace de cada agente.
// Tenta ler de cada agente até encontrar um rates.json válido.
// ============================================================

import { useState, useEffect } from 'react';
import type { OpenClawConfig } from '../types';
import { listAgentIds, readAgentFile } from '../services/openclawWs';

export interface Rates {
  updatedAt: string;
  USDBRL: number;
  EURBRL: number;
  BTCBRL: number;
  ETHBRL: number;
}

export function useRates(config: OpenClawConfig): { rates: Rates | null; loading: boolean } {
  const [rates, setRates]     = useState<Rates | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!config.baseUrl) return;
    setLoading(true);

    (async () => {
      try {
        const agentIds = await listAgentIds(config);
        for (const agentId of agentIds) {
          const content = await readAgentFile(config, agentId, 'rates.json');
          if (!content) continue;
          try {
            const parsed = JSON.parse(content) as Rates;
            if (parsed.USDBRL) {
              setRates(parsed);
              break;
            }
          } catch { continue; }
        }
      } catch { /* silencioso — BRL simplesmente não aparece */
      } finally { setLoading(false); }
    })();
  }, [config.baseUrl, config.token]);

  return { rates, loading };
}
