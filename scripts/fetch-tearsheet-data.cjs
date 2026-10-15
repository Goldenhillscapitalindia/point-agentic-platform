#!/usr/bin/env node
/*
 * Monthly tear sheet data
 *
 *   node scripts/fetch-tearsheet-data.cjs
 *
 * 1. Reads the fund monthly net returns already in app.js (irTearData).
 *    Months the app does not carry (Oct–Dec of prior years) are derived so the
 *    compounded calendar year equals the full-year figure the app reports.
 * 2. Fetches public benchmark history (monthly, dividend-adjusted) from the
 *    Yahoo Finance chart endpoint: S&P 500 TR, MSCI ACWI, US Agg, Bitcoin, 13-week T-bill.
 * 3. Writes data/tearsheet-data.json (source of truth) and data/tearsheet-data.js
 *    (browser wrapper inlined by build.js).
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const START = '2023-12';            // one month before the first return month
const FIRST = '2024-01';

const BENCHMARKS = {
  sp500tr: {symbol: '^SP500TR', name: 'S&P 500 TR', kind: 'price'},
  acwi:    {symbol: 'ACWI',     name: 'MSCI ACWI',  kind: 'price'},
  agg:     {symbol: 'AGG',      name: 'US Agg Bond', kind: 'price'},
  btc:     {symbol: 'BTC-USD',  name: 'Bitcoin',    kind: 'price'},
  tbill:   {symbol: '^IRX',     name: '3M T-Bill',  kind: 'rate'}
};
const FUND_BENCHMARKS = {
  alpha:   ['sp500tr', 'acwi'],
  global:  ['sp500tr', 'agg'],
  neutral: ['sp500tr', 'tbill'],
  digital: ['btc', 'sp500tr']
};

const ym = d => d.toISOString().slice(0, 7);
const round = (n, p = 4) => Math.round(n * 10 ** p) / 10 ** p;

function readFundData() {
  const src = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const m = /\bconst\s+irTearData\s*=/.exec(src);
  if (!m) throw new Error('irTearData not found in app.js');
  const start = m.index + m[0].length;
  for (let end = src.indexOf('};', start); end >= 0; end = src.indexOf('};', end + 1)) {
    try { return vm.runInNewContext('(' + src.slice(start, end + 1) + ')'); } catch { /* keep scanning */ }
  }
  throw new Error('irTearData could not be parsed');
}

function fundSeries(fund) {
  const pct = v => parseFloat(String(v).replace('%', '')) / 100;
  const months = [];
  const derived = [];
  const years = fund.returns.map(r => r[0]).sort();
  for (const year of years) {
    const row = fund.returns.find(r => r[0] === year);
    const nine = row.slice(1, 10).map(pct);
    nine.forEach((r, i) => months.push({month: `${year}-${String(i + 1).padStart(2, '0')}`, r}));
    const isCurrent = year === years[years.length - 1];
    if (isCurrent) continue;
    // Derive Oct–Dec so the compounded year matches the reported full-year figure.
    const fullYear = pct(row[10]);
    const ytdSep = nine.reduce((g, r) => g * (1 + r), 1);
    const q4 = (1 + fullYear) / ytdSep;
    const monthly = Math.cbrt(q4) - 1;
    for (const mm of ['10', '11', '12']) {
      months.push({month: `${year}-${mm}`, r: round(monthly, 5)});
      derived.push(`${year}-${mm}`);
    }
  }
  return {months: months.map(x => ({month: x.month, r: round(x.r, 5)})), derived};
}

async function fetchChart(symbol) {
  const p1 = Math.floor(Date.UTC(2023, 10, 1) / 1000);
  const p2 = Math.floor(Date.now() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1mo&period1=${p1}&period2=${p2}&events=div`;
  const res = await fetch(url, {headers: {'User-Agent': 'Mozilla/5.0'}});
  if (!res.ok) throw new Error(`${symbol}: HTTP ${res.status}`);
  const json = await res.json();
  const r = json.chart?.result?.[0];
  if (!r) throw new Error(`${symbol}: empty response`);
  const closes = r.indicators.adjclose?.[0]?.adjclose || r.indicators.quote[0].close;
  const rows = r.timestamp.map((t, i) => ({month: ym(new Date(t * 1000)), v: closes[i]}))
    .filter(x => x.v != null && x.month >= START);
  // Keep the last bar per month (Yahoo may append a live bar for the current month).
  const byMonth = new Map(rows.map(x => [x.month, x.v]));
  return {rows: [...byMonth].map(([month, v]) => ({month, v})), asOf: new Date(r.meta.regularMarketTime * 1000).toISOString()};
}

function toReturns(rows, kind) {
  if (kind === 'rate') {
    // Annualised discount yield (%) -> approximate monthly holding return.
    return rows.filter(x => x.month >= FIRST).map(x => ({month: x.month, r: round(x.v / 100 / 12, 5), level: round(x.v, 3)}));
  }
  const out = [];
  for (let i = 1; i < rows.length; i++) out.push({month: rows[i].month, r: round(rows[i].v / rows[i - 1].v - 1, 5)});
  return out.filter(x => x.month >= FIRST);
}

async function main() {
  const funds = readFundData();
  const now = new Date();
  const currentMonth = ym(now);
  const benchmarks = {};
  for (const [key, b] of Object.entries(BENCHMARKS)) {
    const {rows, asOf} = await fetchChart(b.symbol);
    const months = toReturns(rows, b.kind);
    benchmarks[key] = {
      name: b.name, symbol: b.symbol, kind: b.kind, asOf,
      partialMonth: months.some(m => m.month === currentMonth) ? currentMonth : null,
      source: `https://finance.yahoo.com/quote/${encodeURIComponent(b.symbol)}/history`,
      months
    };
    console.log(`  ${b.symbol.padEnd(9)} ${months.length} months  (${months[0]?.month} → ${months[months.length - 1]?.month})`);
  }
  const tbill = benchmarks.tbill.months;
  const fundsOut = {};
  for (const [id, f] of Object.entries(funds)) {
    const {months, derived} = fundSeries(f);
    fundsOut[id] = {
      name: f.name, strategy: f.strategy, aum: f.aum, net: f.net, gross: f.gross,
      benchmarks: FUND_BENCHMARKS[id] || ['sp500tr'],
      derivedMonths: derived,
      months
    };
  }
  const data = {
    generatedAt: now.toISOString(),
    note: 'Fund returns come from the Point app (irTearData). Benchmark returns are public market data fetched from Yahoo Finance; the current month is partial (month-to-date).',
    riskFreeRate: round(tbill[tbill.length - 1].level / 100, 5),
    funds: fundsOut,
    benchmarks
  };
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(path.join(root, 'data', 'tearsheet-data.json'), json + '\n');
  fs.writeFileSync(path.join(root, 'data', 'tearsheet-data.js'),
    '// Generated by scripts/fetch-tearsheet-data.cjs from data/tearsheet-data.json — do not hand-edit.\n' +
    '(function(root){\n  const data = ' + json + ';\n' +
    '  if(typeof module === "object" && module.exports) module.exports=data;\n  else root.PointTearsheetData=data;\n' +
    '})(typeof window !== "undefined" ? window : globalThis);\n');
  console.log('Wrote data/tearsheet-data.json and data/tearsheet-data.js');
}

main().catch(err => { console.error(err.message); process.exit(1); });
