const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createFileStore, createRedisStore } = require('../server/auth-store');

test('file store preserves concurrent updates across instances and reopen', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'point-store-test-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const a = createFileStore({ directory });
  const b = createFileStore({ directory });
  await Promise.all(Array.from({ length: 12 }, (_, i) => (i % 2 ? a : b).createUser({ id: String(i), email: `user${i}@example.test` })));
  const reopened = createFileStore({ directory });
  for (let i = 0; i < 12; i++) assert.equal((await reopened.getUserByEmail(`user${i}@example.test`)).id, String(i));
  assert.equal(await reopened.createUser({ id: 'duplicate', email: 'user0@example.test' }), false);
});

test('Redis adapter uses atomic creation, expiring sessions and atomic rate counters', async () => {
  const calls = [];
  const store = createRedisStore({ url: 'https://redis.example.test', token: 'test-token', fetchImpl: async (url, options) => {
    const command = JSON.parse(options.body);
    calls.push({ url, options, command });
    return { ok: true, json: async () => ({ result: command[0] === 'EVAL' && command[1].includes('INCR') ? [1, 1000] : command[0] === 'EVAL' ? 1 : 'OK' }) };
  } });
  assert.equal(await store.createUser({ id: 'id1', email: 'user@example.test' }), true);
  await store.putSession('session-hash', { userId: 'id1', expiresAt: Date.now() + 7000 }, 7000);
  assert.deepEqual(await store.consumeRateLimit('ip-hash', 1000, Date.now()), { count: 1, retryAfter: 1 });
  assert.equal(calls[0].command[0], 'EVAL');
  assert.ok(calls[0].command[1].includes('SETNX'));
  assert.equal(calls[1].command[0], 'SET');
  assert.ok(calls[1].command.includes('PX'));
  assert.equal(calls[2].command[0], 'EVAL');
  assert.ok(calls[2].command[1].includes('PEXPIRE'));
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-token');
});

test('Redis adapter rejects failed storage responses instead of accepting login', async () => {
  const store = createRedisStore({ url: 'https://redis.example.test', token: 'test-token', fetchImpl: async () => ({ ok: false, status: 503 }) });
  await assert.rejects(() => store.getUserByEmail('user@example.test'), /Authentication is temporarily unavailable/);
});
