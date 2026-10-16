const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash, randomBytes } = require('node:crypto');

function unavailable() {
  return Object.assign(new Error('Authentication is temporarily unavailable. Please try again later.'), { status: 503 });
}

const digest = (value) => createHash('sha256').update(value).digest('hex');
const queues = new Map();

// All instances in the local server share one queue per file. Read, modify and
// atomic rename stay in the same transaction so concurrent signup cannot race.
function createFileStore({ directory = path.join(process.cwd(), '.point-auth') } = {}) {
  const filename = path.join(path.resolve(directory), 'auth.json');
  async function transaction(update, write = false) {
    const previous = queues.get(filename) || Promise.resolve();
    const pending = previous.catch(() => {}).then(async () => {
      let temporary;
      try {
        await fs.mkdir(path.dirname(filename), { recursive: true, mode: 0o700 });
        let state;
        try {
          state = JSON.parse(await fs.readFile(filename, 'utf8'));
          if (state.version !== 1 || !state.users || !state.emails || !state.sessions || !state.rates) throw unavailable();
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
          state = { version: 1, users: {}, emails: {}, sessions: {}, rates: {} };
        }
        const result = update(state);
        if (write) {
          temporary = `${filename}.${randomBytes(12).toString('hex')}.tmp`;
          await fs.writeFile(temporary, JSON.stringify(state), { encoding: 'utf8', mode: 0o600, flag: 'wx' });
          await fs.rename(temporary, filename);
        }
        return result;
      } catch (cause) {
        if (temporary) await fs.unlink(temporary).catch(() => {});
        throw Object.assign(unavailable(), { cause });
      }
    });
    queues.set(filename, pending);
    try { return await pending; }
    finally { if (queues.get(filename) === pending) queues.delete(filename); }
  }
  return {
    getUserByEmail(email) { return transaction((state) => state.users[state.emails[digest(email)]] || null); },
    getUserById(id) { return transaction((state) => state.users[id] || null); },
    createUser(user) {
      return transaction((state) => {
        const emailKey = digest(user.email);
        if (state.emails[emailKey]) return false;
        state.emails[emailKey] = user.id;
        state.users[user.id] = user;
        return true;
      }, true);
    },
    putSession(key, session) { return transaction((state) => { state.sessions[key] = session; }, true); },
    getSession(key) { return transaction((state) => state.sessions[key] || null); },
    deleteSession(key) { return transaction((state) => { delete state.sessions[key]; }, true); },
    consumeRateLimit(key, windowMs, now) {
      return transaction((state) => {
        for (const [id, rate] of Object.entries(state.rates)) if (rate.expiresAt <= now) delete state.rates[id];
        for (const [id, session] of Object.entries(state.sessions)) if (session.expiresAt <= now) delete state.sessions[id];
        const rate = state.rates[key] || { count: 0, expiresAt: now + windowMs };
        rate.count += 1;
        state.rates[key] = rate;
        return { count: rate.count, retryAfter: Math.max(1, Math.ceil((rate.expiresAt - now) / 1000)) };
      }, true);
    },
  };
}

function createRedisStore({ url, token, fetchImpl = globalThis.fetch } = {}) {
  let endpoint;
  try {
    endpoint = new URL(url);
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || !token) throw unavailable();
  } catch { throw unavailable(); }
  // The hash tag keeps keys used by a Lua transaction in one Redis cluster slot.
  const prefix = 'point:{auth}:v1:';
  async function command(parts) {
    try {
      const response = await fetchImpl(endpoint.href, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(parts), signal: AbortSignal.timeout(10000), redirect: 'error',
      });
      if (!response.ok) throw unavailable();
      const body = await response.json();
      if (!body || body.error || !Object.hasOwn(body, 'result')) throw unavailable();
      return body.result;
    } catch { throw unavailable(); }
  }
  async function getJson(key) {
    const value = await command(['GET', prefix + key]);
    if (value === null) return null;
    try { return typeof value === 'string' ? JSON.parse(value) : value; }
    catch { throw unavailable(); }
  }
  return {
    async getUserByEmail(email) {
      const id = await command(['GET', `${prefix}email:${digest(email)}`]);
      return id ? getJson(`user:${id}`) : null;
    },
    getUserById(id) { return getJson(`user:${id}`); },
    async createUser(user) {
      const script = "if redis.call('SETNX', KEYS[1], ARGV[1]) == 0 then return 0 end redis.call('SET', KEYS[2], ARGV[2]) return 1";
      return Number(await command(['EVAL', script, 2, `${prefix}email:${digest(user.email)}`, `${prefix}user:${user.id}`, user.id, JSON.stringify(user)])) === 1;
    },
    putSession(key, session, ttlMs) { return command(['SET', `${prefix}session:${key}`, JSON.stringify(session), 'PX', ttlMs]); },
    getSession(key) { return getJson(`session:${key}`); },
    deleteSession(key) { return command(['DEL', `${prefix}session:${key}`]); },
    async consumeRateLimit(key, windowMs) {
      const script = "local n = redis.call('INCR', KEYS[1]) if n == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end return {n, redis.call('PTTL', KEYS[1])}";
      const result = await command(['EVAL', script, 1, `${prefix}rate:${key}`, windowMs]);
      if (!Array.isArray(result) || result.length !== 2) throw unavailable();
      return { count: Number(result[0]), retryAfter: Math.max(1, Math.ceil(Number(result[1]) / 1000)) };
    },
  };
}

module.exports = { createFileStore, createRedisStore, unavailable };
