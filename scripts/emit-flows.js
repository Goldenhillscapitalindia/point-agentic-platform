'use strict';
const fs = require('fs');
const path = require('path');
const flows = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'flows-2026-10-12.json'), 'utf8'));
const root = path.join(__dirname, '..');

function replaceNth(src, marker, n, endMarker, insert) {
  let idx = -1;
  for (let i = 0; i < n; i++) {
    idx = src.indexOf(marker, idx + 1);
    if (idx < 0) throw new Error('missing ' + marker + ' #' + n);
  }
  const end = src.indexOf(endMarker, idx);
  if (end < 0) throw new Error('missing end after ' + marker);
  return src.slice(0, idx) + insert + src.slice(end);
}

const books = ['alpha', 'global', 'neutral', 'digital'];
let app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
books.forEach((book, i) => {
  const rows = flows.books[book].rows;
  const js = '      crowding:' + JSON.stringify(rows) + ',';
  app = replaceNth(app, '      crowding:[', i + 1, '\n      tone:[', js + '\n');
  let div = flows.books[book].divergence || [];
  if (!div.length) {
    div = [['<b>Futures / ETFs</b> — no 13F holder file on these proxies. The column that is filled is put−call skew from the ETF option chain.', 'pill ghost', 'skew only']];
  }
  app = replaceNth(app, '      divergence:', i + 1, '\n      etf:', '      divergence:' + JSON.stringify(div) + ',');
  app = replaceNth(app, '      etf:', i + 1, '\n      social:', '      etf:' + JSON.stringify(flows.books[book].etf) + ',');
});

const summaries = {
  alpha: `flows:['Same 40 Research names. Most crowded long is <b>ADSK 90</b> (institutions 100%, short interest 5.0%).','17 of the bottom-20 research shorts already have short interest ≥ 8%.','GPRO short interest <b>18.4%</b>; Blackrock added 4.3 pts of the company (13F, 30 Jun).','FMR cut 5.0 pts of MOS and Blackrock cut 4.8 pts of CABO — aligned with those shorts.','PLTR crowding is only 36: institutions 64.7%, short interest 2.6%, flat skew.','5 sessions to 12 Oct: SMH <b>−6.8%</b>, XLE +4.0%, SPY +0.4%.'],`,
  global: `flows:['Same Research futures sleeve. No 13F or FINRA short print on these contracts.','Positioning shown is <b>put−call skew</b> on the ETF proxy, as of the 12 Oct close.','Brent skew is steep; several proxies have no listed options (shown n/a).','5 sessions to 12 Oct: USO <b>+4.9%</b>, UNG +3.5%, EEM −3.8%.','TLT +1.2%, GLD +0.7%, UUP +0.5% — duration and gold firmed.','Crowding scores are left blank where the only input would be skew.'],`,
  neutral: `flows:['Same 9 Research pairs. Legs are averaged. <b>GOOGL/META 74</b> is the crowded pair.','Both legs’ institutions ~80%, short interest 1.4% — watch, not a de-gross.','5 pairs on watch, 4 OK. No short-interest squeeze in this sleeve.','FMR cut 0.9 pts across GOOGL/META (13F, 30 Jun).','JPMORGAN added 1.0 pts on AMD/AVGO; FMR added 1.0 pts on HD/LOW.','5 sessions: XLP <b>+4.2%</b>, XLE +4.0%, XLK −2.3%.'],`,
  digital: `flows:['Same Research crypto sleeve. <b>WULF</b> short interest 28.1% — squeeze on a research long.','7 miner / exchange longs already carry short interest ≥ 8%.','Coatue added 3.9 pts of HUT; Jane Street added 2.5 pts of RIOT (13F, 30 Jun).','IBIT and BTC have no equity 13F here — skew only, via the ETF chain.','5 sessions: WGMI miners <b>−12.0%</b>, ETHA −7.1%, IBIT −3.5%.','MSTR crowding 28 with short interest 7.8% — not the crowded leg.']`
};
for (const [book, line] of Object.entries(summaries)) {
  const key = book + ':{';
  // replace the flows: line inside each fund's aiSummaries by unique old prefixes
}
const oldFlows = [
  "flows:['META crowding <b>92</b>; NVDA 88 (top decile).','Viking cut MSFT 40%; Berkshire added UNH.','ETF flows: SPY +$3.1B, IWM −$0.9B.','IBIT (BTC) +$1.4B — crypto inflows rising.','Aligned with you: UBER, CRM.','De-gross risk if VIX breaks 22.'],",
  "flows:['CFTC <b>CoT</b>: spec longs crowded in gold & crude.','Rate-vol sellers positioned short — unwind risk.','EM inflows turning positive on China stimulus.','USD net-short building.','Bond-fund flows into duration.','Positioning-squeeze alerts on commodities.'],",
  "flows:['Pair-level crowding: both legs’ HF ownership tracked.','NVO short interest rising — borrow pressure.','Smart-money aligned on the V/MA tilt.','13F pair-overlap screen is clean.','ETF-rebalance flows mapped to pairs.','De-gross risk low (market-neutral).'],",
  "flows:['Spot <b>BTC ETF +$1.4B</b>, ETH +$0.2B.','Stablecoin mint +$1.4B — liquidity rising.','Exchange net-flows: outflows (bullish).','OI +18% — leverage crowding.','Whale wallets accumulating.','De-gross trigger on funding + VIX.'],"
];
[summaries.alpha, summaries.global, summaries.neutral, summaries.digital].forEach((line, i) => {
  if (!app.includes(oldFlows[i])) throw new Error('summary missing ' + i);
  app = app.replace(oldFlows[i], line);
});

const meta = `    const flowsMeta={
      alpha:['Same names as Research & Alpha · top 20 / bottom 20','ADSK crowding 90 · 12 Oct'],
      global:['Same Research names · futures via ETF proxies','Skew only · no 13F on futures · 12 Oct'],
      neutral:['Same Research pairs · both legs averaged','GOOGL/META crowding 74 · 12 Oct'],
      digital:['Same Research crypto sleeve','WULF short interest 28% · 12 Oct']
    };
    const fm=flowsMeta[fund]||flowsMeta.alpha;
    const ft=document.getElementById('flows-title'); if(ft) ft.textContent=fm[0];
    const fc=document.getElementById('flows-chip'); if(fc) fc.textContent=fm[1];
    vfill('flows-crowding', d.crowding);`;
if (!app.includes("    vfill('flows-crowding', d.crowding);")) throw new Error('vfill missing');
app = app.replace("    vfill('flows-crowding', d.crowding);", meta);

app = app.replace(
  "['06:10:40','Flows','META crowding 92 → de-gross alert to Risk'],",
  "['06:10:40','Flows','ADSK crowding 90 · 17 research shorts already ≥ 8% SI'],"
);

fs.writeFileSync(path.join(root, 'app.js'), app);

function rowHtml(cells) {
  const sep = cells[0] === '…';
  const tds = cells.map(c => Array.isArray(c) ? `<td class="${c[0]}">${c[1]}</td>` : `<td>${c}</td>`).join('');
  return `              <tr${sep ? ' class="tbl-sep"' : ''}>${tds}</tr>`;
}
const tbody = flows.books.alpha.rows.map(rowHtml).join('\n');
const section = `<!-- ======== VIEW: FLOWS ======== -->
    <section class="view" id="view-flows">
      <div class="view-head">
        <div><div class="eyebrow">Market squad · Agent</div><h1 class="h2">≋  Fund Flows & Positioning Agent</h1></div>
        <div class="chip orange" id="flows-chip">ADSK crowding 90 · 12 Oct</div>
      </div>
      <div class="card">
        <div class="card-head"><h3 class="card-title" id="flows-title">Same names as Research & Alpha · top 20 / bottom 20</h3><span class="chip ghost">13F 30 Jun · short interest 30 Sep · skew 12 Oct</span></div>
        <div class="tbl-wrap tbl-scroll">
          <table class="tbl">
            <thead><tr><th>Ticker</th><th>Crowding</th><th>Inst. %</th><th>13F Δ · 30 Jun</th><th>Short % · 30 Sep</th><th>Put−call skew</th><th>Flag</th></tr></thead>
            <tbody id="flows-crowding">
${tbody}
            </tbody>
          </table>
        </div>
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-head"><h3 class="card-title">13F divergence vs research</h3><span class="chip ghost">largest holder move · 30 Jun</span></div>
          <ul class="div-list" id="flows-divergence">
            <li><div><b>FLNC</b> — research short · Siemens Pension Trust E.V. cut 7.0 pts of the co.</div><span class="pill good">aligned</span></li>
            <li><div><b>MOS</b> — research short · FMR cut 5.0 pts of the co.</div><span class="pill good">aligned</span></li>
            <li><div><b>CABO</b> — research short · Blackrock cut 4.8 pts of the co.</div><span class="pill good">aligned</span></li>
            <li><div><b>GPRO</b> — research short · Blackrock added 4.3 pts of the co.</div><span class="pill red">counter</span></li>
            <li><div><b>OLN</b> — research short · AQR Capital Management added 3.8 pts of the co.</div><span class="pill red">counter</span></li>
            <li><div><b>METCB</b> — research short · Blackrock added 3.5 pts of the co.</div><span class="pill red">counter</span></li>
          </ul>
        </div>
        <div class="card">
          <div class="card-head"><h3 class="card-title">Sector tape · 5 sessions to 12 Oct</h3><span class="chip ghost">price change, not creations</span></div>
          <div class="etf" id="flows-etf">
            <div class="etf-row"><span>SPY</span><div class="bar"><div class="fill" style="width:8%"></div></div><b>+0.4%</b></div>
            <div class="etf-row"><span>QQQ</span><div class="bar"><div class="fill bad" style="width:19%"></div></div><b class="dn">−1.3%</b></div>
            <div class="etf-row"><span>SMH</span><div class="bar"><div class="fill bad" style="width:96%"></div></div><b class="dn">−6.8%</b></div>
            <div class="etf-row"><span>IWM</span><div class="bar"><div class="fill bad" style="width:27%"></div></div><b class="dn">−1.9%</b></div>
            <div class="etf-row"><span>XLE</span><div class="bar"><div class="fill" style="width:57%"></div></div><b>+4.0%</b></div>
            <div class="etf-row"><span>XLK</span><div class="bar"><div class="fill bad" style="width:32%"></div></div><b class="dn">−2.3%</b></div>
            <div class="etf-row"><span>IBIT (BTC)</span><div class="bar"><div class="fill bad" style="width:49%"></div></div><b class="dn">−3.5%</b></div>
            <div class="etf-row"><span>ETHA (ETH)</span><div class="bar"><div class="fill bad" style="width:100%"></div></div><b class="dn">−7.1%</b></div>
          </div>
        </div>
      </div>
    </section>

    `;

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const a = html.indexOf('<!-- ======== VIEW: FLOWS ======== -->');
const b = html.indexOf('<!-- ======== VIEW: EARNINGS ======== -->');
if (a < 0 || b < 0) throw new Error('flows markers missing');
html = html.slice(0, a) + section + html.slice(b);
html = html.replace(
  '<div class="a-sub">13F, 13D, N-PORT, crowding</div>\n          <div class="a-meta"><span class="pill orange">crowding ↑ semis</span></div>',
  '<div class="a-sub">13F, short interest, options skew</div>\n          <div class="a-meta"><span class="pill orange">ADSK crowding 90</span></div>'
);
html = html.replace(
  '<li><span class="tag gold">Flows</span> META crowding score <b>92</b> (top decile). HF ownership +7pts QoQ. De-grossing risk if VIX breaks 22.</li>',
  '<li><span class="tag gold">Flows</span> Research universe: <b>ADSK</b> crowding 90 (institutions 100%). 17 of the bottom-20 shorts already have short interest ≥ 8% — GPRO 18.4%, and Blackrock added 4.3 pts of it.</li>'
);
html = html.replace(
  '<li>Halve <b>META</b> or buy OTM Dec put spread to pre-empt de-grossing.</li>',
  '<li>On the market sleeve, <b>ADSK</b> is the de-gross name (crowding 90). The research shorts are already crowded — GPRO short interest 18.4%.</li>'
);
fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('patched app.js and index.html');
console.log('alpha rows', flows.books.alpha.rows.length, 'first', flows.books.alpha.rows[0][0], 'last', flows.books.alpha.rows.at(-1)[0]);
