// ============================================================
// TIPOS GLOBAIS DA APLICAÇÃO
// ============================================================

export type AgentStatus = 'online' | 'idle' | 'offline';
export type ChannelStatus = 'online' | 'idle' | 'offline';
export type TaskStatus = 'queue' | 'processing' | 'reviewing' | 'done' | 'failed';

export interface Agent {
  id: string;
  name: string;
  model: string;
  status: AgentStatus;
  isDefault: boolean;
  heartbeat: string | null; // ex: "30m" ou null
  lastSeen: string;
  tasksCompleted: number;
}

export interface ChannelStatusDetails {
  configured?: boolean;
  running?: boolean;
  connected?: boolean;
  linked?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  type: string;
  status: ChannelStatus;
  statusDetails: ChannelStatusDetails;
  account: string | null; // número/username da conta
  agents: string[];
  lastActivity: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  agentId: string | null;   // null = sem agente atribuído
  agentName: string | null;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  status: TaskStatus;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  tokensUsed: number;
  tokensLimit: number;
  costUSD: number;
  requests: number;
}

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  windspeed: number;
  city?: string;
}

export interface OpenClawConfig {
  baseUrl: string;
  token: string;
  tasksApiUrl?: string; // URL da Tasks API (ex: http://host:3001)
}

export interface AgentSession {
  sessionId: string;
  name: string;
  totalCost: number;
  totalTokens: number;
  modelUsage: Array<{
    provider: string;
    model: string;
    count: number;
    totals: { input: number; output: number; cacheRead: number; totalTokens: number; totalCost: number };
  }>;
}

export interface ConfiguredModel {
  id: string;       // ex: "anthropic/claude-sonnet-4-6" ou "claude-sonnet-4-6"
  name: string;     // nome legível
  provider: string; // ex: "anthropic", "openai", "google"
}
