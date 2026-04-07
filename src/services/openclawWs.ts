// ============================================================
// SERVICE — OPENCLAW WEBSOCKET CLIENT
// ============================================================
// Protocolo: https://docs.openclaw.ai/gateway/protocol
// Autenticação: Ed25519 (chave pública 32 bytes, base64url) + token
// ============================================================

import type { Agent, Channel, ChannelStatusDetails, ConfiguredModel, OpenClawConfig } from '../types';

// ── Armazenamento ──────────────────────────────────────────
const KEYPAIR_PUB_KEY   = 'mc_openclaw_pub';
const KEYPAIR_PRV_KEY   = 'mc_openclaw_priv';
const DEVICE_ID_KEY     = 'mc_openclaw_device_id';
const DEVICE_TOKEN_KEY  = 'mc_openclaw_device_token';

// ── Helpers criptográficos ─────────────────────────────────

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function sha256hex(bytes: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', bytes as unknown as ArrayBuffer);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Identidade do dispositivo ──────────────────────────────

async function getOrCreateKeyPair(): Promise<{
  privateKey: CryptoKey;
  publicKeyStr: string;  // base64url, Ed25519 public key (32 bytes)
  deviceId: string;      // SHA-256 hex da chave pública
}> {
  if (!window.isSecureContext) {
    throw new Error(
      'Contexto inseguro: o app requer HTTPS (ou localhost) para usar criptografia. ' +
      'Acesse via https:// ou configure um certificado TLS no servidor.',
    );
  }
  const storedPub = localStorage.getItem(KEYPAIR_PUB_KEY);
  const storedPrv = localStorage.getItem(KEYPAIR_PRV_KEY);
  const storedId  = localStorage.getItem(DEVICE_ID_KEY);

  if (storedPub && storedPrv && storedId) {
    try {
      const privateKey = await crypto.subtle.importKey(
        'jwk', JSON.parse(storedPrv),
        { name: 'Ed25519' }, false, ['sign'],
      );
      return { privateKey, publicKeyStr: storedPub, deviceId: storedId };
    } catch {
      // Chave antiga (P-256) — gera novo par Ed25519
      localStorage.removeItem(KEYPAIR_PUB_KEY);
      localStorage.removeItem(KEYPAIR_PRV_KEY);
      localStorage.removeItem(DEVICE_ID_KEY);
      localStorage.removeItem(DEVICE_TOKEN_KEY);
    }
  }

  const keyPair = await crypto.subtle.generateKey(
    { name: 'Ed25519' }, true, ['sign', 'verify'],
  );

  const rawPub     = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const pubBytes   = new Uint8Array(rawPub); // 32 bytes
  const publicKeyStr = base64url(pubBytes);
  const deviceId   = await sha256hex(pubBytes);
  const prvJwk     = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

  localStorage.setItem(KEYPAIR_PUB_KEY, publicKeyStr);
  localStorage.setItem(KEYPAIR_PRV_KEY, JSON.stringify(prvJwk));
  localStorage.setItem(DEVICE_ID_KEY, deviceId);

  return { privateKey: keyPair.privateKey, publicKeyStr, deviceId };
}

async function signPayload(
  privateKey: CryptoKey,
  payload: {
    deviceId: string;
    clientId: string;
    clientMode: string;
    role: string;
    scopes: string[];
    signedAtMs: number;
    token: string | null;
    nonce: string;
  },
): Promise<string> {
  // Serialização canônica v2: campos unidos por "|", scopes unidos por ","
  const canonical = [
    'v2',
    payload.deviceId,
    payload.clientId,
    payload.clientMode,
    payload.role,
    payload.scopes.join(','),
    String(payload.signedAtMs),
    payload.token ?? '',
    payload.nonce,
  ].join('|');
  const data = new TextEncoder().encode(canonical);
  const sig  = await crypto.subtle.sign('Ed25519', privateKey, data);
  return base64url(new Uint8Array(sig));
}

// ── Parsing de resposta ────────────────────────────────────

function parseAgents(cfg: any, health?: any): Agent[] {
  const list: any[] = cfg?.agents?.list ?? [];
  // health.agents contém info de sessões por agentId
  const healthMap: Record<string, any> = {};
  for (const h of (health?.agents ?? [])) {
    if (h?.agentId) healthMap[h.agentId] = h;
  }
  // Se o gateway respondeu com health, os agentes estão online
  const gatewayOnline = health != null;
  return list.map((a, i) => {
    const h = healthMap[a.id] ?? {};
    const lastSeen = h.sessions?.recent?.[0]?.updatedAt
      ? new Date(h.sessions.recent[0].updatedAt).toLocaleString()
      : '—';
    return {
      id:             String(a.id ?? `agent-${i}`),
      name:           String(a.name ?? a.displayName ?? a.id ?? `Agente ${i + 1}`),
      model:          String(typeof a.model === 'object' ? (a.model?.primary ?? '—') : (a.model ?? '—')),
      status:         gatewayOnline ? 'online' : 'offline',
      isDefault:      h.isDefault ?? false,
      heartbeat:      h.heartbeat?.enabled ? (h.heartbeat.every ?? null) : null,
      lastSeen,
      tasksCompleted: h.sessions?.count ?? 0,
    };
  });
}

function parseChannels(cfg: any, health?: any): Channel[] {
  const channels: Record<string, any> = cfg?.channels ?? {};
  const healthChannels: Record<string, any> = health?.channels ?? {};
  const labels: Record<string, string> = health?.channelLabels ?? {};
  const bindings: any[] = cfg?.bindings ?? [];
  const agentNames: Record<string, string> = {};
  for (const a of (cfg?.agents?.list ?? [])) {
    agentNames[a.id] = a.name ?? a.id;
  }

  const result: Channel[] = [];

  for (const [key, v] of Object.entries(channels)) {
    if (!v || typeof v !== 'object') continue;
    const hc = healthChannels[key] ?? {};
    const channelName = String(labels[key] ?? v.name ?? (key.charAt(0).toUpperCase() + key.slice(1)));

    // Coleta todas as contas do canal (health.accounts ou só a raiz)
    const accounts: Record<string, any> = hc.accounts ?? { default: hc };

    for (const [accountId, ac] of Object.entries(accounts) as [string, any][]) {
      // Campos brutos — podem estar no sub-objeto de conta (ac) ou no nível do canal (hc)
      const rawRunning   = ac.running   ?? hc.running   ?? false;
      const rawConnected = ac.connected ?? hc.connected ?? false;
      const linked       = ac.linked    ?? hc.linked    ?? undefined;
      const probeOk      = ac.probe?.ok ?? hc.probe?.ok ?? undefined;
      const configured   = ac.configured ?? hc.configured ?? undefined;

      // O OpenClaw deriva "em execução" de probe.ok (Telegram) ou linked (WhatsApp)
      const effectiveRunning   = rawRunning || probeOk || linked || false;
      // "conectado" para WhatsApp = linked (sessão autenticada = conectado)
      const effectiveConnected = rawConnected || linked || undefined;

      const statusDetails: ChannelStatusDetails = {
        configured,
        running:   effectiveRunning   !== false ? effectiveRunning   : undefined,
        connected: effectiveConnected !== undefined ? effectiveConnected : undefined,
        linked:    linked             !== undefined ? linked             : undefined,
      };

      let status: 'online' | 'idle' | 'offline';
      if (effectiveRunning && effectiveConnected) status = 'online';
      else if (effectiveRunning || linked || probeOk) status = 'idle';
      else status = 'offline';

      const account: string | null =
        ac.self?.e164 ??
        (ac.probe?.bot?.username ? `@${ac.probe.bot.username}` : null) ??
        null;

      // Agentes vinculados a esta conta específica
      const boundAgents = [...new Set(
        bindings
          .filter(b => b.match?.channel === key && (b.match?.accountId === accountId || b.match?.accountId === `${key}:${accountId}`))
          .map(b => agentNames[b.agentId] ?? b.agentId)
      )];

      result.push({
        id:           `${key}:${accountId}`,
        name:         channelName,
        type:         String(v.type ?? v.platform ?? 'Mensageria'),
        status,
        statusDetails,
        account,
        agents:       boundAgents,
        lastActivity: (() => {
          const ts = [ac.lastInboundAt, ac.lastMessageAt, ac.lastConnectedAt, ac.lastProbeAt].find(v => v != null) ?? null;
          if (ts) return new Date(ts).toLocaleString();
          if (ac.authAgeMs != null) return new Date(Date.now() - ac.authAgeMs).toLocaleString();
          return '—';
        })(),
      });
    }
  }

  return result;
}

// ── Protocolo WebSocket ────────────────────────────────────

interface WsMessage {
  type: 'req' | 'res' | 'event';
  id?: string;
  method?: string;
  params?: any;
  ok?: boolean;
  payload?: any;
  error?: { code?: string; message: string };
  event?: string;
}

function toWsUrl(baseUrl: string): string {
  return baseUrl.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
}

// ── Sessão autenticada (helper interno) ───────────────────
// Abre WebSocket, autentica via Ed25519 e fornece `rpc` e `on` ao callback.

type RpcFn = (method: string, params?: any) => Promise<any>;
type EventFn = (event: string, handler: (payload: any) => void) => void;

async function openClawSession<T>(
  config: OpenClawConfig,
  callback: (rpc: RpcFn, on: EventFn) => Promise<T>,
): Promise<T> {
  const { privateKey, publicKeyStr, deviceId } = await getOrCreateKeyPair();
  const storedDeviceToken = localStorage.getItem(DEVICE_TOKEN_KEY);

  return new Promise((resolve, reject) => {
    const wsUrl = toWsUrl(config.baseUrl);
    let ws: WebSocket;

    try {
      ws = new WebSocket(wsUrl);
    } catch (e: any) {
      reject(new Error(`Falha ao criar WebSocket: ${e?.message}`));
      return;
    }

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Timeout ao conectar ao OpenClaw.'));
    }, 15000);

    let reqId = 0;
    const pending  = new Map<string, { resolve: (v: any) => void; reject: (e: any) => void }>();
    const handlers = new Map<string, (payload: any) => void>();

    function send(msg: WsMessage) { ws.send(JSON.stringify(msg)); }

    const rpc: RpcFn = (method, params) => {
      const id = String(++reqId);
      return new Promise((res, rej) => {
        pending.set(id, { resolve: res, reject: rej });
        send({ type: 'req', id, method, params });
      });
    };

    const on: EventFn = (event, handler) => { handlers.set(event, handler); };

    ws.onmessage = async (event) => {
      let msg: WsMessage;
      try { msg = JSON.parse(event.data); } catch { return; }

      if (msg.type === 'event' && msg.event) {
        handlers.get(msg.event)?.(msg.payload);
      }

      if (msg.type === 'event' && msg.event === 'connect.challenge') {
        const nonce      = msg.payload?.nonce as string;
        const signedAtMs = Date.now();
        const clientId   = 'openclaw-control-ui';
        const clientMode = 'ui';
        const role       = 'operator';
        const scopes     = ['operator.admin', 'operator.read', 'operator.write', 'operator.approvals', 'operator.pairing'];

        const sigPayload = { deviceId, clientId, clientMode, role, scopes, signedAtMs, token: config.token ?? null, nonce };
        const signature  = await signPayload(privateKey, sigPayload);

        const connectParams = {
          minProtocol: 3, maxProtocol: 3,
          client: { id: clientId, version: 'control-ui', platform: navigator.platform, mode: clientMode, instanceId: crypto.randomUUID() },
          role, scopes, caps: ['tool-events'],
          auth:   { token: config.token, deviceToken: storedDeviceToken ?? undefined },
          device: { id: deviceId, publicKey: publicKeyStr, nonce, signedAt: signedAtMs, signature },
          userAgent: navigator.userAgent,
          locale:    navigator.language,
        };

        try {
          const hello = await rpc('connect', connectParams);
          if (hello?.auth?.deviceToken) {
            localStorage.setItem(DEVICE_TOKEN_KEY, hello.auth.deviceToken);
          }

          clearTimeout(timeout);
          const result = await callback(rpc, on);
          ws.close();
          resolve(result);
        } catch (e: any) {
          clearTimeout(timeout);
          ws.close();
          reject(new Error(e?.message ?? 'Falha na autenticação com o OpenClaw.'));
        }
        return;
      }

      if (msg.type === 'res' && msg.id) {
        const handler = pending.get(msg.id);
        if (handler) {
          pending.delete(msg.id);
          if (msg.ok) handler.resolve(msg.payload);
          else handler.reject(new Error(msg.error?.message ?? 'Erro RPC'));
        }
      }
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Erro de conexão WebSocket. Verifique a URL do OpenClaw.'));
    };

    ws.onclose = (e) => {
      if (e.code !== 1000 && pending.size > 0) {
        clearTimeout(timeout);
        reject(new Error(`WebSocket fechado inesperadamente (código ${e.code}).`));
      }
    };
  });
}

// ── Catálogo local completo por provider ──────────────────
// Expandido quando o provider está configurado no OpenClaw.

const PROVIDER_CATALOG: Record<string, Array<{ id: string; name: string }>> = {
  anthropic: [
    { id: 'anthropic/claude-opus-4-6',     name: 'Claude Opus 4.6' },
    { id: 'anthropic/claude-sonnet-4-6',   name: 'Claude Sonnet 4.6' },
    { id: 'anthropic/claude-haiku-4-5',    name: 'Claude Haiku 4.5' },
    { id: 'anthropic/claude-opus-4-5',     name: 'Claude Opus 4.5' },
    { id: 'anthropic/claude-sonnet-4-5',   name: 'Claude Sonnet 4.5' },
  ],
  openai: [
    { id: 'openai/gpt-4o',       name: 'GPT-4o' },
    { id: 'openai/gpt-4o-mini',  name: 'GPT-4o Mini' },
    { id: 'openai/gpt-4-turbo',  name: 'GPT-4 Turbo' },
    { id: 'openai/o3',           name: 'o3' },
    { id: 'openai/o4-mini',      name: 'o4-mini' },
  ],
  google: [
    { id: 'google/gemini-2.5-pro',        name: 'Gemini 2.5 Pro' },
    { id: 'google/gemini-2.5-flash',      name: 'Gemini 2.5 Flash' },
    { id: 'google/gemini-2.0-flash',      name: 'Gemini 2.0 Flash' },
    { id: 'google/gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite' },
    { id: 'google/gemini-1.5-pro',        name: 'Gemini 1.5 Pro' },
    { id: 'google/gemini-1.5-flash',      name: 'Gemini 1.5 Flash' },
  ],
  meta: [
    { id: 'meta/llama-3.3-70b', name: 'Llama 3.3 70B' },
    { id: 'meta/llama-3.1-8b',  name: 'Llama 3.1 8B' },
  ],
  mistral: [
    { id: 'mistral/mistral-large', name: 'Mistral Large' },
    { id: 'mistral/mistral-small', name: 'Mistral Small' },
    { id: 'mistral/codestral',     name: 'Codestral' },
  ],
};

// ── Parsing de modelos configurados ───────────────────────

function parseModels(raw: any, agentModelIds: string[] = []): ConfiguredModel[] {
  // Desembrulha envelopes comuns: { models: [...] }, { list: [...] }, { items: [...] }
  const data: any = Array.isArray(raw)
    ? raw
    : (raw?.models ?? raw?.list ?? raw?.items ?? raw);

  // Extrai modelos brutos do OpenClaw
  let rawModels: ConfiguredModel[] = [];

  if (Array.isArray(data)) {
    rawModels = data.map((m: any) => {
      if (typeof m === 'string') {
        return { id: m, name: formatModelName(m), provider: inferProvider(m) };
      }
      const id       = String(m.id ?? m.modelId ?? m.model ?? m);
      const provider = String(m.provider ?? inferProvider(id));
      const name     = String(m.name ?? m.displayName ?? formatModelName(id));
      return { id, name, provider };
    });
  } else if (data && typeof data === 'object') {
    rawModels = Object.entries(data).map(([id, v]: [string, any]) => {
      const provider = String(v?.provider ?? inferProvider(id));
      const name     = String(v?.name ?? v?.displayName ?? formatModelName(id));
      return { id, name, provider };
    });
  }

  // Identifica providers: via models.list + fallback pelos modelos já em uso nos agentes
  const configuredProviders = new Set([
    ...rawModels.map((m) => inferProvider(m.id)),
    ...agentModelIds.map((id) => inferProvider(id)),
  ]);
  configuredProviders.delete('outro'); // ignora providers desconhecidos

  // Para cada provider, expande com o catálogo completo local
  const expanded: ConfiguredModel[] = [];
  const seen = new Set<string>();

  for (const provider of configuredProviders) {
    const catalog = PROVIDER_CATALOG[provider];
    if (catalog) {
      for (const entry of catalog) {
        if (!seen.has(entry.id)) {
          expanded.push({ ...entry, provider });
          seen.add(entry.id);
        }
      }
    }
  }

  // Mantém modelos do OpenClaw que não estão no catálogo local (ex: modelos customizados)
  for (const m of rawModels) {
    if (!seen.has(m.id)) {
      expanded.push(m);
      seen.add(m.id);
    }
  }

  // Mantém modelos dos agentes que não estão em nenhuma outra lista
  for (const id of agentModelIds) {
    if (!seen.has(id)) {
      expanded.push({ id, name: formatModelName(id), provider: inferProvider(id) });
      seen.add(id);
    }
  }

  return expanded;
}

function inferProvider(modelId: string): string {
  const id = modelId.toLowerCase();
  if (id.startsWith('anthropic/') || id.includes('claude')) return 'anthropic';
  if (id.startsWith('openai/')    || id.includes('gpt') || id.startsWith('o1') || id.startsWith('o3') || id.startsWith('o4')) return 'openai';
  if (id.startsWith('google/')    || id.includes('gemini')) return 'google';
  if (id.startsWith('meta/')      || id.includes('llama')) return 'meta';
  if (id.startsWith('mistral/')   || id.includes('mistral')) return 'mistral';
  const slash = modelId.indexOf('/');
  return slash !== -1 ? modelId.slice(0, slash) : 'outro';
}

function formatModelName(modelId: string): string {
  // Remove prefixo de provider se presente (ex: "anthropic/claude-sonnet-4-6" → "claude-sonnet-4-6")
  const id = modelId.includes('/') ? modelId.split('/').slice(1).join('/') : modelId;
  return id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── API pública ────────────────────────────────────────────

export async function fetchViaWebSocket(config: OpenClawConfig): Promise<{
  agents: Agent[];
  channels: Channel[];
  configuredModels: ConfiguredModel[];
}> {
  return openClawSession(config, async (rpc, on) => {
    let healthResolve: ((p: any) => void) | null = null;
    const healthPromise = new Promise<any>(res => { healthResolve = res; });
    on('health', (payload) => healthResolve?.(payload));

    // Busca config e modelos em paralelo na mesma sessão autenticada
    const [configData, modelsRaw] = await Promise.all([
      rpc('config.get'),
      rpc('models.list').catch(() => null),
    ]);

    const health = await Promise.race([
      healthPromise,
      new Promise<null>(res => setTimeout(() => res(null), 5000)),
    ]);

    const cfg    = configData?.parsed ?? configData;
    const agents = parseAgents(cfg, health);

    // Complementa a detecção de providers com os modelos já em uso pelos agentes
    const agentModelIds = agents.map((a) => a.model).filter((m) => m !== '—');
    const configuredModels = parseModels(modelsRaw, agentModelIds);

    return {
      agents,
      channels: parseChannels(cfg, health),
      configuredModels,
    };
  });
}

// ── Telemetria ─────────────────────────────────────────────

export interface DailyUsage {
  date: string;
  tokensInput: number;
  tokensOutput: number;
  cacheRead: number;
  tokensTotal: number;
  costUSD: number;
}

export interface ModelUsage {
  provider: string;
  model: string;
  calls: number;
  tokensInput: number;
  tokensOutput: number;
  cacheRead: number;
  tokensTotal: number;
  costUSD: number;
}

export interface TelemetryData {
  daily: DailyUsage[];
  totals: {
    tokensInput: number;
    tokensOutput: number;
    cacheRead: number;
    tokensTotal: number;
    costUSD: number;
  };
  modelUsage: ModelUsage[];
}

export async function fetchTelemetry(config: OpenClawConfig): Promise<TelemetryData> {
  return openClawSession(config, async (rpc) => {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const end   = now.toISOString();

    const [costRaw, sessionsRaw] = await Promise.all([
      rpc('usage.cost',     { from: start, to: end }).catch(() => null),
      rpc('sessions.usage', {}).catch(() => null),
    ]);

    return parseTelemetry(costRaw, sessionsRaw);
  });
}

function parseTelemetry(costRaw: any, sessionsRaw?: any): TelemetryData {
  const dailyRaw: any[] = Array.isArray(costRaw?.daily) ? costRaw.daily : [];

  const daily: DailyUsage[] = dailyRaw.map((d) => ({
    date:         String(d.date ?? ''),
    tokensInput:  d.input        ?? 0,
    tokensOutput: d.output       ?? 0,
    cacheRead:    d.cacheRead    ?? 0,
    tokensTotal:  d.totalTokens  ?? 0,
    costUSD:      d.totalCost    ?? 0,
  })).sort((a, b) => b.date.localeCompare(a.date)); // mais recente primeiro

  const t = costRaw?.totals ?? {};

  // Agrega modelUsage de todas as sessões por chave provider:model
  const modelMap = new Map<string, ModelUsage>();
  const sessions: any[] = Array.isArray(sessionsRaw?.sessions) ? sessionsRaw.sessions : [];
  for (const session of sessions) {
    const modelUsageArr: any[] = Array.isArray(session.usage?.modelUsage) ? session.usage.modelUsage : [];
    for (const mu of modelUsageArr) {
      const key = `${mu.provider ?? ''}:${mu.model ?? ''}`;
      const existing = modelMap.get(key);
      const tot = mu.totals ?? {};
      if (existing) {
        existing.calls        += mu.count         ?? 0;
        existing.tokensInput  += tot.input        ?? 0;
        existing.tokensOutput += tot.output       ?? 0;
        existing.cacheRead    += tot.cacheRead    ?? 0;
        existing.tokensTotal  += tot.totalTokens  ?? 0;
        existing.costUSD      += tot.totalCost    ?? 0;
      } else {
        modelMap.set(key, {
          provider:     String(mu.provider ?? 'outro'),
          model:        String(mu.model    ?? 'desconhecido'),
          calls:        mu.count         ?? 0,
          tokensInput:  tot.input        ?? 0,
          tokensOutput: tot.output       ?? 0,
          cacheRead:    tot.cacheRead    ?? 0,
          tokensTotal:  tot.totalTokens  ?? 0,
          costUSD:      tot.totalCost    ?? 0,
        });
      }
    }
  }

  const modelUsage = Array.from(modelMap.values())
    .sort((a, b) => b.costUSD - a.costUSD);

  return {
    daily,
    totals: {
      tokensInput:  t.input       ?? 0,
      tokensOutput: t.output      ?? 0,
      cacheRead:    t.cacheRead   ?? 0,
      tokensTotal:  t.totalTokens ?? 0,
      costUSD:      t.totalCost   ?? 0,
    },
    modelUsage,
  };
}

// ── agents.files helpers ───────────────────────────────────

export async function listAgentIds(config: OpenClawConfig): Promise<string[]> {
  return openClawSession(config, async (rpc) => {
    const configData = await rpc('config.get');
    const cfg = configData?.parsed ?? configData;
    return (cfg?.agents?.list ?? []).map((a: any) => String(a.id));
  });
}

export async function readAgentFile(
  config: OpenClawConfig,
  agentId: string,
  path: string,
): Promise<string | null> {
  return openClawSession(config, async (rpc) => {
    try {
      const res = await rpc('agents.files.get', { agentId, path });
      console.log(`[agents.files.get] agentId=${agentId} path=${path} →`, JSON.stringify(res));
      return res?.content ?? res?.data ?? null;
    } catch (e: any) {
      console.warn(`[agents.files.get] erro agentId=${agentId} path=${path}:`, e?.message);
      return null;
    }
  });
}

export async function writeAgentFile(
  config: OpenClawConfig,
  agentId: string,
  path: string,
  content: string,
): Promise<void> {
  await openClawSession(config, async (rpc) => {
    await rpc('agents.files.set', { agentId, path, content });
  });
}

export async function updateAgentModel(
  config: OpenClawConfig,
  agentId: string,
  model: string,
): Promise<void> {
  await openClawSession(config, async (rpc) => {
    // O OpenClaw exige o hash atual da config para prevenir conflitos de escrita
    const configData = await rpc('config.get');
    const baseHash: string = configData?.hash;

    await rpc('config.patch', {
      baseHash,
      raw: JSON.stringify({
        agents: {
          list: [{ id: agentId, model: { primary: model } }],
        },
      }),
    });
  });
}
