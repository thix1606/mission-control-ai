#!/usr/bin/env node
// ============================================================
// MICRO API — Mission Control Backend
// ============================================================
// Endpoints:
//   GET  /api/tasks  → lê tasks.json, retorna { tasks, hash }
//   PUT  /api/tasks  → grava tasks.json (lock otimista via If-Match)
//   GET  /api/rates  → lê rates.json, retorna cotações BRL (público)
//
// Variáveis de ambiente:
//   TASKS_API_TOKEN  (obrigatório) — Bearer token para autenticação
//   PORT             (default 3001)
//   TASKS_FILE       (default ./tasks.json)
//   RATES_FILE       (default ./rates.json)
//   CORS_ORIGIN      (default *)
// ============================================================

import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';

const TOKEN      = process.env.TASKS_API_TOKEN;
const PORT       = parseInt(process.env.PORT ?? '3001', 10);
const TASKS_FILE = process.env.TASKS_FILE ?? './tasks.json';
const RATES_FILE = process.env.RATES_FILE ?? './rates.json';
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

// ── Crontab helpers ───────────────────────────────────────

const CRON_FIELD = /^(\*|@\w+|[0-9*\/,\-]+)$/;

function isCronExpression(parts) {
  // @keyword OR 5 valid cron fields
  if (parts.length === 1 && parts[0].startsWith('@')) return true;
  if (parts.length < 6) return false;
  return parts.slice(0, 5).every((p) => CRON_FIELD.test(p));
}

function parseCrontab(raw) {
  const crons = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('#')) {
      // Possibly a disabled cron (# schedule command)
      const rest = trimmed.slice(1).trim();
      const parts = rest.split(/\s+/);
      if (!isCronExpression(parts)) continue; // pure comment line
      const isShorthand = parts[0].startsWith('@');
      const schedule = isShorthand ? parts[0] : parts.slice(0, 5).join(' ');
      const command  = isShorthand ? parts.slice(1).join(' ') : parts.slice(5).join(' ');
      if (!command) continue;
      crons.push({ id: hash(schedule + command), schedule, command, enabled: false });
    } else {
      const parts = trimmed.split(/\s+/);
      if (!isCronExpression(parts)) continue;
      const isShorthand = parts[0].startsWith('@');
      const schedule = isShorthand ? parts[0] : parts.slice(0, 5).join(' ');
      const cmdParts  = isShorthand ? parts.slice(1) : parts.slice(5);
      // Strip inline comment
      const commentIdx = cmdParts.findIndex((p) => p.startsWith('#'));
      const command  = (commentIdx === -1 ? cmdParts : cmdParts.slice(0, commentIdx)).join(' ');
      const comment  = commentIdx !== -1 ? cmdParts.slice(commentIdx + 1).join(' ') : undefined;
      if (!command) continue;
      crons.push({ id: hash(schedule + command), schedule, command, enabled: true, comment });
    }
  }
  return crons;
}

function readCrontab() {
  try {
    const raw = execSync('crontab -l', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { raw, crons: parseCrontab(raw) };
  } catch {
    return { raw: '', crons: [] };
  }
}

function writeCrontab(crons) {
  const lines = crons.map(({ schedule, command, enabled, comment }) => {
    const line = `${schedule} ${command}${comment ? ' # ' + comment : ''}`;
    return enabled ? line : `# ${line}`;
  });
  execSync('crontab -', { input: lines.join('\n') + '\n', encoding: 'utf8' });
}

// ── Server ────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    return res.end();
  }

  // GET /api/crons — lista system crontab (requer auth)
  if (url.pathname === '/api/crons' && req.method === 'GET') {
    if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
    const { crons } = readCrontab();
    return json(res, 200, { crons });
  }

  // PUT /api/crons — atualiza system crontab (requer auth)
  if (url.pathname === '/api/crons' && req.method === 'PUT') {
    if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
    try {
      const body    = await readBody(req);
      const { crons } = JSON.parse(body);
      writeCrontab(crons);
      const { crons: updated } = readCrontab();
      return json(res, 200, { crons: updated });
    } catch (err) {
      console.error('[tasks-api] Erro ao gravar crontab:', err.message);
      return json(res, 500, { error: err.message });
    }
  }

  // GET /api/rates — público (sem autenticação, dados públicos)
  if (url.pathname === '/api/rates' && req.method === 'GET') {
    if (!existsSync(RATES_FILE)) {
      return json(res, 404, { error: 'rates.json não encontrado. Execute o script fetch-rates.mjs.' });
    }
    try {
      const data = JSON.parse(readFileSync(RATES_FILE, 'utf8'));
      return json(res, 200, data);
    } catch {
      return json(res, 500, { error: 'Erro ao ler rates.json' });
    }
  }

  // Demais rotas exigem autenticação
  if (url.pathname !== '/api/tasks') {
    return json(res, 404, { error: 'Not found' });
  }

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
  console.log(`[tasks-api] tasks: ${TASKS_FILE}`);
  console.log(`[tasks-api] rates: ${RATES_FILE}`);
});
