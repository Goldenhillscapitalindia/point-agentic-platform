#!/usr/bin/env node
/*
 * Position Intel · sentiment run
 *
 *   node scripts/fetch-sentiment.cjs            (or: npm run data:sentiment)
 *
 * For each thesis name it pulls public data from the web:
 *   - news headlines (30 days) from Google News, which aggregates many publishers,
 *     plus the Yahoo Finance headline feed
 *   - daily closes from Yahoo Finance (1-week and 1-month price momentum)
 *   - Wall Street consensus (buy / hold / sell, price target) from Nasdaq
 * Headlines are scored with a small finance lexicon. The 1-week and 1-month
 * sentiment blend news tone, price momentum and analyst consensus.
 * Narrative summaries come from data/sentiment-notes.json (written after reading
 * the coverage) so a re-run refreshes the numbers without losing them.
 *
 * Writes data/sentiment-data.json and data/sentiment-data.js (inlined by build.js).
 * StockTwits and Reddit block automated access, so social feeds are not scraped.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const BOOKS = {alpha: ['NVDA', 'MSFT', 'CRM', 'UNH']};
const UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36', 'Accept': 'application/json, text/xml, */*'};
const DAY = 864e5;

const POS = ['beat','beats','surge','surges','surging','soar','soars','rally','rallies','upgrade','upgraded','upgrades','raise','raises','raised','record','strong','stronger','gain','gains','jump','jumps','bullish','outperform','buy','growth','boost','boosts','win','wins','approval','approved','partnership','rebound','rebounds','tops','higher','rise','rises','climb','climbs','optimism','optimistic','upside','accelerate','accelerates','expands','expansion','demand','momentum','breakout','all-time','tailwind','tailwinds','overweight','reiterate','reiterates','top','best','leads','lead','profit','profits','dividend','buyback','robust','solid','positive','recover','recovers','recovery','opportunity','winning','soaring','rallying','higher-than-expected','exceeds','exceeded'];
const NEG = ['miss','misses','missed','fall','falls','fell','drop','drops','dropped','plunge','plunges','slump','slumps','downgrade','downgraded','downgrades','cut','cuts','weak','weaker','weakness','lawsuit','probe','investigation','bearish','sell','decline','declines','declining','warn','warns','warning','slow','slows','slowdown','slowing','concern','concerns','risk','risks','fear','fears','tumble','tumbles','sink','sinks','lower','loses','loss','losses','layoff','layoffs','antitrust','fine','fined','recall','selloff','sell-off','underperform','underweight','pressure','pressured','headwind','headwinds','worst','crash','crashes','slide','slides','sliding','bubble','overvalued','scrutiny','doj','subpoena','fraud','downside','disappoint','disappoints','disappointing','struggle','struggles','volatile','tariff','tariffs','ban','restrictions','short','shorts','glut','skeptic','skeptics','worries','worry'];
const posSet = new Set(POS), negSet = new Set(NEG);

const round = (n, p = 4) => Math.round(n * 10 ** p) / 10 ** p;
const decode = s => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<[^>]+>/g, '').trim();
const tag = (xml, name) => { const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(xml); return m ? decode(m[1]) : ''; };

async function get(url, type = 'json') {
  const res = await fetch(url, {headers: UA});
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return type === 'json' ? res.json() : res.text();
}

function score(title) {
  const words = title.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/);
  let s = 0;
  words.forEach((w, i) => {
    const flip = /^(not|no|never|without)$/.test(words[i - 1] || '') ? -1 : 1;
    if (posSet.has(w)) s += flip;
    if (negSet.has(w)) s -= flip;
  });
  return Math.max(-1, Math.min(1, s));
}

async function news(ticker, name) {
  const items = [];
  const shortName = name.replace(/,?\s+(Inc\.?|Corporation|Corp\.?|Group|Incorporated)$/i, '').trim();
  const q = encodeURIComponent(`"${ticker}" OR "${shortName}" stock when:30d`);
  const g = await get(`https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`, 'text');
  for (const m of g.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const source = tag(m[1], 'source');
    let title = tag(m[1], 'title');
    if (source && title.endsWith(' - ' + source)) title = title.slice(0, -(source.length + 3));
    items.push({title, source: source || 'Google News', url: tag(m[1], 'link'), date: new Date(tag(m[1], 'pubDate')).toISOString(), via: 'Google News'});
  }
  try {
    const y = await get(`https://feeds.finance.yahoo.com/rss/2.0/headline?s=${ticker}&region=US&lang=en-US`, 'text');
    for (const m of y.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      items.push({title: tag(m[1], 'title'), source: 'Yahoo Finance', url: tag(m[1], 'link'), date: new Date(tag(m[1], 'pubDate')).toISOString(), via: 'Yahoo Finance'});
    }
  } catch (e) { console.warn('  yahoo rss:', e.message); }
  const seen = new Set();
  // Keep headlines that actually name the company (feeds mix in general market stories).
  const alias = shortName.split(/\s+/)[0].toLowerCase();
  const relevant = t => new RegExp(`\\b(${ticker}|${alias})\\b`, 'i').test(t);
  return items
    .filter(i => i.title && !isNaN(Date.parse(i.date)) && relevant(i.title))
    .filter(i => { const k = i.title.toLowerCase().slice(0, 70); if (seen.has(k)) return false; seen.add(k); return true; })
    .map(i => ({...i, tone: score(i.title)}))
    .sort((a, b) => b.date.localeCompare(a.date));
}

async function prices(ticker) {
  const j = await get(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=3mo`);
  const r = j.chart.result[0];
  const rows = r.timestamp.map((t, i) => ({date: new Date(t * 1000).toISOString().slice(0, 10), close: r.indicators.quote[0].close[i]})).filter(x => x.close != null);
  const last = rows[rows.length - 1];
  const back = n => rows[Math.max(0, rows.length - 1 - n)].close;
  return {name: r.meta.longName || r.meta.shortName || ticker, exchange: r.meta.fullExchangeName, last: round(last.close, 2), lastDate: last.date,
    change1w: round(last.close / back(5) - 1), change1m: round(last.close / back(21) - 1)};
}

async function analysts(ticker) {
  try {
    const t = await get(`https://api.nasdaq.com/api/analyst/${ticker}/targetprice`);
    const r = await get(`https://api.nasdaq.com/api/analyst/${ticker}/ratings`);
    const c = t.data?.consensusOverview || {};
    return {consensus: r.data?.meanRatingType || null, summary: r.data?.ratingsSummary || null, buy: c.buy ?? null, hold: c.hold ?? null, sell: c.sell ?? null,
      target: c.priceTarget ?? null, low: c.lowPriceTarget ?? null, high: c.highPriceTarget ?? null,
      source: `https://www.nasdaq.com/market-activity/stocks/${ticker.toLowerCase()}/analyst-research`};
  } catch (e) { console.warn('  nasdaq:', e.message); return null; }
}

function windowTone(items, since) {
  const w = items.filter(i => Date.parse(i.date) >= since);
  const pos = w.filter(i => i.tone > 0).length, neg = w.filter(i => i.tone < 0).length;
  return {count: w.length, pos, neg, neutral: w.length - pos - neg, net: w.length ? round((pos - neg) / w.length, 3) : 0};
}

function label(s) { return s >= 0.35 ? 'Bullish' : s >= 0.12 ? 'Positive' : s <= -0.35 ? 'Bearish' : s <= -0.12 ? 'Negative' : 'Neutral'; }

function blend(tone, change, scale, analyst) {
  const t = Math.max(-1, Math.min(1, tone.net * 1.6));           // news tone
  const p = Math.tanh(change / scale);                            // price momentum
  const total = analyst ? (analyst.buy || 0) + (analyst.hold || 0) + (analyst.sell || 0) : 0;
  const a = total ? ((analyst.buy || 0) - (analyst.sell || 0)) / total - 0.6 : 0; // consensus vs. a typical large-cap skew
  const s = 0.5 * t + 0.35 * p + 0.15 * Math.max(-1, Math.min(1, a * 2));
  return {score: round(s, 3), label: label(s), parts: {news: round(t, 3), price: round(p, 3), analysts: round(a, 3)}};
}

async function main() {
  const runAt = new Date();
  const notesPath = path.join(root, 'data', 'sentiment-notes.json');
  const notes = fs.existsSync(notesPath) ? JSON.parse(fs.readFileSync(notesPath, 'utf8')) : {};
  const books = {};
  for (const [book, tickers] of Object.entries(BOOKS)) {
    books[book] = [];
    for (const ticker of tickers) {
      const px = await prices(ticker);
      const items = await news(ticker, px.name);
      const an = await analysts(ticker);
      const w1 = windowTone(items, runAt - 7 * DAY), m1 = windowTone(items, runAt - 30 * DAY);
      const week = blend(w1, px.change1w, 0.05, an), month = blend(m1, px.change1m, 0.10, an);
      const publishers = [...new Set(items.map(i => i.source))];
      const note = notes[ticker] || {};
      const pct = v => (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%';
      books[book].push({
        ticker, name: px.name, exchange: px.exchange, last: px.last, lastDate: px.lastDate,
        change1w: px.change1w, change1m: px.change1m,
        week: {...week, news: w1}, month: {...month, news: m1},
        analysts: an,
        publishers: publishers.length, publisherList: publishers.slice(0, 12),
        summary: note.summary || `${m1.count} headlines from ${publishers.length} publishers over 30 days; ${m1.pos} positive, ${m1.neg} negative. Shares ${pct(px.change1m)} over one month${an?.consensus ? `; Street consensus ${an.consensus}` : ''}.`,
        themes: note.themes || [], catalyst: note.catalyst || null, sources: note.sources || [],
        headlines: items.slice(0, 8).map(({title, source, url, date, tone}) => ({title, source, url, date, tone}))
      });
      console.log(`  ${ticker.padEnd(5)} 1W ${week.label.padEnd(8)} 1M ${month.label.padEnd(8)} ${m1.count} headlines / ${publishers.length} publishers`);
    }
  }
  const data = {
    runAt: runAt.toISOString(),
    method: 'Blend of news-headline tone (50%), price momentum (35%) and Wall Street consensus (15%). 1-Week uses the last 7 days of headlines and 5-day return; 1-Month uses 30 days and 21-day return.',
    sources: ['Google News (multi-publisher aggregation)', 'Yahoo Finance headlines and prices', 'Nasdaq analyst consensus'],
    books
  };
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(path.join(root, 'data', 'sentiment-data.json'), json + '\n');
  fs.writeFileSync(path.join(root, 'data', 'sentiment-data.js'),
    '// Generated by scripts/fetch-sentiment.cjs from data/sentiment-data.json — do not hand-edit.\n' +
    '(function(root){\n  const data = ' + json + ';\n' +
    '  if(typeof module === "object" && module.exports) module.exports=data;\n  else root.PointSentimentData=data;\n' +
    '})(typeof window !== "undefined" ? window : globalThis);\n');
  console.log('Wrote data/sentiment-data.json and data/sentiment-data.js');
}

main().catch(err => { console.error(err.message); process.exit(1); });
