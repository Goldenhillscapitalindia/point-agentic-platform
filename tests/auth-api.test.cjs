const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createAuthService } = require('../server/auth');
const { createFileStore } = require('../server/auth-store');
const { createHandler } = require('../api/auth');

async function fixture(t, options = {}) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'point-auth-test-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const store = createFileStore({ directory });
  const auth = createAuthService({ store, env: {}, ...options });
  return { directory, store, auth, handler: createHandler({ auth }) };
}

async function request(handler, { method = 'POST', body, cookie, origin = 'http://localhost:4178', headers = {}, ip = '127.0.0.1' } = {}) {
  const result = { headers: {} };
  const req = { method, body, headers: { host: 'localhost:4178', origin, 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...headers }, socket: { remoteAddress: ip } };
  const res = {
    setHeader(name, value) { result.headers[name.toLowerCase()] = value; },
    end(value) { result.body = value ? JSON.parse(value) : null; result.status = this.statusCode; },
  };
  await handler(req, res);
  return result;
}

const credentials = { name: 'Example User', email: 'example@example.test', password: 'Correct password 123!' };
const cookieOf = (result) => result.headers['set-cookie'].split(';')[0];

test('signup persists a user, issues a protected cookie, and restores the session', async (t) => {
  const { handler, directory } = await fixture(t);
  const result = await request(handler, { body: { action: 'signup', ...credentials, role: 'admin', funds: ['digital'] } });
  assert.equal(result.status, 201);
  assert.equal(result.body.user.role, 'user');
  assert.deepEqual(result.body.user.funds, ['alpha', 'neutral']);
  assert.equal(result.body.user.email, credentials.email);
  assert.ok(!JSON.stringify(result.body).includes('password'));
  assert.match(result.headers['set-cookie'], /HttpOnly/);
  assert.match(result.headers['set-cookie'], /SameSite=Lax/);
  const session = await request(handler, { method: 'GET', cookie: cookieOf(result) });
  assert.equal(session.body.user.id, result.body.user.id);
  const saved = await fs.readFile(path.join(directory, 'auth.json'), 'utf8');
  assert.ok(!saved.includes(credentials.password));
  assert.ok(!saved.includes(cookieOf(result).split('=')[1]));
  assert.match(saved, /scrypt/);
});

test('credentials are checked, email is normalized, and logout revokes the session', async (t) => {
  const { handler } = await fixture(t);
  const created = await request(handler, { body: { action: 'signup', ...credentials } });
  const invalid = await request(handler, { body: { action: 'login', email: credentials.email, password: 'Wrong password 123!' } });
  assert.equal(invalid.status, 401);
  const unknown = await request(handler, { body: { action: 'login', email: 'missing@example.test', password: 'Wrong password 123!' } });
  assert.equal(unknown.status, 401);
  assert.equal(invalid.body.error, unknown.body.error);
  const login = await request(handler, { body: { action: 'login', email: ' EXAMPLE@EXAMPLE.TEST ', password: credentials.password }, cookie: cookieOf(created) });
  assert.equal(login.status, 200);
  assert.notEqual(cookieOf(login), cookieOf(created));
  assert.equal((await request(handler, { method: 'GET', cookie: cookieOf(created) })).body.user, null);
  const logout = await request(handler, { body: { action: 'logout' }, cookie: cookieOf(login) });
  assert.equal(logout.status, 200);
  assert.match(logout.headers['set-cookie'], /Max-Age=0/);
  assert.equal((await request(handler, { method: 'GET', cookie: cookieOf(login) })).body.user, null);
});

test('duplicate and concurrent signup cannot create multiple users for an email', async (t) => {
  const { handler } = await fixture(t);
  const results = await Promise.all([1, 2].map(() => request(handler, { body: { action: 'signup', ...credentials } })));
  assert.deepEqual(results.map((result) => result.status).sort(), [201, 409]);
  const duplicate = await request(handler, { body: { action: 'signup', ...credentials, email: 'EXAMPLE@EXAMPLE.TEST' } });
  assert.equal(duplicate.status, 409);
});

test('rejects invalid fields, oversized requests, and cross-site mutations', async (t) => {
  const { handler } = await fixture(t);
  for (const patch of [{ name: 'A' }, { email: 'invalid' }, { password: 'short' }, { password: 'a'.repeat(129) }]) {
    assert.equal((await request(handler, { body: { action: 'signup', ...credentials, ...patch } })).status, 400);
  }
  assert.equal((await request(handler, { body: { action: 'signup', ...credentials }, origin: 'https://evil.example' })).status, 403);
  assert.equal((await request(handler, { body: { action: 'logout' }, headers: { 'sec-fetch-site': 'cross-site' } })).status, 403);
  assert.equal((await request(handler, { body: { action: 'logout' }, headers: { 'content-type': 'text/plain' } })).status, 415);
  assert.equal((await request(handler, { body: { action: 'signup', ...credentials, extra: 'x'.repeat(20000) } })).status, 413);
  assert.equal((await request(handler, { method: 'DELETE' })).status, 405);
});

test('sessions expire and invalid cookie values are anonymous', async (t) => {
  let now = Date.now();
  const { handler } = await fixture(t, { now: () => now });
  const result = await request(handler, { body: { action: 'signup', ...credentials } });
  now += 7 * 24 * 60 * 60 * 1000 + 1;
  assert.equal((await request(handler, { method: 'GET', cookie: cookieOf(result) })).body.user, null);
  assert.equal((await request(handler, { method: 'GET', cookie: 'point_session=bad' })).body.user, null);
});

test('limits repeated authentication attempts with durable counters', async (t) => {
  let now = Date.now();
  const { handler, store } = await fixture(t, { now: () => now, rateLimits: { loginIp: 2, loginEmail: 2, windowMs: 1000 } });
  const body = { action: 'login', email: credentials.email, password: credentials.password };
  assert.equal((await request(handler, { body })).status, 401);
  assert.equal((await request(handler, { body })).status, 401);
  const otherHandler = createHandler({ auth: createAuthService({ store, env: {}, now: () => now, rateLimits: { loginIp: 2, loginEmail: 2, windowMs: 1000 } }) });
  const limited = await request(otherHandler, { body });
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers['retry-after']) > 0);
  now += 1001;
  assert.equal((await request(otherHandler, { body })).status, 401);
});

test('production without durable configuration fails closed and production cookies are secure', async (t) => {
  const unconfigured = createHandler({ auth: createAuthService({ env: { NODE_ENV: 'production' } }) });
  assert.equal((await request(unconfigured, { method: 'GET' })).status, 503);
  const { handler } = await fixture(t, { env: { NODE_ENV: 'production' } });
  const result = await request(handler, { body: { action: 'signup', ...credentials }, origin: 'https://localhost:4178' });
  assert.equal(result.status, 201);
  assert.match(result.headers['set-cookie'], /; Secure/);
});

test('server-provisioned admin gets all funds and never promotes an existing signup', async (t) => {
  const adminEnv = { POINT_ADMIN_EMAIL: 'admin@example.test', POINT_ADMIN_PASSWORD: 'Admin password 123!', POINT_ADMIN_NAME: 'Fund Admin' };
  const { handler, store } = await fixture(t, { env: adminEnv });
  const admin = await request(handler, { body: { action: 'login', email: adminEnv.POINT_ADMIN_EMAIL, password: adminEnv.POINT_ADMIN_PASSWORD } });
  assert.equal(admin.status, 200);
  assert.equal(admin.body.user.role, 'admin');
  assert.deepEqual(admin.body.user.funds, ['alpha', 'global', 'neutral', 'digital']);
  await request(handler, { body: { action: 'signup', ...credentials } });
  const nextAuth = createAuthService({ store, env: { POINT_ADMIN_EMAIL: credentials.email, POINT_ADMIN_PASSWORD: credentials.password } });
  const next = await request(createHandler({ auth: nextAuth }), { body: { action: 'login', email: credentials.email, password: credentials.password } });
  assert.equal(next.body.user.role, 'user');
});
