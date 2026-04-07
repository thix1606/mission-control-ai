// ============================================================
// TIPOS GLOBAIS DA APLICAÇÃO
// ============================================================

export type AgentStatus = 'online' | 'idle' | 'offline';
export type ChannelStatus = 'online' | 'idle' | 'offline';
export type TaskStatus = 'queue' | 'processing' | 'done' | 'failed';

export interface Agent {
  id: string;
  name: string;
  model: string;
  status: AgentStatus;
  lastSeen: string;
  tasksCompleted: number;
}

export interface Channel {
  id: string;
  name: string;
  type: string;
  status: ChannelStatus;
  messagesProcessed: number;
}

export interface Task {
  id: string;
  title: string;
  agentId: string;
  agentName: string;
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
