/**
 * OpenClaw Dashboard - Backend
 * Express server with SQLite database
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
const dbPath = path.join(__dirname, 'data', 'dashboard.db');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

console.log('Database initialized at:', dbPath);

// ========== GATEWAYS ==========

// List all gateways
app.get('/api/gateways', (req, res) => {
  const gateways = db.prepare('SELECT * FROM gateways ORDER BY created_at DESC').all();
  res.json(gateways);
});

// Get single gateway
app.get('/api/gateways/:id', (req, res) => {
  const gateway = db.prepare('SELECT * FROM gateways WHERE id = ?').get(req.params.id);
  if (!gateway) {
    return res.status(404).json({ error: 'Gateway not found' });
  }
  res.json(gateway);
});

// Create gateway
app.post('/api/gateways', (req, res) => {
  const { name, url, token } = req.body;
  if (!name || !url || !token) {
    return res.status(400).json({ error: 'name, url, and token are required' });
  }
  
  const id = `gw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const stmt = db.prepare(`
    INSERT INTO gateways (id, name, url, token, status) 
    VALUES (?, ?, ?, ?, 'unknown')
  `);
  
  try {
    stmt.run(id, name, url, token);
    const gateway = db.prepare('SELECT * FROM gateways WHERE id = ?').get(id);
    res.status(201).json(gateway);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update gateway
app.put('/api/gateways/:id', (req, res) => {
  const { name, url, token, status } = req.body;
  const updates = [];
  const values = [];
  
  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (url !== undefined) { updates.push('url = ?'); values.push(url); }
  if (token !== undefined) { updates.push('token = ?'); values.push(token); }
  if (status !== undefined) { updates.push('status = ?'); values.push(status); }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  updates.push("updated_at = strftime('%s', 'now')");
  values.push(req.params.id);
  
  const stmt = db.prepare(`UPDATE gateways SET ${updates.join(', ')} WHERE id = ?`);
  const result = stmt.run(...values);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Gateway not found' });
  }
  
  const gateway = db.prepare('SELECT * FROM gateways WHERE id = ?').get(req.params.id);
  res.json(gateway);
});

// Delete gateway
app.delete('/api/gateways/:id', (req, res) => {
  const result = db.prepare('DELETE FROM gateways WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Gateway not found' });
  }
  res.json({ success: true });
});

// ========== OPENCLAW PROXY ==========

// Proxy requests to OpenClaw gateway
app.post('/api/gateways/:id/proxy', async (req, res) => {
  const gateway = db.prepare('SELECT * FROM gateways WHERE id = ?').get(req.params.id);
  if (!gateway) {
    return res.status(404).json({ error: 'Gateway not found' });
  }
  
  const { endpoint, method = 'GET', body } = req.body;
  if (!endpoint) {
    return res.status(400).json({ error: 'endpoint is required' });
  }
  
  try {
    const url = `${gateway.url}${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${gateway.token}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    // Update last_seen if successful
    if (response.ok) {
      db.prepare("UPDATE gateways SET status = 'online', last_seen_at = strftime('%s', 'now') WHERE id = ?")
        .run(req.params.id);
    }
    
    res.status(response.status).json(data);
  } catch (err) {
    db.prepare("UPDATE gateways SET status = 'error' WHERE id = ?").run(req.params.id);
    res.status(500).json({ error: err.message });
  }
});

// ========== SESSIONS ==========

// List sessions for a gateway
app.get('/api/gateways/:gatewayId/sessions', (req, res) => {
  const sessions = db.prepare(`
    SELECT * FROM sessions 
    WHERE gateway_id = ? 
    ORDER BY last_message_at DESC
  `).all(req.params.gatewayId);
  res.json(sessions);
});

// Sync sessions from OpenClaw
app.post('/api/gateways/:id/sync-sessions', async (req, res) => {
  const gateway = db.prepare('SELECT * FROM gateways WHERE id = ?').get(req.params.id);
  if (!gateway) {
    return res.status(404).json({ error: 'Gateway not found' });
  }
  
  try {
    const url = `${gateway.url}/sessions`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${gateway.token}` }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const sessions = data.sessions || [];
    
    // Upsert sessions
    const upsert = db.prepare(`
      INSERT INTO sessions (id, gateway_id, session_key, kind, channel, model, last_message_at, message_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        kind = excluded.kind,
        channel = excluded.channel,
        model = excluded.model,
        last_message_at = excluded.last_message_at,
        message_count = excluded.message_count,
        updated_at = strftime('%s', 'now')
    `);
    
    const upsertMany = db.transaction((sessions) => {
      for (const s of sessions) {
        const id = `${gateway.id}_${s.sessionKey}`;
        upsert.run(
          id,
          gateway.id,
          s.sessionKey,
          s.kind || null,
          s.channel || null,
          s.model || null,
          s.lastMessageAt ? Math.floor(new Date(s.lastMessageAt).getTime() / 1000) : null,
          s.messageCount || 0
        );
      }
    });
    
    upsertMany(sessions);
    
    db.prepare("UPDATE gateways SET status = 'online', last_seen_at = strftime('%s', 'now') WHERE id = ?")
      .run(gateway.id);
    
    res.json({ synced: sessions.length });
  } catch (err) {
    db.prepare("UPDATE gateways SET status = 'error' WHERE id = ?").run(gateway.id);
    res.status(500).json({ error: err.message });
  }
});

// ========== CRON JOBS ==========

// List cron jobs for a gateway
app.get('/api/gateways/:gatewayId/cron', (req, res) => {
  const jobs = db.prepare(`
    SELECT * FROM cron_jobs 
    WHERE gateway_id = ? 
    ORDER BY created_at DESC
  `).all(req.params.gatewayId);
  res.json(jobs);
});

// Sync cron jobs from OpenClaw
app.post('/api/gateways/:id/sync-cron', async (req, res) => {
  const gateway = db.prepare('SELECT * FROM gateways WHERE id = ?').get(req.params.id);
  if (!gateway) {
    return res.status(404).json({ error: 'Gateway not found' });
  }
  
  try {
    const url = `${gateway.url}/cron?includeDisabled=true`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${gateway.token}` }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const jobs = data.jobs || [];
    
    // Clear existing and insert fresh
    db.prepare('DELETE FROM cron_jobs WHERE gateway_id = ?').run(gateway.id);
    
    const insert = db.prepare(`
      INSERT INTO cron_jobs (id, gateway_id, name, schedule_kind, schedule_data, 
        payload_kind, payload_data, session_target, enabled, last_run_at, next_run_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertMany = db.transaction((jobs) => {
      for (const j of jobs) {
        insert.run(
          `${gateway.id}_${j.jobId || j.id}`,
          gateway.id,
          j.name || null,
          j.schedule?.kind || null,
          JSON.stringify(j.schedule || {}),
          j.payload?.kind || null,
          JSON.stringify(j.payload || {}),
          j.sessionTarget || null,
          j.enabled ? 1 : 0,
          j.lastRunAt ? Math.floor(new Date(j.lastRunAt).getTime() / 1000) : null,
          j.nextRunAt ? Math.floor(new Date(j.nextRunAt).getTime() / 1000) : null
        );
      }
    });
    
    insertMany(jobs);
    res.json({ synced: jobs.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== MESSAGES (Conversation History) ==========

// Get messages for a session
app.get('/api/sessions/:sessionId/messages', (req, res) => {
  const messages = db.prepare(`
    SELECT * FROM messages 
    WHERE session_id = ? 
    ORDER BY timestamp ASC
  `).all(req.params.sessionId);
  res.json(messages);
});

// Sync messages from OpenClaw gateway
app.post('/api/gateways/:id/sessions/:sessionKey/sync-messages', async (req, res) => {
  const gateway = db.prepare('SELECT * FROM gateways WHERE id = ?').get(req.params.id);
  if (!gateway) {
    return res.status(404).json({ error: 'Gateway not found' });
  }
  
  const sessionId = `${gateway.id}_${req.params.sessionKey}`;
  
  try {
    const url = `${gateway.url}/sessions/${encodeURIComponent(req.params.sessionKey)}/history?limit=100`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${gateway.token}` }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const messages = data.messages || [];
    
    // Clear existing and insert fresh
    db.prepare('DELETE FROM messages WHERE session_id = ?').run(sessionId);
    
    const insert = db.prepare(`
      INSERT INTO messages (id, session_id, role, content, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const insertMany = db.transaction((msgs) => {
      for (let i = 0; i < msgs.length; i++) {
        const m = msgs[i];
        const id = `${sessionId}_${i}`;
        insert.run(
          id,
          sessionId,
          m.role || 'user',
          typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
          m.timestamp ? Math.floor(new Date(m.timestamp).getTime() / 1000) : null
        );
      }
    });
    
    insertMany(messages);
    res.json({ synced: messages.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== USAGE STATS ==========

// Get usage stats for a gateway
app.get('/api/gateways/:id/usage', (req, res) => {
  const { days = 7 } = req.query;
  const stats = db.prepare(`
    SELECT 
      date,
      SUM(input_tokens) as input_tokens,
      SUM(output_tokens) as output_tokens,
      SUM(cost_usd) as cost_usd,
      model
    FROM usage_stats 
    WHERE gateway_id = ?
      AND date >= date('now', '-' || ? || ' days')
    GROUP BY date, model
    ORDER BY date DESC
  `).all(req.params.id, days);
  res.json(stats);
});

// Sync usage from OpenClaw gateway (session status)
app.post('/api/gateways/:id/sync-usage', async (req, res) => {
  const gateway = db.prepare('SELECT * FROM gateways WHERE id = ?').get(req.params.id);
  if (!gateway) {
    return res.status(404).json({ error: 'Gateway not found' });
  }
  
  try {
    // Get session status which includes usage info
    const url = `${gateway.url}/status`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${gateway.token}` }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const today = new Date().toISOString().split('T')[0];
    
    // Extract usage info if available
    if (data.usage) {
      const upsert = db.prepare(`
        INSERT INTO usage_stats (gateway_id, session_id, date, input_tokens, output_tokens, cost_usd, model)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(gateway_id, date, model) DO UPDATE SET
          input_tokens = excluded.input_tokens,
          output_tokens = excluded.output_tokens,
          cost_usd = excluded.cost_usd
      `);
      
      upsert.run(
        gateway.id,
        null, // aggregated
        today,
        data.usage.inputTokens || 0,
        data.usage.outputTokens || 0,
        data.usage.costUsd || 0,
        data.model || 'unknown'
      );
    }
    
    db.prepare("UPDATE gateways SET status = 'online', last_seen_at = strftime('%s', 'now') WHERE id = ?")
      .run(gateway.id);
    
    res.json({ synced: true, data: data.usage || null });
  } catch (err) {
    db.prepare("UPDATE gateways SET status = 'error' WHERE id = ?").run(gateway.id);
    res.status(500).json({ error: err.message });
  }
});

// ========== LOGS (via proxy) ==========

// Get logs from gateway (proxied)
app.get('/api/gateways/:id/logs', async (req, res) => {
  const gateway = db.prepare('SELECT * FROM gateways WHERE id = ?').get(req.params.id);
  if (!gateway) {
    return res.status(404).json({ error: 'Gateway not found' });
  }
  
  const { limit = 100, level = 'info' } = req.query;
  
  try {
    // OpenClaw doesn't have a logs endpoint by default, so we'll try /status
    // and return basic info. In production, you'd connect to actual log streams
    const url = `${gateway.url}/status`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${gateway.token}` }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return status as a log entry for now
    const logs = [{
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Gateway status: ${data.status || 'ok'}`,
      meta: data
    }];
    
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message, logs: [] });
  }
});

// ========== HEALTH ==========

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========== START SERVER ==========

app.listen(PORT, () => {
  console.log(`OpenClaw Dashboard backend running on port ${PORT}`);
});

module.exports = { app, db };
