#!/usr/bin/env node
/**
 * Fund-flows positioning for the same names shown on Research & Alpha.
 * Short interest: latest FINRA print in force on 12 Oct (30 Sep 2026).
 * 13F: latest complete quarter (30 Jun 2026) — Q3 filings are not due yet.
 * Options skew: put IV minus call IV, solved from 12 Oct last prices (~30 DTE).
 * ETF card: 5-session price change through 12 Oct (not creation dollars).
 */
'use strict';
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const RESEARCH = path.join(__dirname, '..', 'data', 'research-2026-10-12.json');
const OUT = path.join(__dirname, '..', 'data', 'flows-2026-10-12.json');
const AS_OF = '2026-10-12';

const GLOBAL_PROXY = {
  'Nat gas (NG)': 'UNG',
  'Copper (HG)': 'CPER',
  'Brent (BZ)': 'BNO',
  'Oil ETF': 'USO',
  'USD ETF': 'UUP',
  'S&P (ES)': 'SPY',
  'Nasdaq (NQ)': 'QQQ',
  'China (FXI)': 'FXI',
  'JPY (6J)': 'FXY',
  '10Y (ZN)': 'IEF',
  'Crude (CL)': 'USO',
  'Gold (GC)': 'GLD',
  'Gold miners': 'GDX',
  'HY credit': 'HYG',
  'Gold ETF': 'GLD',
  'EM (EEM)': 'EEM',
  'Silver (SI)': 'SLV',
  'EUR (6E)': 'FXE',
  'TLT': 'TLT',
  'Russell 2k': 'IWM'
};
const SPOT_PROXY = { BTC: 'IBIT', ETH: 'ETHA', SOL: 'SOLT' };
const ETF = {
  alpha: [['SPY','SPY',''],['QQQ','QQQ',''],['SMH','SMH',''],['IWM','IWM',''],['XLE','XLE',''],['XLK','XLK',''],['IBIT','IBIT (BTC)','gold'],['ETHA','ETHA (ETH)','gold']],
  global: [['USO','USO',''],['GLD','GLD','gold'],['TLT','TLT',''],['UUP','UUP',''],['FXI','FXI',''],['EEM','EEM',''],['UNG','UNG',''],['HYG','HYG','']],
  neutral: [['XLV','XLV health',''],['XLF','XLF fins',''],['XLK','XLK tech',''],['XLE','XLE energy',''],['XLP','XLP staples',''],['XLY','XLY discr',''],['SPY','SPY','']],
  digital: [['IBIT','IBIT (BTC)','gold'],['ETHA','ETHA (ETH)','gold'],['BITO','BITO','gold'],['WGMI','WGMI miners',''],['BLOK','BLOK',''],['QQQ','QQQ','']]
};

let session = { cookies: '', crumb: '' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
function req(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const o = {
      hostname: u.hostname, path: u.pathname + u.search, method: 'GET',
      headers: Object.assign({ 'User-Agent': UA, Accept: opts.accept || 'application/json,text/plain,*/*', 'Accept-Language': 'en-US,en;q=0.9' }, opts.headers || {})
    };
    const r = https.request(o, resp => { let d = ''; resp.on('data', c => d += c); resp.on('end', () => resolve({ status: resp.statusCode, headers: resp.headers, body: d })); });
    r.on('error', reject);
    r.setTimeout(opts.timeout || 20000, () => { r.destroy(); reject(new Error('timeout ' + url)); });
    r.end();
  });
}
async function reqRetry(url, opts, tries = 4) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await req(url, opts);
      if (r.status === 429 || r.status === 503) { await sleep(700 * (i + 1)); last = r; continue; }
      return r;
    } catch (e) { last = e; await sleep(400 * (i + 1)); }
  }
  if (last && last.status) return last;
  throw last || new Error('failed');
}
async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx); }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}
function auth() { return { Cookie: session.cookies }; }
const raw = o => (o && o.raw != null) ? o.raw : (typeof o === 'number' ? o : null);

async function initSession() {
  const fc = await req('https://fc.yahoo.com');
  const cookies = (fc.headers['set-cookie'] || []).map(c => c.split(';')[0]);
  let loc = 'https://finance.yahoo.com/quote/SPY';
  for (let i = 0; i < 5; i++) {
    const r = await req(loc, { headers: { Cookie: cookies.join('; ') }, accept: 'text/html' });
    (r.headers['set-cookie'] || []).forEach(c => cookies.push(c.split(';')[0]));
    if (r.status >= 300 && r.status < 400 && r.headers.location) {
      loc = r.headers.location.startsWith('http') ? r.headers.location : new URL(r.headers.location, loc).href;
      continue;
    }
    break;
  }
  session.cookies = cookies.join('; ');
  session.crumb = (await req('https://query2.finance.yahoo.com/v1/test/getcrumb', { headers: auth(), accept: 'text/plain' })).body.trim();
  if (!session.crumb || session.crumb.includes('{')) throw new Error('crumb failed');
}

async function getSummary(symbol) {
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=defaultKeyStatistics,majorHoldersBreakdown,institutionOwnership&crumb=${encodeURIComponent(session.crumb)}`;
  const r = await reqRetry(url, { headers: auth() });
  if (r.status !== 200) return null;
  try { return (JSON.parse(r.body).quoteSummary.result || [])[0] || null; } catch { return null; }
}
async function getOptions(symbol) {
  const url = `https://query2.finance.yahoo.com/v7/finance/options/${encodeURIComponent(symbol)}?crumb=${encodeURIComponent(session.crumb)}`;
  const r = await reqRetry(url, { headers: auth() });
  if (r.status !== 200) return null;
  let chain;
  try { chain = (JSON.parse(r.body).optionChain.result || [])[0]; } catch { return null; }
  if (!chain) return null;
  const now = Date.parse(AS_OF + 'T20:00:00Z') / 1000;
  let best = null, bestDist = 1e9;
  for (const d of chain.expirationDates || []) {
    const dte = (d - now) / 86400;
    if (dte < 14 || dte > 60) continue;
    const dist = Math.abs(dte - 30);
    if (dist < bestDist) { best = d; bestDist = dist; }
  }
  chain._targetExp = best;
  if (best && !(chain.options || []).some(o => o.expirationDate === best)) {
    const r2 = await reqRetry(url + '&date=' + best, { headers: auth() });
    if (r2.status === 200) {
      try {
        const next = (JSON.parse(r2.body).optionChain.result || [])[0];
        if (next) { next._targetExp = best; chain = next; }
      } catch { /* keep nearest */ }
    }
  }
  return chain;
}
async function getChart(symbol) {
  const r = await reqRetry(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1mo`, { headers: auth() });
  if (r.status !== 200) return [];
  let j; try { j = JSON.parse(r.body); } catch { return []; }
  const res = j.chart && j.chart.result && j.chart.result[0];
  if (!res) return [];
  const ts = res.timestamp || [];
  const q = (res.indicators.quote || [])[0] || {};
  const bars = [];
  for (let i = 0; i < ts.length; i++) {
    const c = q.close && q.close[i];
    if (c == null) continue;
    const day = new Date(ts[i] * 1000).toISOString().slice(0, 10);
    if (day > AS_OF) continue;
    bars.push({ day, c, v: q.volume ? q.volume[i] : 0 });
  }
  return bars;
}

function normCdf(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + p * Math.abs(x));
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x / 2);
  return 0.5 * (1 + sign * y);
}
function bsPrice(isCall, S, K, T, r, sig) {
  const df = Math.exp(-r * T);
  if (T <= 1e-6 || sig <= 1e-6) return Math.max(isCall ? S - K * df : K * df - S, 0);
  const d1 = (Math.log(S / K) + (r + sig * sig / 2) * T) / (sig * Math.sqrt(T));
  const d2 = d1 - sig * Math.sqrt(T);
  if (isCall) return S * normCdf(d1) - K * df * normCdf(d2);
  return K * df * normCdf(-d2) - S * normCdf(-d1);
}
function impliedVol(isCall, S, K, T, price) {
  const r = 0.04;
  if (!(S > 0) || !(K > 0) || !(T > 0) || !(price > 0.15)) return null;
  const intrinsic = Math.max(isCall ? S - K * Math.exp(-r * T) : K * Math.exp(-r * T) - S, 0);
  if (price < intrinsic + 0.05) return null;
  let lo = 0.05, hi = 2.5;
  if (bsPrice(isCall, S, K, T, r, lo) > price) return lo;
  if (bsPrice(isCall, S, K, T, r, hi) < price) return null;
  for (let i = 0; i < 36; i++) {
    const mid = (lo + hi) / 2;
    if (bsPrice(isCall, S, K, T, r, mid) > price) hi = mid;
    else lo = mid;
  }
  const iv = (lo + hi) / 2;
  return iv >= 0.08 && iv <= 2.2 ? iv : null;
}
function skewOf(chain) {
  if (!chain || !chain.options || !chain.options.length) return null;
  const spot = chain.quote && chain.quote.regularMarketPrice;
  if (!spot) return null;
  const now = Date.parse(AS_OF + 'T20:00:00Z') / 1000;
  const target = chain._targetExp;
  let best = chain.options.find(o => o.expirationDate === target) || null;
  if (!best) {
    let bestDist = 1e9;
    for (const o of chain.options) {
      const dte = (o.expirationDate - now) / 86400;
      if (dte < 14 || dte > 60) continue;
      const dist = Math.abs(dte - 30);
      if (dist < bestDist) { best = o; bestDist = dist; }
    }
  }
  if (!best) return null;
  const T = Math.max(1 / 365, (best.expirationDate - now) / 86400 / 365);
  const calls = (best.calls || []).filter(c => c.lastPrice > 0.15);
  const puts = best.puts || [];
  let pick = null;
  calls.forEach(c => {
    const put = puts.find(p => p.strike === c.strike && p.lastPrice > 0.15);
    if (!put) return;
    const dist = Math.abs(c.strike - spot) / spot;
    if (dist > 0.06) return;
    const vol = (c.volume || 0) + (put.volume || 0);
    if (!pick || dist < pick.dist - 0.005 || (Math.abs(dist - pick.dist) < 0.005 && vol > pick.vol)) {
      pick = { call: c, put, dist, vol };
    }
  });
  if (!pick) return null;
  const callIv = impliedVol(true, spot, pick.call.strike, T, pick.call.lastPrice);
  const putIv = impliedVol(false, spot, pick.put.strike, T, pick.put.lastPrice);
  if (callIv == null || putIv == null) return null;
  return putIv - callIv;
}
function skewLabel(v) {
  if (v == null || !isFinite(v)) return '—';
  const pts = v * 100;
  if (pts >= 4) return 'steep';
  if (pts >= 1.5) return 'mild';
  if (pts <= -1.5) return 'call-skew';
  return 'flat';
}
function pctile(values, v) {
  const xs = values.filter(x => x != null && isFinite(x)).sort((a, b) => a - b);
  if (!xs.length || v == null || !isFinite(v)) return null;
  let lo = 0, hi = xs.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (xs[mid] <= v) lo = mid + 1; else hi = mid; }
  return (lo - 1) / Math.max(1, xs.length - 1);
}
function fmtPct(v, d = 1) {
  if (v == null || !isFinite(v)) return '—';
  return (v * 100).toFixed(d) + '%';
}
function fmtPts(v) {
  if (v == null || !isFinite(v)) return '—';
  const n = v * 100;
  const s = (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(1);
  return s + ' pts';
}
function money(n) {
  const sign = n < 0 ? '−' : '+';
  const a = Math.abs(n);
  if (a >= 1e9) return sign + '$ ' + (a / 1e9).toFixed(1) + ' B';
  if (a >= 1e6) return sign + '$ ' + (a / 1e6).toFixed(0) + ' M';
  return sign + '$ ' + (a / 1e3).toFixed(0) + ' K';
}
function shortName(org) {
  return String(org || '').replace(/ Inc\.?| Corporation| Capital Management LLC| Ltd\.?| LLC| LP| Advisors|,/g, '').trim();
}
function ownershipDelta(pctHeld, pctChange) {
  if (pctHeld == null || pctChange == null || !isFinite(pctHeld) || !isFinite(pctChange)) return null;
  if (pctChange <= -0.999) return -pctHeld;
  return pctHeld * pctChange / (1 + pctChange);
}

async function loadOne(symbol) {
  const [sum, chain] = await Promise.all([getSummary(symbol), getOptions(symbol)]);
  const ks = (sum && sum.defaultKeyStatistics) || {};
  const mh = (sum && sum.majorHoldersBreakdown) || {};
  const holders = ((sum && sum.institutionOwnership && sum.institutionOwnership.ownershipList) || []).slice(0, 10);
  const si = raw(ks.shortPercentOfFloat);
  const shares = raw(ks.sharesShort);
  const prev = raw(ks.sharesShortPriorMonth);
  let inst = raw(mh.institutionsPercentHeld);
  if (inst != null && inst > 1) inst = 1;
  const deltas = [];
  holders.forEach(h => {
    const d = ownershipDelta(raw(h.pctHeld), raw(h.pctChange));
    if (d == null) return;
    deltas.push({ org: shortName(h.organization), chg: d });
  });
  const add = deltas.length ? deltas.reduce((a, b) => a + b.chg, 0) : null;
  let mover = null;
  deltas.forEach(d => { if (!mover || Math.abs(d.chg) > Math.abs(mover.chg)) mover = d; });
  return {
    symbol, si, shares, prev, inst, add, mover,
    skew: skewOf(chain),
    siDate: ks.dateShortInterest && ks.dateShortInterest.fmt,
    report: holders[0] && holders[0].reportDate && holders[0].reportDate.fmt
  };
}

function namesFrom(rows, mapFn) {
  const out = [];
  rows.forEach(r => {
    if (r[0] === '…') return;
    const label = r[1];
    const rank = parseInt(r[0], 10);
    const long = rank <= 20;
    const mapped = mapFn(label, r);
    if (!mapped) return;
    mapped.forEach(sym => out.push({ label, rank, long, symbol: sym, pair: mapped.length > 1 }));
  });
  return out;
}

function scoreSet(items) {
  const insts = items.map(x => x.inst);
  const adds = items.map(x => x.add);
  const sis = items.map(x => x.si);
  const sks = items.map(x => x.skew);
  items.forEach(x => {
    const parts = [];
    const ip = pctile(insts, x.inst);
    const ap = pctile(adds, x.add);
    const sp = pctile(sis, x.si);
    const kp = pctile(sks, x.skew);
    if (x.long) {
      if (ip != null) parts.push([0.55, ip]);
      if (ap != null) parts.push([0.25, ap]);
      if (kp != null) parts.push([0.20, kp]);
    } else {
      if (sp != null) parts.push([0.60, sp]);
      if (ip != null) parts.push([0.25, 1 - ip]);
      if (kp != null) parts.push([0.15, kp]);
    }
    const covered = parts.reduce((a, b) => a + b[0], 0);
    x.thin = covered > 0 && covered < 0.45;
    if (!parts.length || x.thin) x.crowd = null;
    else x.crowd = Math.round(100 * parts.reduce((a, b) => a + b[0] * b[1], 0) / covered);
  });
}

function flagOf(x) {
  if (x.crowd == null && x.thin) {
    if (x.skew != null && x.skew >= 0.04) return '<span class="pill orange">steep skew</span>';
    if (x.skew != null && x.skew <= -0.015) return '<span class="pill ghost">call-skew</span>';
    return '<span class="pill ghost">skew only</span>';
  }
  if (x.crowd == null) return '<span class="pill ghost">n/a</span>';
  const equity = x.inst != null || x.si != null;
  if (x.long && equity && x.crowd >= 75) return '<span class="pill red">de-gross risk</span>';
  if (!x.long && x.si != null && x.si >= 0.08) return '<span class="pill red">crowded short</span>';
  if (x.long && x.si != null && x.si >= 0.08) return '<span class="pill orange">squeeze</span>';
  if (!x.long && x.mover && x.mover.chg > 0.02) return '<span class="pill red">counter</span>';
  if (x.crowd >= 55) return '<span class="pill orange">watch</span>';
  return '<span class="pill good">OK</span>';
}
function crowdCell(n) {
  if (n == null) return '—';
  if (n >= 70) return ['warn', String(n)];
  return String(n);
}
function toRow(x) {
  const label = x.via && x.via !== x.label ? `${x.label}` : x.label;
  return [label, crowdCell(x.crowd), fmtPct(x.inst), fmtPts(x.add), fmtPct(x.si), skewLabel(x.skew), flagOf(x)];
}

function divergenceLines(items) {
  const scored = items.filter(x => x.mover && x.mover.chg != null).map(x => {
    const cut = x.mover.chg < 0;
    let pill, word;
    if (x.long && cut) { pill = 'pill orange'; word = 'divergent'; }
    else if (x.long && !cut) { pill = 'pill good'; word = 'aligned'; }
    else if (!x.long && !cut) { pill = 'pill red'; word = 'counter'; }
    else { pill = 'pill good'; word = 'aligned'; }
    const verb = cut ? 'cut' : 'added';
    const pts = (Math.abs(x.mover.chg) * 100).toFixed(1);
    const side = x.long ? 'research long' : 'research short';
    const html = `<b>${x.label}</b> — ${side} · ${x.mover.org} ${verb} ${pts} pts of the co.`;
    return { abs: Math.abs(x.mover.chg), line: [html, pill, word] };
  });
  scored.sort((a, b) => b.abs - a.abs);
  const picked = [];
  const seen = new Set();
  for (const s of scored) {
    const key = s.line[2];
    if (picked.filter(p => p[2] === key).length >= 3) continue;
    if (seen.has(s.line[0])) continue;
    seen.add(s.line[0]);
    picked.push(s.line);
    if (picked.length >= 6) break;
  }
  return picked;
}

async function etfTape(list) {
  const vals = await pool(list, 4, async (row) => {
    const bars = await getChart(row[0]);
    const last = bars.slice(-6);
    if (last.length < 2 || !last[0].c) return null;
    return last[last.length - 1].c / last[0].c - 1;
  });
  const max = Math.max(...vals.map(v => Math.abs(v || 0)), 0.001);
  return list.map((row, i) => {
    const v = vals[i];
    if (v == null || !isFinite(v)) return [row[1], 8, '', '—'];
    const width = Math.max(8, Math.round(Math.abs(v) / max * 100));
    const klass = v < 0 ? 'bad' : (row[2] || '');
    const pct = (v >= 0 ? '+' : '−') + (Math.abs(v) * 100).toFixed(1) + '%';
    return [row[1], width, klass, pct];
  });
}

function collapsePairs(loaded, spec) {
  const bySym = new Map(loaded.map(x => [x.symbol, x]));
  const grouped = new Map();
  spec.forEach(s => {
    const key = s.label;
    if (!grouped.has(key)) grouped.set(key, { ...s, legs: [] });
    const leg = bySym.get(s.symbol);
    if (leg) grouped.get(key).legs.push(leg);
  });
  const items = [];
  grouped.forEach(g => {
    const legs = g.legs;
    const avg = (fn) => {
      const xs = legs.map(fn).filter(v => v != null && isFinite(v));
      return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
    };
    let mover = null;
    legs.forEach(l => { if (l.mover && (!mover || Math.abs(l.mover.chg) > Math.abs(mover.chg))) mover = l.mover; });
    items.push({
      label: g.label, rank: g.rank, long: g.long, mover,
      inst: avg(l => l.inst), add: avg(l => l.add), si: avg(l => l.si), skew: avg(l => l.skew),
      via: legs.length === 1 && legs[0].symbol !== g.label ? legs[0].symbol : null,
      siDate: (legs[0] && legs[0].siDate) || null,
      report: (legs[0] && legs[0].report) || null
    });
  });
  items.sort((a, b) => a.rank - b.rank);
  return items;
}

(async () => {
  const research = JSON.parse(fs.readFileSync(RESEARCH, 'utf8'));
  await initSession();
  process.stderr.write('crumb ok\n');

  const books = {
    alpha: namesFrom(research.alpha.rows, label => [label]),
    global: namesFrom(research.global.rows, label => GLOBAL_PROXY[label] ? [GLOBAL_PROXY[label]] : []),
    neutral: namesFrom(research.neutral.rows, label => label.split('/').filter(Boolean)),
    digital: namesFrom(research.digital.rows, label => [SPOT_PROXY[label] || label])
  };

  const syms = [...new Set(Object.values(books).flat().map(x => x.symbol))];
  process.stderr.write(`positioning ${syms.length} symbols\n`);
  const loaded = (await pool(syms, 4, async (sym) => {
    try { return await loadOne(sym); } catch (e) { return { symbol: sym }; }
  })).filter(Boolean);

  const result = { asOf: AS_OF, siDate: null, reportDate: null, books: {} };
  for (const [book, spec] of Object.entries(books)) {
    const items = collapsePairs(loaded, spec);
    scoreSet(items);
    items.forEach(x => { if (x.siDate) result.siDate = x.siDate; if (x.report) result.reportDate = x.report; });
    const rows = [];
    items.forEach((x, i) => {
      if (i > 0 && items[i - 1].long && !x.long) rows.push(['…', '…', '…', '…', '…', '…', '…']);
      rows.push(toRow(x));
    });
    const div = divergenceLines(items);
    const etf = await etfTape(ETF[book]);
    const top = [...items].filter(x => x.crowd != null).sort((a, b) => b.crowd - a.crowd)[0];
    result.books[book] = {
      rows, divergence: div, etf,
      mostCrowded: top ? { label: top.label, crowd: top.crowd, inst: top.inst, si: top.si } : null
    };
    process.stderr.write(`${book} ${rows.length} rows  crowded ${top && top.label} ${top && top.crowd}\n`);
  }
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
  process.stderr.write('wrote ' + OUT + '\n');
  const a = result.books.alpha;
  console.log(JSON.stringify({
    siDate: result.siDate, reportDate: result.reportDate,
    most: a.mostCrowded,
    head: a.rows.slice(0, 5),
    tail: a.rows.slice(-3),
    div: a.divergence,
    etf: a.etf
  }, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
