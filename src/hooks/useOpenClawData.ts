// ============================================================
// HOOK — DADOS DINÂMICOS DO OPENCLAW (agentes, canais e modelos)
// ============================================================
// Usa WebSocket com protocolo RPC do OpenClaw.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import type { Agent, Channel, ConfiguredModel, OpenClawConfig } from '../types';
import { fetchViaWebSocket, updateAgentModel as updateAgentModelRpc } from '../services/openclawWs';

interface OpenClawData {
  agents: Agent[];
  channels: Channel[];
  configuredModels: ConfiguredModel[];
  loading: boolean;
  error: string | null;
  modelUpdating: string | null; // agentId em processo de atualização
  modelUpdateError: string | null;
  refresh: () => void;
  updateAgentModel: (agentId: string, model: string) => Promise<void>;
}

export function useOpenClawData(config: OpenClawConfig): OpenClawData {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [configuredModels, setConfiguredModels] = useState<ConfiguredModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelUpdating, setModelUpdating] = useState<string | null>(null);
  const [modelUpdateError, setModelUpdateError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!config.baseUrl) return;

    setLoading(true);
    setError(null);

    fetchViaWebSocket(config)
      .then(({ agents, channels, configuredModels }) => {
        setAgents(agents);
        setChannels(channels);
        setConfiguredModels(configuredModels);
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

  const updateAgentModel = useCallback(async (agentId: string, model: string) => {
    setModelUpdating(agentId);
    setModelUpdateError(null);
    try {
      await updateAgentModelRpc(config, agentId, model);
      // Atualiza o agente localmente para refletir imediatamente
      setAgents((prev) =>
        prev.map((a) => a.id === agentId ? { ...a, model } : a)
      );
    } catch (err: any) {
      setModelUpdateError(err?.message ?? 'Erro ao atualizar modelo.');
      throw err;
    } finally {
      setModelUpdating(null);
    }
  }, [config]);

  return {
    agents,
    channels,
    configuredModels,
    loading,
    error,
    modelUpdating,
    modelUpdateError,
    refresh,
    updateAgentModel,
  };
}
