// ============================================================
// PÁGINA — Tarefas Agendadas (system crontab + OpenClaw crons)
// ============================================================

import { useState } from 'react';
import {
  CalendarClock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Edit2,
  Check,
  X,
  Terminal,
  Zap,
  BarChart2,
  Info,
} from 'lucide-react';
import { useOpenClawConfig } from '../hooks/useOpenClawConfig';
import { useScheduledTasks } from '../hooks/useScheduledTasks';
import { describeCron } from '../utils/cronParser';
import type { SystemCron, OpenClawCron } from '../types';

// ── Helpers ───────────────────────────────────────────────

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function fmtDuration(ms?: number): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

// ── Summary cards ─────────────────────────────────────────

interface SummaryProps {
  systemCrons: SystemCron[];
  openClawCrons: OpenClawCron[];
}

function SummaryCards({ systemCrons, openClawCrons }: SummaryProps) {
  const totalSystem  = systemCrons.length;
  const enabledSystem  = systemCrons.filter((c) => c.enabled).length;
  const totalOC      = openClawCrons.length;
  const enabledOC    = openClawCrons.filter((c) => c.enabled).length;
  const totalFails   = openClawCrons.reduce((acc, c) => acc + (c.failCount ?? 0), 0);
  const totalRuns    = openClawCrons.reduce((acc, c) => acc + (c.runCount ?? 0), 0);
  const avgDur       = openClawCrons.reduce((acc, c) => acc + (c.avgDurationMs ?? 0), 0) /
    (openClawCrons.filter((c) => (c.avgDurationMs ?? 0) > 0).length || 1);

  const cards = [
    {
      label: 'Sistema (crontab)',
      value: `${enabledSystem} / ${totalSystem}`,
      sub: 'ativas',
      icon: Terminal,
      color: 'indigo',
    },
    {
      label: 'OpenClaw Crons',
      value: `${enabledOC} / ${totalOC}`,
      sub: 'ativas',
      icon: Zap,
      color: 'violet',
    },
    {
      label: 'Execuções totais',
      value: totalRuns.toLocaleString('pt-BR'),
      sub: 'OpenClaw',
      icon: BarChart2,
      color: 'sky',
    },
    {
      label: 'Falhas',
      value: totalFails.toLocaleString('pt-BR'),
      sub: totalFails > 0 ? 'atenção requerida' : 'tudo ok',
      icon: AlertTriangle,
      color: totalFails > 0 ? 'red' : 'green',
    },
    {
      label: 'Duração média',
      value: fmtDuration(avgDur > 0 ? avgDur : undefined),
      sub: 'OpenClaw',
      icon: Clock,
      color: 'amber',
    },
  ];

  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-900/40 border-indigo-700/40 text-indigo-400',
    violet: 'bg-violet-900/40 border-violet-700/40 text-violet-400',
    sky: 'bg-sky-900/40 border-sky-700/40 text-sky-400',
    red: 'bg-red-900/40 border-red-700/40 text-red-400',
    green: 'bg-green-900/40 border-green-700/40 text-green-400',
    amber: 'bg-amber-900/40 border-amber-700/40 text-amber-400',
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((c) => {
        const Icon = c.icon;
        const cls = colorMap[c.color] ?? colorMap.indigo;
        return (
          <div key={c.label} className={`rounded-xl border p-4 flex flex-col gap-2 ${cls}`}>
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-xs font-medium opacity-80">{c.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{c.value}</p>
            <p className="text-xs opacity-60">{c.sub}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── System Cron Row ───────────────────────────────────────

interface SystemCronRowProps {
  cron: SystemCron;
  onToggle: (id: string, enabled: boolean) => Promise<void>;
  onUpdateSchedule: (id: string, schedule: string) => Promise<void>;
}

function SystemCronRow({ cron, onToggle, onUpdateSchedule }: SystemCronRowProps) {
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState(false);
  const [schedule, setSchedule] = useState(cron.schedule);
  const [saving, setSaving]     = useState(false);

  async function handleToggle() {
    setSaving(true);
    try { await onToggle(cron.id, !cron.enabled); } finally { setSaving(false); }
  }

  async function handleSaveSchedule() {
    if (schedule === cron.schedule) { setEditing(false); return; }
    setSaving(true);
    try {
      await onUpdateSchedule(cron.id, schedule);
      setEditing(false);
    } finally { setSaving(false); }
  }

  return (
    <div className={`rounded-xl border transition-colors ${
      cron.enabled ? 'bg-gray-900 border-gray-800' : 'bg-gray-900/50 border-gray-800/50 opacity-60'
    }`}>
      {/* Header row */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-800/40 rounded-xl transition-colors"
      >
        {cron.enabled
          ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          : <XCircle className="w-4 h-4 text-gray-600 shrink-0" />}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {cron.command}
          </p>
          <p className="text-xs text-gray-500">{describeCron(cron.schedule)}</p>
        </div>

        <span className="hidden sm:block font-mono text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded">
          {cron.schedule}
        </span>

        {open ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-800 pt-4">
          {/* Command */}
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Comando</p>
            <code className="block text-xs text-green-300 bg-gray-950 rounded-lg px-3 py-2 font-mono break-all">
              {cron.command}
            </code>
            {cron.comment && (
              <p className="mt-1 text-xs text-gray-600 italic"># {cron.comment}</p>
            )}
          </div>

          {/* Schedule editor */}
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Agendamento</p>
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="flex-1 bg-gray-950 border border-indigo-600/60 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="* * * * *"
                  autoFocus
                />
                <button
                  onClick={handleSaveSchedule}
                  disabled={saving}
                  className="p-1.5 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/40 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setSchedule(cron.schedule); setEditing(false); }}
                  className="p-1.5 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-indigo-300 bg-gray-950 rounded-lg px-3 py-1.5">
                  {cron.schedule}
                </code>
                <span className="text-sm text-gray-400">{describeCron(cron.schedule)}</span>
                <button
                  onClick={() => setEditing(true)}
                  className="ml-auto p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Status</p>
            <button
              onClick={handleToggle}
              disabled={saving}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                cron.enabled ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {cron.enabled
                ? <ToggleRight className="w-5 h-5" />
                : <ToggleLeft className="w-5 h-5" />}
              {cron.enabled ? 'Ativa' : 'Desativada'}
              {saving && <RefreshCw className="w-3 h-3 animate-spin" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── OpenClaw Cron Row ─────────────────────────────────────

interface OpenClawCronRowProps {
  cron: OpenClawCron;
}

function OpenClawCronRow({ cron }: OpenClawCronRowProps) {
  const [open, setOpen] = useState(false);

  const name     = cron.name ?? cron.id;
  const schedule = cron.schedule ?? '—';
  const desc     = cron.schedule ? describeCron(cron.schedule) : '—';

  return (
    <div className={`rounded-xl border transition-colors ${
      cron.enabled ? 'bg-gray-900 border-gray-800' : 'bg-gray-900/50 border-gray-800/50 opacity-60'
    }`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-800/40 rounded-xl transition-colors"
      >
        {cron.enabled
          ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          : <XCircle className="w-4 h-4 text-gray-600 shrink-0" />}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{name}</p>
          <p className="text-xs text-gray-500">{desc}</p>
        </div>

        {/* Fail badge */}
        {(cron.failCount ?? 0) > 0 && (
          <span className="flex items-center gap-1 text-xs text-red-400 bg-red-900/30 border border-red-700/30 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            {cron.failCount} falha{cron.failCount !== 1 ? 's' : ''}
          </span>
        )}

        {schedule !== '—' && (
          <span className="hidden sm:block font-mono text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded">
            {schedule}
          </span>
        )}

        {open ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-4 border-t border-gray-800 space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Execuções"      value={cron.runCount?.toLocaleString('pt-BR') ?? '—'} />
            <Stat label="Falhas"         value={cron.failCount?.toLocaleString('pt-BR') ?? '—'} highlight={(cron.failCount ?? 0) > 0 ? 'red' : undefined} />
            <Stat label="Duração média"  value={fmtDuration(cron.avgDurationMs)} />
            <Stat label="Status"         value={cron.enabled ? 'Ativa' : 'Inativa'} highlight={cron.enabled ? 'green' : undefined} />
          </div>

          {/* Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Stat label="Última execução" value={fmtDate(cron.lastRun)} />
            <Stat label="Próxima execução" value={fmtDate(cron.nextRun)} />
          </div>

          {/* Command (if present) */}
          {cron.command && (
            <div>
              <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Comando</p>
              <code className="block text-xs text-green-300 bg-gray-950 rounded-lg px-3 py-2 font-mono break-all">
                {cron.command}
              </code>
            </div>
          )}

          {/* Agendamento */}
          {cron.schedule && (
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <code className="text-sm font-mono text-indigo-300">{cron.schedule}</code>
              <span className="text-sm text-gray-400">{describeCron(cron.schedule)}</span>
            </div>
          )}

          {/* Note: OpenClaw crons are read-only here */}
          <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-800/50 rounded-lg px-3 py-2">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Para editar ou desativar esta cron, use a interface do OpenClaw diretamente.</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'red' | 'green';
}) {
  const valueColor =
    highlight === 'red' ? 'text-red-400' :
    highlight === 'green' ? 'text-green-400' :
    'text-white';

  return (
    <div className="bg-gray-800/60 rounded-lg px-3 py-2">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${valueColor}`}>{value}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

export function ScheduledTasksPage() {
  const { config } = useOpenClawConfig();
  const {
    systemCrons,
    openClawCrons,
    loading,
    systemError,
    openClawError,
    refresh,
    toggleSystemCron,
    updateSystemCron,
  } = useScheduledTasks(config);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarClock className="w-6 h-6 text-indigo-400" />
          <div>
            <h1 className="text-xl font-bold text-white">Tarefas Agendadas</h1>
            <p className="text-sm text-gray-500">
              Crontab do sistema e crons do OpenClaw
            </p>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Summary */}
      <SummaryCards systemCrons={systemCrons} openClawCrons={openClawCrons} />

      {/* System crontab */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Sistema (crontab)</h2>
          <span className="ml-auto text-xs text-gray-500">
            {systemCrons.filter((c) => c.enabled).length}/{systemCrons.length} ativas
          </span>
        </div>

        {systemError && (
          <div className="flex items-start gap-2 text-sm text-red-400 bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3 mb-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            {systemError}
          </div>
        )}

        {!systemError && systemCrons.length === 0 && !loading && (
          <div className="text-sm text-gray-600 bg-gray-900 border border-gray-800 rounded-xl px-4 py-6 text-center">
            Nenhuma tarefa encontrada no crontab do sistema.
          </div>
        )}

        <div className="space-y-2">
          {systemCrons.map((cron) => (
            <SystemCronRow
              key={cron.id}
              cron={cron}
              onToggle={toggleSystemCron}
              onUpdateSchedule={updateSystemCron}
            />
          ))}
        </div>
      </section>

      {/* OpenClaw crons */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-violet-400" />
          <h2 className="text-base font-semibold text-white">OpenClaw</h2>
          <span className="ml-auto text-xs text-gray-500">
            {openClawCrons.filter((c) => c.enabled).length}/{openClawCrons.length} ativas
          </span>
        </div>

        {openClawError && (
          <div className="flex items-start gap-2 text-sm text-red-400 bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3 mb-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            {openClawError}
          </div>
        )}

        {!openClawError && openClawCrons.length === 0 && !loading && (
          <div className="text-sm text-gray-600 bg-gray-900 border border-gray-800 rounded-xl px-4 py-6 text-center">
            Nenhuma cron configurada no OpenClaw.
          </div>
        )}

        <div className="space-y-2">
          {openClawCrons.map((cron) => (
            <OpenClawCronRow key={cron.id} cron={cron} />
          ))}
        </div>
      </section>
    </div>
  );
}
