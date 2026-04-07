// ============================================================
// SERVICE — OPENCLAW WEBSOCKET CLIENT
// ============================================================
// Protocolo: https://docs.openclaw.ai/gateway/protocol
// Autenticação: Ed25519 (chave pública 32 bytes, base64url) + token
// ============================================================

import type { Agent, Channel, OpenClawConfig } from '../types';

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
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Identidade do dispositivo ──────────────────────────────

async function getOrCreateKeyPair(): Promise<{
  privateKey: CryptoKey;
  publicKeyStr: string;  // base64url, Ed25519 public key (32 bytes)
  deviceId: string;      // SHA-256 hex da chave pública
}> {
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

function mapStatus(raw?: string): 'online' | 'idle' | 'offline' {
  const s = (raw ?? '').toLowerCase();
  if (['online', 'active', 'running', 'connected'].includes(s)) return 'online';
  if (['idle', 'paused', 'waiting'].includes(s)) return 'idle';
  return 'offline';
}

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
      let status: 'online' | 'idle' | 'offline';
      if (ac.running && ac.connected) status = 'online';
      else if (ac.running || ac.linked || ac.probe?.ok) status = 'idle';
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
        account,
        agents:       boundAgents,
        lastActivity: ac.lastInboundAt ? new Date(ac.lastInboundAt).toLocaleString() : (ac.lastProbeAt ? new Date(ac.lastProbeAt).toLocaleString() : '—'),
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

// ── API pública ────────────────────────────────────────────

export async function fetchViaWebSocket(config: OpenClawConfig): Promise<{
  agents: Agent[];
  channels: Channel[];
}> {
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
    const pending = new Map<string, { resolve: (v: any) => void; reject: (e: any) => void }>();

    function send(msg: WsMessage) { ws.send(JSON.stringify(msg)); }

    function rpc(method: string, params?: any): Promise<any> {
      const id = String(++reqId);
      return new Promise((res, rej) => {
        pending.set(id, { resolve: res, reject: rej });
        send({ type: 'req', id, method, params });
      });
    }

    let healthResolve: ((p: any) => void) | null = null;
    const healthPromise = new Promise<any>(res => { healthResolve = res; });

    ws.onmessage = async (event) => {
      let msg: WsMessage;
      try { msg = JSON.parse(event.data); } catch { return; }

      if (msg.type === 'event' && msg.event === 'health') {
        healthResolve?.(msg.payload);
      }

      if (msg.type === 'event' && msg.event === 'connect.challenge') {
        const nonce      = msg.payload?.nonce as string;
        const signedAtMs = Date.now();
        const clientId   = 'openclaw-control-ui';
        const clientMode = 'ui';
        const role       = 'operator';
        const scopes     = ['operator.admin', 'operator.read', 'operator.write', 'operator.approvals', 'operator.pairing'];

        const sigPayload = {
          deviceId,
          clientId,
          clientMode,
          role,
          scopes,
          signedAtMs,
          token: config.token ?? null,
          nonce,
        };
        const signature = await signPayload(privateKey, sigPayload);

        const connectParams = {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id:         clientId,
              version:    'control-ui',
              platform:   navigator.platform,
              mode:       clientMode,
              instanceId: crypto.randomUUID(),
            },
            role,
            scopes,
            caps:   ['tool-events'],
            auth: {
              token:       config.token,
              deviceToken: storedDeviceToken ?? undefined,
            },
            device: { id: deviceId, publicKey: publicKeyStr, nonce, signedAt: signedAtMs, signature },
            userAgent: navigator.userAgent,
            locale:    navigator.language,
        };
        try {
          const hello = await rpc('connect', connectParams);

          // Persiste device token para próximas conexões
          if (hello?.auth?.deviceToken) {
            localStorage.setItem(DEVICE_TOKEN_KEY, hello.auth.deviceToken);
          }

          const configData = await rpc('config.get');


          // Aguarda evento health (máx 5s) para obter status em tempo real
          const health = await Promise.race([
            healthPromise,
            new Promise<null>(res => setTimeout(() => res(null), 5000)),
          ]);

          clearTimeout(timeout);
          ws.close();
          const cfg = configData?.parsed ?? configData;
          resolve({ agents: parseAgents(cfg, health), channels: parseChannels(cfg, health) });
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
