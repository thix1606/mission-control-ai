// ============================================================
// HOOK — Cotações do dia (via GET /api/rates no backend)
// ============================================================
// O script fetch-rates.mjs grava rates.json na pasta do backend.
// O endpoint /api/rates serve esse arquivo sem autenticação.
// ============================================================

import { useState, useEffect } from 'react';

export interface Rates {
  updatedAt: string;
  USDBRL: number;
  EURBRL: number;
  BTCBRL: number;
  ETHBRL: number;
}

export function useRates(): { rates: Rates | null; loading: boolean } {
  const [rates, setRates]     = useState<Rates | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${window.location.origin}/api/rates`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Rates) => {
        if (data.USDBRL) setRates(data);
      })
      .catch(() => { /* silencioso — BRL simplesmente não aparece */ })
      .finally(() => setLoading(false));
  }, []);

  return { rates, loading };
}
