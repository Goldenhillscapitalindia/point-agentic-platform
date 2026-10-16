const { getDefaultAuth } = require('../server/auth');
const BODY_LIMIT = 8192;

const failure = (status, message) => Object.assign(new Error(message), { status });

async function readBody(req) {
  if (Number(req.headers?.['content-length']) > BODY_LIMIT) throw failure(413, 'This request is too large.');
  let value = req.body;
  if (value === undefined && req[Symbol.asyncIterator]) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += bytes.length;
      if (size > BODY_LIMIT) throw failure(413, 'This request is too large.');
      chunks.push(bytes);
    }
    value = Buffer.concat(chunks);
  }
  if (Buffer.isBuffer(value)) value = value.toString('utf8');
  try {
    const raw = typeof value === 'string' ? value : JSON.stringify(value);
    if (typeof raw !== 'string') throw failure(400, 'Send a valid sign-in request.');
    if (Buffer.byteLength(raw) > BODY_LIMIT) throw failure(413, 'This request is too large.');
    const body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw failure(400, 'Send a valid sign-in request.');
    return body;
  } catch (error) {
    if (error.status) throw error;
    throw failure(400, 'Send a valid sign-in request.');
  }
}

function createHandler({ auth = getDefaultAuth() } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Vary', 'Cookie');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const send = (status, body) => { res.statusCode = status; res.end(JSON.stringify(body)); };
    try {
      if (req.method === 'GET') return send(200, { user: await auth.getUser(req) });
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'GET, POST');
        return send(405, { error: 'Use GET or POST for authentication.' });
      }
      if (!/^application\/json(?:\s*;|$)/i.test(req.headers?.['content-type'] || '')) throw failure(415, 'Send a JSON sign-in request.');
      auth.checkOrigin(req);
      const body = await readBody(req);
      let result;
      if (body.action === 'signup') result = await auth.signup(body, req);
      else if (body.action === 'login') result = await auth.login(body, req);
      else if (body.action === 'logout') result = await auth.logout(req);
      else throw failure(400, 'Choose sign in, create account, or sign out.');
      res.setHeader('Set-Cookie', result.cookie);
      return send(body.action === 'signup' ? 201 : 200, { user: result.user });
    } catch (error) {
      const status = Number.isInteger(error.status) && error.status >= 400 && error.status <= 599 ? error.status : 500;
      if (error.retryAfter) res.setHeader('Retry-After', String(error.retryAfter));
      return send(status, { error: status === 500 ? 'Unable to complete sign in. Please try again.' : error.message });
    }
  };
}

module.exports = createHandler();
module.exports.createHandler = createHandler;
