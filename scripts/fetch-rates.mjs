#!/usr/bin/env node
// ============================================================
// SCRIPT — Busca cotações e salva em rates.json
// ============================================================
// Roda via cron de hora em hora.
// O arquivo é servido pelo backend em GET /api/rates.
//
// Variáveis de ambiente:
//   RATES_FILE  (default /opt/mission-control/data/rates.json)
//
// Exemplo de cron (crontab -e):
//   0 * * * * RATES_FILE=/opt/mission-control/data/rates.json node /opt/mission-control/fetch-rates.mjs
// ============================================================

import { writeFileSync } from 'node:fs';

const OUTPUT  = process.env.RATES_FILE ?? '/opt/mission-control/data/rates.json';
const API_URL = 'https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL,ETH-BRL';

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
