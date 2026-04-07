// ============================================================
// DADOS MOCKADOS — TELEMETRIA E MÉTRICAS DE IA
// ============================================================
// 🔧 PARA CONECTAR AO BACKEND:
//    Substitua por: GET /api/v1/telemetry/models
//    Veja README.md → seção "Conectando ao Backend"
// ============================================================

import type { AIModel } from '../types';

export const mockAIModels: AIModel[] = [
  {
    id: 'model-001',
    name: 'claude-sonnet-4-6',
    provider: 'Anthropic',
    tokensUsed: 1_240_500,
    tokensLimit: 5_000_000,
    costUSD: 18.72,
    requests: 342,
  },
  {
    id: 'model-002',
    name: 'gpt-4o',
    provider: 'OpenAI',
    tokensUsed: 892_000,
    tokensLimit: 2_000_000,
    costUSD: 12.45,
    requests: 187,
  },
  {
    id: 'model-003',
    name: 'gemini-2.0-flash',
    provider: 'Google',
    tokensUsed: 3_100_000,
    tokensLimit: 10_000_000,
    costUSD: 4.30,
    requests: 521,
  },
  {
    id: 'model-004',
    name: 'claude-haiku-3',
    provider: 'Anthropic',
    tokensUsed: 450_000,
    tokensLimit: 5_000_000,
    costUSD: 1.12,
    requests: 98,
  },
  {
    id: 'model-005',
    name: 'gpt-4o-mini',
    provider: 'OpenAI',
    tokensUsed: 2_780_000,
    tokensLimit: 10_000_000,
    costUSD: 3.21,
    requests: 634,
  },
];
