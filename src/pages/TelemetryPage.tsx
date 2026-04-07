// ============================================================
// TELA 3 — TELEMETRIA E MÉTRICAS
// ============================================================
// Dados de modelos vêm de: src/data/mockTelemetry.ts
// Clima: API pública Open-Meteo + Geolocalização do navegador
// Relógio: calculado em tempo real (sem API)
// ============================================================

import { Activity, Clock, Cloud, Cpu } from 'lucide-react';
import { mockAIModels } from '../data/mockTelemetry';
import { useWeather } from '../hooks/useWeather';
import { useClock } from '../hooks/useClock';
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
  OpenAI: 'text-emerald-400',
  Google: 'text-blue-400',
};

export function TelemetryPage() {
  const { weather, loading: weatherLoading, error: weatherError, getDescription, getIcon } = useWeather();
  const { time, date } = useClock();

  const totalCost = mockAIModels.reduce((acc, m) => acc + m.costUSD, 0);
  const totalRequests = mockAIModels.reduce((acc, m) => acc + m.requests, 0);

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

      {/* Resumo de custo total */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Custo Total (mês)</p>
          <p className="text-3xl font-bold text-white">
            ${totalCost.toFixed(2)}
          </p>
          <p className="text-xs text-gray-600 mt-1">USD estimado</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total de Requests</p>
          <p className="text-3xl font-bold text-white">
            {totalRequests.toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-gray-600 mt-1">chamadas à API</p>
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
                <th className="text-left px-4 py-3 w-48">Tokens usados</th>
                <th className="text-right px-4 py-3">Requests</th>
                <th className="text-right px-4 py-3">Custo (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {mockAIModels.map((model) => {
                const providerColor = PROVIDER_COLORS[model.provider] || 'text-gray-400';
                const pct = ((model.tokensUsed / model.tokensLimit) * 100).toFixed(1);
                return (
                  <tr key={model.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-white">{model.name}</td>
                    <td className={`px-4 py-3 font-medium ${providerColor}`}>{model.provider}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-0.5">
                        <span>{(model.tokensUsed / 1_000_000).toFixed(2)}M</span>
                        <span className="text-gray-600">{pct}%</span>
                      </div>
                      <TokenBar used={model.tokensUsed} limit={model.tokensLimit} />
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">{model.requests}</td>
                    <td className="px-4 py-3 text-right font-semibold text-white">
                      ${model.costUSD.toFixed(2)}
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
