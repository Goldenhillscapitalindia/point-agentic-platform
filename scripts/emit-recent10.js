#!/usr/bin/env node
/**
 * Patch app.js so all 4 funds in the 4 Market-Squad dashboards use the
 * 10-name recent-SPX-adds universe. Balanced-bracket replacement — robust
 * against CRLF and multi-line arrays.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'recent10-2026-10-12.json');
const APP = path.join(__dirname, '..', 'app.js');
const INDEX = path.join(__dirname, '..', 'index.html');

const j = JSON.parse(fs.readFileSync(DATA, 'utf8'));

function S(s) { return JSON.stringify(s); }
function cell(c) {
  if (Array.isArray(c)) return `[${S(c[0])},${S(c[1])}]`;
  return S(c);
}
function row(r) { return `[${r.map(cell).join(',')}]`; }
function block(rows, indent, eol) {
  return rows.map(r => ' '.repeat(indent) + row(r)).join(',' + eol);
}

// Find and replace the content of a key:[...] array. Preserves outer brackets.
function replaceArrayValue(src, keyIdent, newInnerContent) {
  const marker = keyIdent + '[';
  let out = src;
  let pos = 0;
  const parts = [];
  while (true) {
    const idx = out.indexOf(marker, pos);
    if (idx === -1) {
      parts.push(out.slice(pos));
      break;
    }
    parts.push(out.slice(pos, idx));
    // Find matching close bracket
    let depth = 1, i = idx + marker.length;
    for (; i < out.length; i++) {
      if (out[i] === '[') depth++;
      else if (out[i] === ']') { depth--; if (depth === 0) break; }
    }
    parts.push(marker + newInnerContent + ']');
    pos = i + 1;
  }
  return parts.join('');
}

let app = fs.readFileSync(APP, 'utf8');
const EOL = app.includes('\r\n') ? '\r\n' : '\n';

// 1. Replace EVERY viewTables.{fund}.universe (4 of them) with research rows
const universeInner = EOL + block(j.research.rows, 8, EOL) + EOL + '      ';
app = replaceArrayValue(app, '      universe:', universeInner);

// 2. Replace EVERY viewTables.{fund}.crowding with flows rows
const crowdingInner = EOL + block(j.flows.rows, 8, EOL) + EOL + '      ';
app = replaceArrayValue(app, '      crowding:', crowdingInner);

// 3. Replace EVERY viewTables.{fund}.tone with top-surprises tone rows
const toneRows = j.earnings.surprises.slice(0, 10).map(r => {
  const sym = r[0], qts = r[1].replace(' · q-end', ''), tone = r[5], read = r[6];
  const trend = parseFloat(tone[1]) >= 0 ? '↓' : '↑';
  const guide = read.split(' · ')[0];
  return [sym, qts, tone, trend, guide, '—'];
});
const toneInner = EOL + block(toneRows, 8, EOL) + EOL + '      ';
app = replaceArrayValue(app, '      tone:', toneInner);

// 4. Replace EVERY viewTables.{fund}.betas with macro betas rows
const betasInner = EOL + block(j.macro.betas, 8, EOL) + EOL + '      ';
app = replaceArrayValue(app, '      betas:', betasInner);

// 5. Replace EVERY panelData.{fund}.scenario with macro scenarios
const scenarioInner = EOL + block(j.macro.scenarios, 8, EOL) + EOL + '      ';
app = replaceArrayValue(app, '      scenario:', scenarioInner);

// 5b. Replace EVERY panelData.{fund}.divergence with the 10-name divergence rows
const divergenceInner = EOL + block(j.flows.divergence, 8, EOL) + EOL + '      ';
app = replaceArrayValue(app, '      divergence:', divergenceInner);

// 5c. Replace EVERY panelData.{fund}.etf with the 10-name 5-day price tape
const etfInner = EOL + block(j.flows.etf, 8, EOL) + EOL + '      ';
app = replaceArrayValue(app, '      etf:', etfInner);

// 5d. Replace EVERY panelData.{fund}.social with the 10-name social-proxy
const socialInner = EOL + block(j.flows.social || [], 8, EOL) + EOL + '      ';
app = replaceArrayValue(app, '      social:', socialInner);

// 5e. Replace EVERY panelData.{fund}.explain / explainName / explainTxt with the top-10 research-explain
if (j.research && j.research.explain) {
  const e = j.research.explain;
  const explainArr = e.bars.map(r => [r[0], r[1], (r[1] / 100).toFixed(2)]);
  const explainInner = EOL + block(explainArr, 8, EOL) + EOL + '      ';
  app = replaceArrayValue(app, '      explain:', explainInner);
  // Replace explainName across funds (string literal replace, per fund)
  const nameRe = /(      explainName:')([^']*)(')/g;
  app = app.replace(nameRe, (_, pre, _old, post) => `${pre}${e.name.replace(/'/g, "\\'")}${post}`);
  // Replace explainTxt across funds (string literal replace)
  const txtRe = /(      explainTxt:')((?:\\'|[^'])*)(')/g;
  app = app.replace(txtRe, (_, pre, _old, post) => `${pre}${e.text.replace(/'/g, "\\'")}${post}`);
}

// 6. Replace EVERY earningsData.{fund} entire object by first finding each
//    `    {fund}:{\r\n      chip:` block and replacing the full object.
const e = j.earnings;
const earningsObj = `{
      chip:${S(e.chip)},
      kpis:[
${block(e.kpis, 8, EOL)}],
      upcoming:[
${block(e.upcoming, 8, EOL)}],
      surprises:[
${block(e.surprises, 8, EOL)}],
      phrases:[
${block(e.phrases, 8, EOL)}],
      revisions:[
${block(e.revisions, 8, EOL)}]
    }`.replace(/\n/g, EOL);

for (const fund of ['alpha', 'global', 'neutral', 'digital']) {
  const startKey = `    ${fund}:{${EOL}      chip:`;
  const startIdx = app.indexOf(startKey);
  if (startIdx === -1) continue;
  let depth = 1, i = startIdx + startKey.length;
  for (; i < app.length; i++) {
    if (app[i] === '{') depth++;
    else if (app[i] === '}') { depth--; if (depth === 0) break; }
  }
  const endIdx = i + 1;
  app = app.slice(0, startIdx) + `    ${fund}:${earningsObj}` + app.slice(endIdx);
}

fs.writeFileSync(APP, app);

// ===== index.html =====
let idx = fs.readFileSync(INDEX, 'utf8');
const tbodyEol = idx.includes('\r\n') ? '\r\n' : '\n';
function td(c) {
  if (Array.isArray(c)) return `<td class="${c[0]}">${c[1]}</td>`;
  let s = String(c);
  if (/^-\d/.test(s)) s = '−' + s.slice(1);
  return `<td>${s}</td>`;
}
const researchTbody = j.research.rows.map(r => `            <tr>${r.map(td).join('')}</tr>`).join(tbodyEol);
idx = idx.replace(/<tbody id="research-universe">[\s\S]*?<\/tbody>/,
  '<tbody id="research-universe">' + tbodyEol + researchTbody + tbodyEol + '          </tbody>');
const flowsTbody = j.flows.rows.map(r => `              <tr>${r.map(td).join('')}</tr>`).join(tbodyEol);
idx = idx.replace(/<tbody id="flows-crowding">[\s\S]*?<\/tbody>/,
  '<tbody id="flows-crowding">' + tbodyEol + flowsTbody + tbodyEol + '            </tbody>');
fs.writeFileSync(INDEX, idx);

// Macro extras bootstrap + Agentic AI briefs
const extras = `window.__POINT_MACRO_EXTRAS__ = ${JSON.stringify({ yieldCurve: j.macro.yieldCurve, cbCalendar: j.macro.cbCalendar, kpis: j.macro.kpis })};
window.__POINT_AI_BRIEFS__ = ${JSON.stringify(j.briefs || {})};`;
fs.writeFileSync(path.join(__dirname, '..', 'data', 'macro-extras.js'), extras);

console.log(`patched · asOf ${j.asOf} · 10-name universe applied to 4 funds × 4 dashboards`);
