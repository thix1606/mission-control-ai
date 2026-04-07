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
        console.log('[rates] agentIds encontrados:', agentIds);
        for (const agentId of agentIds) {
          console.log(`[rates] tentando agents.files.get { agentId: '${agentId}', path: 'rates.json' }`);
          const content = await readAgentFile(config, agentId, 'rates.json');
          console.log(`[rates] resposta de '${agentId}':`, content);
          if (!content) continue;
          try {
            const parsed = JSON.parse(content) as Rates;
            if (parsed.USDBRL) {
              setRates(parsed);
              break;
            }
          } catch (e) {
            console.warn(`[rates] erro ao parsear JSON de '${agentId}':`, e);
            continue;
          }
        }
      } catch (e) {
        console.error('[rates] erro geral:', e);
      } finally { setLoading(false); }
    })();
  }, [config.baseUrl, config.token]);

  return { rates, loading };
}
