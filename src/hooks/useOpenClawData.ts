// ============================================================
// HOOK — DADOS DINÂMICOS DO OPENCLAW (agentes e canais)
// ============================================================
// Usa WebSocket com protocolo RPC do OpenClaw.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import type { Agent, Channel, OpenClawConfig } from '../types';
import { fetchViaWebSocket } from '../services/openclawWs';

interface OpenClawData {
  agents: Agent[];
  channels: Channel[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useOpenClawData(config: OpenClawConfig): OpenClawData {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!config.baseUrl) return;

    setLoading(true);
    setError(null);

    fetchViaWebSocket(config)
      .then(({ agents, channels }) => {
        setAgents(agents);
        setChannels(channels);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err?.message ?? 'Erro desconhecido.');
        setLoading(false);
      });
  }, [config.baseUrl, config.token, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  // Polling a cada 15s para atualizar status em tempo real
  useEffect(() => {
    if (!config.baseUrl) return;
    const id = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, [config.baseUrl, config.token]);

  return { agents, channels, loading, error, refresh };
}
