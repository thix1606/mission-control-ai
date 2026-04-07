import { useState, useEffect } from 'react';
import type { OpenClawConfig } from '../types';
import { fetchTelemetry, type TelemetryData } from '../services/openclawWs';
export type { TelemetryData };

interface UseTelemetryDataReturn {
  data: TelemetryData | null;
  loading: boolean;
  error: string | null;
}

export function useTelemetryData(config: OpenClawConfig): UseTelemetryDataReturn {
  const [data, setData]       = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!config.baseUrl) return;
    setLoading(true);
    setError(null);
    fetchTelemetry(config)
      .then(setData)
      .catch((err: any) => setError(err?.message ?? 'Erro ao buscar telemetria.'))
      .finally(() => setLoading(false));
  }, [config.baseUrl, config.token]);

  return { data, loading, error };
}
