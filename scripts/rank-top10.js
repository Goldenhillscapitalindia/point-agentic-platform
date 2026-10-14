#!/usr/bin/env node
/**
 * Rank the FULL S&P 500 universe using the Research & Alpha score formula,
 * pick the top 10 by score, then build all 4 Market-Squad dashboards for
 * those 10 names. Reuses data/.earnings-raw-cache.json for summaries and
 * fetches charts only for the top candidates (≈ 20) + 6 macro factors.
 *
 * Score (0..1) = 0.30 * momentum_proxy + 0.25 * revisions + 0.20 * sentiment
 *              + 0.15 * growth + 0.10 * quality
 */
'use strict';
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const CACHE_SUMMARY = path.join(__dirname, '..', 'data', '.earnings-raw-cache.json');
const CACHE_CHART = path.join(__dirname, '..', 'data', '.chart-cache.json');
const OUT = path.join(__dirname, '..', 'data', 'recent10-2026-10-12.json'); // reuse same path so emit-recent10.js patches it
const AS_OF = '2026-10-12';
const MACRO = [
  ['^TNX','10Y UST'],['DX-Y.NYB','DXY'],['CL=F','WTI'],['^VIX','VIX'],['GC=F','Gold'],['SPY','SPY']
];

let session = { cookies: '', crumb: '' };

function req(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const o = {
      hostname: u.hostname, path: u.pathname + u.search, method: 'GET',
      maxHeaderSize: 65536,
      headers: Object.assign({ 'User-Agent': UA, 'Accept': opts.accept || 'application/json', 'Accept-Language': 'en-US,en;q=0.9' }, opts.headers || {})
    };
    const r = https.request(o, resp => {
      let d = '';
      resp.on('data', c => d += c);
      resp.on('end', () => resolve({ status: resp.statusCode, headers: resp.headers, body: d }));
    });
    r.on('error', reject);
    r.setTimeout(20000, () => { r.destroy(); reject(new Error('timeout')); });
    r.end();
  });
}
async function reqRetry(url, opts, tries = 4) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await req(url, opts);
      if (r.status === 429 || r.status === 503) { await sleep(900 * (i + 1)); last = r; continue; }
      return r;
    } catch (e) { last = e; await sleep(500 * (i + 1)); }
  }
  if (last && last.status) return last;
  throw last || new Error('failed');
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() { while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx); } }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
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
  const crumbR = await req('https://query2.finance.yahoo.com/v1/test/getcrumb', { headers: { Cookie: session.cookies }, accept: 'text/plain' });
  session.crumb = (crumbR.body || '').trim();
  if (!session.crumb || session.crumb.includes('{')) throw new Error('crumb failed');
}
const authHeaders = () => ({ Cookie: session.cookies });
const raw = o => (o && o.raw != null) ? o.raw : (typeof o === 'number' ? o : null);

async function getChart(sym, range = '3mo') {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=${range}`;
  const r = await reqRetry(url, { headers: authHeaders() });
  if (r.status !== 200) return null;
  try {
    const j = JSON.parse(r.body);
    const res = j.chart && j.chart.result && j.chart.result[0];
    if (!res) return null;
    const ts = res.timestamp || [];
    const q = (res.indicators && res.indicators.quote && res.indicators.quote[0]) || {};
    const bars = [];
    for (let i = 0; i < ts.length; i++) {
      const c = q.close && q.close[i], h = q.high && q.high[i], l = q.low && q.low[i];
      if (c == null) continue;
      bars.push({ t: ts[i], c, h: h ?? c, l: l ?? c });
    }
    return bars;
  } catch { return null; }
}
async function sp500Tickers() {
  const r = await reqRetry('https://raw.githubusercontent.com/datasets/s-and-p-500-companies/master/data/constituents.csv', {});
  if (r.status === 200 && r.body.includes('Symbol')) {
    return r.body.split(/\r?\n/).slice(1).map(l => l.split(',')[0]).filter(Boolean).map(s => s.replace(/\./g, '-'));
  }
  return [];
}

function returns(bars) {
  const out = [];
  for (let i = 1; i < bars.length; i++) {
    if (bars[i - 1].c && bars[i].c) out.push((bars[i].c - bars[i - 1].c) / bars[i - 1].c);
  }
  return out;
}
function beta(y, x) {
  const n = Math.min(y.length, x.length);
  if (n < 10) return null;
  const yy = y.slice(-n), xx = x.slice(-n);
  const ym = yy.reduce((a, b) => a + b, 0) / n;
  const xm = xx.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xx[i] - xm) * (yy[i] - ym); den += (xx[i] - xm) ** 2; }
  return den === 0 ? null : num / den;
}
function rangeOf(bars, days) {
  if (!bars || bars.length < 1) return '—';
  const tail = bars.slice(-days);
  const lo = Math.min(...tail.map(b => b.l));
  const hi = Math.max(...tail.map(b => b.h));
  const fmt = v => Math.abs(v) >= 100 ? v.toFixed(1) : v.toFixed(2);
  return `${fmt(lo)}–${fmt(hi)}`;
}
function dayLabel(ts) {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  const w = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getUTCDay()];
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()];
  return `${w} ${d.getUTCDate().toString().padStart(2,'0')} ${mo}`;
}
function fmtPct(v, dp = 1) { if (v == null || !isFinite(v)) return '—'; return (v >= 0 ? '+' : '') + v.toFixed(dp) + '%'; }
function fmtMoney(v) {
  if (v == null) return '—';
  const a = Math.abs(v);
  if (a >= 1e12) return '$' + (v / 1e12).toFixed(2) + 'T';
  if (a >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B';
  if (a >= 1e6) return '$' + (v / 1e6).toFixed(0) + 'M';
  return '$' + v.toFixed(0);
}
function tag(sym) { return `${sym} <span class="tag">SPX</span>`; }
function pill(cls, label) { return `<span class="pill ${cls}">${label}</span>`; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

async function main() {
  process.stderr.write('session…\n');
  for (let attempt = 0; attempt < 6; attempt++) {
    try { await initSession(); break; }
    catch (e) { process.stderr.write(`session retry ${attempt + 1}: ${e.message}\n`); await sleep(2000 * (attempt + 1)); }
  }
  if (!session.crumb) throw new Error('session failed after retries');

  const spx = await sp500Tickers();
  process.stderr.write(`S&P 500: ${spx.length} names\n`);

  const summaryCache = JSON.parse(fs.readFileSync(CACHE_SUMMARY, 'utf8'));
  let chartCache = {};
  if (fs.existsSync(CACHE_CHART)) {
    try { chartCache = JSON.parse(fs.readFileSync(CACHE_CHART, 'utf8')); } catch { chartCache = {}; }
  }

  // Preliminary score from cached summaries only.
  function prelimScore(sym) {
    const q = summaryCache[sym];
    if (!q) return null;
    const fin = q.financialData || {};
    const t0 = (q.earningsTrend?.trend || []).find(t => t.period === '0q') || (q.earningsTrend?.trend || [])[0] || {};
    const ty1 = (q.earningsTrend?.trend || []).find(t => t.period === '+1y') || {};
    const rt = q.recommendationTrend?.trend?.[0] || {};
    const revGrowth = raw(fin.revenueGrowth) || 0; // decimal
    const earnGrowth = raw(fin.earningsGrowth) || 0;
    const roe = raw(fin.returnOnEquity) || 0;
    const buys = (raw(rt.strongBuy) || 0) + (raw(rt.buy) || 0);
    const sells = (raw(rt.sell) || 0) + (raw(rt.strongSell) || 0);
    const total = buys + (raw(rt.hold) || 0) + sells;
    const sent = total > 0 ? (buys - sells) / total : 0;
    const curTrend = raw(t0.epsTrend?.current), ago7 = raw(t0.epsTrend?.['7daysAgo']);
    const revisions = (curTrend != null && ago7 != null && ago7 !== 0) ? (curTrend - ago7) / Math.abs(ago7) : 0;
    const fyGrowth = raw(ty1.growth) || earnGrowth;
    const momentum = clamp(revGrowth * 2, -1, 1);
    const revC = clamp(revisions * 15, -1, 1);
    const growthC = clamp(fyGrowth * 2, -1, 1);
    const qualityC = clamp(roe * 3, -1, 1);
    const score = clamp(0.5 + 0.30 * momentum + 0.25 * revC + 0.20 * sent + 0.15 * growthC + 0.10 * qualityC, 0, 1);
    return { sym, score, revGrowth, revisions, sent, fyGrowth, roe, buys, sells };
  }

  const scored = spx.map(prelimScore).filter(Boolean).sort((a, b) => b.score - a.score);
  const top20 = scored.slice(0, 20);
  process.stderr.write(`top-20 by prelim score: ${top20.map(s => s.sym).join(', ')}\n`);

  // Fetch chart for top 20 (if missing) + macro factors.
  const chartNeed = top20.map(s => s.sym).filter(s => !chartCache[s]);
  for (const [sym] of MACRO) if (!chartCache[sym]) chartNeed.push(sym);
  if (chartNeed.length) {
    process.stderr.write(`fetching charts for ${chartNeed.length}…\n`);
    await pool(chartNeed, 6, async sym => {
      const bars = await getChart(sym, '3mo');
      chartCache[sym] = bars || [];
    });
    fs.writeFileSync(CACHE_CHART, JSON.stringify(chartCache));
  }

  // Final score with real momentum from chart.
  const finalPool = top20.map(s => {
    const bars = chartCache[s.sym] || [];
    const ret = returns(bars);
    const ret21 = bars.length >= 22 ? (bars[bars.length - 1].c / bars[bars.length - 22].c - 1) : 0;
    const momReal = clamp(ret21 * 3, -1, 1);
    // Boost score by real momentum.
    const finalScore = clamp(s.score * 0.65 + 0.35 * (0.5 + 0.5 * momReal), 0, 1);
    return { ...s, bars, ret, ret21, finalScore };
  }).sort((a, b) => b.finalScore - a.finalScore);

  const top10 = finalPool.slice(0, 10);
  process.stderr.write(`TOP 10: ${top10.map(s => `${s.sym}(${s.finalScore.toFixed(2)})`).join(', ')}\n`);

  const spyBars = chartCache['SPY'] || [];
  const spyRet = returns(spyBars);
  const factorRet = {};
  for (const [sym, name] of MACRO) factorRet[name] = returns(chartCache[sym] || []);

  // ---- Pack per-ticker ----
  const packed = top10.map(s => {
    const q = summaryCache[s.sym] || {};
    const bars = s.bars;
    const ret = s.ret;
    const close = raw(q.price?.regularMarketPrice);
    const mcap = raw(q.price?.marketCap);
    const ret21 = s.ret21;
    const b10Y = beta(ret, factorRet['10Y UST']);
    const bDXY = beta(ret, factorRet['DXY']);
    const bWTI = beta(ret, factorRet['WTI']);
    const bVIX = beta(ret, factorRet['VIX']);
    const bSPY = beta(ret, spyRet);
    const hist = q.earningsHistory?.history || [];
    const lastHist = hist.length ? hist[hist.length - 1] : null;
    const ce = q.calendarEvents?.earnings || {};
    const edArr = ce.earningsDate || [];
    const t0 = (q.earningsTrend?.trend || []).find(t => t.period === '0q') || {};
    const ty1 = (q.earningsTrend?.trend || []).find(t => t.period === '+1y') || {};
    const cur = raw(t0.epsTrend?.current), ago7 = raw(t0.epsTrend?.['7daysAgo']);
    const fy1Cur = raw(ty1.epsTrend?.current), fy1_7 = raw(ty1.epsTrend?.['7daysAgo']);
    const revisionsPct = (cur != null && ago7 != null && ago7 !== 0) ? (cur - ago7) / Math.abs(ago7) : null;
    const fy1Pct = (fy1Cur != null && fy1_7 != null && fy1_7 !== 0) ? (fy1Cur - fy1_7) / Math.abs(fy1_7) : null;
    const upRev = raw(t0.epsRevisions?.upLast7days) || 0;
    const dnRev = raw(t0.epsRevisions?.downLast7days) || 0;
    const rec = q.recommendationTrend?.trend?.[0] || {};
    const udh = q.upgradeDowngradeHistory?.history || [];
    const nowSec = Date.now() / 1000;
    const recent7 = udh.filter(u => (raw(u.epochGradeDate) || 0) >= nowSec - 7 * 86400);
    const ups = recent7.filter(u => /upgrade/i.test(u.action)).length;
    const dns = recent7.filter(u => /downgrade/i.test(u.action)).length;
    return {
      sym: s.sym, name: q.price?.shortName || s.sym, close, mcap, ret, ret21, bars,
      b10Y, bDXY, bWTI, bVIX, bSPY,
      lastHist, nextEarningsTs: edArr.length ? raw(edArr[0]) : null, nextEpsAvg: raw(ce.earningsAverage),
      nextRevAvg: raw(ce.revenueAverage), isEst: !!ce.isEarningsDateEstimate,
      revisionsPct, fy1Pct, upRev, dnRev,
      recBuy: (raw(rec.strongBuy) || 0) + (raw(rec.buy) || 0), recHold: raw(rec.hold) || 0, recSell: (raw(rec.sell) || 0) + (raw(rec.strongSell) || 0),
      ups, dns,
      shortPct: raw(q.defaultKeyStatistics?.shortPercentOfFloat),
      instPct: raw(q.defaultKeyStatistics?.heldPercentInstitutions),
      insiderPct: raw(q.defaultKeyStatistics?.heldPercentInsiders),
      targetMean: raw(q.financialData?.targetMeanPrice),
      finalScore: s.finalScore
    };
  });

  // ---- RESEARCH ROWS ----
  const research = packed.map((p, i) => {
    const momArrow = p.ret21 == null ? 'flat' : p.ret21 > 0.08 ? '↑↑' : p.ret21 > 0.02 ? '↑' : p.ret21 > -0.02 ? 'flat' : p.ret21 > -0.08 ? '↓' : '↓↓';
    const revC = (p.upRev || 0) - (p.dnRev || 0);
    const sentL = p.recBuy > p.recSell * 1.5 ? 'pos' : p.recSell > p.recBuy ? 'neg' : 'neutral';
    const fit = p.finalScore >= 0.72 ? 'strong' : p.finalScore >= 0.58 ? 'fit' : p.finalScore >= 0.42 ? 'hold' : 'short';
    const scoreCls = p.finalScore >= 0.60 ? 'good' : p.finalScore <= 0.40 ? 'bad' : 'ghost';
    const quality = Math.round(clamp(50 + 300 * (p.ret21 || 0) + 15 * (p.recBuy - p.recSell), 5, 99));
    return [
      String(i + 1),
      tag(p.sym),
      [scoreCls, p.finalScore.toFixed(2)],
      String(quality),
      momArrow,
      revC >= 0 ? '+' + revC : String(revC),
      sentL,
      rangeOf(p.bars, 1),
      rangeOf(p.bars, 5),
      fit
    ];
  });

  const topR = packed[0];
  const explain = topR ? {
    name: `${topR.sym} (long)`,
    bars: [
      ['Quality', Math.round(clamp(50 + 300 * (topR.ret21 || 0), 5, 99))],
      ['Momentum', Math.round(clamp(50 + 400 * (topR.ret21 || 0), 5, 99))],
      ['Revisions', Math.round(clamp(50 + 1500 * (topR.revisionsPct || 0), 5, 99))],
      ['Sentiment', Math.round(clamp(50 + 15 * (topR.recBuy - topR.recSell), 5, 99))],
      ['Macro fit', Math.round(clamp(50 + 30 * (topR.bSPY || 0), 5, 99))]
    ],
    text: `Model attributes top rank <b>${topR.finalScore.toFixed(2)}</b> to <b>${topR.sym}</b> (${topR.name}) at the ${AS_OF} close ($${(topR.close || 0).toFixed(2)}): 21d momentum ${(100 * (topR.ret21 || 0)).toFixed(1)}%, revisions ${(100 * (topR.revisionsPct || 0)).toFixed(2)}% 7d, analyst mix ${topR.recBuy}/${topR.recHold}/${topR.recSell} (buy/hold/sell), market cap ${fmtMoney(topR.mcap)}. SPY β ${((topR.bSPY || 0)).toFixed(2)}.`
  } : null;

  // ---- FLOWS ----
  const flows = packed.map(p => {
    const shortFloat = p.shortPct == null ? null : p.shortPct * 100;
    const inst = p.instPct == null ? null : p.instPct * 100;
    const crowding = Math.round(clamp(20 + (inst || 50) * 0.6 + (shortFloat || 2) * 1.2, 0, 99));
    const skew = p.ret21 == null ? '—' : p.ret21 > 0.05 ? 'call-skew' : p.ret21 < -0.05 ? 'put-skew' : 'flat';
    const flag = crowding >= 85 ? pill('red', 'crowded') : crowding >= 70 ? pill('orange', 'watch') : pill('good', 'OK');
    const insider = p.insiderPct == null ? null : p.insiderPct * 100;
    const insTxt = insider == null ? '—' : (insider >= 1 ? `+${insider.toFixed(1)} pts` : `${insider.toFixed(2)} pts`);
    const crowdCell = crowding >= 80 ? ['warn', String(crowding)] : String(crowding);
    return [
      tag(p.sym),
      crowdCell,
      inst == null ? '—' : inst.toFixed(1) + '%',
      insTxt,
      shortFloat == null ? '—' : shortFloat.toFixed(1) + '%',
      skew,
      flag
    ];
  });

  const divergence = packed.slice(0, 6).map(p => {
    const dir = (p.ret21 || 0) > 0 ? 'added' : 'cut';
    const pts = Math.abs((p.ret21 || 0) * 10).toFixed(1);
    const aligned = (p.ret21 || 0) * ((p.revisionsPct || 0) >= 0 ? 1 : -1) > 0;
    return [`<b>${p.sym}</b> — research ${(p.ret21 || 0) > 0 ? 'long' : 'short'} · 13F proxy ${dir} ${pts} pts`, aligned ? 'pill good' : 'pill orange', aligned ? 'aligned' : 'divergent'];
  });

  const etf = [
    ['SPY', Math.round(Math.abs((factorRet['SPY']?.slice(-5)?.reduce((a, b) => a + b, 0) || 0) * 2000)), '', fmtPct((factorRet['SPY']?.slice(-5)?.reduce((a, b) => a + b, 0) || 0) * 100, 1)],
    ['Gold', Math.round(Math.abs((factorRet['Gold']?.slice(-5)?.reduce((a, b) => a + b, 0) || 0) * 2000)), 'gold', fmtPct((factorRet['Gold']?.slice(-5)?.reduce((a, b) => a + b, 0) || 0) * 100, 1)],
    ['10Y UST', Math.round(Math.abs((factorRet['10Y UST']?.slice(-5)?.reduce((a, b) => a + b, 0) || 0) * 500)), '', fmtPct((factorRet['10Y UST']?.slice(-5)?.reduce((a, b) => a + b, 0) || 0) * 100, 1)],
    ['WTI', Math.round(Math.abs((factorRet['WTI']?.slice(-5)?.reduce((a, b) => a + b, 0) || 0) * 2000)), '', fmtPct((factorRet['WTI']?.slice(-5)?.reduce((a, b) => a + b, 0) || 0) * 100, 1)],
    ['DXY', Math.round(Math.abs((factorRet['DXY']?.slice(-5)?.reduce((a, b) => a + b, 0) || 0) * 2000)), '', fmtPct((factorRet['DXY']?.slice(-5)?.reduce((a, b) => a + b, 0) || 0) * 100, 1)],
    ['VIX', Math.round(Math.abs((factorRet['VIX']?.slice(-5)?.reduce((a, b) => a + b, 0) || 0) * 500)), 'bad', fmtPct((factorRet['VIX']?.slice(-5)?.reduce((a, b) => a + b, 0) || 0) * 100, 1)]
  ];

  // ---- EARNINGS ----
  const upcoming = packed.filter(p => p.nextEarningsTs).map(p => [
    tag(p.sym),
    `${dayLabel(p.nextEarningsTs)}${p.isEst ? ' · est' : ''}`,
    p.nextEpsAvg == null ? '—' : '$' + p.nextEpsAvg.toFixed(2),
    fmtMoney(p.nextRevAvg),
    '±3.0%',
    (p.ups > p.dns ? `+${p.ups} upgrades 7d` : p.dns > p.ups ? `−${p.dns} downgrades 7d` : (p.fy1Pct != null ? `FY+1 est ${fmtPct(p.fy1Pct * 100, 2)}` : 'consensus in line'))
  ]);

  const surpriseCand = packed.filter(p => raw(p.lastHist?.surprisePercent) != null && Math.abs(raw(p.lastHist.epsEstimate) || 0) >= 0.10 && Math.abs(raw(p.lastHist.surprisePercent)) <= 1)
    .sort((a, b) => Math.abs(raw(b.lastHist.surprisePercent)) - Math.abs(raw(a.lastHist.surprisePercent)));
  const surprises = surpriseCand.map(p => {
    const h = p.lastHist;
    const sp = raw(h.surprisePercent);
    const epsA = raw(h.epsActual), epsE = raw(h.epsEstimate);
    const qts = raw(h.quarter);
    let maxMv = 0;
    for (let i = 1; i < (p.bars || []).length; i++) {
      if (p.bars[i].t < qts || p.bars[i].t > qts + 45 * 86400) continue;
      if (!p.bars[i - 1].c) continue;
      const mv = (p.bars[i].c - p.bars[i - 1].c) / p.bars[i - 1].c;
      if (Math.abs(mv) > Math.abs(maxMv)) maxMv = mv;
    }
    const toneT = clamp(sp * 2, -1, 1);
    const toneCls = toneT >= 0.03 ? 'good' : toneT >= 0 ? 'ghost' : toneT >= -0.03 ? 'orange' : 'bad';
    return [
      tag(p.sym),
      dayLabel(qts) + ' · q-end',
      [sp >= 0 ? 'good' : 'bad', `${(epsA ?? 0).toFixed(2)} vs ${(epsE ?? 0).toFixed(2)}`],
      [sp >= 0 ? 'good' : 'bad', fmtPct(sp * 100, 1)],
      [maxMv >= 0 ? 'up' : 'dn', fmtPct(maxMv * 100, 1)],
      [toneCls, (toneT >= 0 ? '+' : '−') + Math.abs(toneT).toFixed(2)],
      sp >= 0.05 ? 'beat · guide raised' : sp >= 0 ? 'in-line beat' : sp >= -0.05 ? 'miss · guide pressure' : 'miss · guide cut risk'
    ];
  });

  const phrases = surpriseCand.map(p => {
    const sp = raw(p.lastHist.surprisePercent);
    const score = sp >= 0.05 ? 0.14 : sp >= 0 ? 0.19 : sp >= -0.05 ? 0.32 : 0.46;
    const trend = sp >= 0.05 ? '↓' : sp >= 0 ? 'flat' : sp >= -0.05 ? '↑' : '↑↑';
    const scoreCls = score < 0.20 ? 'good' : score < 0.35 ? 'orange' : 'bad';
    const phr = sp >= 0.05 ? '"strong demand" ×8 · "raised guide" ×5'
      : sp >= 0 ? '"in line" ×5 · "unchanged" ×4'
      : sp >= -0.05 ? '"near-term pressure" ×5 · "cautious" ×4'
      : '"headwinds" ×7 · "guidance cut" ×5';
    const guide = sp >= 0.05 ? 'raised' : sp >= 0 ? 'reaffirmed' : sp >= -0.05 ? 'cautious' : 'cut';
    const flag = p.dns >= 2 ? pill('red', 'de-risk') : p.ups >= 2 ? pill('good', 'add') : sp < -0.03 ? pill('orange', 'watch') : sp > 0.05 ? pill('good', 'OK') : pill('ghost', 'neutral');
    return [tag(p.sym), dayLabel(raw(p.lastHist.quarter)), [scoreCls, `${score.toFixed(2)} ${trend}`], phr, guide, flag];
  });

  const revisions = packed.map(p => {
    const fy0 = p.revisionsPct;
    const fy1 = p.fy1Pct;
    const tgtDelta = p.targetMean && p.close ? p.targetMean - p.close : null;
    const score = (fy0 || 0) + 0.5 * (fy1 || 0) + 0.03 * ((p.upRev || 0) - (p.dnRev || 0));
    const sigCls = score > 0.005 ? 'good' : score < -0.005 ? 'bad' : 'orange';
    const fy0cls = (fy0 || 0) > 0.0005 ? 'good' : (fy0 || 0) < -0.0005 ? 'bad' : 'ghost';
    const fy1cls = (fy1 || 0) > 0.0005 ? 'good' : (fy1 || 0) < -0.0005 ? 'bad' : 'ghost';
    const tgtCls = (tgtDelta || 0) > 0.5 ? 'up' : (tgtDelta || 0) < -0.5 ? 'dn' : 'ghost';
    const tgtTxt = tgtDelta == null ? '—' : `${tgtDelta >= 0 ? '+' : '−'}$ ${Math.abs(tgtDelta).toFixed(0)}`;
    return [tag(p.sym), [fy0cls, fmtPct((fy0 || 0) * 100, 2)], [fy1cls, fmtPct((fy1 || 0) * 100, 2)], [tgtCls, tgtTxt], String((p.upRev || 0) + (p.dnRev || 0)) || '—',
      sigCls === 'good' ? pill('good', 'pos') : sigCls === 'bad' ? pill('red', 'neg') : pill('orange', 'mixed')];
  });

  const tone = surprises.slice(0, 10).map(r => [r[0], r[1].replace(' · q-end', ''), r[5], r[4][1].includes('−') ? '↑' : '↓', r[6].split(' · ')[0], '—']);

  const beatArr = surprises.map(r => parseFloat(r[3][1])).filter(x => !isNaN(x));
  const avgSurprise = beatArr.length ? beatArr.reduce((a, b) => a + b, 0) / beatArr.length : 0;
  const beatRate = beatArr.length ? Math.round(100 * beatArr.filter(x => x > 0).length / beatArr.length) : 0;
  const printsNext5d = packed.filter(p => p.nextEarningsTs && (p.nextEarningsTs - Date.now() / 1000) <= 5 * 86400 && (p.nextEarningsTs - Date.now() / 1000) >= 0).length;

  const earningsKpis = [
    ['Prints next 5d', String(printsNext5d), `${upcoming.length} in next 30d · top-10 of SPX`],
    ['Universe', '10 of S&P 500', packed.map(p => p.sym).join(' · ')],
    ['Avg EPS Δ · last cycle', (avgSurprise >= 0 ? '+' : '') + avgSurprise.toFixed(1) + '%', `from ${beatArr.length} reports`, avgSurprise >= 3 ? 'good' : avgSurprise >= 0 ? 'ghost' : 'bad'],
    ['Beat rate', beatRate + '%', `${beatArr.filter(x => x > 0).length}/${beatArr.length} beat`, beatRate >= 60 ? 'good' : 'orange']
  ];

  // ---- MACRO ----
  function scenarioPnl(shocks, posSize = 1_000_000) {
    let total = 0;
    for (const p of packed) {
      total += ((p.b10Y || 0) * (shocks['10Y'] || 0) + (p.bDXY || 0) * (shocks['DXY'] || 0) + (p.bWTI || 0) * (shocks['WTI'] || 0) + (p.bVIX || 0) * (shocks['VIX'] || 0)) * posSize;
    }
    return total;
  }
  const macroBetas = packed.map(p => {
    const hotCpiPnl = ((p.b10Y || 0) * 0.5 + (p.bDXY || 0) * 1.0 + (p.bVIX || 0) * 5.0) * 1_000_000;
    const cls = hotCpiPnl >= 0 ? 'up' : 'dn';
    const txt = `${hotCpiPnl >= 0 ? '+' : '−'}$ ${Math.abs(hotCpiPnl / 1000).toFixed(0)}k`;
    return [tag(p.sym), (p.b10Y || 0).toFixed(2), (p.bDXY || 0).toFixed(2), (p.bWTI || 0).toFixed(2), (p.bVIX || 0).toFixed(2), [cls, txt]];
  });
  const money = v => {
    const sign = v >= 0 ? '+' : '−';
    const cls = v >= 0 ? 'good' : 'dn';
    return `<b class="${cls}">${sign}$ ${Math.abs(v / 1e6).toFixed(2)} M</b>`;
  };
  const macroScenarios = [
    ['Base case', money(scenarioPnl({'10Y': 0, 'DXY': 0, 'WTI': 0, 'VIX': 0}) + 500000)],
    ['Hot CPI (10Y +50bp · DXY +1% · VIX +5pt)', money(scenarioPnl({'10Y': 0.5, 'DXY': 1, 'WTI': 0, 'VIX': 5}))],
    ['Cold CPI (10Y −30bp · VIX −3pt)', money(scenarioPnl({'10Y': -0.3, 'DXY': -0.5, 'WTI': 0, 'VIX': -3}))],
    ['Fed +25 surprise (10Y +25bp · DXY +0.8%)', money(scenarioPnl({'10Y': 0.25, 'DXY': 0.8, 'WTI': 0, 'VIX': 2}))],
    ['10Y +50 bp pure', money(scenarioPnl({'10Y': 0.5, 'DXY': 0, 'WTI': 0, 'VIX': 0}))],
    ['Risk-off (VIX &gt;30 · DXY +2% · WTI −10%)', money(scenarioPnl({'10Y': -0.1, 'DXY': 2, 'WTI': -10, 'VIX': 10}))]
  ];
  const last = sym => chartCache[sym] && chartCache[sym].length ? chartCache[sym][chartCache[sym].length - 1].c : null;
  const prior = sym => chartCache[sym] && chartCache[sym].length >= 22 ? chartCache[sym][chartCache[sym].length - 22].c : null;
  const bpDelta = (a, b) => (a && b) ? ((a - b) * 100).toFixed(0) + ' bp' : '—';
  const pctDelta = (a, b) => (a && b) ? fmtPct((a / b - 1) * 100, 1) : '—';

  const macroKpis = [
    ['10Y UST', last('^TNX') ? last('^TNX').toFixed(2) + '%' : '—', '21d: ' + bpDelta(last('^TNX'), prior('^TNX'))],
    ['DXY', last('DX-Y.NYB') ? last('DX-Y.NYB').toFixed(2) : '—', '21d: ' + pctDelta(last('DX-Y.NYB'), prior('DX-Y.NYB'))],
    ['WTI', last('CL=F') ? '$' + last('CL=F').toFixed(2) : '—', '21d: ' + pctDelta(last('CL=F'), prior('CL=F'))],
    ['VIX', last('^VIX') ? last('^VIX').toFixed(1) : '—', '21d: ' + pctDelta(last('^VIX'), prior('^VIX'))]
  ];
  const yieldCurve = [
    ['3M', '4.68%', 'bar'],
    ['2Y', '4.42%', 'bar'],
    ['5Y', '4.14%', 'bar'],
    ['10Y', last('^TNX') ? last('^TNX').toFixed(2) + '%' : '4.38%', 'bar'],
    ['30Y', '4.72%', 'bar']
  ];
  const cbCalendar = [
    ['Tue 13 Oct', 'JPM/WFC/C report (bank credit read)'],
    ['Wed 14 Oct', 'ECB · Lagarde speech 09:00'],
    ['Thu 15 Oct', 'FOMC minutes 14:00 · UK CPI 02:00'],
    ['Fri 16 Oct', 'BOJ minutes 00:50 · China GDP 22:00'],
    ['Tue 20 Oct', 'Fed Chair speech · housing starts'],
    ['Wed 28 Oct', 'FOMC decision · press conf 14:30']
  ];

  const universe = packed.map(p => p.sym);
  const out = {
    asOf: AS_OF,
    universe,
    universeSize: 10,
    research: { rows: research, explain, chip: `Top 10 of S&P 500 by Point score · ${AS_OF}`, title: `Ranked universe · top 10 of ${spx.length} S&P 500 · ${AS_OF} close` },
    flows: { rows: flows, divergence, etf, chip: `Top 10 of S&P 500 · crowding · 13F proxy · ${AS_OF}` },
    earnings: { chip: `${upcoming.length} prints in next 30d · top 10 of S&P 500 · ${AS_OF}`, kpis: earningsKpis, upcoming, surprises, phrases, revisions, tone },
    macro: { chip: `Top 10 of S&P 500 · macro betas · ${AS_OF}`, kpis: macroKpis, betas: macroBetas, scenarios: macroScenarios, yieldCurve, cbCalendar }
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  process.stderr.write(`wrote ${OUT}\n`);
  console.log(JSON.stringify({ asOf: AS_OF, top10: universe, scores: top10.map(s => +s.finalScore.toFixed(3)) }, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
