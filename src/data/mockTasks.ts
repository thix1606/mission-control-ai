// ============================================================
// DADOS MOCKADOS — TAREFAS (KANBAN)
// ============================================================
// 🔧 PARA CONECTAR AO BACKEND:
//    Substitua por: GET /api/v1/tasks
//    Veja README.md → seção "Conectando ao Backend"
// ============================================================

import type { Task } from '../types';

export const mockTasks: Task[] = [
  // FILA DE ESPERA
  {
    id: 'task-001',
    title: 'Processar relatório mensal de vendas',
    agentId: 'agent-005',
    agentName: 'Agente de Relatórios',
    priority: 'high',
    createdAt: '2026-04-07T04:00:00Z',
    status: 'queue',
  },
  {
    id: 'task-002',
    title: 'Buscar notícias sobre IA para briefing',
    agentId: 'agent-002',
    agentName: 'Agente Pesquisador',
    priority: 'medium',
    createdAt: '2026-04-07T04:10:00Z',
    status: 'queue',
  },
  {
    id: 'task-003',
    title: 'Enviar resumo semanal por e-mail',
    agentId: 'agent-005',
    agentName: 'Agente de Relatórios',
    priority: 'low',
    createdAt: '2026-04-07T04:20:00Z',
    status: 'queue',
  },

  // EM PROCESSAMENTO
  {
    id: 'task-004',
    title: 'Analisar métricas de performance do cluster',
    agentId: 'agent-004',
    agentName: 'Agente de Monitoramento',
    priority: 'high',
    createdAt: '2026-04-07T03:50:00Z',
    status: 'processing',
  },
  {
    id: 'task-005',
    title: 'Calcular projeção financeira Q2',
    agentId: 'agent-003',
    agentName: 'Agente Financeiro',
    priority: 'high',
    createdAt: '2026-04-07T03:55:00Z',
    status: 'processing',
  },

  // CONCLUÍDO
  {
    id: 'task-006',
    title: 'Configurar repositório mission-control-ai',
    agentId: 'agent-001',
    agentName: 'Transinha',
    priority: 'high',
    createdAt: '2026-04-07T03:00:00Z',
    status: 'done',
  },
  {
    id: 'task-007',
    title: 'Integrar GitHub CLI ao ambiente',
    agentId: 'agent-001',
    agentName: 'Transinha',
    priority: 'medium',
    createdAt: '2026-04-07T03:30:00Z',
    status: 'done',
  },
  {
    id: 'task-008',
    title: 'Pesquisar preços de servidores Proxmox',
    agentId: 'agent-002',
    agentName: 'Agente Pesquisador',
    priority: 'low',
    createdAt: '2026-04-07T02:00:00Z',
    status: 'done',
  },

  // FALHA
  {
    id: 'task-009',
    title: 'Sincronizar dados com API legada (.NET)',
    agentId: 'agent-003',
    agentName: 'Agente Financeiro',
    priority: 'high',
    createdAt: '2026-04-07T01:00:00Z',
    status: 'failed',
  },
  {
    id: 'task-010',
    title: 'Enviar alerta de sistema (timeout)',
    agentId: 'agent-004',
    agentName: 'Agente de Monitoramento',
    priority: 'medium',
    createdAt: '2026-04-07T00:30:00Z',
    status: 'failed',
  },
];
