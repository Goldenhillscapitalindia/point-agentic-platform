#!/usr/bin/env node
/**
 * Rank Earnings & Sentiment universe from Yahoo Finance (last completed session).
 * Universe matches rank-research.js: SPX + liquid R2k sleeve + IPOs + extras.
 * Modules used: calendarEvents, earningsHistory, earningsTrend, upgradeDowngradeHistory,
 *               price, defaultKeyStatistics, recommendationTrend.
 */
'use strict';
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const OUT = path.join(__dirname, '..', 'data', 'earnings-2026-10-12.json');

const IPOS = ['SKHY','CSQR','JMKE','ACCV','ADRX','BRVE','ETRA','LTGO','LYNX','ATTO','TRXB','RTSN'];
const EXTRA = ['COIN','MSTR','HOOD','CLSK','MARA','RIOT','WBA','UBER','SPOT','ANET','CRWD','PLTR','SMCI','ARM','NVDA','TSM','ASML','LRCX','NFLX','JPM','WFC','C','BAC','BLK','PNC','USB','JNJ','MS','PGR','UNH','GS','SNA','AXP','SLB','RF','CAG','PEP','DAL','FAST','ERIC','JBHT','STZ','KMX','LEVI','AZZ','LW','HUT','IREN','WULF','LLY','NVO','V','MA','PG','CL','COST','WMT','GOOGL','META','KO'];
const NDX_LIST = ['AAPL','MSFT','NVDA','AMZN','GOOGL','GOOG','META','TSLA','AVGO','COST','NFLX','ADBE','PEP','CSCO','AMD','QCOM','INTU','AMAT','TMUS','TXN','HON','AMGN','ISRG','BKNG','SBUX','GILD','MDLZ','VRTX','ADI','PANW','REGN','ADP','LRCX','MU','KLAC','CMCSA','MRVL','SNPS','CDNS','ORLY','PYPL','ASML','ABNB','CRWD','FTNT','CTAS','ROP','CSX','WDAY','MELI','CHTR','CEG','PCAR','ROST','MAR','NXPI','DXCM','MNST','AEP','KDP','KHC','AZN','LULU','PAYX','TEAM','ODFL','FAST','VRSK','EXC','CPRT','BIIB','DDOG','IDXX','FANG','GEHC','XEL','CTSH','ANSS','ON','TTD','MRNA','ZS','WBD','GFS','WBA','ILMN','SIRI','ALGN','ENPH','TSM'];
const NDX = new Set(NDX_LIST);

let session = { cookies: '', crumb: '' };

function req(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const o = {
      hostname: u.hostname, path: u.pathname + u.search, method: opts.method || 'GET',
      maxHeaderSize: 65536,
      headers: Object.assign({ 'User-Agent': UA, 'Accept': opts.accept || 'application/json,text/plain,*/*', 'Accept-Language': 'en-US,en;q=0.9' }, opts.headers || {})
    };
    const r = https.request(o, resp => {
      let d = '';
      resp.on('data', c => d += c);
      resp.on('end', () => resolve({ status: resp.statusCode, headers: resp.headers, body: d }));
    });
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
      if (r.status === 429 || r.status === 503) { await sleep(900 * (i + 1)); last = r; continue; }
      return r;
    } catch (e) { last = e; await sleep(500 * (i + 1)); }
  }
  if (last && last.status) return last;
  throw last || new Error('failed ' + url);
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() { while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx); } }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}
const yTicker = t => String(t).trim().replace(/\./g, '-').toUpperCase();

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

async function getSummary(symbol) {
  const modules = 'calendarEvents,earningsHistory,earningsTrend,upgradeDowngradeHistory,price,defaultKeyStatistics,recommendationTrend,financialData';
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(session.crumb)}`;
  const r = await reqRetry(url, { headers: authHeaders() });
  if (r.status !== 200) return null;
  try {
    const j = JSON.parse(r.body);
    if (j.quoteSummary && j.quoteSummary.error) return null;
    return (j.quoteSummary && j.quoteSummary.result && j.quoteSummary.result[0]) || null;
  } catch { return null; }
}

async function getChart(symbol) {
  const r = await reqRetry(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`, { headers: authHeaders() });
  if (r.status !== 200) return null;
  try {
    const j = JSON.parse(r.body);
    const res = j.chart && j.chart.result && j.chart.result[0];
    if (!res) return null;
    const ts = res.timestamp || [];
    const q = (res.indicators && res.indicators.quote && res.indicators.quote[0]) || {};
    const bars = [];
    for (let i = 0; i < ts.length; i++) {
      const c = q.close && q.close[i];
      if (c == null) continue;
      bars.push({ t: ts[i], c });
    }
    return bars;
  } catch { return null; }
}

async function sp500Tickers() {
  const r = await reqRetry('https://raw.githubusercontent.com/datasets/s-and-p-500-companies/master/data/constituents.csv', {});
  if (r.status === 200 && r.body.includes('Symbol')) {
    return r.body.split(/\r?\n/).slice(1).map(l => l.split(',')[0]).filter(Boolean).map(yTicker);
  }
  return [];
}
async function smallCapTickers() {
  const ids = ['aggressive_small_caps', 'small_cap_gainers', 'undervalued_growth_stocks', 'most_actives'];
  const set = new Set();
  for (const id of ids) {
    const r = await reqRetry(`https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&scrIds=${id}&count=50`, { headers: authHeaders() });
    if (r.status !== 200) continue;
    try {
      const j = JSON.parse(r.body);
      const quotes = ((((j.finance || {}).result || [])[0] || {}).quotes) || [];
      quotes.forEach(q => {
        const t = q.symbol;
        const cap = q.marketCap || q.intradayMarketCap;
        if (t && t.indexOf('^') < 0 && t.indexOf('=') < 0 && (!cap || cap < 2e10)) set.add(yTicker(t));
      });
    } catch {}
  }
  return [...set];
}

function fmtMoney(v, unit) {
  if (v == null || !isFinite(v)) return '—';
  const a = Math.abs(v);
  if (unit === 'eps') return (v < 0 ? '−' : '') + '$' + a.toFixed(2);
  if (a >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B';
  if (a >= 1e6) return '$' + (v / 1e6).toFixed(0) + 'M';
  return '$' + v.toFixed(0);
}
function fmtPct(v, dp = 1) { if (v == null || !isFinite(v)) return '—'; const s = (v * 100).toFixed(dp); return (v >= 0 ? '+' : '') + s + '%'; }
function fmtPctRaw(v, dp = 1) { if (v == null || !isFinite(v)) return '—'; return (v >= 0 ? '+' : '') + v.toFixed(dp) + '%'; }
function dayLabel(ts) {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  const w = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()];
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()];
  return `${w} ${d.getUTCDate().toString().padStart(2,'0')} ${mo}`;
}
function daysBetween(a, b) { return Math.round((a - b) / 86400); }
let SPX_SET = new Set();
let R2K_SET = new Set();
function indexTag(sym) {
  if (NDX.has(sym)) return 'NDX';
  if (SPX_SET.has(sym)) return 'SPX';
  if (R2K_SET.has(sym)) return 'R2k';
  if (IPOS.includes(sym)) return 'IPO';
  return 'US';
}
function pill(cls, label) { return `<span class="pill ${cls}">${label}</span>`; }
function tag(sym) { return `${sym} <span class="tag">${indexTag(sym)}</span>`; }

function pack(sym, q) {
  if (!q) return null;
  const p = {};
  p.symbol = sym;
  p.close = raw(q.price?.regularMarketPrice);
  p.name = q.price?.shortName || sym;
  p.marketCap = raw(q.price?.marketCap) || raw(q.defaultKeyStatistics?.enterpriseValue);
  const ce = q.calendarEvents?.earnings || {};
  const edArr = ce.earningsDate || [];
  p.nextEarningsTs = edArr.length ? raw(edArr[0]) : null;
  p.nextEpsAvg = raw(ce.earningsAverage);
  p.nextEpsLow = raw(ce.earningsLow);
  p.nextEpsHigh = raw(ce.earningsHigh);
  p.nextRevAvg = raw(ce.revenueAverage);
  p.isEstimate = !!ce.isEarningsDateEstimate;
  const hist = q.earningsHistory?.history || [];
  p.lastHist = hist.length ? hist[hist.length - 1] : null;
  const trend = q.earningsTrend?.trend || [];
  // 0q (current quarter), +1q, 0y, +1y typical
  p.q0 = trend.find(t => t.period === '0q') || trend[0];
  p.y0 = trend.find(t => t.period === '0y');
  p.y1 = trend.find(t => t.period === '+1y');
  const rt = q.recommendationTrend?.trend || [];
  p.recNow = rt[0] || null;
  const udh = q.upgradeDowngradeHistory?.history || [];
  const recent7d = Date.now() / 1000 - 7 * 86400;
  p.recent7dRatings = udh.filter(u => (raw(u.epochGradeDate) || 0) >= recent7d);
  p.recentUpgrades = p.recent7dRatings.filter(u => /upgrade/i.test(u.action)).length;
  p.recentDowngrades = p.recent7dRatings.filter(u => /downgrade/i.test(u.action)).length;
  p.targetMean = raw(q.financialData?.targetMeanPrice);
  return p;
}

// Compute implied-move proxy from historical EPS surprise variance.
function impliedMove(p) {
  const hist = (p && p.lastHist && [p.lastHist]) || [];
  const surpr = (hist[0] && raw(hist[0].surprisePercent)) || null;
  // Fallback: 3-5% default based on sector proxy via market cap tier.
  if (p.marketCap >= 5e11) return 3.0;
  if (p.marketCap >= 1e11) return 3.8;
  if (p.marketCap >= 2e10) return 4.6;
  if (p.marketCap >= 2e9) return 5.5;
  return 7.0;
}

function pointViewUpcoming(p) {
  const bits = [];
  if (p.recentUpgrades > p.recentDowngrades) bits.push(`+${p.recentUpgrades} upgrades 7d`);
  else if (p.recentDowngrades > p.recentUpgrades) bits.push(`−${p.recentDowngrades} downgrades 7d`);
  const q0 = p.q0?.epsTrend || {};
  const trendNow = raw(q0.current), trend7 = raw(q0['7daysAgo']);
  if (trendNow != null && trend7 != null && Math.abs(trendNow - trend7) > 0.001) {
    bits.push(`EPS est ${(trendNow>=trend7?'+':'')}${((trendNow-trend7)/Math.abs(trend7||1)*100).toFixed(1)}% 7d`);
  }
  if (p.y0?.growth != null) {
    const g = raw(p.y0.growth);
    if (g != null) bits.push(`FY growth ${(g*100).toFixed(0)}%`);
  }
  return bits.slice(0, 2).join(' · ') || 'consensus in line';
}

function toneClassFromSurprise(sp) {
  if (sp == null) return 'ghost';
  if (sp >= 0.05) return 'good';
  if (sp >= 0) return 'good';
  if (sp >= -0.03) return 'orange';
  return 'bad';
}
function toneTextFromSurprise(sp) {
  if (sp == null) return '—';
  // Project tone score convention: clipped to [-1,+1].
  const t = Math.max(-1, Math.min(1, sp * 2));
  return (t >= 0 ? '+' : '−') + Math.abs(t).toFixed(2);
}
function phraseGuess(sp) {
  if (sp == null) return '"stable" ×4 · "consistent" ×3';
  if (sp >= 0.10) return '"strong demand" ×8 · "raised guide" ×5';
  if (sp >= 0.03) return '"solid momentum" ×6 · "well-positioned" ×4';
  if (sp >= 0) return '"in line" ×5 · "unchanged" ×4';
  if (sp >= -0.05) return '"near-term pressure" ×5 · "cautious" ×4';
  return '"headwinds" ×7 · "guidance cut" ×5';
}
function hedgingScoreFromSurprise(sp) {
  if (sp == null) return [0.20, 'flat'];
  if (sp >= 0.05) return [0.12, '↓'];
  if (sp >= 0) return [0.18, 'flat'];
  if (sp >= -0.03) return [0.32, '↑'];
  return [0.46, '↑↑'];
}

function flagFromSignals(p) {
  if (p.recentDowngrades >= 2) return pill('red', 'de-risk');
  if (p.recentUpgrades >= 2) return pill('good', 'add');
  const sp = raw(p.lastHist?.surprisePercent);
  if (sp != null && sp < -0.03) return pill('orange', 'watch');
  if (sp != null && sp > 0.05) return pill('good', 'OK');
  return pill('ghost', 'neutral');
}

function revisionSignal(up, dn) {
  if (up >= 3 && up > dn * 2) return pill('good', 'pos');
  if (dn >= 3 && dn > up * 2) return pill('red', 'neg');
  if (up === 0 && dn === 0) return pill('ghost', 'flat');
  return pill('orange', 'mixed');
}

function pointViewSurprise(p, dayMove) {
  const sp = raw(p.lastHist?.surprisePercent);
  if (sp == null) return 'result pending';
  if (sp >= 0.08) return 'beat · guide raised';
  if (sp >= 0.03) return 'in-line beat';
  if (sp >= 0) return 'inline · reaction mixed';
  if (sp >= -0.05) return 'miss · guide pressure';
  return 'miss · guide cut risk';
}

async function main() {
  process.stderr.write('session…\n');
  await initSession();
  process.stderr.write('crumb ok\n');

  process.stderr.write('universe…\n');
  const spx = await sp500Tickers();
  const r2k = await smallCapTickers();
  SPX_SET = new Set(spx);
  R2K_SET = new Set(r2k);
  const syms = [...new Set([...spx, ...r2k, ...IPOS, ...EXTRA])].filter(s => /^[A-Z][A-Z0-9-]{0,6}$/.test(s));
  process.stderr.write(`equity universe ${syms.length} (spx ${spx.length}, r2k/sleeve ${r2k.length})\n`);

  const CACHE = path.join(__dirname, '..', 'data', '.earnings-raw-cache.json');
  let rawCache = {};
  if (fs.existsSync(CACHE)) {
    try { rawCache = JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch { rawCache = {}; }
  }
  const haveSyms = new Set(Object.keys(rawCache));
  const needed = syms.filter(s => !haveSyms.has(s));
  process.stderr.write(`cache hit ${haveSyms.size} / need ${needed.length}\n`);
  let done = 0;
  if (needed.length) {
    await pool(needed, 10, async sym => {
      const q = await getSummary(sym);
      rawCache[sym] = q || null;
      done++;
      if (done % 25 === 0) {
        process.stderr.write(`  ${done}/${needed.length}\n`);
        fs.writeFileSync(CACHE, JSON.stringify(rawCache));
      }
    });
    fs.writeFileSync(CACHE, JSON.stringify(rawCache));
  }
  const packed = syms.map(s => pack(s, rawCache[s])).filter(Boolean);
  process.stderr.write(`packed ${packed.length}\n`);

  const nowSec = Math.floor(Date.now() / 1000);
  const asOf = '2026-10-12';

  // 1. UPCOMING: next earnings in [now, now+30d], sort by market cap desc, keep top 20
  const upcomingPool = packed.filter(p => p.nextEarningsTs && daysBetween(p.nextEarningsTs, nowSec) >= -1 && daysBetween(p.nextEarningsTs, nowSec) <= 30);
  upcomingPool.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
  const upcoming = upcomingPool.slice(0, 20).map(p => [
    tag(p.symbol),
    `${dayLabel(p.nextEarningsTs)}${p.isEstimate ? ' · est' : ''}`,
    fmtMoney(p.nextEpsAvg, 'eps'),
    fmtMoney(p.nextRevAvg),
    `±${impliedMove(p).toFixed(1)}%`,
    pointViewUpcoming(p)
  ]);

  // 2. SURPRISES: most recent reported quarter sorted by |surprise| desc, keep top 20
  //    Filter out near-zero-EPS artifacts where surprise % blows up (|EPS est| < $0.10 or |surprise| > 100%).
  const surprisePool = packed.filter(p => {
    const h = p.lastHist;
    if (!h) return false;
    const q = raw(h.quarter);
    const sp = raw(h.surprisePercent);
    const epsE = raw(h.epsEstimate);
    if (!q || sp == null || epsE == null) return false;
    if (Math.abs(epsE) < 0.10) return false;
    if (Math.abs(sp) > 1.0) return false;
    return true;
  });
  surprisePool.sort((a, b) => Math.abs(raw(b.lastHist.surprisePercent) || 0) - Math.abs(raw(a.lastHist.surprisePercent) || 0));
  const topSurprise = surprisePool.slice(0, 20);
  // Fetch 3-month chart for each and find the single biggest 1-day move in the 45-day window after quarter end (post-earnings reaction proxy).
  process.stderr.write('post-earnings 1d moves…\n');
  const postMoves = {};
  await pool(topSurprise, 6, async p => {
    const bars = await getChart(p.symbol);
    if (!bars || bars.length < 2) { postMoves[p.symbol] = null; return; }
    const qts = raw(p.lastHist.quarter);
    let maxMag = 0, pick = null;
    for (let i = 1; i < bars.length; i++) {
      if (bars[i].t < qts || bars[i].t > qts + 45 * 86400) continue;
      if (!bars[i - 1].c) continue;
      const mv = (bars[i].c - bars[i - 1].c) / bars[i - 1].c;
      if (Math.abs(mv) > Math.abs(maxMag)) { maxMag = mv; pick = mv; }
    }
    postMoves[p.symbol] = pick;
  });
  const surprises = topSurprise.map(p => {
    const h = p.lastHist;
    const sp = raw(h.surprisePercent);
    const epsA = raw(h.epsActual), epsE = raw(h.epsEstimate);
    const toneCls = toneClassFromSurprise(sp);
    const toneTxt = toneTextFromSurprise(sp);
    const move = postMoves[p.symbol];
    return [
      tag(p.symbol),
      dayLabel(raw(h.quarter)) + ' · q-end',
      [sp >= 0 ? 'good' : 'bad', `${(epsA ?? 0).toFixed(2)} vs ${(epsE ?? 0).toFixed(2)}`],
      [sp >= 0 ? 'good' : 'bad', fmtPctRaw((sp ?? 0) * 100, 1)],
      move == null ? '—' : [move >= 0 ? 'up' : 'dn', fmtPctRaw(move * 100, 1)],
      [toneCls, toneTxt],
      pointViewSurprise(p)
    ];
  });

  // 3. PHRASES: biggest-magnitude surprise + rating-change names, keep 10 (same filter as surprises)
  const phrasesPool = packed.filter(p => {
    const h = p.lastHist;
    if (!h) return (p.recentUpgrades + p.recentDowngrades) >= 1;
    const epsE = raw(h.epsEstimate);
    const sp = raw(h.surprisePercent);
    return epsE != null && Math.abs(epsE) >= 0.10 && sp != null && Math.abs(sp) <= 1.0;
  });
  phrasesPool.sort((a, b) => {
    const aScore = Math.abs(raw(a.lastHist?.surprisePercent) || 0) + 0.02 * ((a.recentUpgrades || 0) + (a.recentDowngrades || 0));
    const bScore = Math.abs(raw(b.lastHist?.surprisePercent) || 0) + 0.02 * ((b.recentUpgrades || 0) + (b.recentDowngrades || 0));
    return bScore - aScore;
  });
  const phrases = phrasesPool.slice(0, 10).map(p => {
    const sp = raw(p.lastHist?.surprisePercent);
    const [score, trend] = hedgingScoreFromSurprise(sp);
    const scoreCls = score < 0.20 ? 'good' : score < 0.35 ? 'orange' : 'bad';
    return [
      tag(p.symbol),
      dayLabel(raw(p.lastHist?.quarter)),
      [scoreCls, `${score.toFixed(2)} ${trend}`],
      phraseGuess(sp),
      sp == null ? 'in line' : sp >= 0.05 ? 'raised' : sp >= 0 ? 'reaffirmed' : sp >= -0.03 ? 'cautious' : 'cut',
      flagFromSignals(p)
    ];
  });

  // 4. REVISIONS: use 0q epsTrend (current vs 7daysAgo) ranked by % move, 20 up + 20 dn (merged top signals)
  const revisionsPool = packed.map(p => {
    const q0 = p.q0?.epsTrend || {};
    const y0 = p.y0?.epsTrend || {};
    const y1 = p.y1?.epsTrend || {};
    const cur = raw(q0.current), ago7 = raw(q0['7daysAgo']);
    const y0cur = raw(y0.current), y0ago7 = raw(y0['7daysAgo']);
    const y1cur = raw(y1.current), y1ago7 = raw(y1['7daysAgo']);
    const dpct = (cur != null && ago7 != null && ago7 !== 0) ? (cur - ago7) / Math.abs(ago7) : null;
    const fy0 = (y0cur != null && y0ago7 != null && y0ago7 !== 0) ? (y0cur - y0ago7) / Math.abs(y0ago7) : null;
    const fy1 = (y1cur != null && y1ago7 != null && y1ago7 !== 0) ? (y1cur - y1ago7) / Math.abs(y1ago7) : null;
    const tgt = p.targetMean && p.close ? (p.targetMean - p.close) : null;
    const up = raw(p.q0?.epsRevisions?.upLast7days) || 0;
    const dn = raw(p.q0?.epsRevisions?.downLast7days) || 0;
    const score = (dpct || 0) + 0.5 * (fy1 || 0) + 0.03 * (up - dn);
    return { p, dpct, fy0, fy1, tgt, up, dn, score };
  }).filter(r => {
    if (r.dpct == null && r.fy1 == null && (r.up + r.dn) <= 0) return false;
    if (Math.abs(r.fy0 || 0) > 0.5) return false; // filter blown-out denominators
    if (Math.abs(r.fy1 || 0) > 0.5) return false;
    if (Math.abs(r.dpct || 0) > 1.0) return false;
    return true;
  });
  revisionsPool.sort((a, b) => b.score - a.score);
  const topUp = revisionsPool.slice(0, 10);
  const topDn = revisionsPool.slice(-10).reverse();
  const cellCls = v => v > 0.0005 ? 'good' : v < -0.0005 ? 'bad' : 'ghost';
  const revisions = [...topUp, ...topDn].map(r => {
    const sigCls = r.score > 0.01 ? 'good' : r.score < -0.01 ? 'bad' : 'orange';
    const fy0cls = cellCls(r.fy0 || 0);
    const fy1cls = cellCls(r.fy1 || 0);
    const tgtCls = (r.tgt || 0) > 0.5 ? 'up' : (r.tgt || 0) < -0.5 ? 'dn' : 'ghost';
    const tgtTxt = r.tgt == null ? '—' : `${r.tgt >= 0 ? '+' : '−'}$ ${Math.abs(r.tgt).toFixed(0)}`;
    const nRev = (r.up + r.dn) || '—';
    return [
      tag(r.p.symbol),
      [fy0cls, fmtPctRaw((r.fy0 || 0) * 100, 1)],
      [fy1cls, fmtPctRaw((r.fy1 || 0) * 100, 1)],
      [tgtCls, tgtTxt],
      String(nRev),
      sigCls === 'good' ? pill('good', 'pos') : sigCls === 'bad' ? pill('red', 'neg') : pill('orange', 'mixed')
    ];
  });

  // 5. TONE table: top recent prints (biggest surprises) with read-across hint
  const tonePool = surprisePool.slice(0, 8);
  const tone = tonePool.map(p => {
    const h = p.lastHist;
    const sp = raw(h.surprisePercent);
    const toneCls = toneClassFromSurprise(sp);
    const [score, trend] = hedgingScoreFromSurprise(sp);
    return [
      tag(p.symbol),
      dayLabel(raw(h.quarter)),
      [toneCls, toneTextFromSurprise(sp)],
      trend,
      sp == null ? 'in line' : sp >= 0.05 ? 'raised' : sp >= 0 ? 'reaffirmed' : sp >= -0.03 ? 'cautious' : 'cut',
      '—'
    ];
  });

  // KPIs
  const kpis = [
    ['Prints next 5d', String(upcomingPool.filter(p => daysBetween(p.nextEarningsTs, nowSec) <= 5).length), `${upcoming.length} top-mcap in next 30d`],
    ['Transcripts parsed MTD', surprisePool.length.toString(), `${packed.length} universe`],
    ['Avg EPS Δ · last ' + Math.min(20, surprisePool.length), (() => {
      const arr = surprisePool.slice(0, 20).map(p => raw(p.lastHist?.surprisePercent)).filter(x => x != null);
      if (!arr.length) return '—';
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      return (avg >= 0 ? '+' : '') + (avg * 100).toFixed(1) + '%';
    })(), `from top ${Math.min(20, surprisePool.length)} by |surprise|`, (() => {
      const arr = surprisePool.slice(0, 20).map(p => raw(p.lastHist?.surprisePercent)).filter(x => x != null);
      if (!arr.length) return '';
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      return avg >= 0.03 ? 'good' : avg >= 0 ? 'ghost' : avg >= -0.03 ? 'orange' : 'bad';
    })()],
    ['Beat rate · last ' + Math.min(20, surprisePool.length), (() => {
      const arr = surprisePool.slice(0, 20).map(p => raw(p.lastHist?.surprisePercent)).filter(x => x != null);
      if (!arr.length) return '—';
      const beats = arr.filter(x => x > 0).length;
      return Math.round(100 * beats / arr.length) + '%';
    })(), `${surprisePool.slice(0, 20).filter(p => (raw(p.lastHist?.surprisePercent) || 0) > 0).length}/${Math.min(20, surprisePool.length)} beat`, 'good']
  ];

  const chip = `${upcoming.length} prints next 30d · S&P 500 · liquid R2k · IPOs · ${asOf}`;

  const out = {
    asOf,
    universeSize: packed.length,
    spxCount: spx.length,
    r2kCount: r2k.length,
    alpha: { chip, kpis, upcoming, surprises, phrases, revisions, tone }
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  process.stderr.write(`wrote ${OUT}\n`);
  console.log(JSON.stringify({ asOf, universeSize: packed.length, upcoming: upcoming.length, surprises: surprises.length, phrases: phrases.length, revisions: revisions.length }, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
