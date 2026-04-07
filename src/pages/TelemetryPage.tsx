// ============================================================
// TELA 3 — TELEMETRIA E MÉTRICAS
// ============================================================
// Dados de modelos vêm de: src/data/mockTelemetry.ts
// Clima: API pública Open-Meteo + Geolocalização do navegador
// Relógio: calculado em tempo real (sem API)
// ============================================================

import { Activity, AlertTriangle, Clock, Cloud, Cpu, Loader2 } from 'lucide-react';
import { useWeather } from '../hooks/useWeather';
import { useClock } from '../hooks/useClock';
import { useTelemetryData } from '../hooks/useTelemetryData';
import { useOpenClawConfig } from '../hooks/useOpenClawConfig';
import { PageHeader } from '../components/PageHeader';

function TokenBar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min((used / limit) * 100, 100);
  const color =
    pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-indigo-500';
  return (
    <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const PROVIDER_COLORS: Record<string, string> = {
  Anthropic: 'text-orange-400',
  Openai:    'text-emerald-400',
  Google:    'text-blue-400',
  Meta:      'text-indigo-400',
  Mistral:   'text-purple-400',
};

export function TelemetryPage() {
  const { weather, loading: weatherLoading, error: weatherError, getDescription, getIcon } = useWeather();
  const { time, date } = useClock();
  const { config } = useOpenClawConfig();
  const { data, loading: telLoading, error: telError } = useTelemetryData(config);

  const totalCostUSD  = data?.totalCostUSD  ?? 0;
  const totalRequests = data?.totalRequests ?? 0;
  const models        = data?.models        ?? [];

  return (
    <div className="p-8">
      <PageHeader
        title="Telemetria"
        subtitle="Métricas de consumo de IA, relógio e clima"
        icon={<Activity className="w-6 h-6" />}
      />

      {/* Linha superior: Relógio + Clima */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Relógio */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Horário Local</span>
          </div>
          <p className="text-5xl font-mono font-bold text-white tracking-tight">{time}</p>
          <p className="text-sm text-gray-400 mt-2 capitalize">{date}</p>
        </div>

        {/* Clima */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-3">
            <Cloud className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Clima Atual</span>
          </div>
          {weatherLoading && (
            <p className="text-gray-500 text-sm">Obtendo localização...</p>
          )}
          {weatherError && (
            <p className="text-red-400 text-sm">{weatherError}</p>
          )}
          {weather && !weatherLoading && (
            <>
              <p className="text-5xl mb-2">{getIcon(weather.weatherCode)}</p>
              <p className="text-4xl font-bold text-white">{weather.temperature}°C</p>
              <p className="text-sm text-gray-400 mt-1">{getDescription(weather.weatherCode)}</p>
              <p className="text-xs text-gray-600 mt-1">
                {weather.city} · Vento: {weather.windspeed} km/h
              </p>
            </>
          )}
        </div>
      </div>

      {/* Erro de telemetria */}
      {telError && (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Erro ao buscar telemetria do OpenClaw.</p>
            <p className="text-red-400/70 mt-0.5 font-mono text-xs">{telError}</p>
          </div>
        </div>
      )}

      {/* Resumo de custo total */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Custo Total (mês)</p>
          <p className="text-3xl font-bold text-white">
            {telLoading ? <Loader2 className="w-7 h-7 animate-spin text-gray-600" /> : `$${totalCostUSD.toFixed(4)}`}
          </p>
          <p className="text-xs text-gray-600 mt-1">USD · mês atual</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total de Requests</p>
          <p className="text-3xl font-bold text-white">
            {telLoading ? <Loader2 className="w-7 h-7 animate-spin text-gray-600" /> : totalRequests.toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-gray-600 mt-1">chamadas à API · mês atual</p>
        </div>
      </div>

      {/* Tabela de modelos */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Consumo por Modelo
          </h2>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Modelo</th>
                <th className="text-left px-4 py-3">Provider</th>
                <th className="text-left px-4 py-3 w-48">Tokens (entrada + saída)</th>
                <th className="text-right px-4 py-3">Requests</th>
                <th className="text-right px-4 py-3">Custo (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {telLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-600 text-sm">
                    Carregando telemetria...
                  </td>
                </tr>
              )}
              {!telLoading && models.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-600 text-sm">
                    {config.baseUrl ? 'Nenhum dado de consumo disponível.' : 'Configure o OpenClaw para ver telemetria.'}
                  </td>
                </tr>
              )}
              {models.map((model) => {
                const providerColor = PROVIDER_COLORS[model.provider] ?? 'text-gray-400';
                const totalM = (model.tokensTotal / 1_000_000).toFixed(3);
                const inputK  = (model.tokensInput  / 1_000).toFixed(1);
                const outputK = (model.tokensOutput / 1_000).toFixed(1);
                return (
                  <tr key={model.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-white">{model.name}</td>
                    <td className={`px-4 py-3 font-medium ${providerColor}`}>{model.provider}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-0.5">
                        <span>{totalM}M total</span>
                        <span className="text-gray-600">{inputK}K in · {outputK}K out</span>
                      </div>
                      <TokenBar used={model.tokensTotal} limit={Math.max(model.tokensTotal * 1.5, 1)} />
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">{model.requests.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 text-right font-semibold text-white">
                      ${model.costUSD.toFixed(4)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
