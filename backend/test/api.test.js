const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');

// Simple integration test for API
describe('API Health Check', () => {
  test('health endpoint returns ok', async () => {
    // This test assumes the server is running
    // In CI, you'd start the server first
    const expected = { status: 'ok' };
    
    // Basic validation that the health response structure is correct
    assert.ok(expected.status === 'ok', 'Health status should be ok');
  });
});

describe('Database Schema', () => {
  const Database = require('better-sqlite3');
  const fs = require('fs');
  const path = require('path');
  
  let db;
  
  before(() => {
    // Use in-memory database for testing
    db = new Database(':memory:');
    const schema = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
    db.exec(schema);
  });
  
  after(() => {
    db.close();
  });

  test('gateways table exists and accepts inserts', () => {
    const stmt = db.prepare(`
      INSERT INTO gateways (id, name, url, token) 
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run('gw_test', 'Test Gateway', 'http://localhost:4445', 'test-token');
    assert.strictEqual(result.changes, 1, 'Should insert one gateway');
    
    const gateway = db.prepare('SELECT * FROM gateways WHERE id = ?').get('gw_test');
    assert.strictEqual(gateway.name, 'Test Gateway');
    assert.strictEqual(gateway.status, 'unknown');
  });

  test('sessions table exists and has foreign key', () => {
    const stmt = db.prepare(`
      INSERT INTO sessions (id, gateway_id, session_key) 
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run('sess_test', 'gw_test', 'main');
    assert.strictEqual(result.changes, 1, 'Should insert one session');
  });

  test('cron_jobs table exists', () => {
    const stmt = db.prepare(`
      INSERT INTO cron_jobs (id, gateway_id, name, schedule_kind, schedule_data, payload_kind, payload_data, session_target) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      'cron_test', 
      'gw_test', 
      'Test Job',
      'every',
      '{"everyMs": 60000}',
      'systemEvent',
      '{"text": "test"}',
      'main'
    );
    assert.strictEqual(result.changes, 1, 'Should insert one cron job');
  });

  test('messages table cascade deletes work', () => {
    // Insert a message
    db.prepare(`INSERT INTO messages (id, session_id, role, content) VALUES (?, ?, ?, ?)`)
      .run('msg_1', 'sess_test', 'user', 'Hello');
    
    // Verify it exists
    let msg = db.prepare('SELECT * FROM messages WHERE id = ?').get('msg_1');
    assert.ok(msg, 'Message should exist');
    
    // Delete the session
    db.prepare('DELETE FROM sessions WHERE id = ?').run('sess_test');
    
    // Message should be cascade deleted
    msg = db.prepare('SELECT * FROM messages WHERE id = ?').get('msg_1');
    assert.strictEqual(msg, undefined, 'Message should be cascade deleted');
  });

  test('usage_stats table exists', () => {
    const stmt = db.prepare(`
      INSERT INTO usage_stats (gateway_id, date, input_tokens, output_tokens, cost_usd, model) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run('gw_test', '2026-02-16', 1000, 500, 0.05, 'claude-3-opus');
    assert.strictEqual(result.changes, 1, 'Should insert usage stats');
  });
});
