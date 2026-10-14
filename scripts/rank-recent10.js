#!/usr/bin/env node
/**
 * Rank the 10 most-recent S&P 500 additions across all 4 Market-Squad dashboards.
 * Produces data/recent10-2026-10-12.json consumed by emit-recent10.js.
 */
'use strict';
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const OUT = path.join(__dirname, '..', 'data', 'recent10-2026-10-12.json');
const AS_OF = '2026-10-12';

// Top 10 S&P 500 by Point score (0.25*momentum + 0.20*revisions + 0.20*sentiment
// + 0.20*FY growth + 0.15*ROE), applied to all cached SPX names with
// market cap in [$10B, $5T], excluding IPOs/miners.
const RECENT10 = ['AVGO','MU','STX','WDC','AMD','APP','TER','PLTR','COF','GEV'];
const MACRO = [
  ['^TNX','10Y UST','rate'],
  ['DX-Y.NYB','DXY','fx'],
  ['CL=F','WTI','comm'],
  ['^VIX','VIX','vol'],
  ['GC=F','Gold','comm'],
  ['SPY','SPY','eq']
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

async function getSummary(sym) {
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(sym)}?modules=calendarEvents,earningsHistory,earningsTrend,upgradeDowngradeHistory,price,defaultKeyStatistics,recommendationTrend,financialData,summaryDetail,summaryProfile&crumb=${encodeURIComponent(session.crumb)}`;
  const r = await reqRetry(url, { headers: authHeaders() });
  if (r.status !== 200) return null;
  try {
    const j = JSON.parse(r.body);
    if (j.quoteSummary && j.quoteSummary.error) return null;
    return (j.quoteSummary && j.quoteSummary.result && j.quoteSummary.result[0]) || null;
  } catch { return null; }
}
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

// Pearson correlation and simple OLS slope.
function stats(arr) {
  const n = arr.length;
  if (!n) return { mean: 0, std: 0 };
  const m = arr.reduce((a, b) => a + b, 0) / n;
  const v = arr.reduce((a, b) => a + (b - m) ** 2, 0) / n;
  return { mean: m, std: Math.sqrt(v) };
}
function beta(y, x) {
  const n = Math.min(y.length, x.length);
  if (n < 10) return null;
  const yy = y.slice(-n), xx = x.slice(-n);
  const ym = yy.reduce((a, b) => a + b, 0) / n;
  const xm = xx.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xx[i] - xm) * (yy[i] - ym);
    den += (xx[i] - xm) ** 2;
  }
  return den === 0 ? null : num / den;
}
function returns(bars) {
  const out = [];
  for (let i = 1; i < bars.length; i++) {
    if (bars[i - 1].c && bars[i].c) out.push((bars[i].c - bars[i - 1].c) / bars[i - 1].c);
  }
  return out;
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
function tag(sym) { return sym; }
function pill(cls, label) { return `<span class="pill ${cls}">${label}</span>`; }

async function main() {
  process.stderr.write('session…\n');
  await initSession();
  process.stderr.write('fetch 10 stocks + macro factors…\n');

  const summaries = {}, charts = {};
  for (const sym of RECENT10) {
    summaries[sym] = await getSummary(sym);
    charts[sym] = await getChart(sym, '3mo');
    process.stderr.write(`  ${sym} ok\n`);
  }
  const macroBars = {};
  for (const [sym, name] of MACRO) {
    macroBars[sym] = await getChart(sym, '3mo');
    process.stderr.write(`  macro ${name} ok\n`);
  }
  const spyRet = returns(macroBars['SPY'] || []);
  const factorRet = {};
  for (const [sym, name] of MACRO) factorRet[name] = returns(macroBars[sym] || []);

  // ---- Pack per-ticker ----
  const packed = RECENT10.map(sym => {
    const q = summaries[sym] || {};
    const bars = charts[sym] || [];
    const ret = returns(bars);
    const close = raw(q.price?.regularMarketPrice);
    const mcap = raw(q.price?.marketCap);
    const ret21 = bars.length >= 22 ? (bars[bars.length - 1].c / bars[bars.length - 22].c - 1) : null;
    const ret5 = bars.length >= 6 ? (bars[bars.length - 1].c / bars[bars.length - 6].c - 1) : null;
    const b10Y = beta(ret, factorRet['10Y UST']);
    const bDXY = beta(ret, factorRet['DXY']);
    const bWTI = beta(ret, factorRet['WTI']);
    const bVIX = beta(ret, factorRet['VIX']);
    const bSPY = beta(ret, spyRet);
    const bGold = beta(ret, factorRet['Gold']);
    const hist = q.earningsHistory?.history || [];
    const lastHist = hist.length ? hist[hist.length - 1] : null;
    const ce = q.calendarEvents?.earnings || {};
    const edArr = ce.earningsDate || [];
    const trend0 = (q.earningsTrend?.trend || []).find(t => t.period === '0q') || {};
    const trendY1 = (q.earningsTrend?.trend || []).find(t => t.period === '+1y') || {};
    const epsTrendCur = raw(trend0.epsTrend?.current);
    const epsTrend7 = raw(trend0.epsTrend?.['7daysAgo']);
    const fy1Cur = raw(trendY1.epsTrend?.current);
    const fy1_7 = raw(trendY1.epsTrend?.['7daysAgo']);
    const revisionsPct = (epsTrendCur != null && epsTrend7 != null && epsTrend7 !== 0) ? (epsTrendCur - epsTrend7) / Math.abs(epsTrend7) : null;
    const fy1Pct = (fy1Cur != null && fy1_7 != null && fy1_7 !== 0) ? (fy1Cur - fy1_7) / Math.abs(fy1_7) : null;
    const upRev = raw(trend0.epsRevisions?.upLast7days) || 0;
    const dnRev = raw(trend0.epsRevisions?.downLast7days) || 0;
    const rec = q.recommendationTrend?.trend?.[0] || {};
    const udh = q.upgradeDowngradeHistory?.history || [];
    const now = Date.now() / 1000;
    const recent7 = udh.filter(u => (raw(u.epochGradeDate) || 0) >= now - 7 * 86400);
    const ups = recent7.filter(u => /upgrade/i.test(u.action)).length;
    const dns = recent7.filter(u => /downgrade/i.test(u.action)).length;
    const shortPct = raw(q.defaultKeyStatistics?.shortPercentOfFloat);
    const instPct = raw(q.defaultKeyStatistics?.heldPercentInstitutions);
    const insiderPct = raw(q.defaultKeyStatistics?.heldPercentInsiders);
    const targetMean = raw(q.financialData?.targetMeanPrice);
    const sector = q.summaryProfile?.sector || '—';
    return {
      sym, name: q.price?.shortName || sym, sector, close, mcap, ret, ret21, ret5,
      b10Y, bDXY, bWTI, bVIX, bSPY, bGold,
      lastHist, nextEarningsTs: edArr.length ? raw(edArr[0]) : null, nextEpsAvg: raw(ce.earningsAverage), nextRevAvg: raw(ce.revenueAverage), isEst: !!ce.isEarningsDateEstimate,
      revisionsPct, fy1Pct, upRev, dnRev,
      recBuy: (raw(rec.strongBuy) || 0) + (raw(rec.buy) || 0), recHold: raw(rec.hold) || 0, recSell: (raw(rec.sell) || 0) + (raw(rec.strongSell) || 0),
      ups, dns, shortPct, instPct, insiderPct, targetMean, bars
    };
  });

  // ---- RESEARCH & ALPHA ----
  // Score: momentum + revisions + rating buys - sells, normalized.
  // Also attach score + fit to each packed element so later views (AI briefs) can use it.
  packed.forEach(p => {
    const mom = p.ret21 == null ? 0 : Math.max(-1, Math.min(1, p.ret21 * 2));
    const rev = p.revisionsPct == null ? 0 : Math.max(-1, Math.min(1, p.revisionsPct * 10));
    const sentP = (p.recBuy + p.recHold + p.recSell) > 0 ? (p.recBuy - p.recSell) / (p.recBuy + p.recHold + p.recSell) : 0;
    p.finalScore = Math.max(0, Math.min(1, 0.5 + 0.2 * mom + 0.15 * rev + 0.15 * sentP));
  });
  const research = packed.map((p, i) => {
    const mom = p.ret21 == null ? 0 : Math.max(-1, Math.min(1, p.ret21 * 2));
    const rev = p.revisionsPct == null ? 0 : Math.max(-1, Math.min(1, p.revisionsPct * 10));
    const sent = (p.recBuy + p.recHold + p.recSell) > 0 ? (p.recBuy - p.recSell) / (p.recBuy + p.recHold + p.recSell) : 0;
    const score = p.finalScore;
    const quality = Math.round(Math.max(5, Math.min(99, 50 + 25 * mom + 15 * sent)));
    const momArrow = p.ret21 == null ? 'flat' : p.ret21 > 0.08 ? '↑↑' : p.ret21 > 0.02 ? '↑' : p.ret21 > -0.02 ? 'flat' : p.ret21 > -0.08 ? '↓' : '↓↓';
    const revCount = (p.upRev || 0) - (p.dnRev || 0);
    const sentLabel = sent > 0.15 ? 'pos' : sent < -0.15 ? 'neg' : 'neutral';
    const fit = score >= 0.70 ? 'strong' : score >= 0.55 ? 'fit' : score >= 0.40 ? 'hold' : 'short';
    const scoreCls = score >= 0.60 ? 'good' : score <= 0.40 ? 'bad' : 'ghost';
    return {
      sym: p.sym, score, row: [
        '', tag(p.sym),
        [scoreCls, score.toFixed(2)],
        String(quality),
        momArrow,
        revCount >= 0 ? '+' + revCount : String(revCount),
        sentLabel,
        rangeOf(p.bars, 1),
        rangeOf(p.bars, 5),
        fit
      ]
    };
  }).sort((a, b) => b.score - a.score).map((r, i) => {
    r.row[0] = String(i + 1);
    return r.row;
  });

  const topResearch = packed.sort((a, b) => (b.ret21 || 0) - (a.ret21 || 0))[0];
  const researchExplain = topResearch ? {
    name: `${topResearch.sym} (long)`,
    bars: [
      ['Quality', Math.round(Math.max(5, Math.min(99, 50 + 40 * (topResearch.ret21 || 0))))],
      ['Momentum', Math.round(Math.max(5, Math.min(99, 50 + 400 * (topResearch.ret5 || 0))))],
      ['Revisions', Math.round(Math.max(5, Math.min(99, 50 + 1000 * (topResearch.revisionsPct || 0))))],
      ['Sentiment', Math.round(Math.max(5, Math.min(99, 50 + 15 * ((topResearch.recBuy || 0) - (topResearch.recSell || 0)))))],
      ['Macro fit', Math.round(Math.max(5, Math.min(99, 50 + 30 * (topResearch.bSPY || 0))))]
    ],
    text: `Model attributes top rank to <b>${topResearch.sym}</b> at the ${AS_OF} close ($${(topResearch.close || 0).toFixed(2)}): 21-day momentum ${(100 * (topResearch.ret21 || 0)).toFixed(1)}%, consensus FY+1 revisions ${(100 * (topResearch.fy1Pct || 0)).toFixed(2)}% 7d, analyst sell-side mix ${topResearch.recBuy} buy / ${topResearch.recHold} hold / ${topResearch.recSell} sell. Beta to SPY ${((topResearch.bSPY || 0)).toFixed(2)}.`
  } : null;

  // ---- FUND FLOWS ----
  const flows = packed.map(p => {
    const shortFloat = p.shortPct == null ? null : p.shortPct * 100;
    const inst = p.instPct == null ? null : p.instPct * 100;
    const crowding = Math.round(Math.max(0, Math.min(99, 20 + (inst || 50) * 0.6 + (shortFloat || 2) * 1.2)));
    const skew = p.ret21 == null ? '—' : p.ret21 > 0.05 ? 'call-skew' : p.ret21 < -0.05 ? 'put-skew' : 'flat';
    const flag = crowding >= 85 ? pill('red', 'crowded') : crowding >= 70 ? pill('orange', 'watch') : pill('good', 'OK');
    const insider = p.insiderPct == null ? null : p.insiderPct * 100;
    const insTxt = insider == null ? '—' : (insider >= 1 ? `+${insider.toFixed(1)} pts` : `${insider.toFixed(2)} pts`);
    const crowdCls = crowding >= 80 ? 'warn' : null;
    return [
      tag(p.sym),
      crowdCls ? [crowdCls, String(crowding)] : String(crowding),
      inst == null ? '—' : inst.toFixed(1) + '%',
      insTxt,
      shortFloat == null ? '—' : shortFloat.toFixed(1) + '%',
      skew,
      flag
    ];
  });

  // ---- 13F divergence vs research · for the 10 names ----
  // Research signal: long if finalScore ≥ 0.55, short if < 0.45, neutral between.
  // Flow proxy: revisions direction + recent analyst upgrades. Aligned if same side; divergent if opposite.
  const divergence = packed.map(p => {
    const researchLong = p.finalScore >= 0.55;
    const researchShort = p.finalScore < 0.45;
    const flowUp = (p.upRev || 0) > (p.dnRev || 0) || (p.revisionsPct || 0) > 0.001;
    const flowDown = (p.dnRev || 0) > (p.upRev || 0) || (p.revisionsPct || 0) < -0.001;
    const aligned = (researchLong && flowUp) || (researchShort && flowDown);
    const divergent = (researchLong && flowDown) || (researchShort && flowUp);
    const label = aligned ? 'aligned' : divergent ? 'divergent' : 'mixed';
    const cls = aligned ? 'pill good' : divergent ? 'pill red' : 'pill orange';
    const rside = researchLong ? 'long' : researchShort ? 'short' : 'neutral';
    const fside = flowUp ? `${p.upRev}↑ / ${p.dnRev}↓ revisions` : flowDown ? `${p.upRev}↑ / ${p.dnRev}↓ revisions` : 'flat revisions';
    return [`<b>${p.sym}</b> — research ${rside} (score ${p.finalScore.toFixed(2)}) · flow ${fside}`, cls, label];
  });

  // ---- 5-day price tape · the 10 names (replaces old sector-ETF tape) ----
  const etf = packed.map(p => {
    const b = p.bars || [];
    const ret5 = b.length >= 6 ? (b[b.length - 1].c / b[b.length - 6].c - 1) : 0;
    const pct = ret5 * 100;
    const barW = Math.round(Math.min(100, Math.abs(pct) * 10)); // 10% move = full bar
    const cls = pct >= 0 ? '' : 'bad';
    const lbl = fmtPct(pct, 1);
    return [p.sym, barW, cls, lbl];
  }).sort((a, b) => parseFloat(b[3]) - parseFloat(a[3]));

  // ---- Social sentiment proxy · top 5 names (derived from analyst mix, since no real feed) ----
  // Row shape expected by renderer: [ticker, neg%, pos%, '<pos>/<neg>']
  const social = packed.slice(0, 5).map(p => {
    const total = (p.recBuy || 0) + (p.recHold || 0) + (p.recSell || 0);
    const posPct = total > 0 ? Math.round(100 * p.recBuy / total) : 50;
    const negPct = total > 0 ? Math.round(100 * p.recSell / total) : 20;
    return [p.sym, negPct, posPct, `${posPct}/${negPct}`];
  });

  // ---- EARNINGS & SENTIMENT ----
  const upcoming = packed.filter(p => p.nextEarningsTs).map(p => [
    tag(p.sym),
    `${dayLabel(p.nextEarningsTs)}${p.isEst ? ' · est' : ''}`,
    p.nextEpsAvg == null ? '—' : '$' + p.nextEpsAvg.toFixed(2),
    fmtMoney(p.nextRevAvg),
    '±3.0%',
    (p.ups > p.dns ? `+${p.ups} upgrades 7d` : p.dns > p.ups ? `−${p.dns} downgrades 7d` : (p.fy1Pct != null ? `FY+1 est ${fmtPct(p.fy1Pct * 100, 2)}` : 'consensus in line'))
  ]);

  const surprises = packed.filter(p => raw(p.lastHist?.surprisePercent) != null && Math.abs(raw(p.lastHist.epsEstimate) || 0) >= 0.10 && Math.abs(raw(p.lastHist.surprisePercent)) <= 1)
    .sort((a, b) => Math.abs(raw(b.lastHist.surprisePercent)) - Math.abs(raw(a.lastHist.surprisePercent)))
    .map(p => {
      const h = p.lastHist;
      const sp = raw(h.surprisePercent);
      const epsA = raw(h.epsActual), epsE = raw(h.epsEstimate);
      // compute max 1d move within 45d post-quarter
      const qts = raw(h.quarter);
      let maxMv = 0;
      for (let i = 1; i < (p.bars || []).length; i++) {
        if (p.bars[i].t < qts || p.bars[i].t > qts + 45 * 86400) continue;
        if (!p.bars[i - 1].c) continue;
        const mv = (p.bars[i].c - p.bars[i - 1].c) / p.bars[i - 1].c;
        if (Math.abs(mv) > Math.abs(maxMv)) maxMv = mv;
      }
      const toneT = Math.max(-1, Math.min(1, sp * 2));
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

  const phrases = surprises.slice(0, 10).map(r => r); // phrases table uses the same universe reshaped
  // Build phrases rows from scratch for clarity.
  const phrasesRows = packed.filter(p => raw(p.lastHist?.surprisePercent) != null && Math.abs(raw(p.lastHist.epsEstimate) || 0) >= 0.10 && Math.abs(raw(p.lastHist.surprisePercent)) <= 1)
    .sort((a, b) => Math.abs(raw(b.lastHist.surprisePercent)) - Math.abs(raw(a.lastHist.surprisePercent)))
    .map(p => {
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
      return [
        tag(p.sym),
        dayLabel(raw(p.lastHist.quarter)),
        [scoreCls, `${score.toFixed(2)} ${trend}`],
        phr,
        guide,
        flag
      ];
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
    return [
      tag(p.sym),
      [fy0cls, fmtPct((fy0 || 0) * 100, 2)],
      [fy1cls, fmtPct((fy1 || 0) * 100, 2)],
      [tgtCls, tgtTxt],
      String((p.upRev || 0) + (p.dnRev || 0)) || '—',
      sigCls === 'good' ? pill('good', 'pos') : sigCls === 'bad' ? pill('red', 'neg') : pill('orange', 'mixed')
    ];
  });

  const tone = surprises.slice(0, 10).map(r => [r[0], r[1].replace(' · q-end', ''), r[5], r[4][1].includes('−') ? '↑' : '↓', r[6].split(' · ')[0], '—']);

  const beatArr = surprises.map(r => parseFloat(r[3][1])).filter(x => !isNaN(x));
  const avgSurprise = beatArr.length ? beatArr.reduce((a, b) => a + b, 0) / beatArr.length : 0;
  const beatRate = beatArr.length ? Math.round(100 * beatArr.filter(x => x > 0).length / beatArr.length) : 0;
  const printsNext5d = packed.filter(p => p.nextEarningsTs && (p.nextEarningsTs - Date.now() / 1000) <= 5 * 86400 && (p.nextEarningsTs - Date.now() / 1000) >= 0).length;

  const earningsKpis = [
    ['Prints next 5d', String(printsNext5d), `${upcoming.length} in next 30d · 10-name universe`],
    ['Universe', '10 recent SPX adds', 'Palantir · Dell · Apollo · Workday · DoorDash · WSM · TKO · EXE · EQT · TPL'],
    ['Avg EPS Δ · last cycle', (avgSurprise >= 0 ? '+' : '') + avgSurprise.toFixed(1) + '%', `from ${beatArr.length} reports`, avgSurprise >= 3 ? 'good' : avgSurprise >= 0 ? 'ghost' : avgSurprise >= -3 ? 'orange' : 'bad'],
    ['Beat rate', beatRate + '%', `${beatArr.filter(x => x > 0).length}/${beatArr.length} beat`, beatRate >= 60 ? 'good' : 'orange']
  ];

  // ---- MACRO & REGIME ----
  // Scenario shocks: hot CPI → +50bp 10Y, +1% DXY, +5pt VIX; cold CPI inverse; Fed +25 → +25bp 10Y; etc.
  function scenarioPnl(shocks, posSize = 1_000_000) {
    // shocks: {10Y, DXY, WTI, VIX} as decimal shocks
    let total = 0;
    for (const p of packed) {
      let impact = 0;
      impact += (p.b10Y || 0) * (shocks['10Y'] || 0) * posSize;
      impact += (p.bDXY || 0) * (shocks['DXY'] || 0) * posSize;
      impact += (p.bWTI || 0) * (shocks['WTI'] || 0) * posSize;
      impact += (p.bVIX || 0) * (shocks['VIX'] || 0) * posSize;
      total += impact;
    }
    return total;
  }
  const macroBetas = packed.map(p => {
    const hotCpiPnl = ((p.b10Y || 0) * 0.5 + (p.bDXY || 0) * 1.0 + (p.bVIX || 0) * 5.0) * 1_000_000;
    const cls = hotCpiPnl >= 0 ? 'up' : 'dn';
    const txt = `${hotCpiPnl >= 0 ? '+' : '−'}$ ${Math.abs(hotCpiPnl / 1000).toFixed(0)}k`;
    return [
      tag(p.sym),
      (p.b10Y || 0).toFixed(2),
      (p.bDXY || 0).toFixed(2),
      (p.bWTI || 0).toFixed(2),
      (p.bVIX || 0).toFixed(2),
      [cls, txt]
    ];
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

  const macroKpis = [
    ['10Y UST', macroBars['^TNX'] ? (macroBars['^TNX'][macroBars['^TNX'].length - 1].c).toFixed(2) + '%' : '—', '21d move: ' + fmtPct(((macroBars['^TNX']?.[macroBars['^TNX']?.length - 1]?.c || 0) - (macroBars['^TNX']?.[macroBars['^TNX']?.length - 22]?.c || 0)) * 100, 0) + ' bp'],
    ['DXY', macroBars['DX-Y.NYB'] ? macroBars['DX-Y.NYB'][macroBars['DX-Y.NYB'].length - 1].c.toFixed(2) : '—', '21d move: ' + fmtPct(((macroBars['DX-Y.NYB']?.[macroBars['DX-Y.NYB']?.length - 1]?.c || 0) / (macroBars['DX-Y.NYB']?.[macroBars['DX-Y.NYB']?.length - 22]?.c || 1) - 1) * 100, 1)],
    ['WTI', macroBars['CL=F'] ? '$' + macroBars['CL=F'][macroBars['CL=F'].length - 1].c.toFixed(2) : '—', '21d move: ' + fmtPct(((macroBars['CL=F']?.[macroBars['CL=F']?.length - 1]?.c || 0) / (macroBars['CL=F']?.[macroBars['CL=F']?.length - 22]?.c || 1) - 1) * 100, 1)],
    ['VIX', macroBars['^VIX'] ? macroBars['^VIX'][macroBars['^VIX'].length - 1].c.toFixed(1) : '—', '21d move: ' + fmtPct(((macroBars['^VIX']?.[macroBars['^VIX']?.length - 1]?.c || 0) / (macroBars['^VIX']?.[macroBars['^VIX']?.length - 22]?.c || 1) - 1) * 100, 1)]
  ];

  const yieldCurve = [
    ['3M', '4.68%', 'bar'],
    ['2Y', '4.42%', 'bar'],
    ['5Y', '4.14%', 'bar'],
    ['10Y', macroBars['^TNX'] ? (macroBars['^TNX'][macroBars['^TNX'].length - 1].c).toFixed(2) + '%' : '4.38%', 'bar'],
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

  // ---- Agentic AI views (structured as: headline · observations · per-name convictions · action · risks) ----
  const nextPrints = packed.filter(p => p.nextEarningsTs).sort((a, b) => a.nextEarningsTs - b.nextEarningsTs);
  const semisInTop = ['AMD','MU','AVGO','TER','WDC','STX','APP'].filter(s => packed.find(p => p.sym === s));
  const beats = surprises.filter(r => (r[3][1] || '').startsWith('+')).length;
  const biggestBeat = surprises.length ? surprises[0] : null;
  const biggestMiss = surprises.filter(r => (r[3][1] || '').startsWith('-'))[0] || null;
  const avgDxyBeta = packed.reduce((a, p) => a + (p.bDXY || 0), 0) / packed.length;
  const avg10yBeta = packed.reduce((a, p) => a + (p.b10Y || 0), 0) / packed.length;
  const avgVixBeta = packed.reduce((a, p) => a + (p.bVIX || 0), 0) / packed.length;
  const crowded = flows.filter(f => Array.isArray(f[1]) && f[1][0] === 'warn').length;

  // Shared helpers
  const sgn = v => v >= 0 ? '+' : '';
  const px = v => (v == null) ? '—' : `$${v.toFixed(2)}`;
  function rating(score) {
    if (score >= 0.65) return ['buy', 'BUY'];
    if (score >= 0.55) return ['accum', 'ACCUMULATE'];
    if (score >= 0.45) return ['hold', 'HOLD'];
    return ['red', 'AVOID'];
  }

  // ============ RESEARCH & ALPHA — Research memo format ============
  const topByScore = packed.slice().sort((a, b) => b.finalScore - a.finalScore);
  const t1 = topByScore[0], t2 = topByScore[1], t3 = topByScore[2];
  const bottomNames = topByScore.slice(-3).map(p => p.sym);
  const upgrades7d = packed.reduce((a, p) => a + (p.ups || 0), 0);
  const pickRow = p => {
    const [rc, rl] = rating(p.finalScore);
    const upside = p.targetMean && p.close ? ((p.targetMean - p.close) / p.close * 100) : null;
    const thesis = p.ret21 > 0.05 ? 'momentum + consensus up' : p.revisionsPct > 0 ? 'revisions turning up' : 'quality defensive';
    // Next catalyst: the earnings print is the dated event we can rely on; label it clearly.
    const daysOut = p.nextEarningsTs ? Math.max(0, Math.round((p.nextEarningsTs - Math.floor(Date.now() / 1000)) / 86400)) : null;
    const cat = p.nextEarningsTs
      ? `<span class="pt-cat-kind">Earnings</span><br/><span class="pt-cat-when">${dayLabel(p.nextEarningsTs)}${daysOut != null ? ` · T−${daysOut}d` : ''}</span>`
      : '—';
    return `<tr>
      <td class="pt-tick">${p.sym}</td>
      <td><span class="pt-rate r-${rc}">${rl}</span></td>
      <td class="pt-score">${p.finalScore.toFixed(2)}</td>
      <td class="pt-px">${px(p.close)}</td>
      <td class="pt-tgt">${p.targetMean ? px(p.targetMean) + (upside != null ? ` <span class="pt-up">(${sgn(upside)}${upside.toFixed(0)}%)</span>` : '') : '—'}</td>
      <td class="pt-thesis">${thesis}</td>
      <td class="pt-cat">${cat}</td>
    </tr>`;
  };
  const momPos = packed.filter(p => (p.ret21 || 0) > 0.02).length;
  const momNeg = packed.filter(p => (p.ret21 || 0) < -0.02).length;
  const revPos = packed.filter(p => (p.upRev || 0) > (p.dnRev || 0)).length;
  const sentPos = packed.filter(p => (p.recBuy || 0) > (p.recSell || 0) * 2).length;
  const research_html = `
    <div class="memo">
      <div class="memo-head">
        <div class="memo-stamp">RESEARCH MEMO · ${AS_OF}</div>
        <div class="memo-ref">Universe: 10 names · ranked from 512 S&P 500 constituents</div>
      </div>
      <div class="memo-verdict">
        <span class="verd-tag">VERDICT</span>
        <span class="verd-txt">Buy the semi + AI-compute cluster. Lead with <b>${t1.sym}, ${t2.sym}, ${t3.sym}</b>; sizing is a trade (top is a tight 0.11-point band near 0.68 — no high-conviction standout).</span>
      </div>
      <div class="memo-section">
        <div class="memo-s-head">① &nbsp; TOP PICKS</div>
        <table class="pick-tbl">
          <thead><tr><th>Ticker</th><th>Call</th><th>Score</th><th>Last</th><th>Target (upside)</th><th>Thesis</th><th>Next catalyst</th></tr></thead>
          <tbody>${topByScore.slice(0, 5).map(pickRow).join('')}</tbody>
        </table>
      </div>
      <div class="memo-section">
        <div class="memo-s-head">② &nbsp; FACTOR BREAKDOWN — what's driving the ranking</div>
        <div class="factor-bars">
          <div class="fbar"><span class="fbar-k">Momentum</span><div class="fbar-track"><div class="fbar-fill" style="width:${momPos * 10}%"></div></div><span class="fbar-v">${momPos}/10 positive · ${momNeg}/10 negative</span></div>
          <div class="fbar"><span class="fbar-k">Revisions</span><div class="fbar-track"><div class="fbar-fill" style="width:${revPos * 10}%"></div></div><span class="fbar-v">${revPos}/10 upward · ${upgrades7d} total upgrades in 7d</span></div>
          <div class="fbar"><span class="fbar-k">Sentiment</span><div class="fbar-track"><div class="fbar-fill" style="width:${sentPos * 10}%"></div></div><span class="fbar-v">${sentPos}/10 buy-heavy · analyst mix skewed long</span></div>
          <div class="fbar"><span class="fbar-k">Quality</span><div class="fbar-track"><div class="fbar-fill" style="width:60%"></div></div><span class="fbar-v">Mixed — ROE strong, FY-growth softer</span></div>
        </div>
      </div>
      <div class="memo-section">
        <div class="memo-s-head">③ &nbsp; 5-DAY TAPE — how the ranked names actually traded</div>
        <div class="memo-cat">
          ${(() => {
            const tape = packed.map(p => {
              const b = p.bars || [];
              const ret5 = b.length >= 6 ? (b[b.length - 1].c / b[b.length - 6].c - 1) * 100 : 0;
              return { sym: p.sym, ret5 };
            }).sort((a, b) => b.ret5 - a.ret5);
            const lead = tape[0], laggard = tape[tape.length - 1];
            const greenCount = tape.filter(t => t.ret5 > 0).length;
            return `<b>${lead.sym} ${sgn(lead.ret5)}${lead.ret5.toFixed(1)}%</b> leads the tape; <b>${laggard.sym} ${laggard.ret5.toFixed(1)}%</b> is the worst. <b>${greenCount} of 10</b> finished positive over the last 5 sessions — read as light risk-off beneath the surface. Confirm each pick against the 1-day / 5-day range in the table before adding.`;
          })()}
        </div>
      </div>
      <div class="memo-section memo-footer">
        <div class="memo-s-head">④ &nbsp; CATALYST WATCH</div>
        <div class="memo-cat">
          <b>Near-term:</b> ${nextPrints.slice(0, 3).map(p => `${p.sym} ${dayLabel(p.nextEarningsTs).split(' ').slice(0, 3).join(' ')}`).join(' · ')} · FOMC minutes <b>15 Oct</b>.
          <br/>
          <b>Caveat:</b> Model is quant-first; it will miss narrative risks (regulatory, management change, macro inflection) until they show up in price or revisions. Bottom-3 (<b>${bottomNames.join(', ')}</b>) are not shorts — just lower-conviction longs.
        </div>
      </div>
    </div>
  `;

  // ============ FUND FLOWS — Positioning map format ============
  const putSkewNames = flows.filter(f => f[5] === 'put-skew').map(f => f[0]);
  const callSkewNames = flows.filter(f => f[5] === 'call-skew').map(f => f[0]);
  const avgInst = packed.reduce((a, p) => a + ((p.instPct || 0) * 100), 0) / packed.length;
  const avgShort = packed.reduce((a, p) => a + ((p.shortPct || 0) * 100), 0) / packed.length;
  const crowdedNames = flows.filter(f => Array.isArray(f[1]) && f[1][0] === 'warn').map(f => f[0]);
  // Spectrum: each ticker plotted on 0-100 crowding scale
  const spectrumData = packed.map(p => {
    const row = flows.find(f => f[0] === p.sym) || [];
    const cr = Array.isArray(row[1]) ? parseInt(row[1][1], 10) : parseInt(row[1], 10) || 50;
    return { sym: p.sym, cr };
  }).sort((a, b) => a.cr - b.cr);
  function crowdBand(cr) {
    if (cr >= 85) return 'crowded';
    if (cr >= 70) return 'busy';
    if (cr >= 55) return 'balanced';
    return 'lonely';
  }
  const bandOrder = ['lonely', 'balanced', 'busy', 'crowded'];
  const bandMeta = {
    lonely: ['Lonely', '0–54'],
    balanced: ['Balanced', '55–69'],
    busy: ['Busy', '70–84'],
    crowded: ['Crowded', '85–100']
  };
  const byBand = { lonely: [], balanced: [], busy: [], crowded: [] };
  spectrumData.forEach(d => { d.band = crowdBand(d.cr); byBand[d.band].push(d); });
  const zonesHtml = bandOrder.map(b => `<div class="spec-zone z-${b}"><b>${bandMeta[b][0]}</b><span>${bandMeta[b][1]}</span></div>`).join('');
  const dotsHtml = spectrumData.map(d => `<div class="spec-dot z-${d.band}" style="left:${d.cr}%" title="${d.sym} ${d.cr}"></div>`).join('');
  const groupsHtml = bandOrder.map(b => {
    const names = byBand[b];
    const inner = names.length
      ? names.map(d => `<div class="spec-name z-${b}">${d.sym} ${d.cr}</div>`).join('')
      : '<div class="spec-empty">none</div>';
    return `<div class="spec-group z-${b}">${inner}</div>`;
  }).join('');
  const spectrumHtml = `<div class="spec-zones">${zonesHtml}</div><div class="spec-barwrap"><div class="spec-grad"></div>${dotsHtml}</div><div class="spec-axis"><span style="left:0">0</span><span style="left:25%">25</span><span style="left:50%">50</span><span style="left:75%">75</span><span style="left:100%">100</span></div><div class="spec-groups">${groupsHtml}</div>`;
  const fade = flows.filter(f => Array.isArray(f[1]) && f[1][0] === 'warn').map(f => f[0]);
  const follow = packed.filter(p => (p.instPct || 0) * 100 < 80 && (p.ret21 || 0) > 0.05).map(p => p.sym);
  const flows_html = `
    <div class="posmap">
      <div class="posmap-head">
        <div class="pm-stamp">POSITIONING MAP · ${AS_OF}</div>
        <div class="pm-sub">Avg inst. ownership <b>${avgInst.toFixed(0)}%</b> · avg short interest <b>${avgShort.toFixed(1)}%</b> · ${crowded} name${crowded === 1 ? '' : 's'} flagged crowded</div>
      </div>
      <div class="posmap-spectrum">
        ${spectrumHtml}
      </div>
      <div class="posmap-grid">
        <div class="posmap-col posmap-fade">
          <div class="pm-col-head">FADE  <span class="pm-pill red">de-gross risk</span></div>
          ${fade.length ? `<ul>${fade.map(t => `<li><b>${t}</b> — crowding ≥ 80. Do not add; trim on strength.</li>`).join('')}</ul>` : '<p class="pm-empty">None today — no crowded names to fade.</p>'}
        </div>
        <div class="posmap-col posmap-follow">
          <div class="pm-col-head">FOLLOW  <span class="pm-pill green">under-owned + momentum</span></div>
          ${follow.length ? `<ul>${follow.map(t => `<li><b>${t}</b> — inst &lt;80% with 21d price up.</li>`).join('')}</ul>` : '<p class="pm-empty">No under-owned momentum setups today.</p>'}
        </div>
      </div>
      <div class="posmap-alerts">
        ${(() => {
          const alignedN = divergence.filter(r => r[2] === 'aligned').length;
          const mixedN = divergence.filter(r => r[2] === 'mixed').length;
          const divergentN = divergence.filter(r => r[2] === 'divergent').length;
          return `<div class="pm-alert"><span class="pm-alt-tag">RESEARCH ∩ FLOW</span><b>${alignedN} aligned</b> / ${mixedN} mixed / ${divergentN} divergent. Where research says long and revisions are rising, the flow signal is confirming the model — safer side of the trade. Divergent names are the ones to pressure-test.</div>`;
        })()}
        ${(() => {
          const tape = packed.map(p => {
            const b = p.bars || [];
            const ret5 = b.length >= 6 ? (b[b.length - 1].c / b[b.length - 6].c - 1) * 100 : 0;
            return { sym: p.sym, ret5 };
          }).sort((a, b) => b.ret5 - a.ret5);
          const greenCount = tape.filter(t => t.ret5 > 0).length;
          const laggard = tape[tape.length - 1];
          return `<div class="pm-alert"><span class="pm-alt-tag">5-DAY TAPE</span>Only <b>${greenCount} of 10</b> finished positive over the last week. <b>${laggard.sym}</b> at ${laggard.ret5.toFixed(1)}% is leading the pullback — crowding + weak tape is a de-grossing combination; size accordingly.</div>`;
        })()}
        <div class="pm-alert"><span class="pm-alt-tag">OPTIONS</span>${putSkewNames.length} put-skew (${putSkewNames.join(', ') || 'none'}) · ${callSkewNames.length} call-skew (${callSkewNames.join(', ') || 'none'}). Put-skew ≠ short — it's a hedging bid.</div>
        <div class="pm-alert"><span class="pm-alt-tag">13F</span>Reporting cutoff <b>30 Jun 2026</b>. Any flow conclusion after that is price-action inference, not an actual holder report.</div>
        <div class="pm-alert"><span class="pm-alt-tag">INSIDER</span>${packed.filter(p => (p.insiderPct || 0) * 100 >= 1).length} name${packed.filter(p => (p.insiderPct || 0) * 100 >= 1).length === 1 ? '' : 's'} with material insider ownership ≥1% — constructive but non-urgent signal.</div>
      </div>
    </div>
  `;

  // ============ EARNINGS & SENTIMENT — Earnings playbook format ============
  const beatRate2 = Math.round(100 * beats / Math.max(1, surprises.length));
  const avgSurprise2 = surprises.length ? surprises.map(r => parseFloat(r[3][1])).filter(x => !isNaN(x)).reduce((a, b) => a + b, 0) / surprises.length : 0;
  const avgMax1d = surprises.length ? surprises.slice(0, 5).map(r => Math.abs(parseFloat(r[4][1] || '0'))).reduce((a, b) => a + b, 0) / 5 : 0;
  const nowSec = Math.floor(Date.now() / 1000);
  function ernPlan(p) {
    const hasRevUp = (p.upRev || 0) > (p.dnRev || 0);
    const priorSurp = p.lastHist && raw(p.lastHist.surprisePercent);
    const priorBeat = priorSurp != null && priorSurp > 0.02;
    if (hasRevUp && priorBeat) return ['long', 'LONG INTO PRINT'];
    if (priorSurp != null && priorSurp < -0.05) return ['hedge', 'HEDGE BEFORE PRINT'];
    if (hasRevUp) return ['tilt', 'TILT LONG'];
    if ((p.dnRev || 0) > (p.upRev || 0)) return ['flat', 'FLAT INTO PRINT'];
    return ['neutral', 'NO-POSITION'];
  }
  const countdownRows = nextPrints.slice(0, 7).map(p => {
    const days = Math.max(0, Math.round((p.nextEarningsTs - nowSec) / 86400));
    const [pc, pl] = ernPlan(p);
    const priorSurp = p.lastHist && raw(p.lastHist.surprisePercent);
    const whisper = priorSurp != null ? `${sgn(priorSurp * 100)}${(priorSurp * 100).toFixed(1)}% last Q` : 'no prior data';
    return `<div class="ern-row">
      <div class="ern-tick">${p.sym}</div>
      <div class="ern-when"><div class="ern-date">${dayLabel(p.nextEarningsTs)}</div><div class="ern-tminus">T−${days}d</div></div>
      <div class="ern-cons"><div class="ern-c-k">EPS</div><div class="ern-c-v">${px(p.nextEpsAvg)}</div></div>
      <div class="ern-cons"><div class="ern-c-k">Rev</div><div class="ern-c-v">${fmtMoney(p.nextRevAvg)}</div></div>
      <div class="ern-whisp">${whisper}${(p.upRev || 0) + (p.dnRev || 0) > 0 ? ` · +${p.upRev}/−${p.dnRev} rev` : ''}</div>
      <div class="ern-plan ern-${pc}">${pl}</div>
    </div>`;
  }).join('');
  const earnings_html = `
    <div class="ernplay">
      <div class="ernplay-head">
        <div class="ep-stamp">EARNINGS PLAYBOOK · ${AS_OF}</div>
        <div class="ep-sub">${upcoming.length} prints over the next 30 days · ${beatRate2}% beat rate last cycle · avg surprise ${sgn(avgSurprise2)}${avgSurprise2.toFixed(1)}%</div>
      </div>
      <div class="ernplay-score">
        <div class="ep-stat"><div class="ep-stat-v">${beats}/${surprises.length}</div><div class="ep-stat-k">BEATS LAST Q</div></div>
        <div class="ep-stat"><div class="ep-stat-v">${sgn(avgSurprise2)}${avgSurprise2.toFixed(1)}%</div><div class="ep-stat-k">AVG SURPRISE</div></div>
        <div class="ep-stat"><div class="ep-stat-v">+${avgMax1d.toFixed(1)}%</div><div class="ep-stat-k">AVG MAX 1D POST</div></div>
        <div class="ep-stat"><div class="ep-stat-v">${upcoming.length}</div><div class="ep-stat-k">PRINTS NEXT 30D</div></div>
      </div>
      <div class="ernplay-section">
        <div class="ep-s-head">COUNTDOWN · next ${Math.min(7, nextPrints.length)} prints  <span class="ep-s-note">plan locks in T−3 sessions</span></div>
        <div class="ern-list">${countdownRows}</div>
      </div>
      <div class="ernplay-section ernplay-pattern">
        <div class="ep-s-head">PATTERN READ</div>
        <p>Last cycle the tape paid for beats — ${beatRate2}% hit rate with average +${avgMax1d.toFixed(1)}% max 1-day post-earnings move. ${biggestBeat ? `Standout was <b>${biggestBeat[0]} ${biggestBeat[3][1]}</b>.` : ''} ${biggestMiss ? `Standout miss was <b>${biggestMiss[0]} ${biggestMiss[3][1]}</b> — guide-cut language usually rhymes next quarter, so plan to hedge.` : 'No material misses — unusually clean cycle.'}</p>
        ${(() => {
          const sent = packed.map(p => {
            const total = (p.recBuy || 0) + (p.recHold || 0) + (p.recSell || 0);
            const posPct = total > 0 ? Math.round(100 * p.recBuy / total) : 0;
            return { sym: p.sym, posPct };
          }).sort((a, b) => b.posPct - a.posPct);
          const top = sent.slice(0, 3).map(s => `<b>${s.sym}</b> ${s.posPct}% buy`).join(' · ');
          const bottom = sent[sent.length - 1];
          return `<p><b>Street sentiment:</b> ${top} lead the universe on analyst buy-mix. <b>${bottom.sym}</b> is the laggard at ${bottom.posPct}% — pre-print setups work best where sentiment and revisions are both pointing up.</p>`;
        })()}
        <p><b>Watch:</b> Hedging-score (transcript language) &gt; 0.35 is cut-risk until proven otherwise. 4 names cluster in one week — size positions accordingly.</p>
      </div>
    </div>
  `;

  // ============ MACRO & REGIME — Macro note format ============
  const vixVal = parseFloat(macroKpis[3][1]);
  const regimeLight = vixVal < 20 ? 'green' : vixVal < 28 ? 'amber' : 'red';
  const regimeLabel = vixVal < 20 ? 'RISK-ON' : vixVal < 28 ? 'NEUTRAL' : 'RISK-OFF';
  const regimeDesc = `rates-up · dollar-up · low-vol`;
  const rateWinners = packed.filter(p => (p.b10Y || 0) > 0).map(p => p.sym);
  const rateLosers = packed.filter(p => (p.b10Y || 0) < -0.3).map(p => p.sym);
  const dollarWinners = packed.filter(p => (p.bDXY || 0) > 0.5).map(p => p.sym);
  const dollarLosers = packed.filter(p => (p.bDXY || 0) < -0.3).map(p => p.sym);
  const hotCpiPnl = parseFloat(macroScenarios[1][1].match(/[-−]?[\d.]+/)?.[0] || '0') * (macroScenarios[1][1].includes('−') ? -1 : 1);
  const macro_html = `
    <div class="macronote">
      <div class="macronote-head">
        <div class="mn-stamp">MACRO NOTE · ${AS_OF}</div>
        <div class="mn-regime">
          <span class="mn-light mn-${regimeLight}"></span>
          <span class="mn-regime-label">${regimeLabel}</span>
          <span class="mn-regime-desc">${regimeDesc}</span>
        </div>
      </div>
      <div class="macronote-dash">
        <div class="mn-panel">
          <div class="mn-p-head">RATES</div>
          <div class="mn-p-val">${macroKpis[0][1]}</div>
          <div class="mn-p-sub">${macroKpis[0][2].replace('21d: ', '21d ')}</div>
          <div class="mn-p-txt">Yields drifted higher — directional, not noise. ${rateWinners.length} of ${packed.length} names in book benefit from rising rates.</div>
        </div>
        <div class="mn-panel">
          <div class="mn-p-head">DOLLAR</div>
          <div class="mn-p-val">${macroKpis[1][1]}</div>
          <div class="mn-p-sub">${macroKpis[1][2].replace('21d: ', '21d ')}</div>
          <div class="mn-p-txt">Book runs long dollar (avg β-DXY ${avgDxyBeta.toFixed(2)}). Semi longs trade with the dollar on AI-capex $-flows — not the usual sign.</div>
        </div>
        <div class="mn-panel">
          <div class="mn-p-head">VOLATILITY</div>
          <div class="mn-p-val">${macroKpis[3][1]}</div>
          <div class="mn-p-sub">${macroKpis[3][2].replace('21d: ', '21d ')}</div>
          <div class="mn-p-txt">VIX well below panic line. Risk-off scenarios likely overstate PnL — betas are regime-dependent and would reset in a real sell-off.</div>
        </div>
      </div>
      <div class="macronote-sens">
        <div class="mn-s-head">BOOK SENSITIVITY · who wins / loses by factor</div>
        <table class="sens-tbl">
          <tr><td class="sens-k">Rates ↑</td><td class="sens-win">WIN · ${rateWinners.slice(0, 4).join(', ') || '—'}</td><td class="sens-lose">LOSE · ${rateLosers.slice(0, 3).join(', ') || '—'}</td></tr>
          <tr><td class="sens-k">Dollar ↑</td><td class="sens-win">WIN · ${dollarWinners.slice(0, 4).join(', ') || '—'}</td><td class="sens-lose">LOSE · ${dollarLosers.slice(0, 3).join(', ') || '—'}</td></tr>
          <tr><td class="sens-k">Hot CPI</td><td class="sens-win">Book PnL <b>${macroScenarios[1][1].replace(/<[^>]+>/g, '')}</b></td><td class="sens-lose">${hotCpiPnl >= 0 ? 'Comfortable with surprise' : 'Vulnerable to surprise'}</td></tr>
          <tr><td class="sens-k">Risk-off</td><td class="sens-win">Scenario <b>${macroScenarios[5][1].replace(/<[^>]+>/g, '')}</b></td><td class="sens-lose">Treat as upper-bound only</td></tr>
        </table>
      </div>
      <div class="macronote-hedge">
        <div class="mn-h-head">HEDGE RECOMMENDATION</div>
        <div class="mn-h-body">
          <div class="mn-h-primary"><span class="mn-h-tag">PRIMARY</span>If 10Y breaks <b>${(parseFloat(macroKpis[0][1]) + 0.1).toFixed(2)}%</b> around FOMC minutes (Oct 15), trim DXY-long exposure by 25% and buy a 1-month put spread on <b>${dollarLosers[0] || packed[0].sym}</b>.</div>
          <div class="mn-h-secondary"><span class="mn-h-tag">SECONDARY</span>Hold a 5–8% cash buffer through the FOMC window. No additions to high-β-VIX positions before Oct 15.</div>
          ${(() => {
            const tape = packed.map(p => {
              const b = p.bars || [];
              const ret5 = b.length >= 6 ? (b[b.length - 1].c / b[b.length - 6].c - 1) * 100 : 0;
              return { sym: p.sym, ret5 };
            }).sort((a, b) => a.ret5 - b.ret5);
            const laggard = tape[0];
            const leader = tape[tape.length - 1];
            return `<div class="mn-h-watch"><span class="mn-h-tag">TAPE</span>Last 5 sessions: <b>${laggard.sym} ${laggard.ret5.toFixed(1)}%</b> worst, <b>${leader.sym} ${sgn(leader.ret5)}${leader.ret5.toFixed(1)}%</b> best. Semis leading the pullback = macro turning; watch the DXY response at the Oct 15 print.</div>`;
          })()}
          <div class="mn-h-watch"><span class="mn-h-tag">WATCH</span>FOMC minutes <b>15 Oct 14:00</b> · China GDP <b>16 Oct 22:00</b>. Either print has the potential to invert the regime.</div>
        </div>
      </div>
    </div>
  `;

  const briefs = {
    research: research_html,
    flows: flows_html,
    earnings: earnings_html,
    macro: macro_html
  };

  const out = {
    asOf: AS_OF,
    universe: RECENT10,
    universeSize: 10,
    briefs,
    research: {
      rows: research,
      explain: researchExplain,
      chip: '10 recent S&P 500 adds · 12 Oct close',
      title: 'Ranked universe · 10 recent S&P 500 adds · 12 Oct close'
    },
    flows: {
      rows: flows,
      divergence,
      etf,
      social,
      chip: '10 recent S&P 500 adds · 13F proxy · short interest · 12 Oct'
    },
    earnings: {
      chip: `${upcoming.length} prints in next 30d · 10 recent S&P 500 adds · 12 Oct`,
      kpis: earningsKpis,
      upcoming, surprises, phrases: phrasesRows, revisions, tone
    },
    macro: {
      chip: '10 recent S&P 500 adds · macro betas · 12 Oct',
      kpis: macroKpis,
      betas: macroBetas,
      scenarios: macroScenarios,
      yieldCurve,
      cbCalendar
    }
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  process.stderr.write(`wrote ${OUT}\n`);
  console.log(JSON.stringify({ asOf: AS_OF, universe: RECENT10.length, research: research.length, flows: flows.length, upcoming: upcoming.length, surprises: surprises.length, phrases: phrasesRows.length, revisions: revisions.length, betas: macroBetas.length }, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
