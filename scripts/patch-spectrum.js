'use strict';
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'data', 'recent10-2026-10-12.json');
const j = JSON.parse(fs.readFileSync(file, 'utf8'));

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
const rows = j.flows.rows.map(r => ({
  sym: r[0],
  cr: Array.isArray(r[1]) ? parseInt(r[1][1], 10) : parseInt(r[1], 10)
})).sort((a, b) => a.cr - b.cr);
const byBand = { lonely: [], balanced: [], busy: [], crowded: [] };
rows.forEach(d => { d.band = crowdBand(d.cr); byBand[d.band].push(d); });
const zonesHtml = bandOrder.map(b => `<div class="spec-zone z-${b}"><b>${bandMeta[b][0]}</b><span>${bandMeta[b][1]}</span></div>`).join('');
const dotsHtml = rows.map(d => `<div class="spec-dot z-${d.band}" style="left:${d.cr}%" title="${d.sym} ${d.cr}"></div>`).join('');
const groupsHtml = bandOrder.map(b => {
  const names = byBand[b];
  const inner = names.length
    ? names.map(d => `<div class="spec-name z-${b}">${d.sym} ${d.cr}</div>`).join('')
    : '<div class="spec-empty">none</div>';
  return `<div class="spec-group z-${b}">${inner}</div>`;
}).join('');
const spectrum = `<div class="spec-zones">${zonesHtml}</div><div class="spec-barwrap"><div class="spec-grad"></div>${dotsHtml}</div><div class="spec-axis"><span style="left:0">0</span><span style="left:25%">25</span><span style="left:50%">50</span><span style="left:75%">75</span><span style="left:100%">100</span></div><div class="spec-groups">${groupsHtml}</div>`;
const next = j.briefs.flows.replace(/<div class="posmap-spectrum">[\s\S]*?<\/div>\s*<div class="posmap-grid">/, `<div class="posmap-spectrum">\n        ${spectrum}\n      </div>\n      <div class="posmap-grid">`);
if (next === j.briefs.flows) throw new Error('spectrum block not found');
j.briefs.flows = next;
fs.writeFileSync(file, JSON.stringify(j, null, 2));
const extras = `window.__POINT_MACRO_EXTRAS__ = ${JSON.stringify({ yieldCurve: j.macro.yieldCurve, cbCalendar: j.macro.cbCalendar, kpis: j.macro.kpis })};
window.__POINT_AI_BRIEFS__ = ${JSON.stringify(j.briefs || {})};`;
fs.writeFileSync(path.join(__dirname, '..', 'data', 'macro-extras.js'), extras);
console.log(rows.map(d => d.sym + ' ' + d.cr + ' ' + d.band).join(', '));
