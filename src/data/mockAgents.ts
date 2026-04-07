// ============================================================
// DADOS MOCKADOS — AGENTES DE IA
// ============================================================
// 🔧 PARA CONECTAR AO BACKEND:
//    Substitua este arquivo por uma chamada à sua API REST.
//    Exemplo: GET /api/v1/agents
//    Veja README.md → seção "Conectando ao Backend"
// ============================================================

import type { Agent } from '../types';

export const mockAgents: Agent[] = [
  {
    id: 'agent-001',
    name: 'Transinha',
    model: 'claude-sonnet-4-6',
    status: 'online',
    lastSeen: 'Agora',
    tasksCompleted: 142,
  },
  {
    id: 'agent-002',
    name: 'Agente Pesquisador',
    model: 'gpt-4o',
    status: 'online',
    lastSeen: '2 min atrás',
    tasksCompleted: 87,
  },
  {
    id: 'agent-003',
    name: 'Agente Financeiro',
    model: 'gemini-2.0-flash',
    status: 'idle',
    lastSeen: '15 min atrás',
    tasksCompleted: 34,
  },
  {
    id: 'agent-004',
    name: 'Agente de Monitoramento',
    model: 'claude-haiku-3',
    status: 'offline',
    lastSeen: '2h atrás',
    tasksCompleted: 211,
  },
  {
    id: 'agent-005',
    name: 'Agente de Relatórios',
    model: 'gpt-4o-mini',
    status: 'idle',
    lastSeen: '5 min atrás',
    tasksCompleted: 56,
  },
];
