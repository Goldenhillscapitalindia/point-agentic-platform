#!/usr/bin/env node
/**
 * Rank Research & Alpha universe from the last completed US session.
 * Sources: Yahoo Finance chart + quoteSummary (fundamentals, recs, EPS trends).
 */
'use strict';
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const OUT = path.join(__dirname, '..', 'data', 'research-2026-10-12.json');

const IPOS = ['SKHY','CSQR','JMKE','ACCV','ADRX','BRVE','ETRA','LTGO','LYNX','ATTO','TRXB','RTSN'];
const EXTRA = ['COIN','MSTR','HOOD','CLSK','MARA','RIOT','WBA','UBER','SPOT','ANET','CRWD','PLTR','SMCI','ARM'];
const GLOBAL_SYMS = [
  ['GC=F','Gold (GC)'],['SI=F','Silver (SI)'],['HG=F','Copper (HG)'],['CL=F','Crude (CL)'],
  ['BZ=F','Brent (BZ)'],['NG=F','Nat gas (NG)'],['ES=F','S&P (ES)'],['NQ=F','Nasdaq (NQ)'],
  ['ZN=F','10Y (ZN)'],['DX=F','USD (DX)'],['6E=F','EUR (6E)'],['6J=F','JPY (6J)'],
  ['EEM','EM (EEM)'],['FXI','China (FXI)'],['GLD','Gold ETF'],['TLT','TLT'],['UUP','USD ETF'],
  ['GDX','Gold miners'],['USO','Oil ETF'],['IWM','Russell 2k'],['HYG','HY credit']
];
const DIGITAL_SYMS = [
  ['BTC-USD','BTC'],['ETH-USD','ETH'],['SOL-USD','SOL'],['COIN','COIN'],
  ['MSTR','MSTR'],['HOOD','HOOD'],['CLSK','CLSK'],['MARA','MARA'],['RIOT','RIOT'],
  ['IBIT','IBIT'],['ETHA','ETHA'],['HUT','HUT'],['IREN','IREN'],['WULF','WULF']
];
const PAIRS = [
  ['LLY','NVO'],['V','MA'],['COST','WMT'],['HD','LOW'],['PG','CL'],
  ['GOOGL','META'],['KO','PEP'],['JPM','BAC'],['AMZN','WMT'],['AVGO','AMD']
];
const ALPHA_LONG = new Set(['NVDA','AAPL','MSFT','META','GOOGL','AMZN','UBER','TSLA','COIN','MSTR','ANET']);
const ALPHA_SHORT = new Set(['UNH','WBA','PEP']);
const CRYPTO = new Set(['COIN','MSTR','CLSK','HOOD','MARA','RIOT','HUT','IREN','WULF','IBIT','ETHA','BTC','ETH','SOL']);

let session = { cookies: '', crumb: '' };

function req(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const timeout = opts.timeout || 20000;
    const o = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: opts.method || 'GET',
      headers: Object.assign({
        'User-Agent': UA,
        'Accept': opts.accept || 'application/json,text/plain,*/*',
        'Accept-Language': 'en-US,en;q=0.9'
      }, opts.headers || {})
    };
    const r = https.request(o, resp => {
      let d = '';
      resp.on('data', c => d += c);
      resp.on('end', () => resolve({ status: resp.statusCode, headers: resp.headers, body: d }));
    });
    r.on('error', reject);
    r.setTimeout(timeout, () => { r.destroy(); reject(new Error('timeout ' + url)); });
    if (opts.body) r.write(opts.body);
    r.end();
  });
}

async function reqRetry(url, opts, tries = 4) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await req(url, opts);
      if (r.status === 429 || r.status === 503) {
        await sleep(800 * (i + 1));
        last = r;
        continue;
      }
      return r;
    } catch (e) {
      last = e;
      await sleep(400 * (i + 1));
    }
  }
  if (last && last.status) return last;
  throw last || new Error('failed ' + url);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

function yTicker(t) {
  return String(t).trim().replace(/\./g, '-').toUpperCase();
}

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
  const crumbR = await req('https://query2.finance.yahoo.com/v1/test/getcrumb', {
    headers: { Cookie: session.cookies },
    accept: 'text/plain'
  });
  session.crumb = (crumbR.body || '').trim();
  if (!session.crumb || session.crumb.includes('{')) throw new Error('crumb failed: ' + crumbR.body.slice(0, 120));
}

function authHeaders() {
  return { Cookie: session.cookies };
}

const raw = o => (o && o.raw != null) ? o.raw : (typeof o === 'number' ? o : null);

async function getChart(symbol) {
  const r = await reqRetry(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=6mo&events=div%7Csplit`,
    { headers: authHeaders() }
  );
  if (r.status !== 200) return null;
  let j;
  try { j = JSON.parse(r.body); } catch { return null; }
  const res = j.chart && j.chart.result && j.chart.result[0];
  if (!res) return null;
  const ts = res.timestamp || [];
  const q = (res.indicators && res.indicators.quote && res.indicators.quote[0]) || {};
  const bars = [];
  for (let i = 0; i < ts.length; i++) {
    const o = q.open && q.open[i], h = q.high && q.high[i], l = q.low && q.low[i], c = q.close && q.close[i];
    if (c == null || h == null || l == null) continue;
    bars.push({ t: ts[i], o, h, l, c, v: q.volume ? q.volume[i] : null });
  }
  return { meta: res.meta || {}, bars };
}

async function getSummary(symbol) {
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=financialData,defaultKeyStatistics,recommendationTrend,earningsTrend,summaryProfile&crumb=${encodeURIComponent(session.crumb)}`;
  const r = await reqRetry(url, { headers: authHeaders() });
  if (r.status !== 200) return null;
  let j;
  try { j = JSON.parse(r.body); } catch { return null; }
  if (j.quoteSummary && j.quoteSummary.error) return null;
  return (j.quoteSummary && j.quoteSummary.result && j.quoteSummary.result[0]) || null;
}

async function sp500Tickers() {
  const r = await reqRetry('https://raw.githubusercontent.com/datasets/s-and-p-500-companies/master/data/constituents.csv', {});
  if (r.status === 200 && r.body.includes('Symbol')) {
    return r.body.split(/\r?\n/).slice(1).map(l => l.split(',')[0]).filter(Boolean).map(yTicker);
  }
  const w = await reqRetry('https://en.wikipedia.org/wiki/List_of_S%26P_500_companies', { accept: 'text/html' });
  const re = /<td><a[^>]*>([A-Z]{1,5}(?:\.[A-Z])?)<\/a><\/td>/g;
  const out = [];
  let m;
  while ((m = re.exec(w.body))) out.push(yTicker(m[1]));
  return [...new Set(out)];
}

async function smallCapTickers() {
  const ids = ['aggressive_small_caps', 'small_cap_gainers', 'undervalued_growth_stocks', 'most_actives'];
  const set = new Set();
  for (const id of ids) {
    const r = await reqRetry(
      `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&scrIds=${id}&count=50`,
      { headers: authHeaders() }
    );
    if (r.status !== 200) continue;
    try {
      const j = JSON.parse(r.body);
      const quotes = ((((j.finance || {}).result || [])[0] || {}).quotes) || [];
      quotes.forEach(q => {
        const t = q.symbol;
        const cap = q.marketCap || q.intradayMarketCap;
        if (t && t.indexOf('^') < 0 && t.indexOf('=') < 0 && (!cap || cap < 2e10)) set.add(yTicker(t));
      });
    } catch { /* skip */ }
  }
  return [...set];
}

function ret(bars, n) {
  if (!bars || bars.length < n + 1) return null;
  const a = bars[bars.length - 1].c;
  const b = bars[bars.length - 1 - n].c;
  if (!b) return null;
  return a / b - 1;
}

function rsi(bars, n = 14) {
  if (!bars || bars.length < n + 1) return null;
  let g = 0, l = 0;
  for (let i = bars.length - n; i < bars.length; i++) {
    const d = bars[i].c - bars[i - 1].c;
    if (d >= 0) g += d; else l -= d;
  }
  if (l === 0) return 100;
  const rs = (g / n) / (l / n);
  return 100 - 100 / (1 + rs);
}

function rangeFmt(lo, hi) {
  if (lo == null || hi == null || !isFinite(lo) || !isFinite(hi)) return '—';
  const fmt = v => {
    const a = Math.abs(v);
    if (a >= 10000) return v.toFixed(0);
    if (a >= 1000) return v.toFixed(0);
    if (a >= 100) return v.toFixed(1);
    if (a >= 10) return v.toFixed(1);
    return v.toFixed(2);
  };
  return `${fmt(lo)}–${fmt(hi)}`;
}

function percentile(values, v) {
  const xs = values.filter(x => x != null && isFinite(x)).sort((a, b) => a - b);
  if (!xs.length || v == null || !isFinite(v)) return null;
  let lo = 0, hi = xs.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] <= v) lo = mid + 1; else hi = mid;
  }
  return (lo - 1) / Math.max(1, xs.length - 1);
}

function mean(arr) {
  const xs = arr.filter(x => x != null && isFinite(x));
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function momArrow(m5, m21, bars) {
  if (!bars || bars.length < 15) return 'new';
  if (m5 == null && m21 == null) return '—';
  if (m5 != null && m5 > 0.03 && m21 != null && m21 > 0.05) return '↑↑';
  if ((m5 != null && m5 > 0.008) || (m21 != null && m21 > 0.02)) return '↑';
  if (m5 != null && m5 < -0.03 && m21 != null && m21 < -0.05) return '↓↓';
  if ((m5 != null && m5 < -0.008) || (m21 != null && m21 < -0.02)) return '↓';
  return 'flat';
}

function sectorTilt(sector, industry) {
  const s = (sector || '').toLowerCase();
  const i = (industry || '').toLowerCase();
  // 12 Oct 2026 tape: XLK/optics/chips sold off; comms, financials, health, energy bid
  if (/semiconductor|optical|photonic|electronic component|communication equipment/.test(i)) return 0.18;
  if (/information technology/.test(s)) return 0.32;
  if (/communication services/.test(s)) return 0.82;
  if (/financial/.test(s)) return 0.74;
  if (/health/.test(s)) return 0.70;
  if (/energy/.test(s)) return 0.72;
  if (/consumer staples/.test(s)) return 0.64;
  if (/utilities|real estate/.test(s)) return 0.55;
  if (/industrials/.test(s)) return 0.52;
  if (/consumer discretionary/.test(s)) return 0.48;
  if (/materials/.test(s)) return 0.58;
  return 0.50;
}

function recBias(trend) {
  if (!trend || !trend.length) return { buyRatio: null, delta: null };
  const cur = trend.find(t => t.period === '0m') || trend[0];
  const prev = trend.find(t => t.period === '-1m');
  const tot = (x) => (x.strongBuy || 0) + (x.buy || 0) + (x.hold || 0) + (x.sell || 0) + (x.strongSell || 0);
  const bull = (x) => (x.strongBuy || 0) + (x.buy || 0);
  const buyRatio = tot(cur) ? bull(cur) / tot(cur) : null;
  let delta = null;
  if (prev) delta = (bull(cur) - (prev.sell || 0) - (prev.strongSell || 0)) - (bull(prev) - (cur.sell || 0) - (cur.strongSell || 0));
  // simpler: change in buy count minus change in sell count
  if (prev) {
    delta = (bull(cur) - bull(prev)) - (((cur.sell || 0) + (cur.strongSell || 0)) - ((prev.sell || 0) + (prev.strongSell || 0)));
  }
  return { buyRatio, delta };
}

function epsRevision(et) {
  const rows = (et && et.trend) || [];
  const y = rows.find(t => t.period === '0y') || rows.find(t => t.period === '0q') || rows[0];
  if (!y || !y.epsTrend) return { pct: null, display: 0 };
  const now = raw(y.epsTrend.current);
  const d30 = raw(y.epsTrend['30daysAgo']);
  const d7 = raw(y.epsTrend['7daysAgo']);
  const base = d30 != null ? d30 : d7;
  if (now == null || base == null || base === 0) return { pct: null, display: 0 };
  const pct = (now - base) / Math.abs(base);
  // display as revision "notches" similar to the original UI
  const display = Math.round(pct * 20);
  return { pct, display };
}

function packName(p) {
  const chart = p.chart, sum = p.sum, bars = (chart && chart.bars) || [];
  const last = bars[bars.length - 1];
  const last5 = bars.slice(-5);
  const fd = (sum && sum.financialData) || {};
  const ks = (sum && sum.defaultKeyStatistics) || {};
  const sp = (sum && sum.summaryProfile) || {};
  const recT = recBias(sum && sum.recommendationTrend && sum.recommendationTrend.trend);
  const eps = epsRevision(sum && sum.earningsTrend);
  const m1 = ret(bars, 1);
  const m5 = ret(bars, 5);
  const m21 = ret(bars, 21);
  const m63 = ret(bars, 63);
  const r = rsi(bars, 14);
  const d1lo = last ? last.l : null, d1hi = last ? last.h : null;
  const d5lo = last5.length ? Math.min(...last5.map(b => b.l)) : null;
  const d5hi = last5.length ? Math.max(...last5.map(b => b.h)) : null;
  return {
    symbol: p.symbol,
    label: p.label || p.symbol,
    asOf: last ? new Date(last.t * 1000).toISOString().slice(0, 10) : null,
    close: last ? last.c : raw(fd.currentPrice),
    sector: sp.sector || null,
    industry: sp.industry || null,
    profitMargins: raw(fd.profitMargins),
    roe: raw(fd.returnOnEquity),
    revGrowth: raw(fd.revenueGrowth),
    earnGrowth: raw(fd.earningsGrowth),
    debtToEquity: raw(fd.debtToEquity),
    recMean: raw(fd.recommendationMean),
    target: raw(fd.targetMeanPrice),
    beta: raw(ks.beta),
    short: raw(ks.shortPercentOfFloat),
    w52: raw(ks['52WeekChange']),
    buyRatio: recT.buyRatio,
    recDelta: recT.delta,
    epsRev: eps.pct,
    epsDisp: eps.display,
    m1, m5, m21, m63, rsi: r,
    d1lo, d1hi, d5lo, d5hi,
    barsLen: bars.length
  };
}

function scoreUniverse(rows) {
  const cols = {
    qM: rows.map(r => r.profitMargins),
    qR: rows.map(r => r.roe),
    qG: rows.map(r => r.revGrowth),
    qE: rows.map(r => r.earnGrowth),
    qD: rows.map(r => r.debtToEquity),
    m5: rows.map(r => r.m5),
    m21: rows.map(r => r.m21),
    m63: rows.map(r => r.m63),
    rsi: rows.map(r => r.rsi),
    eps: rows.map(r => r.epsRev),
    recD: rows.map(r => r.recDelta),
    rec: rows.map(r => r.recMean != null ? -r.recMean : null),
    short: rows.map(r => r.short != null ? -r.short : null),
    buy: rows.map(r => r.buyRatio),
    rel: rows.map(r => r.rel21)
  };
  return rows.map(r => {
    const quality = mean([
      percentile(cols.qM, r.profitMargins),
      percentile(cols.qR, r.roe),
      percentile(cols.qG, r.revGrowth),
      percentile(cols.qE, r.earnGrowth),
      r.debtToEquity != null ? 1 - percentile(cols.qD, r.debtToEquity) : null
    ]);
    const momentum = mean([
      percentile(cols.m5, r.m5),
      percentile(cols.m21, r.m21),
      percentile(cols.m63, r.m63),
      percentile(cols.rsi, r.rsi)
    ]);
    const revisions = mean([
      percentile(cols.eps, r.epsRev),
      percentile(cols.recD, r.recDelta)
    ]);
    const sentiment = mean([
      percentile(cols.rec, r.recMean != null ? -r.recMean : null),
      percentile(cols.short, r.short != null ? -r.short : null),
      percentile(cols.buy, r.buyRatio)
    ]);
    const macro = mean([
      percentile(cols.rel, r.rel21),
      sectorTilt(r.sector, r.industry)
    ]);
    const parts = [
      [0.25, quality], [0.25, momentum], [0.20, revisions], [0.15, sentiment], [0.15, macro]
    ].filter(x => x[1] != null);
    const w = parts.reduce((a, b) => a + b[0], 0) || 1;
    const score = parts.reduce((a, b) => a + b[0] * b[1], 0) / w;
    return Object.assign(r, {
      quality, momentum, revisions, sentiment, macro, score,
      qualityPct: quality == null ? null : Math.round(quality * 100)
    });
  }).sort((a, b) => (b.score || 0) - (a.score || 0));
}

function thesisFit(r, book) {
  const s = r.score || 0;
  const tk = r.symbol;
  if (book === 'alpha') {
    if (ALPHA_SHORT.has(tk)) return s <= 0.40 ? 'short' : s >= 0.60 ? 'cover' : 'short watch';
    if (ALPHA_LONG.has(tk)) {
      if (s >= 0.78) return 'strong';
      if (s >= 0.55) return CRYPTO.has(tk) ? 'fit · crypto β' : 'fit';
      return 'reassess';
    }
    if (IPOS.includes(tk)) return s >= 0.70 ? 'strong' : s >= 0.45 ? 'watch · IPO' : 'avoid · IPO';
    if (s >= 0.80) return 'strong';
    if (s >= 0.62) return CRYPTO.has(tk) ? 'fit · crypto β' : 'fit';
    if (s <= 0.28) return 'short';
    return 'hold';
  }
  if (s >= 0.80) return 'strong';
  if (s >= 0.62) return 'fit';
  if (s <= 0.30) return 'short';
  return 'hold';
}

function sentLabel(r) {
  if (r.recMean != null) {
    if (r.recMean <= 2.15) return 'pos';
    if (r.recMean >= 2.9) return 'neg';
    return 'neutral';
  }
  if (r.m21 != null) return r.m21 > 0.01 ? 'pos' : r.m21 < -0.01 ? 'neg' : 'neutral';
  return '—';
}

function clampRev(n) {
  if (n == null || !isFinite(n)) return 0;
  return Math.max(-9, Math.min(9, Math.round(n)));
}
function revLabel(r) {
  if (r.barsLen < 20 && IPOS.includes(r.symbol)) {
    const n = clampRev(r.epsDisp || 0);
    return n ? `init ${n > 0 ? '+' : ''}${n}` : 'init';
  }
  let n = r.epsDisp || 0;
  if (n === 0 && (r.recDelta || 0) !== 0) n = r.recDelta;
  n = clampRev(n);
  return (n > 0 ? '+' : '') + n;
}

function scoreCell(s) {
  const v = (s || 0).toFixed(2);
  if (s >= 0.75) return ['good', v];
  if (s <= 0.30) return ['bad', v];
  return v;
}

function toRow(r, rank, book) {
  const q = r.qualityPct == null ? 'n/a' : String(r.qualityPct);
  return [
    String(rank),
    r.label || r.symbol,
    scoreCell(r.score),
    q,
    momArrow(r.m5, r.m21, { length: r.barsLen }),
    revLabel(r),
    sentLabel(r),
    rangeFmt(r.d1lo, r.d1hi),
    rangeFmt(r.d5lo, r.d5hi),
    thesisFit(r, book)
  ];
}

function pickRows(ranked, book, topN = 20, botN = 20) {
  const n = ranked.length;
  if (n <= topN + botN) return ranked.map((r, i) => toRow(r, i + 1, book));
  const rows = [];
  ranked.slice(0, topN).forEach((r, i) => rows.push(toRow(r, i + 1, book)));
  rows.push(['…', '…', '…', '…', '…', '…', '…', '…', '…', '…']);
  ranked.slice(-botN).forEach((r, i) => rows.push(toRow(r, n - botN + i + 1, book)));
  return rows;
}

function explainFor(r) {
  const pct = x => x == null ? null : Math.round(x * 100);
  const bars = [
    ['Quality', pct(r.quality), r.quality == null ? '—' : (r.quality).toFixed(2)],
    ['Momentum', pct(r.momentum), r.momentum == null ? '—' : (r.momentum).toFixed(2)],
    ['Revisions', pct(r.revisions), r.revisions == null ? '—' : (r.revisions).toFixed(2)],
    ['Sentiment', pct(r.sentiment), r.sentiment == null ? '—' : (r.sentiment).toFixed(2)],
    ['Macro fit', pct(r.macro), r.macro == null ? '—' : (r.macro).toFixed(2)]
  ].map(x => [x[0], x[1] == null ? 50 : x[1], x[2]]);
  const bits = [];
  if (r.profitMargins != null) bits.push(`${(r.profitMargins * 100).toFixed(0)}% profit margin`);
  if (r.roe != null) bits.push(`${(r.roe * 100).toFixed(0)}% ROE`);
  if (r.revGrowth != null) bits.push(`${(r.revGrowth * 100).toFixed(0)}% revenue growth`);
  if (r.m21 != null) bits.push(`${(r.m21 * 100).toFixed(1)}% 21-day price momentum`);
  if (r.epsRev != null) bits.push(`${r.epsRev >= 0 ? '+' : ''}${(r.epsRev * 100).toFixed(1)}% 30-day EPS revision`);
  if (r.recMean != null) bits.push(`analyst mean ${r.recMean.toFixed(2)} (1=SB)`);
  if (r.sector) bits.push(`${r.sector} vs Monday’s tape`);
  const risk = [];
  if (r.short != null && r.short > 0.04) risk.push(`short interest ${(r.short * 100).toFixed(1)}% of float`);
  if (r.beta != null && r.beta > 1.4) risk.push(`beta ${r.beta.toFixed(2)}`);
  if (r.m5 != null && r.m5 < -0.03) risk.push('near-term pullback');
  const riskTxt = risk.length ? ' Risk: ' + risk.join(', ') + '.' : '';
  const txt = `Model attributes <b>${(r.score || 0).toFixed(2)}</b> to: ${bits.slice(0, 4).join(', ')}.${riskTxt}`;
  return { name: `${r.label || r.symbol} (${(r.score || 0) >= 0.55 ? 'long' : 'short'})`, bars, txt, score: r.score };
}

async function loadPacked(symbols) {
  const packed = [];
  let done = 0;
  await pool(symbols, 5, async (item) => {
    const symbol = typeof item === 'string' ? item : item[0];
    const label = typeof item === 'string' ? symbol : item[1];
    try {
      const [chart, sum] = await Promise.all([getChart(symbol), getSummary(symbol)]);
      if (!chart || !chart.bars.length) return;
      packed.push(packName({ symbol, label, chart, sum }));
    } catch (e) {
      /* skip */
    }
    done++;
    if (done % 40 === 0) process.stderr.write(`  ${done}/${symbols.length}\n`);
  });
  return packed;
}

function attachRel(rows, spyM21) {
  rows.forEach(r => { r.rel21 = (r.m21 != null && spyM21 != null) ? r.m21 - spyM21 : r.m21; });
}

function pairRows(bySym) {
  const out = [];
  for (const [a, b] of PAIRS) {
    const A = bySym.get(a), B = bySym.get(b);
    if (!A || !B || A.barsLen < 40 || B.barsLen < 40) continue;
    // rebuild spread z from stored m21/close approximation using relative 21d and quality gap
    const spreadMom = (A.m21 || 0) - (B.m21 || 0);
    const qGap = (A.quality || 0.5) - (B.quality || 0.5);
    const zProxy = ((A.m63 || 0) - (B.m63 || 0)) / 0.08; // rough z
    const absZ = Math.abs(zProxy);
    const longFirst = (qGap + spreadMom) >= 0;
    const long = longFirst ? A : B;
    const sht = longFirst ? B : A;
    const score = mean([
      Math.min(1, absZ / 2.5),
      long.quality, long.momentum, 1 - (sht.momentum || 0.5),
      long.revisions
    ]);
    out.push({
      symbol: `${long.symbol}/${sht.symbol}`,
      label: `${long.symbol}/${sht.symbol}`,
      score,
      quality: long.quality,
      momentum: mean([long.momentum, 1 - (sht.momentum || 0.5)]),
      revisions: mean([long.revisions, sht.revisions]),
      sentiment: mean([long.sentiment, sht.sentiment]),
      macro: mean([long.macro, sht.macro]),
      qualityPct: long.qualityPct,
      m5: (long.m5 || 0) - (sht.m5 || 0),
      m21: spreadMom,
      epsDisp: (long.epsDisp || 0) - (sht.epsDisp || 0),
      recMean: mean([long.recMean, sht.recMean]),
      d1lo: null, d1hi: null, d5lo: null, d5hi: null,
      rangeNote: `z ${zProxy >= 0 ? '+' : ''}${zProxy.toFixed(1)}σ`,
      barsLen: Math.min(A.barsLen, B.barsLen),
      profitMargins: long.profitMargins, roe: long.roe, revGrowth: long.revGrowth,
      epsRev: long.epsRev, sector: 'Pairs', industry: 'Equity MN',
      close: long.close, short: long.short, beta: long.beta
    });
  }
  // attach 1d/5d as spread of last ranges via labels
  out.forEach(p => {
    p.d1lo = p.m21 != null ? p.m21 - 0.01 : null;
    p.d1hi = p.m21 != null ? p.m21 + 0.01 : null;
    p.d5lo = p.m5 != null ? Math.min(p.m5, p.m21 || p.m5) : null;
    p.d5hi = p.m5 != null ? Math.max(p.m5, p.m21 || p.m5) : null;
  });
  return out.sort((a, b) => (b.score || 0) - (a.score || 0));
}

function pairToRow(r, rank) {
  const s = r.score || 0;
  let fit = 'hold';
  if (s >= 0.80) fit = 'strong pair';
  else if (s >= 0.62) fit = 'fit';
  else if (s <= 0.35) fit = 'unwind';
  const mom = momArrow(r.m5, r.m21, { length: r.barsLen });
  const momOut = Math.abs(r.m21 || 0) > 0.03 ? 'rev' : mom;
  return [
    String(rank),
    r.label,
    scoreCell(s),
    r.qualityPct == null ? '—' : String(r.qualityPct),
    momOut,
    revLabel(r),
    sentLabel(r),
    'spread',
    `conv ${(Math.abs(r.m21 || 0) * 10).toFixed(1)}σ`,
    fit
  ];
}

(async () => {
  process.stderr.write('session…\n');
  await initSession();
  process.stderr.write('crumb ok\n');

  const spyChart = await getChart('SPY');
  const spyBars = (spyChart && spyChart.bars) || [];
  const spyM21 = ret(spyBars, 21);
  const asOf = spyBars.length ? new Date(spyBars[spyBars.length - 1].t * 1000).toISOString().slice(0, 10) : '2026-10-12';
  process.stderr.write(`as-of ${asOf}  SPY 21d ${(spyM21 * 100).toFixed(2)}%\n`);

  process.stderr.write('constituents…\n');
  const spx = await sp500Tickers();
  const r2k = await smallCapTickers();
  const equitySyms = [...new Set([...spx, ...r2k, ...IPOS, ...EXTRA])].filter(s => /^[A-Z][A-Z0-9-]{0,6}$/.test(s));
  process.stderr.write(`equity universe ${equitySyms.length} (spx ${spx.length}, r2k/sleeve ${r2k.length})\n`);

  process.stderr.write('fetch equities…\n');
  const equityPacked = await loadPacked(equitySyms);
  attachRel(equityPacked, spyM21);
  // score in two steps so quality percentiles exist before pair use
  const equityRanked = scoreUniverse(equityPacked);
  const bySym = new Map(equityRanked.map(r => [r.symbol, r]));

  const newIdeas = equityRanked.filter(r => (r.score || 0) >= 0.72 && (r.m5 || 0) > 0).length;
  const alphaRows = pickRows(equityRanked, 'alpha', 20, 20);
  const top = equityRanked[0];
  const explain = explainFor(top);

  process.stderr.write('fetch global…\n');
  const globalPacked = await loadPacked(GLOBAL_SYMS);
  attachRel(globalPacked, spyM21);
  const globalRanked = scoreUniverse(globalPacked);
  const globalRows = pickRows(globalRanked, 'global', 20, 20);
  const gExpl = explainFor(globalRanked[0]);

  process.stderr.write('pairs…\n');
  const pairs = pairRows(bySym);
  const pairRowsOut = pairs.map((p, i) => pairToRow(p, i + 1));
  const pExpl = pairs[0] ? explainFor(pairs[0]) : explain;

  process.stderr.write('fetch digital…\n');
  const digPacked = await loadPacked(DIGITAL_SYMS);
  attachRel(digPacked, spyM21);
  const digRanked = scoreUniverse(digPacked);
  const digRows = pickRows(digRanked, 'digital', 20, 20);
  const dExpl = explainFor(digRanked[0]);

  const out = {
    asOf,
    spyM21,
    universeSize: equityRanked.length,
    newIdeas,
    alpha: { rows: alphaRows, explain, top: { symbol: top.symbol, score: top.score, close: top.close, sector: top.sector } },
    global: { rows: globalRows, explain: gExpl, top: { symbol: globalRanked[0] && globalRanked[0].symbol, score: globalRanked[0] && globalRanked[0].score } },
    neutral: { rows: pairRowsOut, explain: Object.assign(pExpl, { name: pairs[0] ? pairs[0].label : pExpl.name }) },
    digital: { rows: digRows, explain: dExpl, top: { symbol: digRanked[0] && digRanked[0].symbol, score: digRanked[0] && digRanked[0].score } },
    leaders: equityRanked.slice(0, 12).map(r => ({ s: r.symbol, score: +((r.score || 0).toFixed(3)), q: r.qualityPct, m21: r.m21, sector: r.sector, close: r.close })),
    laggards: equityRanked.slice(-8).map(r => ({ s: r.symbol, score: +((r.score || 0).toFixed(3)), q: r.qualityPct, m21: r.m21, sector: r.sector, close: r.close }))
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  process.stderr.write(`wrote ${OUT}\n`);
  console.log(JSON.stringify({ asOf, n: equityRanked.length, newIdeas, top: out.leaders.slice(0, 8), bottom: out.laggards }, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
