#!/usr/bin/env node
// ============================================================
// MICRO API — Persistência de tarefas do Mission Control
// ============================================================
// Endpoints:
//   GET  /api/tasks  → lê tasks.json, retorna { tasks, hash }
//   PUT  /api/tasks  → grava tasks.json (lock otimista via If-Match)
//
// Variáveis de ambiente:
//   TASKS_API_TOKEN  (obrigatório) — Bearer token para autenticação
//   PORT             (default 3001)
//   TASKS_FILE       (default ./tasks.json)
//   CORS_ORIGIN      (default *)
// ============================================================

import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const TOKEN      = process.env.TASKS_API_TOKEN;
const PORT       = parseInt(process.env.PORT ?? '3001', 10);
const TASKS_FILE = process.env.TASKS_FILE ?? './tasks.json';
const CORS       = process.env.CORS_ORIGIN ?? '*';

if (!TOKEN) {
  console.error('[tasks-api] TASKS_API_TOKEN é obrigatório.');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────

function hash(buf) {
  return createHash('sha256').update(buf).digest('hex').slice(0, 16);
}

function readTasks() {
  if (!existsSync(TASKS_FILE)) return { raw: '{"tasks":[]}', data: { tasks: [] } };
  const raw = readFileSync(TASKS_FILE, 'utf8');
  return { raw, data: JSON.parse(raw) };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': CORS,
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, If-Match',
    'Access-Control-Expose-Headers': 'ETag',
  };
}

function authOk(req) {
  const hdr = req.headers.authorization ?? '';
  if (!hdr.startsWith('Bearer ')) return false;
  const t = hdr.slice(7);
  if (t.length !== TOKEN.length) return false;
  // Comparação em tempo constante
  const a = Buffer.from(t);
  const b = Buffer.from(TOKEN);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function json(res, status, body, extra = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', ...corsHeaders(), ...extra });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// ── Server ────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    return res.end();
  }

  // Somente /api/tasks
  if (url.pathname !== '/api/tasks') {
    return json(res, 404, { error: 'Not found' });
  }

  // Autenticação
  if (!authOk(req)) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const { raw, data } = readTasks();
      const etag = hash(raw);
      return json(res, 200, { ...data, hash: etag }, { ETag: etag });
    }

    if (req.method === 'PUT') {
      const body = await readBody(req);
      const incoming = JSON.parse(body);

      // Lock otimista
      const ifMatch = req.headers['if-match'];
      if (ifMatch) {
        const { raw: current } = readTasks();
        const currentHash = hash(current);
        if (ifMatch !== currentHash) {
          const { data } = readTasks();
          return json(res, 409, { error: 'Conflict', ...data, hash: currentHash });
        }
      }

      const toWrite = JSON.stringify({ tasks: incoming.tasks ?? [] }, null, 2);
      writeFileSync(TASKS_FILE, toWrite, 'utf8');
      const newHash = hash(toWrite);
      return json(res, 200, { tasks: incoming.tasks ?? [], hash: newHash }, { ETag: newHash });
    }

    return json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    console.error('[tasks-api] Erro:', err.message);
    return json(res, 500, { error: 'Internal server error' });
  }
});

// Escuta apenas em loopback — acesso externo via nginx reverse proxy
server.listen(PORT, '127.0.0.1', () => {
  console.log(`[tasks-api] Rodando em http://127.0.0.1:${PORT}`);
  console.log(`[tasks-api] Arquivo: ${TASKS_FILE}`);
});
