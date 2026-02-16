-- OpenClaw Dashboard Database Schema
-- SQLite3

-- Gateways: cada instancia de OpenClaw conectada
CREATE TABLE IF NOT EXISTS gateways (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  token TEXT NOT NULL,
  status TEXT DEFAULT 'unknown', -- online, offline, error, unknown
  last_seen_at INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Sessions: sesiones activas por gateway
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  gateway_id TEXT NOT NULL,
  session_key TEXT NOT NULL,
  kind TEXT, -- main, isolated, etc
  channel TEXT, -- whatsapp, telegram, etc
  model TEXT,
  last_message_at INTEGER,
  message_count INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (gateway_id) REFERENCES gateways(id) ON DELETE CASCADE
);

-- Messages: historial de mensajes (cache local)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL, -- user, assistant, system
  content TEXT,
  timestamp INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Cron Jobs: trabajos programados por gateway
CREATE TABLE IF NOT EXISTS cron_jobs (
  id TEXT PRIMARY KEY,
  gateway_id TEXT NOT NULL,
  name TEXT,
  schedule_kind TEXT, -- at, every, cron
  schedule_data TEXT, -- JSON con los detalles del schedule
  payload_kind TEXT, -- systemEvent, agentTurn
  payload_data TEXT, -- JSON con el payload
  session_target TEXT, -- main, isolated
  enabled INTEGER DEFAULT 1,
  last_run_at INTEGER,
  next_run_at INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (gateway_id) REFERENCES gateways(id) ON DELETE CASCADE
);

-- Usage Stats: estadísticas de uso (tokens, costos)
CREATE TABLE IF NOT EXISTS usage_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gateway_id TEXT NOT NULL,
  session_id TEXT,
  date TEXT NOT NULL, -- YYYY-MM-DD
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_usd REAL DEFAULT 0,
  model TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (gateway_id) REFERENCES gateways(id) ON DELETE CASCADE
);

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_sessions_gateway ON sessions(gateway_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_cron_jobs_gateway ON cron_jobs(gateway_id);
CREATE INDEX IF NOT EXISTS idx_usage_stats_gateway_date ON usage_stats(gateway_id, date);
