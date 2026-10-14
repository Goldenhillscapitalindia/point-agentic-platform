#!/usr/bin/env node
/**
 * Patch earningsData.alpha in app.js with the real-data block from
 * data/earnings-2026-10-12.json (produced by rank-earnings.js).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'earnings-2026-10-12.json');
const APP = path.join(__dirname, '..', 'app.js');

const j = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const a = j.alpha;

const S = s => JSON.stringify(s);
function cellArr(c) {
  if (Array.isArray(c)) return `[${S(c[0])},${S(c[1])}]`;
  return S(c);
}
function rowArr(r) { return `[${r.map(cellArr).join(',')}]`; }

const kpiBlock = a.kpis.map(k => {
  const parts = k.map(x => S(x));
  return `        [${parts.join(',')}]`;
}).join(',\n');
const upcomingBlock = a.upcoming.map(r => '        ' + rowArr(r)).join(',\n');
const surprisesBlock = a.surprises.map(r => '        ' + rowArr(r)).join(',\n');
const phrasesBlock = a.phrases.map(r => '        ' + rowArr(r)).join(',\n');
const revisionsBlock = a.revisions.map(r => '        ' + rowArr(r)).join(',\n');
const toneBlock = a.tone.map(r => '        ' + rowArr(r)).join(',\n');

const block = `    alpha:{
      chip:${S(a.chip)},
      kpis:[
${kpiBlock}],
      upcoming:[
${upcomingBlock}],
      surprises:[
${surprisesBlock}],
      phrases:[
${phrasesBlock}],
      revisions:[
${revisionsBlock}],
      earningsTone:[
${toneBlock}]
    },`;

let app = fs.readFileSync(APP, 'utf8');
const EOL = app.includes('\r\n') ? '\r\n' : '\n';
const re = new RegExp(`    alpha:\\{\\s*chip:[\\s\\S]*?${EOL === '\r\n' ? '\\r\\n' : '\\n'}    \\},${EOL === '\r\n' ? '\\r\\n' : '\\n'}    global:\\{`, 'm');
if (!re.test(app)) throw new Error('earningsData.alpha block not found');
const blockWithEol = block.replace(/\n/g, EOL);
app = app.replace(re, blockWithEol + EOL + '    global:{');

// Also patch viewTables.alpha.tone with the real tone rows so the Tone-shift card is real.
const n = EOL === '\r\n' ? '\\r\\n' : '\\n';
const toneRe = new RegExp(`      tone:\\[${n}(?:        \\[[^\\r\\n]*,${n})*?        \\[[^\\r\\n]*\\]\\],${n}      betas:\\[`, 'm');
if (toneRe.test(app)) {
  const toneLines = a.tone.map(r => '        ' + rowArr(r)).join(',' + EOL);
  const replacement = `      tone:[${EOL}${toneLines}],${EOL}      betas:[`;
  app = app.replace(toneRe, replacement);
}

fs.writeFileSync(APP, app);
console.log(`patched app.js earningsData.alpha + viewTables.alpha.tone · asOf ${j.asOf} · universe ${j.universeSize}`);
