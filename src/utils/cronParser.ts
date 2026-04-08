// ============================================================
// UTIL — Parsing e descrição de expressões cron
// ============================================================

const SHORTHANDS: Record<string, string> = {
  '@reboot':   'Ao reiniciar',
  '@yearly':   'Anualmente (1º jan)',
  '@annually': 'Anualmente (1º jan)',
  '@monthly':  'Mensalmente (dia 1)',
  '@weekly':   'Semanalmente (domingo)',
  '@daily':    'Diariamente à meia-noite',
  '@midnight': 'Diariamente à meia-noite',
  '@hourly':   'A cada hora',
};

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function pad(n: number) { return String(n).padStart(2, '0'); }

export function describeCron(schedule: string): string {
  const s = schedule.trim();

  if (SHORTHANDS[s]) return SHORTHANDS[s];

  const parts = s.split(/\s+/);
  if (parts.length !== 5) return s;
  const [min, hour, dom, mon, dow] = parts;

  // A cada N minutos
  if (min.startsWith('*/') && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
    const n = min.slice(2);
    return `A cada ${n} minuto${n === '1' ? '' : 's'}`;
  }

  // A cada N horas
  if (min === '0' && hour.startsWith('*/') && dom === '*' && mon === '*' && dow === '*') {
    const n = hour.slice(2);
    return `A cada ${n} hora${n === '1' ? '' : 's'}`;
  }

  // Hora fixa, todo dia
  if (!min.includes('*') && !hour.includes('*') && dom === '*' && mon === '*' && dow === '*') {
    return `Diariamente às ${pad(+hour)}:${pad(+min)}`;
  }

  // Hora fixa, dias da semana
  if (!min.includes('*') && !hour.includes('*') && dom === '*' && mon === '*' && dow !== '*') {
    const time = `${pad(+hour)}:${pad(+min)}`;
    if (dow === '1-5') return `Seg–Sex às ${time}`;
    if (dow === '0-6' || dow === '*') return `Diariamente às ${time}`;
    const dayNums = dow.split(',').map(Number);
    const dayNames = dayNums.map((d) => DAYS[d] ?? d).join(', ');
    return `${dayNames} às ${time}`;
  }

  // Dia do mês fixo
  if (!min.includes('*') && !hour.includes('*') && !dom.includes('*') && mon === '*' && dow === '*') {
    return `Dia ${dom} de cada mês às ${pad(+hour)}:${pad(+min)}`;
  }

  // Mês específico
  if (!mon.includes('*')) {
    const monthName = MONTHS[(+mon) - 1] ?? mon;
    return `Anualmente em ${monthName}`;
  }

  return s;
}
