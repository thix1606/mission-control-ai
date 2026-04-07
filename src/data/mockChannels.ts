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
    messagesProcessed: 1893,
  },
  {
    id: 'ch-002',
    name: 'WhatsApp',
    type: 'Mensageria',
    status: 'online',
    messagesProcessed: 742,
  },
  {
    id: 'ch-003',
    name: 'GitHub Webhooks',
    type: 'Integração',
    status: 'online',
    messagesProcessed: 318,
  },
  {
    id: 'ch-004',
    name: 'Discord',
    type: 'Mensageria',
    status: 'idle',
    messagesProcessed: 95,
  },
  {
    id: 'ch-005',
    name: 'Email (SMTP)',
    type: 'Notificação',
    status: 'offline',
    messagesProcessed: 0,
  },
];
