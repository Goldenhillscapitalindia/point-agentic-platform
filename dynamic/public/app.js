/* ============ Point dynamic terminal — API-driven, multi-tenant ============ */
(function(){
'use strict';
const Q=s=>document.querySelector(s), QA=s=>[...document.querySelectorAll(s)];
const api=(p,o)=>fetch(p,o).then(r=>r.json());
let companies=[], COMPANY=null, PORT=null; // PORT = current portfolio payload

const money=n=>{const a=Math.abs(n);
  if(a>=1e9)return (n<0?'−$':'$')+(a/1e9).toFixed(2)+'B';
  if(a>=1e6)return (n<0?'−$':'$')+(a/1e6).toFixed(1)+'M';
  if(a>=1e3)return (n<0?'−$':'$')+(a/1e3).toFixed(0)+'K';
  return (n<0?'−$':'$')+a.toFixed(0);};
const pct=n=>(n>=0?'+':'')+n.toFixed(1)+'%';
const cls=n=>n>0?'pos':n<0?'neg':'mut';

function toast(msg,kind){const t=Q('#toast');t.textContent=msg;t.className='toast show '+(kind||'');setTimeout(()=>t.className='toast',2600);}

/* ---------- companies ---------- */
async function loadCompanies(){
  companies=await api('/api/companies');
  const list=Q('#company-list');
  list.innerHTML=companies.map(c=>`<div class="co-item ${COMPANY===c.id?'on':''}" data-co="${c.id}">
    <span class="co-ic" style="background:${c.color}">${c.short}</span>
    <div><div class="co-nm">${c.name}</div><div class="co-sub">${c.fundName||(c.hasData?'portfolio loaded':'no portfolio')}</div></div>
    <span class="co-dot ${c.hasData?'has':''}"></span></div>`).join('');
  QA('#company-list .co-item').forEach(el=>el.onclick=()=>selectCompany(el.dataset.co));
  if(!COMPANY && companies[0]) selectCompany(companies[0].id,true);
}
async function selectCompany(id,silent){
  COMPANY=id; const c=companies.find(x=>x.id===id);
  QA('#company-list .co-item').forEach(el=>el.classList.toggle('on',el.dataset.co===id));
  Q('#co-badge').textContent=c.short; Q('#co-badge').style.background=c.color;
  Q('#co-name').textContent=c.name; Q('#co-role').textContent='active tenant';
  const data=await api('/api/'+id+'/portfolio');
  PORT=data.empty?null:data;
  const fresh=Q('#fresh');
  if(PORT){fresh.innerHTML=`<span class="fd live"></span>${PORT.meta.fundName} · ${PORT.metrics.positions.length} positions`;}
  else{fresh.innerHTML='<span class="fd"></span>No portfolio — upload Excel';}
  renderAll(); if(!silent) toast('Switched to '+c.name);
}

/* ---------- render all views ---------- */
function renderAll(){renderCommand();renderPortfolio();renderRisk();renderUpload();}

function emptyState(view){
  return `<div class="pg-head"><div><div class="pg-title">${view}</div><div class="pg-sub">${COMPANY?companies.find(c=>c.id===COMPANY).name:''}</div></div></div>
    <div class="card"><div class="card-b"><div class="empty">
      <div class="ei"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg></div>
      <h2>No portfolio loaded</h2>
      <p>Upload this company's portfolio as an Excel file (.xlsx). Point parses the positions, computes NAV, exposure, risk and concentration, and renders the terminal from your data.</p>
      <button class="btn pri lg" data-goto="upload">Upload Excel portfolio</button>
      <div style="margin-top:12px"><a class="btn gh sm" href="/api/template.xlsx">Download template</a></div>
    </div></div></div>`;
}

/* ---------- Command Center ---------- */
function renderCommand(){
  const el=Q('#view-command');
  if(!PORT){el.innerHTML=emptyState('Command Center');return;}
  const m=PORT.metrics;
  const strip=`<div class="kstrip">
    ${kc('NAV',money(m.nav),'as-of '+PORT.meta.asOf)}
    ${kc('Daily PnL',money(m.dayPnl),pct(m.dayPnlPct),cls(m.dayPnl))}
    ${kc('Gross',m.grossPct.toFixed(0)+'%','exposure')}
    ${kc('Net',m.netPct.toFixed(0)+'%','β-adj '+m.betaNet.toFixed(0)+'%')}
    ${kc('1D VaR 99%',m.var99Pct.toFixed(1)+'%',money(m.var99))}
    ${kc('Positions',m.positions.length,m.longCount+'L / '+m.shortCount+'S')}
    ${kc('Top-10',m.top10.toFixed(0)+'%','concentration')}
  </div>`;

  // top movers
  const mv=m.positions.slice().sort((a,b)=>Math.abs(b.dayPnl)-Math.abs(a.dayPnl)).slice(0,8);
  const mvMax=Math.max(...mv.map(p=>Math.abs(p.dayPnl)),1);
  const movers=mv.map(p=>`<div class="bar-row"><span class="lab tk">${p.ticker}</span><div class="track" style="position:relative"><span style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:var(--line-2)"></span><i style="position:absolute;${p.dayPnl>=0?'left:50%':'right:50%'};width:${Math.abs(p.dayPnl)/mvMax*50}%;background:${p.dayPnl>=0?'var(--pos)':'var(--crit)'}"></i></div><span class="val num ${cls(p.dayPnl)}">${money(p.dayPnl)}</span></div>`).join('');

  // sector concentration
  const smax=Math.max(...m.sectors.map(s=>s.pct),1);
  const sect=m.sectors.slice(0,8).map(s=>`<div class="bar-row"><span class="lab">${s.sector}</span><div class="track"><i style="width:${s.pct/smax*100}%;background:${s.pct>25?'var(--warn)':'var(--accent)'}"></i></div><span class="val num">${s.pct.toFixed(1)}%</span></div>`).join('');

  // exposure
  const exp=`
    ${expRow('Gross',m.grossPct,250)}
    ${expRow('Net',m.netPct,100)}
    ${expRow('Beta-adj net',m.betaNet,100)}
    ${expRow('Long',m.longSum/m.nav*100,250)}
    ${expRow('Short',Math.abs(m.shortSum)/m.nav*100,250)}
    ${expRow('Cash',m.cashPct,100)}`;

  el.innerHTML=`<div class="pg-head"><div><div class="pg-title">Command Center</div><div class="pg-sub">${PORT.meta.fundName} · ${companies.find(c=>c.id===COMPANY).name} · computed from uploaded portfolio</div></div>
    <div><button class="btn gh sm" data-goto="upload">Re-upload</button></div></div>
    ${strip}
    <div class="grid g-2b">
      <div class="card"><div class="card-h"><h3>Exposure</h3><span class="sp"></span><span class="tag">% of NAV</span></div><div class="card-b">${exp}</div></div>
      <div class="card"><div class="card-h"><h3>Top movers · today</h3><span class="sp"></span><span class="tag">$ PnL</span></div><div class="card-b">${movers}</div></div>
    </div>
    <div class="grid g-2">
      <div class="card"><div class="card-h"><h3>Sector concentration</h3><span class="sp"></span>${m.sectors[0]&&m.sectors[0].pct>30?'<span class="pill warn">concentrated</span>':'<span class="pill ok">diversified</span>'}</div><div class="card-b">${sect}</div></div>
      <div class="card"><div class="card-h"><h3>Portfolio summary</h3><span class="sp"></span></div><div class="card-b">
        <div class="bar-row"><span class="lab">Long exposure</span><span class="val num" style="width:auto;margin-left:auto">${money(m.longSum)}</span></div>
        <div class="bar-row"><span class="lab">Short exposure</span><span class="val num" style="width:auto;margin-left:auto">${money(m.shortSum)}</span></div>
        <div class="bar-row"><span class="lab">Net market value</span><span class="val num" style="width:auto;margin-left:auto">${money(m.netSum)}</span></div>
        <div class="bar-row"><span class="lab">Gross market value</span><span class="val num" style="width:auto;margin-left:auto">${money(m.grossSum)}</span></div>
        <div class="bar-row"><span class="lab">Uploaded</span><span class="val" style="width:auto;margin-left:auto;color:var(--muted)">${new Date(PORT.uploadedAt).toLocaleString()}</span></div>
        <div class="bar-row"><span class="lab">Source file</span><span class="val" style="width:auto;margin-left:auto;color:var(--muted)">${PORT.fileName||'—'}</span></div>
      </div></div>
    </div>`;
}
function kc(l,v,sub,subcls){return `<div class="kcell"><div class="klab">${l}</div><div class="kval num">${v}</div><div class="ksub ${subcls||'mut'}">${sub||''}</div></div>`;}
function expRow(lab,v,max){const w=Math.min(100,Math.abs(v)/max*100);const col=lab.includes('Beta')||lab==='Net'?'var(--warn)':'var(--accent)';
  return `<div class="bar-row"><span class="lab">${lab}</span><div class="track"><i style="width:${w}%;background:${col}"></i></div><span class="val num">${v.toFixed(0)}%</span></div>`;}

/* ---------- Portfolio ---------- */
let sortK='mv',sortDir=-1;
function renderPortfolio(){
  const el=Q('#view-portfolio');
  if(!PORT){el.innerHTML=emptyState('Portfolio');return;}
  let rows=PORT.metrics.positions.slice().sort((a,b)=>{let x=a[sortK],y=b[sortK];if(typeof x==='string'){x=x.toLowerCase();y=y.toLowerCase();}return (x>y?1:x<y?-1:0)*sortDir;});
  const body=rows.map(p=>`<tr>
    <td class="l tk">${p.ticker}</td><td class="l co">${p.name}</td>
    <td class="l"><span class="side-${p.side==='L'?'l':'s'}">${p.side==='L'?'LONG':'SHORT'}</span></td>
    <td class="num">${Math.round(p.qty).toLocaleString()}</td>
    <td class="num">$${p.price.toFixed(2)}</td>
    <td class="num">${money(p.mv)}</td>
    <td class="num">${p.navPct.toFixed(1)}%</td>
    <td class="num ${cls(p.dayPnl)}">${money(p.dayPnl)}</td>
    <td class="num ${cls(p.mtdPnl)}">${money(p.mtdPnl)}</td>
    <td class="num">${p.beta.toFixed(2)}</td>
    <td class="num">${p.varc.toFixed(1)}%</td>
    <td class="l">${p.sector}</td></tr>`).join('');
  const cols=[['ticker','Ticker','l'],['name','Company','l'],['side','Side','l'],['qty','Qty'],['price','Price'],['mv','Mkt Val'],['navPct','% NAV'],['dayPnl','Day'],['mtdPnl','MTD'],['beta','Beta'],['varc','VaR c.'],['sector','Sector','l']];
  const heads=cols.map(c=>`<th class="${c[2]||''}" data-sort="${c[0]}">${c[1]}</th>`).join('');
  el.innerHTML=`<div class="pg-head"><div><div class="pg-title">Portfolio</div><div class="pg-sub">${rows.length} positions · ${money(PORT.metrics.nav)} NAV · gross ${PORT.metrics.grossPct.toFixed(0)}% · net ${PORT.metrics.netPct.toFixed(0)}%</div></div></div>
    <div class="card"><div class="card-h"><h3>${PORT.meta.fundName} — holdings</h3><span class="sp"></span><span class="tag">click a header to sort · from uploaded Excel</span></div>
    <div class="card-b flush"><div class="tbl-wrap"><table class="t"><thead><tr>${heads}</tr></thead><tbody>${body}</tbody></table></div></div></div>`;
  QA('#view-portfolio th[data-sort]').forEach(th=>th.onclick=()=>{const k=th.dataset.sort;sortDir=sortK===k?-sortDir:-1;sortK=k;renderPortfolio();});
}

/* ---------- Risk & Concentration ---------- */
function renderRisk(){
  const el=Q('#view-risk');
  if(!PORT){el.innerHTML=emptyState('Risk & Concentration');return;}
  const m=PORT.metrics;
  const strip=`<div class="kstrip">
    ${kc('1D VaR 99%',m.var99Pct.toFixed(1)+'%',money(m.var99))}
    ${kc('Gross',m.grossPct.toFixed(0)+'%','exposure')}
    ${kc('Net β',m.betaNet.toFixed(0)+'%','beta-adjusted')}
    ${kc('Top-10',m.top10.toFixed(0)+'%','concentration')}
    ${kc('Largest',m.positions[0]?m.positions[0].navPct.toFixed(1)+'%':'—',m.positions[0]?m.positions[0].ticker:'')}
    ${kc('Sectors',m.sectors.length,'represented')}
    ${kc('Names',m.positions.length,m.longCount+'L / '+m.shortCount+'S')}
  </div>`;
  // VaR contributors
  const vc=m.positions.slice().sort((a,b)=>b.varc-a.varc).slice(0,10);
  const vcMax=Math.max(...vc.map(p=>p.varc),1);
  const vcHtml=vc.map(p=>`<div class="bar-row"><span class="lab tk">${p.ticker}</span><div class="track"><i style="width:${p.varc/vcMax*100}%;background:var(--crit)"></i></div><span class="val num">${p.varc.toFixed(1)}%</span></div>`).join('');
  // sector
  const smax=Math.max(...m.sectors.map(s=>s.pct),1);
  const sect=m.sectors.map(s=>`<div class="bar-row"><span class="lab">${s.sector}</span><div class="track"><i style="width:${s.pct/smax*100}%;background:${s.pct>25?'var(--warn)':'var(--accent)'}"></i></div><span class="val num">${s.pct.toFixed(1)}%</span></div>`).join('');
  // liquidity
  const lmax=Math.max(...m.liqBuckets.map(b=>b[1]),1);
  const liq=m.liqBuckets.map(b=>`<div class="bar-row"><span class="lab">${b[0]}</span><div class="track"><i style="width:${b[1]/lmax*100}%;background:${b[0].includes('>')?'var(--crit)':b[0].includes('3–5')?'var(--warn)':'var(--pos)'}"></i></div><span class="val num">${b[1].toFixed(0)}%</span></div>`).join('');
  el.innerHTML=`<div class="pg-head"><div><div class="pg-title">Risk &amp; Concentration</div><div class="pg-sub">Computed from ${PORT.meta.fundName} · VaR is a beta-weighted 1-day 99% proxy</div></div></div>
    ${strip}
    <div class="grid g-2">
      <div class="card"><div class="card-h"><h3>Top VaR contributors</h3><span class="sp"></span><span class="tag">beta-weighted</span></div><div class="card-b">${vcHtml}</div></div>
      <div class="card"><div class="card-h"><h3>Sector concentration</h3><span class="sp"></span>${m.sectors[0]&&m.sectors[0].pct>30?'<span class="pill warn">'+m.sectors[0].sector+' '+m.sectors[0].pct.toFixed(0)+'%</span>':'<span class="pill ok">balanced</span>'}</div><div class="card-b">${sect}</div></div>
    </div>
    <div class="card"><div class="card-h"><h3>Liquidity · days to liquidate</h3><span class="sp"></span><span class="tag">% of NAV</span></div><div class="card-b">${liq}</div></div>`;
}

/* ---------- Upload ---------- */
function renderUpload(){
  const el=Q('#view-upload');
  const c=COMPANY?companies.find(x=>x.id===COMPANY):null;
  el.innerHTML=`<div class="pg-head"><div><div class="pg-title">Upload Portfolio</div><div class="pg-sub">${c?c.name:''} · ingest an Excel (.xlsx) portfolio file</div></div>
    <a class="btn gh sm" href="/api/template.xlsx">Download template</a></div>
    <div class="up-steps">
      <div class="up-step"><div class="n">1</div><h4>Prepare Excel</h4><p>A <b>Positions</b> sheet with Ticker, Name, Side, Quantity, Price, Sector, Beta, DayChangePct. Optional <b>Fund</b> sheet with NAV &amp; Cash.</p></div>
      <div class="up-step"><div class="n">2</div><h4>Upload</h4><p>Drop the file below for <b>${c?c.name:'the selected company'}</b>. Each company keeps its own portfolio.</p></div>
      <div class="up-step"><div class="n">3</div><h4>Review</h4><p>Point parses positions and computes NAV, exposure, VaR and concentration — the terminal renders from your data.</p></div>
    </div>
    <div class="card"><div class="card-b">
      <div class="drop" id="drop"><h3>Drop .xlsx here or click to browse</h3><p>Max 8 MB · parsed server-side with SheetJS</p>
        <button class="btn pri">Choose file</button>
        <input type="file" id="file" accept=".xlsx,.xls" style="display:none"/></div>
      ${c&&c.hasData?`<div style="margin-top:14px;display:flex;align-items:center;gap:10px"><span class="pill ok">Loaded</span><span class="mut">${c.fundName||''} · uploaded portfolio on file</span><span style="flex:1"></span><button class="btn danger sm" id="clear-btn">Clear this company's data</button></div>`:''}
      <div style="margin-top:16px"><div class="tag" style="margin-bottom:6px">Expected columns (Positions sheet)</div>
      <div class="schema">Ticker | Name | Side | Quantity | Price | Sector | Beta | DayChangePct | MTD | YTD | LiqDays
NVDA   | NVIDIA Corp | Long  | 120000 | 903 | Technology | 1.82 | 1.4 | 6.1 | 18.4 | 2</div></div>
    </div></div>`;
  const drop=Q('#drop'),file=Q('#file');
  drop.onclick=e=>{if(e.target.tagName!=='INPUT')file.click();};
  file.onchange=()=>{if(file.files[0])doUpload(file.files[0]);};
  drop.ondragover=e=>{e.preventDefault();drop.classList.add('over');};
  drop.ondragleave=()=>drop.classList.remove('over');
  drop.ondrop=e=>{e.preventDefault();drop.classList.remove('over');if(e.dataTransfer.files[0])doUpload(e.dataTransfer.files[0]);};
  const clr=Q('#clear-btn'); if(clr)clr.onclick=async()=>{await fetch('/api/'+COMPANY+'/portfolio',{method:'DELETE'});toast('Cleared');await loadCompanies();selectCompany(COMPANY,true);};
}
async function doUpload(f){
  if(!COMPANY){toast('Select a company first',"err");return;}
  if(!/\.xlsx?$/i.test(f.name)){toast('Please upload an .xlsx file',"err");return;}
  const drop=Q('#drop'); drop.innerHTML='<h3><span class="spin"></span>Parsing '+f.name+'…</h3>';
  const fd=new FormData(); fd.append('file',f);
  try{
    const res=await fetch('/api/'+COMPANY+'/upload',{method:'POST',body:fd});
    const j=await res.json();
    if(!res.ok){toast(j.error||'Upload failed',"err");renderUpload();return;}
    toast(j.positions+' positions loaded for '+j.company.name,"ok");
    await loadCompanies();
    await selectCompany(COMPANY,true);
    go('command');
  }catch(e){toast('Upload error: '+e.message,"err");renderUpload();}
}

/* ---------- routing ---------- */
function go(v){QA('.view').forEach(s=>s.classList.toggle('on',s.id==='view-'+v));QA('#nav a[data-v]').forEach(a=>a.classList.toggle('on',a.dataset.v===v));window.scrollTo(0,0);}
QA('#nav a[data-v]').forEach(a=>a.onclick=()=>go(a.dataset.v));
document.addEventListener('click',e=>{const g=e.target.closest('[data-goto]');if(g)go(g.dataset.goto);});
Q('#btn-upload-top').onclick=()=>go('upload');

/* boot */
loadCompanies();
})();
