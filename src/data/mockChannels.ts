// ============================================================
// DADOS MOCKADOS — CANAIS DE COMUNICAÇÃO
// ============================================================
// 🔧 PARA CONECTAR AO BACKEND:
//    Substitua por: GET /api/v1/channels
//    Veja README.md → seção "Conectando ao Backend"
// ============================================================

import type { Channel } from '../types';

export const mockChannels: Channel[] = [
  {
    id: 'ch-001',
    name: 'Telegram',
    type: 'Mensageria',
    status: 'online',
    statusDetails: { configured: true, running: true },
    account: '@bot_telegram',
    agents: ['agent-001'],
    lastActivity: 'Agora',
  },
  {
    id: 'ch-002',
    name: 'WhatsApp',
    type: 'Mensageria',
    status: 'online',
    statusDetails: { configured: true, running: true, connected: true, linked: true },
    account: '+5511999999999',
    agents: ['agent-001', 'agent-002'],
    lastActivity: '2 min atrás',
  },
  {
    id: 'ch-003',
    name: 'GitHub Webhooks',
    type: 'Integração',
    status: 'online',
    statusDetails: { configured: true, running: true },
    account: null,
    agents: ['agent-003'],
    lastActivity: '10 min atrás',
  },
  {
    id: 'ch-004',
    name: 'Discord',
    type: 'Mensageria',
    status: 'idle',
    statusDetails: { configured: true, running: false },
    account: '@bot_discord',
    agents: [],
    lastActivity: '1h atrás',
  },
  {
    id: 'ch-005',
    name: 'Email (SMTP)',
    type: 'Notificação',
    status: 'offline',
    statusDetails: { configured: false },
    account: null,
    agents: [],
    lastActivity: '—',
  },
];
