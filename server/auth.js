const { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } = require('node:crypto');
const { promisify } = require('node:util');
const { createFileStore, createRedisStore, unavailable } = require('./auth-store');

const scryptAsync = promisify(scrypt);
const COOKIE_NAME = 'point_session';
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_OPTIONS = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const hash = (value) => createHash('sha256').update(value).digest('hex');
const error = (status, message) => Object.assign(new Error(message), { status });
let dummyPasswordHash;

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scryptAsync(password, salt, 64, PASSWORD_OPTIONS);
  return `scrypt$32768$8$3$${salt}$${key.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const fields = String(stored).split('$');
  if (fields.length !== 6 || fields.slice(0, 4).join('$') !== 'scrypt$32768$8$3' || !/^[a-f0-9]{32}$/.test(fields[4]) || !/^[a-f0-9]{128}$/.test(fields[5])) return false;
  const actual = await scryptAsync(password, fields[4], 64, PASSWORD_OPTIONS);
  return timingSafeEqual(actual, Buffer.from(fields[5], 'hex'));
}

function normalizeEmail(value) {
  if (typeof value !== 'string') throw error(400, 'Enter a valid email address.');
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /[\x00-\x1f\x7f]/.test(email)) throw error(400, 'Enter a valid email address.');
  return email;
}

function validatePassword(value) {
  if (typeof value !== 'string' || value.length < 12 || value.length > 128) throw error(400, 'Use a password between 12 and 128 characters.');
  return value;
}

function normalizeName(value) {
  if (typeof value !== 'string') throw error(400, 'Enter your name (2 to 80 characters).');
  const name = value.trim();
  if (name.length < 2 || name.length > 80 || /[\x00-\x1f\x7f]/.test(name)) throw error(400, 'Enter your name (2 to 80 characters).');
  return name;
}

function publicUser(user) {
  const role = user.role === 'admin' ? 'admin' : 'user';
  return { id: user.id, name: user.name, email: user.email, role,
    funds: role === 'admin' ? ['alpha', 'global', 'neutral', 'digital'] : ['alpha', 'neutral'], createdAt: user.createdAt };
}

function header(req, name) {
  const value = req.headers?.[name];
  return typeof value === 'string' ? value : '';
}

function sessionToken(req) {
  for (const part of header(req, 'cookie').split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE_NAME) {
      const value = rest.join('=');
      return /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
    }
  }
  return null;
}

function createAuthService({ store, env = process.env, now = Date.now, fetchImpl = globalThis.fetch, rateLimits = {} } = {}) {
  const production = env.NODE_ENV === 'production' || Boolean(env.VERCEL && env.VERCEL !== '0');
  const limits = { windowMs: 15 * 60 * 1000, loginIp: 30, loginEmail: 10, signupIp: 5, ...rateLimits };
  let selectedStore = store;
  let ready;

  async function initialize() {
    if (!ready) ready = (async () => {
      if (!selectedStore) {
        const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
        const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
        if (url || token) {
          if (!url || !token) throw unavailable();
          selectedStore = createRedisStore({ url, token, fetchImpl });
        } else {
          if (production) throw unavailable();
          selectedStore = createFileStore({ directory: env.POINT_AUTH_DIR });
        }
      }
      if (env.POINT_ADMIN_EMAIL || env.POINT_ADMIN_PASSWORD) {
        let email, name, password;
        try {
          email = normalizeEmail(env.POINT_ADMIN_EMAIL);
          name = normalizeName(env.POINT_ADMIN_NAME || 'Administrator');
          password = validatePassword(env.POINT_ADMIN_PASSWORD);
        } catch { throw unavailable(); }
        // Existing accounts retain their original role; configuration can never
        // turn a public signup into an administrator.
        if (!await selectedStore.getUserByEmail(email)) {
          await selectedStore.createUser({ id: randomUUID(), email, name, role: 'admin', passwordHash: await hashPassword(password), createdAt: new Date(now()).toISOString() });
        }
      }
      return selectedStore;
    })().catch((failure) => { ready = null; throw failure; });
    return ready;
  }

  function checkOrigin(req) {
    if (header(req, 'sec-fetch-site') === 'cross-site') throw error(403, 'Open the sign-in form on this website.');
    const origin = header(req, 'origin');
    if (!origin) return; // Non-browser clients are permitted; browser POSTs require JSON.
    const protocol = production || req.socket?.encrypted ? 'https' : 'http';
    let expected;
    try { expected = new URL(env.POINT_APP_ORIGIN || `${protocol}://${header(req, 'host')}`).origin; }
    catch { throw error(403, 'Open the sign-in form on this website.'); }
    if (origin !== expected) throw error(403, 'Open the sign-in form on this website.');
  }

  function cookie(value, clear = false) {
    return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : SESSION_TTL / 1000}; Expires=${new Date(clear ? 0 : now() + SESSION_TTL).toUTCString()}${production ? '; Secure' : ''}`;
  }

  async function rateLimit(action, email, req) {
    const db = await initialize();
    // Vercel sets this header at its trusted edge. On the local Node server,
    // forwarded headers are ignored so clients cannot rotate their own IP.
    const ip = env.VERCEL && env.VERCEL !== '0'
      ? header(req, 'x-forwarded-for').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown'
      : req.socket?.remoteAddress || 'unknown';
    const checks = [[`${action}:ip:${hash(ip)}`, action === 'signup' ? limits.signupIp : limits.loginIp]];
    if (action === 'login') checks.push([`login:email:${hash(email)}`, limits.loginEmail]);
    for (const [key, maximum] of checks) {
      const result = await db.consumeRateLimit(key, limits.windowMs, now());
      if (result.count > maximum) throw Object.assign(error(429, 'Too many attempts. Please wait before trying again.'), { retryAfter: result.retryAfter });
    }
  }

  async function createSession(user, req) {
    const db = await initialize();
    const previous = sessionToken(req);
    if (previous) await db.deleteSession(hash(previous));
    const token = randomBytes(32).toString('base64url');
    await db.putSession(hash(token), { userId: user.id, expiresAt: now() + SESSION_TTL }, SESSION_TTL);
    return { user: publicUser(user), cookie: cookie(token) };
  }

  return {
    checkOrigin,
    async getUser(req) {
      const db = await initialize();
      const token = sessionToken(req);
      if (!token) return null;
      const key = hash(token);
      const session = await db.getSession(key);
      if (!session) return null;
      if (!Number.isFinite(session.expiresAt) || session.expiresAt <= now()) { await db.deleteSession(key); return null; }
      const user = await db.getUserById(session.userId);
      return user ? publicUser(user) : null;
    },
    async signup(input, req) {
      const email = normalizeEmail(input.email);
      const name = normalizeName(input.name);
      const password = validatePassword(input.password);
      await rateLimit('signup', email, req);
      const db = await initialize();
      if (await db.getUserByEmail(email)) throw error(409, 'An account with this email already exists. Please sign in.');
      const user = { id: randomUUID(), name, email, role: 'user', passwordHash: await hashPassword(password), createdAt: new Date(now()).toISOString() };
      if (!await db.createUser(user)) throw error(409, 'An account with this email already exists. Please sign in.');
      return createSession(user, req);
    },
    async login(input, req) {
      const email = normalizeEmail(input.email);
      const password = validatePassword(input.password);
      await rateLimit('login', email, req);
      const db = await initialize();
      const user = await db.getUserByEmail(email);
      let stored = user?.passwordHash;
      if (!user) {
        if (!dummyPasswordHash) dummyPasswordHash = hashPassword(randomBytes(32).toString('hex'));
        stored = await dummyPasswordHash;
      }
      if (!await verifyPassword(password, stored) || !user) throw error(401, 'The email or password is incorrect.');
      return createSession(user, req);
    },
    async logout(req) {
      const db = await initialize();
      const token = sessionToken(req);
      if (token) await db.deleteSession(hash(token));
      return { user: null, cookie: cookie('', true) };
    },
  };
}

let defaultAuth;
function getDefaultAuth() {
  if (!defaultAuth) defaultAuth = createAuthService();
  return defaultAuth;
}

module.exports = { createAuthService, getDefaultAuth, COOKIE_NAME };
