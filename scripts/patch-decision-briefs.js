#!/usr/bin/env node
/**
 * Rewrite the Market-Squad decision briefs (research / flows / earnings / macro)
 * in app.js so they reference the 10-name top-SPX universe instead of the old
 * 650-name universe. Applied to all 4 funds.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'recent10-2026-10-12.json');
const APP = path.join(__dirname, '..', 'app.js');

const j = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const universe = j.universe || [];
const top3 = universe.slice(0, 3).join(', ');
const first = universe[0] || 'AMD';
const nextTwo = j.earnings?.upcoming?.slice(0, 3)?.map(r => (r[0] || '').replace(/<[^>]+>/g, '').trim()) || [];
const next3Text = nextTwo.length ? nextTwo.map((s, i) => `${s} (${j.earnings.upcoming[i][1]})`).join(' · ') : 'the next scheduled prints';

// Build fresh brief tuples [recommendation, rationale, next-step] per view
function esc(s) { return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"'); }

const briefs = {
  research: [
    `Lead new longs with <b>${top3}</b> from the top-10 S&P 500 screen.`,
    `The Point score ranks these three at the top of a 10-name universe drawn from 500+ S&P 500 constituents. Scores cluster tightly near 0.68; no name clears the 0.72 high-conviction threshold yet, so sizing is a trade rather than a thesis.`,
    `Position in 150–200 bps starters; add on confirmation. Pair each entry with a hard stop below the 5-day range low. The lower-ranked names in the universe (bottom-3 by score) are hold, not short.`
  ],
  flows: [
    `Fade the crowded names in the top-10 before adding new risk.`,
    `Positioning spans the full LONELY→CROWDED spectrum. Any name flagged crowded (≥85) is a de-grossing risk — institutional ownership is already stretched and marginal demand is thin. Put-skew flags in the options market highlight hedging demand on specific names.`,
    `No additions to names tagged crowded or watch; use the OK list for fresh entries. Where put-skew is bid, buy the hedge the market is already pricing instead of waiting for a selloff.`
  ],
  earnings: [
    `Pre-position winners before the next prints — ${next3Text}.`,
    `Last cycle the 10-name universe beat with a high hit rate and the tape paid for beats (max 1-day post-earnings moves averaged double digits). Prints cluster late-October to early-November, so event risk is concentrated in a short window.`,
    `Enter half-size at least 3 sessions before the print and add on confirmation. Flat into any name whose last-quarter hedging score was > 0.35 or whose revisions turned negative in the last 7 days.`
  ],
  macro: [
    `Current regime is rates-up / dollar-up / low-vol. Carry the semis; hedge the dollar leg before FOMC minutes.`,
    `10Y UST and DXY both moved materially in 21 days while VIX stayed well below 20. The top-10 book runs long dollar on average (positive β-DXY from AI-capex $-flows). A hot-CPI scenario shows the book positive; a true risk-off would reset the correlations and invert that comfort.`,
    `If 10Y breaks another 10bp around the Oct 15 FOMC minutes, trim DXY-long exposure by 25% and buy a 1-month put spread on the most negative β-DXY name. Hold a 5–8% cash buffer through the FOMC window.`
  ]
};

let app = fs.readFileSync(APP, 'utf8');
const EOL = app.includes('\r\n') ? '\r\n' : '\n';

// For each fund, replace the 4 Market-Squad brief tuples.
// The decisionBriefs block uses JSON-ish keys with quoted strings; we locate each
// `"<view>": [` inside each fund block and replace its 3-element array.
function replaceBriefForFund(src, fund, view, tuple) {
  const fundHeader = `  "${fund}": {`;
  const fundIdx = src.indexOf(fundHeader);
  if (fundIdx === -1) return src;
  const viewHeader = `    "${view}": [`;
  const vIdx = src.indexOf(viewHeader, fundIdx);
  if (vIdx === -1) return src;
  // Find matching ]
  let depth = 1, i = vIdx + viewHeader.length;
  for (; i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') { depth--; if (depth === 0) break; }
  }
  const closeIdx = i;
  const body = EOL + tuple.map(s => `      "${esc(s)}"`).join(',' + EOL) + EOL + '    ';
  return src.slice(0, vIdx + viewHeader.length) + body + src.slice(closeIdx);
}

let changed = 0;
for (const fund of ['alpha', 'global', 'neutral', 'digital']) {
  for (const view of ['research', 'flows', 'earnings', 'macro']) {
    const before = app.length;
    app = replaceBriefForFund(app, fund, view, briefs[view]);
    if (app.length !== before) changed++;
  }
}

fs.writeFileSync(APP, app);
console.log(`patched ${changed}/16 decision briefs (4 funds × 4 Market-Squad views)`);
