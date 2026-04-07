// ============================================================
// TELA 3 — TELEMETRIA E MÉTRICAS
// ============================================================
// Consumo: usage.cost do OpenClaw (diário, últimos 31 dias)
// Clima: API pública Open-Meteo + Geolocalização do navegador
// Relógio: calculado em tempo real (sem API)
// ============================================================

import { Activity, AlertTriangle, Clock, Cloud, Cpu, TrendingUp } from 'lucide-react';
import { useWeather } from '../hooks/useWeather';
import { useClock } from '../hooks/useClock';
import { useTelemetryData } from '../hooks/useTelemetryData';
import { useOpenClawConfig } from '../hooks/useOpenClawConfig';
import { useRates } from '../hooks/useRates';
import { PageHeader } from '../components/PageHeader';

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function CostBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const color = pct > 80 ? 'bg-red-500' : pct > 40 ? 'bg-yellow-500' : 'bg-indigo-500';
  return (
    <div className="w-full bg-gray-800 rounded-full h-1 mt-1">
      <div className={`h-1 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function TelemetryPage() {
  const { weather, loading: weatherLoading, error: weatherError, getDescription, getIcon } = useWeather();
  const { time, date } = useClock();
  const { config } = useOpenClawConfig();
  const { data, loading: telLoading, error: telError } = useTelemetryData(config);
  const { rates } = useRates(config);

  const usdToBrl = rates?.USDBRL ?? null;

  const totals  = data?.totals;
  const daily   = data?.daily ?? [];
  const maxCost = daily.length > 0 ? Math.max(...daily.map((d) => d.costUSD)) : 1;

  function brl(usd: number) {
    if (!usdToBrl) return null;
    return (usd * usdToBrl).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Telemetria"
        subtitle="Métricas de consumo de IA, relógio e clima"
        icon={<Activity className="w-6 h-6" />}
      />

      {/* Relógio + Clima */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Horário Local</span>
          </div>
          <p className="text-5xl font-mono font-bold text-white tracking-tight">{time}</p>
          <p className="text-sm text-gray-400 mt-2 capitalize">{date}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-3">
            <Cloud className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Clima Atual</span>
          </div>
          {weatherLoading && <p className="text-gray-500 text-sm">Obtendo localização...</p>}
          {weatherError   && <p className="text-red-400 text-sm">{weatherError}</p>}
          {weather && !weatherLoading && (
            <>
              <p className="text-5xl mb-2">{getIcon(weather.weatherCode)}</p>
              <p className="text-4xl font-bold text-white">{weather.temperature}°C</p>
              <p className="text-sm text-gray-400 mt-1">{getDescription(weather.weatherCode)}</p>
              <p className="text-xs text-gray-600 mt-1">{weather.city} · Vento: {weather.windspeed} km/h</p>
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

      {/* Cotações do dia */}
      {rates && (
        <div className="mb-6 p-3 rounded-xl bg-gray-900 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              Cotações · {new Date(rates.updatedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'USD / BRL', value: rates.USDBRL },
              { label: 'EUR / BRL', value: rates.EURBRL },
              { label: 'BTC / BRL', value: rates.BTCBRL, large: true },
              { label: 'ETH / BRL', value: rates.ETHBRL, large: true },
            ].map(({ label, value, large }) => (
              <div key={label} className="bg-gray-800/60 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="text-sm font-bold text-white font-mono">
                  {large
                    ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
                    : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards de totais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Custo total</p>
          <p className="text-2xl font-bold text-white">
            {telLoading ? '—' : `$${(totals?.costUSD ?? 0).toFixed(2)}`}
          </p>
          {brl(totals?.costUSD ?? 0) && (
            <p className="text-xs text-indigo-400 mt-0.5">{brl(totals?.costUSD ?? 0)}</p>
          )}
          <p className="text-xs text-gray-600 mt-1">USD · últimos 31 dias</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tokens totais</p>
          <p className="text-2xl font-bold text-white">
            {telLoading ? '—' : fmt(totals?.tokensTotal ?? 0)}
          </p>
          <p className="text-xs text-gray-600 mt-1">entrada + saída + cache</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Entrada</p>
          <p className="text-2xl font-bold text-white">
            {telLoading ? '—' : fmt(totals?.tokensInput ?? 0)}
          </p>
          <p className="text-xs text-gray-600 mt-1">tokens de input</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Cache lido</p>
          <p className="text-2xl font-bold text-indigo-400">
            {telLoading ? '—' : fmt(totals?.cacheRead ?? 0)}
          </p>
          <p className="text-xs text-gray-600 mt-1">tokens economizados</p>
        </div>
      </div>

      {/* Tabela de consumo diário */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Consumo Diário
          </h2>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-right px-4 py-3">Entrada</th>
                <th className="text-right px-4 py-3">Saída</th>
                <th className="text-right px-4 py-3">Cache lido</th>
                <th className="text-right px-4 py-3">Total tokens</th>
                <th className="text-left px-4 py-3 w-40">Custo (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {telLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-600 text-sm">
                    Carregando telemetria...
                  </td>
                </tr>
              )}
              {!telLoading && daily.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-600 text-sm">
                    {config.baseUrl ? 'Nenhum dado de consumo disponível.' : 'Configure o OpenClaw para ver telemetria.'}
                  </td>
                </tr>
              )}
              {daily.map((d) => (
                <tr key={d.date} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-300">{d.date}</td>
                  <td className="px-4 py-3 text-right text-gray-400 text-xs">{fmt(d.tokensInput)}</td>
                  <td className="px-4 py-3 text-right text-gray-400 text-xs">{fmt(d.tokensOutput)}</td>
                  <td className="px-4 py-3 text-right text-indigo-400 text-xs">{fmt(d.cacheRead)}</td>
                  <td className="px-4 py-3 text-right text-gray-300 text-xs font-medium">{fmt(d.tokensTotal)}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs mb-0.5">
                      <span className="text-white font-semibold">${d.costUSD.toFixed(4)}</span>
                      {brl(d.costUSD) && (
                        <span className="text-indigo-400 ml-1.5">{brl(d.costUSD)}</span>
                      )}
                    </div>
                    <CostBar value={d.costUSD} max={maxCost} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
