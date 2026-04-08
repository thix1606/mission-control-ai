import { useState, useEffect } from 'react';
import type { OpenClawConfig } from '../types';
import { fetchAgentSessions, type AgentSessionData } from '../services/openclawWs';

export function useAgentSessions(
  config: OpenClawConfig,
  agentId: string,
  agentName: string,
): { data: AgentSessionData | null; loading: boolean; error: string | null } {
  const [data, setData]       = useState<AgentSessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!config.baseUrl || !agentId) return;
    setLoading(true);
    setError(null);
    fetchAgentSessions(config, agentId, agentName)
      .then(setData)
      .catch((e: any) => setError(e?.message ?? 'Erro ao buscar sessões.'))
      .finally(() => setLoading(false));
  }, [config.baseUrl, config.token, agentId, agentName]);

  return { data, loading, error };
}
