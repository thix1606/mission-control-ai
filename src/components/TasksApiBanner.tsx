// ============================================================
// COMPONENTE — Banner de aviso da Tasks API
// ============================================================
// Exibido globalmente quando a API de tarefas está inacessível.
// ============================================================

import { useState } from 'react';
import { AlertTriangle, X, Terminal, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TasksApiStatus } from '../hooks/useTasksApiHealth';

interface Props {
  status: TasksApiStatus;
  apiUrl: string;
}

export function TasksApiBanner({ status, apiUrl }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (status === 'ok' || status === 'checking' || dismissed) return null;

  const isUnconfigured = status === 'unconfigured';
  const isUnauthorized = status === 'unauthorized';

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-6 py-3">
      <div className="flex items-start gap-3 max-w-5xl">
        <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-yellow-300">
            {isUnconfigured && 'Tasks API não configurada — tarefas serão salvas apenas neste browser.'}
            {isUnauthorized && 'Tasks API: token inválido — verifique as configurações.'}
            {status === 'unreachable' && 'Tasks API inacessível — tarefas serão salvas apenas neste browser.'}
          </p>

          {(status === 'unreachable' || isUnconfigured) && (
            <div className="mt-2 space-y-1">
              {isUnconfigured ? (
                <p className="text-xs text-yellow-400/70">
                  Configure a URL da Tasks API em{' '}
                  <button
                    onClick={() => navigate('/settings')}
                    className="underline hover:text-yellow-300 transition-colors"
                  >
                    Configurações
                  </button>
                  {' '}e inicie o serviço no servidor.
                </p>
              ) : (
                <details className="group">
                  <summary className="text-xs text-yellow-400/70 cursor-pointer hover:text-yellow-300 transition-colors list-none flex items-center gap-1">
                    <Terminal className="w-3 h-3" />
                    Ver instruções para iniciar o serviço
                  </summary>
                  <div className="mt-2 bg-gray-950/60 rounded-lg p-3 font-mono text-xs text-gray-300 space-y-1 border border-yellow-500/20">
                    <p className="text-gray-500"># Verificar status do serviço</p>
                    <p>sudo systemctl status mc-tasks-api</p>
                    <p className="text-gray-500 mt-2"># Se o arquivo não existir no servidor:</p>
                    <p>{'sudo curl -o /opt/mission-control/tasks-server.mjs \\'}</p>
                    <p className="pl-4">{'https://raw.githubusercontent.com/thix1606/mission-control-ai/main/server/tasks-server.mjs'}</p>
                    <p className="text-gray-500 mt-2"># Iniciar o serviço</p>
                    <p>sudo systemctl start mc-tasks-api</p>
                    <p className="text-gray-500 mt-2"># Ver logs em caso de erro</p>
                    <p>sudo journalctl -u mc-tasks-api -n 20</p>
                    <p className="text-gray-500 mt-2"># URL configurada atualmente:</p>
                    <p className="text-indigo-400">{apiUrl || '(não configurada)'}</p>
                  </div>
                </details>
              )}
            </div>
          )}

          {isUnauthorized && (
            <p className="text-xs text-yellow-400/70 mt-1">
              O token em{' '}
              <button
                onClick={() => navigate('/settings')}
                className="underline hover:text-yellow-300 transition-colors"
              >
                Configurações
              </button>
              {' '}deve ser o mesmo definido em <code className="text-indigo-400">TASKS_API_TOKEN</code> no serviço.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/settings')}
            className="text-xs text-yellow-400/70 hover:text-yellow-300 transition-colors flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Configurar
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-yellow-400/50 hover:text-yellow-300 transition-colors"
            aria-label="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
