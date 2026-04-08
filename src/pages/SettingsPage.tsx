// ============================================================
// TELA — CONFIGURAÇÕES
// ============================================================

import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Wifi, WifiOff, Save, RotateCcw, Fingerprint, Trash2, ShieldAlert } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { useOpenClawConfig } from '../hooks/useOpenClawConfig';
import { testConnection } from '../services/openclaw';

type TestResult = { ok: boolean; message: string } | null;

export function SettingsPage() {
  const { config, saveConfig } = useOpenClawConfig();

  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [token, setToken] = useState(config.token);
  const [tasksApiUrl, setTasksApiUrl] = useState(config.tasksApiUrl ?? '');
  const [showToken, setShowToken] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>(null);

  const isDirty = baseUrl !== config.baseUrl || token !== config.token || tasksApiUrl !== (config.tasksApiUrl ?? '');

  const [deviceId, setDeviceId] = useState<string>('');
  useEffect(() => {
    setDeviceId(localStorage.getItem('mc_openclaw_device_id') ?? '');
  }, []);

  function resetDevice() {
    ['mc_openclaw_pub', 'mc_openclaw_priv', 'mc_openclaw_device_id', 'mc_openclaw_device_token'].forEach(
      (k) => localStorage.removeItem(k),
    );
    setDeviceId('');
    setTestResult(null);
  }

  function handleSave() {
    saveConfig({ baseUrl: baseUrl.trim(), token: token.trim(), tasksApiUrl: tasksApiUrl.trim() || undefined });
    setSaved(true);
    setTestResult(null);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    setBaseUrl(config.baseUrl);
    setToken(config.token);
    setTasksApiUrl(config.tasksApiUrl ?? '');
    setTestResult(null);
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const result = await testConnection({ baseUrl: baseUrl.trim(), token: token.trim() });
    setTestResult(result);
    setTesting(false);
  }

  return (
    <div className="p-8 max-w-2xl">
      <PageHeader
        title="Configurações"
        subtitle="Integração com o servidor OpenClaw"
        icon={<Settings className="w-6 h-6" />}
      />

      {!window.isSecureContext && (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
          <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">HTTPS obrigatório</p>
            <p className="text-yellow-500/70 mt-0.5">
              Este app usa criptografia Ed25519 (Web Crypto API) que só funciona em contextos seguros.
              Acesse via <strong>https://</strong> ou configure um certificado TLS no servidor.
            </p>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            OpenClaw Gateway
          </h2>

          <div className="space-y-4">
            {/* URL Base */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                URL Base
              </label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => { setBaseUrl(e.target.value); setSaved(false); setTestResult(null); }}
                placeholder="https://openclaw.local"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
              <p className="text-xs text-gray-600 mt-1">
                Endereço do gateway OpenClaw. Padrão: http://127.0.0.1:18789
              </p>
            </div>

            {/* Token */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Token de Autenticação
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => { setToken(e.target.value); setSaved(false); setTestResult(null); }}
                  placeholder="Bearer token configurado no openclaw"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Configure via: <code className="text-indigo-400">openclaw config set gateway.token seu-token</code>
              </p>
            </div>

            {/* Tasks API URL */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Tasks API URL
              </label>
              <input
                type="url"
                value={tasksApiUrl}
                onChange={(e) => { setTasksApiUrl(e.target.value); setSaved(false); }}
                placeholder="http://host:3001"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
              <p className="text-xs text-gray-600 mt-1">
                Micro API para persistência de tarefas do Kanban. Derivada automaticamente se vazia.
              </p>
            </div>
          </div>
        </div>

        {/* Identidade do dispositivo */}
        <div className="pt-4 border-t border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <Fingerprint className="w-4 h-4 text-gray-500" />
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Identidade do dispositivo</h3>
          </div>
          {deviceId ? (
            <div className="flex items-center gap-3">
              <code className="flex-1 text-xs text-gray-500 font-mono truncate bg-gray-800 px-3 py-2 rounded-lg">
                {deviceId}
              </code>
              <button
                onClick={resetDevice}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Resetar e reparear
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-600">
              Nenhum dispositivo registrado. O par de chaves será gerado automaticamente na próxima conexão.
            </p>
          )}
          <p className="text-xs text-gray-700 mt-2">
            Após resetar, aprove o novo dispositivo no painel do OpenClaw antes de reconectar.
          </p>
        </div>

        {/* Resultado do teste */}
        {testResult && (
          <div
            className={`flex items-start gap-2 p-3 rounded-lg text-sm border ${
              testResult.ok
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {testResult.ok ? (
              <Wifi className="w-4 h-4 mt-0.5 shrink-0" />
            ) : (
              <WifiOff className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-800">
          <button
            onClick={handleTest}
            disabled={testing || !baseUrl}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Wifi className="w-4 h-4" />
            {testing ? 'Testando...' : 'Testar conexão'}
          </button>

          {isDirty && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Descartar
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={!isDirty}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ml-auto"
          >
            <Save className="w-4 h-4" />
            {saved ? 'Salvo!' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
