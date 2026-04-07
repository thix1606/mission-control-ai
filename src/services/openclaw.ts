// ============================================================
// SERVICE — OPENCLAW API
// ============================================================
// Documentação: https://docs.openclaw.ai
// Auth: Authorization: Bearer <token>
//
// Requests vão para /openclaw-proxy/* (Vite middleware).
// A URL real do OpenClaw é passada via header X-Openclaw-Target,
// permitindo que o usuário configure o endereço pela UI.
// ============================================================

import type { Agent, Channel, OpenClawConfig } from '../types';

const PROXY = '/openclaw-proxy';

function mapStatus(raw: string | undefined): 'online' | 'idle' | 'offline' {
  const s = (raw ?? '').toLowerCase();
  if (['connected', 'online', 'active', 'running'].includes(s)) return 'online';
  if (['idle', 'paused', 'waiting'].includes(s)) return 'idle';
  return 'offline';
}

function buildHeaders(config: OpenClawConfig) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Openclaw-Target': config.baseUrl,
  };
  if (config.token) {
    headers['Authorization'] = `Bearer ${config.token}`;
  }
  return headers;
}

async function parseJson(res: Response, label: string): Promise<any> {
  const text = await res.text();
  if (text.trimStart().startsWith('<')) {
    throw new Error(`${label}: servidor retornou HTML — verifique se o token de autenticação está correto.`);
  }
  return JSON.parse(text);
}

// GET /v1/models — lista agentes disponíveis (formato OpenAI-compatible)
export async function fetchAgents(config: OpenClawConfig): Promise<Agent[]> {
  const res = await fetch(`${PROXY}/v1/models`, {
    headers: buildHeaders(config),
  });
  if (!res.ok) throw new Error(`Agentes: HTTP ${res.status}`);
  const data = await parseJson(res, 'Agentes');

  const models: any[] = data.data ?? data.models ?? [];
  return models.map((m) => ({
    id: String(m.id),
    name: String(m.id).replace(/^openclaw\/?/, '') || String(m.id),
    model: String(m.id),
    status: mapStatus(m.status),
    isDefault: m.isDefault ?? false,
    heartbeat: m.heartbeat ?? null,
    lastSeen: m.created
      ? new Date(m.created * 1000).toLocaleString('pt-BR')
      : '—',
    tasksCompleted: m.requests ?? 0,
  }));
}

// Tenta múltiplos endpoints para canais, pois varia entre versões do OpenClaw
const CHANNEL_ENDPOINTS = [
  '/api/channels',
  '/api/channels/list',
  '/v1/channels',
  '/api/connectors',
];

export async function fetchChannels(config: OpenClawConfig): Promise<Channel[]> {
  let lastStatus = 0;

  for (const endpoint of CHANNEL_ENDPOINTS) {
    const res = await fetch(`${PROXY}${endpoint}`, {
      headers: buildHeaders(config),
    });

    if (res.status === 404) {
      lastStatus = 404;
      continue;
    }

    if (!res.ok) throw new Error(`Canais: HTTP ${res.status} (${endpoint})`);

    const data = await parseJson(res, 'Canais');
    const list: any[] = Array.isArray(data) ? data : (data.channels ?? data.connectors ?? data.data ?? []);
    return list.map((c) => ({
      id: String(c.id ?? c.name ?? Math.random()),
      name: String(c.name ?? c.id),
      type: String(c.type ?? c.platform ?? 'Mensageria'),
      status: mapStatus(c.status),
      account: c.account ?? c.username ?? null,
      agents: Array.isArray(c.agents) ? c.agents : [],
      lastActivity: c.lastActivity ?? c.lastInboundAt ?? '—',
    }));
  }

  throw new Error(`Canais: endpoint não encontrado (HTTP ${lastStatus}). Pode não estar disponível nesta versão do OpenClaw.`);
}

// Testa conexão via WebSocket (protocolo nativo do OpenClaw)
export async function testConnection(
  config: OpenClawConfig,
): Promise<{ ok: boolean; message: string }> {
  try {
    const { fetchViaWebSocket } = await import('./openclawWs');
    const { agents, channels } = await fetchViaWebSocket(config);
    return {
      ok: true,
      message: `Conexão estabelecida. ${agents.length} agente(s), ${channels.length} canal(is) encontrado(s).`,
    };
  } catch (err: any) {
    return { ok: false, message: err?.message ?? 'Falha ao conectar.' };
  }
}
