'use strict';
const https = require('https');
const { URL } = require('url');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
function req(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const o = { hostname: u.hostname, path: u.pathname + u.search, method: 'GET', headers: Object.assign({ 'User-Agent': UA, Accept: opts.accept || 'application/json' }, opts.headers || {}) };
    const r = https.request(o, resp => { let d = ''; resp.on('data', c => d += c); resp.on('end', () => resolve({ status: resp.statusCode, headers: resp.headers, body: d })); });
    r.on('error', reject);
    r.setTimeout(20000, () => { r.destroy(); reject(new Error('timeout')); });
    r.end();
  });
}
(async () => {
  const fc = await req('https://fc.yahoo.com');
  const cookies = (fc.headers['set-cookie'] || []).map(c => c.split(';')[0]);
  let loc = 'https://finance.yahoo.com/quote/PLTR';
  for (let i = 0; i < 5; i++) {
    const r = await req(loc, { headers: { Cookie: cookies.join('; ') }, accept: 'text/html' });
    (r.headers['set-cookie'] || []).forEach(c => cookies.push(c.split(';')[0]));
    if (r.status >= 300 && r.status < 400 && r.headers.location) {
      loc = r.headers.location.startsWith('http') ? r.headers.location : new URL(r.headers.location, loc).href;
      continue;
    }
    break;
  }
  const crumb = (await req('https://query2.finance.yahoo.com/v1/test/getcrumb', { headers: { Cookie: cookies.join('; ') }, accept: 'text/plain' })).body.trim();
  const H = { Cookie: cookies.join('; ') };
  const mods = 'defaultKeyStatistics,majorHoldersBreakdown,institutionOwnership,fundOwnership';
  const qs = await req(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/PLTR?modules=${mods}&crumb=${encodeURIComponent(crumb)}`, { headers: H });
  const r = JSON.parse(qs.body).quoteSummary.result[0];
  const raw = o => o && o.raw != null ? o.raw : o;
  const ks = r.defaultKeyStatistics || {};
  const mh = r.majorHoldersBreakdown || {};
  console.log('SHORT', {
    si: raw(ks.shortPercentOfFloat), shares: raw(ks.sharesShort), ratio: raw(ks.shortRatio),
    date: ks.dateShortInterest, prev: raw(ks.sharesShortPriorMonth),
    inst: raw(mh.institutionsPercentHeld), insider: raw(mh.insidersPercentHeld),
    instCount: raw(mh.institutionsCount)
  });
  const own = ((r.institutionOwnership || {}).ownershipList || []).slice(0, 4);
  console.log('HOLDERS', own.map(h => ({
    org: h.organization, pct: raw(h.pctHeld), chg: raw(h.pctChange), pos: raw(h.position), report: h.reportDate
  })));
  const opt = await req('https://query2.finance.yahoo.com/v7/finance/options/PLTR?crumb=' + encodeURIComponent(crumb), { headers: H });
  console.log('OPT status', opt.status, opt.body.slice(0, 500));
  if (opt.status === 200) {
    const o = JSON.parse(opt.body).optionChain.result[0];
    const calls = (o.options[0].calls || []).slice(0, 3);
    const puts = (o.options[0].puts || []).slice(0, 3);
    console.log('spot', o.quote.regularMarketPrice, 'exp', o.options[0].expirationDate);
    console.log('call0', calls[0] && { s: calls[0].strike, iv: calls[0].impliedVolatility, bid: calls[0].bid });
    console.log('put0', puts[0] && { s: puts[0].strike, iv: puts[0].impliedVolatility });
  }
})().catch(e => { console.error(e); process.exit(1); });
