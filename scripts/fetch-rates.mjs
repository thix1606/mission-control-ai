#!/usr/bin/env node
// ============================================================
// SCRIPT — Busca cotações e salva em rates.json no workspace
// ============================================================
// Executa 1x/dia via cron às 9:30 BRT (12:30 UTC)
// Cron: 30 12 * * 1-5
// Fonte: AwesomeAPI (https://economia.awesomeapi.com.br)
// ============================================================

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const WORKSPACE = process.env.OPENCLAW_WORKSPACE
  ?? '/home/openclaw/.openclaw/workspace';

const OUTPUT = join(WORKSPACE, 'rates.json');

const API_URL =
  'https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL,ETH-BRL';

async function fetchRates() {
  console.log(`[rates] Buscando cotações em ${new Date().toISOString()}...`);

  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar cotações`);

  const data = await res.json();

  const rates = {
    updatedAt: new Date().toISOString(),
    USDBRL: parseFloat(data.USDBRL?.bid ?? '0'),
    EURBRL: parseFloat(data.EURBRL?.bid ?? '0'),
    BTCBRL: parseFloat(data.BTCBRL?.bid ?? '0'),
    ETHBRL: parseFloat(data.ETHBRL?.bid ?? '0'),
  };

  writeFileSync(OUTPUT, JSON.stringify(rates, null, 2), 'utf8');

  console.log('[rates] Salvo em', OUTPUT);
  console.log('[rates]', rates);
}

fetchRates().catch((err) => {
  console.error('[rates] Erro:', err.message);
  process.exit(1);
});
