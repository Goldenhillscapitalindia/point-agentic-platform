// Authenticated chat. OpenAI credentials and resource IDs never come from the browser.
const core = require('../chat-core');
const snapshots = require('../server/portfolio-data.json');

function createHandler({env=process.env, fetcher=globalThis.fetch, data=snapshots, auth}={}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status, value) => res.status(status).json(value);
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return send(405, {error:'Use the question form to send a message.'});
    }
    if (!(req.headers['content-type'] || '').startsWith('application/json'))
      return send(415, {error:'Send a JSON question.'});
    if (req.headers['sec-fetch-site'] === 'cross-site')
      return send(403, {error:'Open Portfolio Intelligence on this website.'});
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || JSON.stringify(body).length > 40000) throw new Error();
    } catch { return send(400, {error:'This question is too large or invalid.'}); }
    const {surface, fundId, question, history=[]} = body;
    const snapshot = data.find(s=>s.surface===surface && s.fundId===fundId);
    if (!snapshot || typeof question !== 'string' || !question.trim() || question.length > 4000 ||
        !Array.isArray(history) || history.length > 10 || history.some(m=>!m ||
          !['user','assistant'].includes(m.role) || typeof m.content !== 'string' || m.content.length > 8000))
      return send(400, {error:'Choose a valid fund and enter a question under 4,000 characters.'});
    if (/sk-[A-Za-z0-9_-]{12,}/.test(question + history.map(m=>m.content).join('')))
      return send(400, {error:'Remove credentials from your message.'});
    let user;
    try { user = await (auth || require('../server/auth').getDefaultAuth()).getUser(req); }
    catch { return send(503, {error:'Sign-in is temporarily unavailable. Please try again later.'}); }
    if (!user) return send(401, {error:'Your session has ended. Please sign in again.'});
    if (!user.funds.includes(fundId)) return send(403, {error:'Your account does not have access to this fund.'});
    const key = env.OPENAI_API_KEY?.trim();
    if (!key) return send(503, {error:'Portfolio Intelligence is not configured yet. Please contact the site owner.'});
    const vectorStoreId = (surface==='terminal' ? env.OPENAI_TERMINAL_VECTOR_STORE_ID : env.OPENAI_VECTOR_STORE_ID)?.trim() || '';
    if (vectorStoreId && !core.STORE_ID.test(vectorStoreId))
      return send(503, {error:'Portfolio Intelligence configuration needs attention. Please contact the site owner.'});
    const client = core.createClient(fetcher);
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(), 55000);
    try {
      client.connect(key);
      const result = await client.ask({snapshot,question:question.trim(),
        history:history.map(m=>({role:m.role,content:m.content})),vectorStoreId,
        model:env.OPENAI_MODEL?.trim() || core.MODEL,signal:controller.signal});
      return send(200, result);
    } catch(error) {
      // Upstream bodies/headers and environment values are never returned or logged.
      if (error.status===429) return send(429, {error:'Portfolio Intelligence is busy or its usage allowance has been reached. Please try again later.'});
      if (error.name==='AbortError') return send(504, {error:'The answer took too long. Try a shorter question.'});
      return send(502, {error:'Portfolio Intelligence could not complete this answer. Please retry; if this continues, contact the site owner.'});
    } finally {clearTimeout(timer);client.disconnect();}
  };
}
module.exports = createHandler();
module.exports.createHandler = createHandler;
