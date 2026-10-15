/* ===================== Point — Fund Intelligence Terminal ===================== */
(function(){
'use strict';
const Q=s=>document.querySelector(s), QA=s=>[...document.querySelectorAll(s)];
const fmt=n=>n.toLocaleString('en-US');
const sgn=(v,suf='')=>(v>=0?'+':'')+v+suf;
const cls=v=>v>0?'pos':v<0?'neg':'mut';

function setTheme(theme){
  const next=theme==='dark'?'dark':'light';
  document.body.dataset.theme=next;
  try{localStorage.setItem('point-inst-theme',next);}catch(e){}
  const control=Q('#theme-btn');
  if(control){
    const label=next==='light'?'Switch to dark theme':'Switch to light theme';
    control.title=label; control.setAttribute('aria-label',label);
  }
}

/* ---------- FUNDS ---------- */
const FUNDS={
  alpha:{ic:'AL',col:'#e8603b',name:'Alpha Fund',sub:'Equity L/S · flagship',aum:'$1.248 B',
    nav:'$1.248B',day:'+$4.24M',dayp:'+0.34%',dayPos:true,gross:'184%',net:'62%',var:'1.15%',cash:'8.3%',
    health:74,yhealth:81,type:'ls'},
  global:{ic:'GM',col:'#d4a42b',name:'Global Macro Fund',sub:'Macro · multi-asset',aum:'$842.0 M',
    nav:'$842.0M',day:'−$1.01M',dayp:'−0.12%',dayPos:false,gross:'142%',net:'38%',var:'1.16%',cash:'22%',
    health:69,yhealth:66,type:'macro'},
  neutral:{ic:'MN',col:'#58b06a',name:'Market Neutral Fund',sub:'Equity MN · low beta',aum:'$1.560 B',
    nav:'$1.560B',day:'+$1.40M',dayp:'+0.09%',dayPos:true,gross:'210%',net:'4%',var:'0.39%',cash:'11%',
    health:82,yhealth:80,type:'neutral'},
  digital:{ic:'DA',col:'#6c7bf0',name:'Digital Assets Fund',sub:'Crypto + tokenized',aum:'$318.4 M',
    nav:'$318.4M',day:'−$6.80M',dayp:'−2.10%',dayPos:false,gross:'96%',net:'71%',var:'3.52%',cash:'4%',
    health:58,yhealth:67,type:'digital'}
};
let FUND='alpha';

/* ---------- POSITIONS (Alpha) ---------- */
/* tk, company, side, qty, mv($M), nav%, day$M, mtd$M, ytd$M, varc%, rbud%, rused%, sector, factor, crowd, liqDays, catalyst, health, beta, ret% */
const APEX=[
['NVDA','NVIDIA Corp','L',120000,108.4,8.6,2.8,6.1,18.4,11.2,14,80,'Technology','Growth','High',2.1,'Earnings 12d','WATCH',1.82,13.2],
['META','Meta Platforms','L',150000,84.7,6.7,1.9,4.2,15.1,7.4,10,74,'Comm Svcs','Growth','High',1.4,'Earnings 18d','GOOD',1.21,16.8],
['MSFT','Microsoft','L',200000,82.6,6.6,-0.4,-2.1,9.2,6.1,9,68,'Technology','Quality','Mid',1.1,'—','WATCH',0.96,4.1],
['AMZN','Amazon','L',380000,72.5,5.8,1.1,3.8,11.0,5.4,8,61,'Cons Disc','Growth','Mid',1.3,'Earnings 20d','GOOD',1.14,9.9],
['GOOGL','Alphabet','L',420000,70.9,5.6,0.6,1.1,6.4,4.2,7,54,'Comm Svcs','Quality','Low',1.1,'—','GOOD',1.02,7.2],
['AVGO','Broadcom','L',48000,62.1,4.9,1.4,3.3,10.6,6.8,9,79,'Technology','Growth','High',1.8,'Earnings 9d','WATCH',1.44,11.4],
['AMD','Adv Micro Dev','L',310000,52.8,4.2,-1.2,-3.1,-2.4,9.1,11,98,'Technology','Growth','High',1.78,'Earnings 14d','TRIM',1.78,-4.0],
['LLY','Eli Lilly','L',68000,61.4,4.9,0.4,2.0,8.1,3.9,6,62,'Health Care','Quality','Mid',1.6,'—','GOOD',0.62,12.1],
['JPM','JPMorgan','L',240000,56.2,4.5,0.3,1.4,4.9,3.1,5,51,'Financials','Value','Low',0.9,'Earnings 2d','GOOD',1.08,6.4],
['GS','Goldman Sachs','L',92000,44.6,3.5,0.2,0.9,3.2,2.8,4,59,'Financials','Value','Low',1.14,'Earnings 7d','WATCH',1.18,4.1],
['COST','Costco','L',52000,40.8,3.2,0.5,2.0,2.9,2.1,3,51,'Cons Staples','Quality','Low',1.0,'—','GOOD',0.72,5.9],
['UNH','UnitedHealth','L',58000,34.1,2.7,-0.3,-1.8,-3.2,4.6,5,92,'Health Care','Quality','Mid',1.2,'Investor Day 8d','TRIM',0.74,-5.1],
['XOM','Exxon Mobil','L',280000,33.6,2.7,-0.6,0.8,5.1,3.4,4,78,'Energy','Value','Low',0.9,'—','WATCH',0.66,7.4],
['CVX','Chevron','L',180000,28.4,2.3,-0.5,0.4,3.8,2.9,4,74,'Energy','Value','Low',1.0,'—','GOOD',0.64,5.1],
['ANET','Arista Networks','L',62000,25.8,2.0,0.9,2.1,4.4,4.1,5,77,'Technology','Growth','High',1.33,'Earnings 16d','GOOD',1.33,8.6],
['NFLX','Netflix','L',28000,22.1,1.8,0.4,1.1,3.9,3.6,4,71,'Comm Svcs','Growth','Mid',1.26,'Earnings 11d','GOOD',1.26,7.7],
['UBER','Uber Tech','L',280000,20.4,1.6,0.8,1.9,4.1,3.0,4,62,'Technology','Growth','Low',1.1,'—','GOOD',1.28,9.1],
['CRM','Salesforce','L',72000,19.9,1.6,-0.2,-0.9,0.4,3.9,4,88,'Technology','Growth','Mid',1.22,'Dreamforce 9d','WATCH',1.22,0.9],
['TSLA','Tesla','S',-65000,-15.9,1.3,0.6,2.2,3.1,5.2,5,61,'Cons Disc','Growth','Mid',1.74,'Deliveries 6d','GOOD',-1.74,6.1],
['WBA','Walgreens','S',-820000,-6.9,0.5,0.5,2.8,4.4,2.1,3,52,'Cons Staples','Value','Low',0.91,'—','GOOD',-0.91,9.4],
['PEP','PepsiCo','S',-120000,-19.6,1.6,0.1,0.6,1.4,2.4,3,58,'Cons Staples','Quality','Low',0.58,'Earnings 3d','WATCH',-0.58,1.9],
['INTC','Intel','S',-540000,-12.1,1.0,0.3,1.4,2.2,2.0,3,66,'Technology','Value','Low',1.05,'Earnings 13d','GOOD',-1.05,5.8],
['HD','Home Depot','L',46000,18.4,1.5,0.4,1.5,2.6,2.2,3,55,'Cons Disc','Quality','Low',0.9,'—','GOOD',0.72,4.4],
['PG','Procter & Gamble','L',108000,17.9,1.4,0.1,0.8,1.9,1.8,2,42,'Cons Staples','Quality','Low',0.6,'—','GOOD',0.38,3.1],
['NOW','ServiceNow','L',18000,16.2,1.3,0.3,1.0,2.4,3.1,4,64,'Technology','Growth','Mid',1.29,'—','GOOD',1.29,4.9],
['SNOW','Snowflake','L',94000,14.6,1.2,0.5,1.4,2.8,3.4,4,72,'Technology','Growth','Mid',1.4,'Investor Day 18d','GOOD',1.4,5.1]
];
const DATA={alpha:APEX};
function positions(){return DATA[FUND]||APEX;}

/* health components */
const HEALTH={
  alpha:[['Risk',72,-3,'VaR rose to 7.4% on semiconductor beta drift.',68],
    ['Liquidity',91,0,'88% of book liquidates in under 3 days.',40],
    ['Concentration',58,-9,'Semiconductor exposure increased after NVDA rally.',82],
    ['Crowding',64,-4,'Three top holdings sit in top-decile HF ownership.',70],
    ['Momentum',78,+2,'Breadth positive; growth factor leading.',38],
    ['Catalyst risk',69,-5,'Four holdings report earnings within 14 days.',62],
    ['Guideline headroom',84,-1,'Beta-adjusted net nearing IMA soft limit.',22]]
};
function health(){return HEALTH[FUND]||HEALTH.alpha;}

/* ---------- WHAT CHANGED ---------- */
const CHANGED={
  alpha:{
    RISK:[['VaR','7.1% → 7.4%',1],['Semiconductor exposure','21.4% → 24.8%',1],['Net exposure','38% → 42%',1]],
    MARKET:[['NVDA','+4.2%',1],['WTI Crude','−3.1%',-1],['10Y Yield','+11 bps',1]],
    FLOWS:[['2 names · institutional accumulation','META, AVGO',1],['1 name · rising short interest','AMD',-1]],
    THESIS:[['3 positions · new contradicting evidence','AMD, UNH, CRM',-1]],
    LIMITS:[['2 guidelines moved SAFE → WARNING','Beta-net, Tech exposure',-1]]
  }
};
function changed(){return CHANGED[FUND]||CHANGED.alpha;}

/* ---------- ACTION CARDS ---------- */
const CARDS=[
  {id:'AC-7731',sev:'crit',agent:'Risk & Guideline',ts:'09:38 ET',conf:'High',fresh:'Risk 09:41',
   title:'Semiconductor concentration approaching internal limit',
   m:[['24.8%','Current'],['27%','Limit'],['28.3%','Projected'],['63%','1D breach prob'],['$18.4M','$ at risk']],
   drivers:['NVDA appreciation (+4.2%)','AMD appreciation','Cross-correlation increase to 0.78'],
   rec:'Reduce semiconductor beta or add an SMH hedge. Minimum fix: trim NVDA $8.4M (breach prob → 14%).',
   evidence:[['Quant Engine','Concentration = 24.8% of NAV, computed 09:41 ET'],['Risk Agent','Projected 28.3% at next-open on current drift'],['Guideline Engine','Internal sector cap 27% (Risk Policy §3.1)']]},
  {id:'AC-7728',sev:'crit',agent:'Macro & Regime',ts:'08:55 ET',conf:'Med',fresh:'Macro latest',
   title:'CPI print tomorrow 08:30 — hot scenario = −$8.2M',
   m:[['−$8.2M','Hot scenario'],['−0.65%','% NAV'],['0.6×','DV01 hedge'],['High','Portfolio sens.']],
   drivers:['Core CPI consensus 0.3% MoM','Book long-duration growth','Rate-vol sellers crowded'],
   rec:'Deploy 10Y DV01 hedge ladder at 0.6× book. Carry < 2 bps/mo.',
   evidence:[['Quant Engine','Scenario PnL grid vs position-level rate betas'],['Catalyst Calendar','CPI Oct 08 08:30 ET · HIGH sensitivity']]},
  {id:'AC-7725',sev:'warn',agent:'Fund Flows',ts:'08:12 ET',conf:'Med',fresh:'13F 54d',
   title:'META crowding score 92 — de-grossing vulnerability',
   m:[['92','Crowding'],['14.1%','HF ownership'],['+7pts','QoQ Δ'],['High','De-gross risk']],
   drivers:['Top-decile hedge-fund ownership','Options skew steep','4 of top-10 funds trimming'],
   rec:'Consider halving META or a Dec OTM put spread ahead of any vol event.',
   evidence:[['Fund Flows Agent','13F observed Jun 30 · filed Aug 14 · 54 days old'],['Options','25-delta skew 90th percentile']]},
  {id:'AC-7719',sev:'warn',agent:'Position Intel',ts:'07:40 ET',conf:'High',fresh:'News 2m',
   title:'AMD thesis drift — alignment fell to 61%',
   m:[['61%','Alignment'],['86%','Prior'],['−3.1%','MTD'],['98%','Risk budget used']],
   drivers:['Gross-margin guidance weakened','Capex growth exceeded thesis','Competitor pricing pressure'],
   rec:'Re-underwrite or trim. Position is high-risk / low-return (99% budget, −4% return).',
   evidence:[['Position Intel','8-K + transcript delta vs recorded thesis'],['PnL Agent','YTD −$2.4M · efficiency POOR']]},
  {id:'AC-7704',sev:'opp',agent:'Research & Alpha',ts:'07:05 ET',conf:'High',fresh:'Estimates 3h',
   title:'META — Alpha 84, diversifies semiconductor concentration',
   m:[['84','Alpha score'],['High','Portfolio fit'],['+4.1/−2.3%','5D range'],['18d','Earnings']],
   drivers:['Strong estimate revisions','Improving institutional positioning','Momentum positive'],
   rec:'Add on weakness; portfolio fit HIGH — reduces reliance on semis for upside.',
   evidence:[['Research Agent','Composite 84/100 · explainable factor stack'],['Flows Agent','Institutional ownership +7 pts QoQ']]},
  {id:'AC-7698',sev:'opp',agent:'Earnings & Sentiment',ts:'06:50 ET',conf:'Med',fresh:'Transcript',
   title:'TSMC read-across positive for NVDA, AVGO',
   m:[['+','NVDA'],['+','AVGO'],['=','INTC'],['72%','Confidence']],
   drivers:['TSMC raised AI-demand commentary','Capex guide reaffirmed','Supply tightness eased'],
   rec:'Supports existing semis longs; no new action required — informational.',
   evidence:[['Earnings Agent','TSMC call tone +0.3 QoQ, AI mentions +22%']]}
];

/* inbox state per card — read / status / owner (drives Alert center, Command center queue, nav badge) */
const AL={};
CARDS.forEach(c=>{AL[c.id]={read:!['AC-7731','AC-7728','AC-7725','AC-7704'].includes(c.id),status:'open',
  owner:{'AC-7731':'You','AC-7719':'You','AC-7728':'Macro desk','AC-7725':'Flows desk','AC-7704':'Research','AC-7698':'Research'}[c.id]||'Unassigned'};});
const isOpen=c=>AL[c.id].status==='open';

/* ---------- GUIDELINES ---------- */
const LIMITS=[
  ['Gross exposure','Risk Policy §2.1','186%','220%','250%','64%','4%','9%','14%','SAFE'],
  ['Beta-adjusted net','IMA §4.2','56%','58%','60%','4%','48%','67%','74%','WARN'],
  ['Technology exposure','Risk Policy §3.1','29%','30%','35%','6%','31%','42%','55%','WARN'],
  ['Single-name max','IMA §4.5','8.6%','9%','10%','1.4%','12%','18%','22%','SAFE'],
  ['Top-10 concentration','Risk Policy §3.2','44%','48%','50%','6%','3%','6%','9%','SAFE'],
  ['1-day VaR / NAV','Risk Policy §5.1','7.4%','8.0%','9.0%','1.6%','2%','5%','8%','SAFE'],
  ['Semiconductor sector','Risk Policy §3.1','24.8%','26%','27%','2.2%','31%','44%','58%','WARN'],
  ['Short borrow avg fee','Ops Policy §1.3','118bp','200bp','250bp','132bp','0%','1%','2%','SAFE'],
  ['Days-to-liquidate (95%)','Risk Policy §5.4','2.6','4.0','5.0','2.4','0%','1%','2%','SAFE']
];

/* ---------- DECISIONS ---------- */
const DECISIONS=[
  {date:'Oct 01',rec:'Reduce NVDA exposure',reason:'Concentration + earnings risk',dec:'Dismissed',by:'Admin (PM)',
   note:'"Fundamental conviction remains strong."',out:[['NVDA 5D','−7.2%','neg'],['Portfolio impact','−$4.2M','neg'],['Verdict','Missed','warn']]},
  {date:'Sep 28',rec:'Add SMH put spread hedge',reason:'Beta-net nearing IMA cap',dec:'Approved',by:'Admin (PM)',
   note:'"Cheap insurance into CPI."',out:[['Cost','5 bps',''],['5D protection','+$1.1M','pos'],['Verdict','Correct','ok']]},
  {date:'Sep 24',rec:'Trim MSFT 25% — alpha decay',reason:'Half-life expired, 18% risk budget',dec:'Modified',by:'Admin (PM)',
   note:'"Trimmed 10% instead of 25%."',out:[['MSFT 5D','−2.1%','neg'],['Impact','−$0.4M','neg'],['Verdict','Partial','warn']]},
  {date:'Sep 19',rec:'Initiate UBER long',reason:'FCF inflection, insider buying',dec:'Approved',by:'Admin (PM)',
   note:'"Strong risk-adjusted entry."',out:[['UBER 5D','+7.2%','pos'],['Impact','+$1.4M','pos'],['Verdict','Correct','ok']]}
];

/* ---------- OPPORTUNITIES ---------- */
const OPPS=[
  ['META',84,'HIGH',78,62,'+3',' Positive',67,'+4.1/−2.3%','Earnings 18d','Low','Diversifies semi concentration'],
  ['V',79,'HIGH',71,68,'+2','Positive',64,'+2.8/−1.9%','Earnings 9d','Low','Adds low-beta quality compounder'],
  ['ANET',82,'MED',80,55,'+3','Positive',72,'+5.0/−3.1%','Earnings 16d','Mid','Already held — add on dip'],
  ['LLY',81,'MED',66,48,'+2','Positive',70,'+3.2/−2.0%','—','Low','Health-care factor diversifier'],
  ['SPOT',86,'LOW',84,52,'+4','Positive',68,'+6.1/−3.4%','Earnings 21d','Mid','New name — high momentum'],
  ['NFLX',77,'MED',74,58,'+1','Neutral',66,'+4.4/−2.7%','Earnings 11d','Mid','Held — rank supports hold']
];

/* ======================= RENDERERS ======================= */
function kcell(l,v,sub,subcls,valcls){return `<div class="kcell"><div class="klab">${l}</div><div class="kval num ${valcls||''}">${v}</div><div class="ksub ${subcls||'mut'}">${sub||''}</div></div>`;}

const ICO={
  cmd:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 3a3 3 0 00-3 3v12a3 3 0 103-3H6a3 3 0 103 3V6a3 3 0 10-3 3h12a3 3 0 000-6z"/></svg>',
  book:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4h6a4 4 0 014 4v13a3 3 0 00-3-3H2zM22 4h-6a4 4 0 00-4 4v13a3 3 0 013-3h7z"/></svg>',
  check:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  zap:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>'
};

function renderCommand(){
  const f=FUNDS[FUND];
  const hd=f.health-f.yhealth, hlev=f.health>=75?'pos':f.health>=60?'warnc':'neg';
  const strip=`<div class="kstrip">
    ${kcell('NAV',f.nav,'as-of 09:42 ET')}
    ${kcell('Daily P&L',f.day,f.dayp,f.dayPos?'pos':'neg',f.dayPos?'pos':'neg')}
    ${kcell('Gross',f.gross,'exposure')}
    ${kcell('Net',f.net,'beta-adj 56%')}
    ${kcell('1D VaR',f.var,'of NAV')}
    ${kcell('Cash',f.cash,'available')}
    ${kcell('Health',f.health+' / 100',sgn(hd)+' vs yesterday',hd>=0?'pos':'neg',hlev)}
  </div>`;

  // health ring
  const h=f.health, circ=2*Math.PI*41, off=circ*(1-h/100);
  const hcol=h>=75?'var(--pos)':h>=60?'var(--warn)':'var(--crit)';
  const comps=health().map((c,i)=>{
    const col=c[1]>=75?'var(--pos)':'var(--warn)';
    return `<div class="hc" data-hc="${i}">
      <div class="hc-top"><span class="hc-name">${c[0]}</span><span class="hc-val num">${c[1]}</span><span class="hc-chg num ${cls(c[2])}">${sgn(c[2])}</span></div>
      <div class="hc-bar"><div class="hc-fill" style="width:${c[1]}%;background:${col}"></div></div>
      <div class="hc-why">${c[3]}</div></div>`;}).join('');

  const healthCard=`<div class="card">
    <div class="card-h"><h3>Portfolio health</h3><span class="sp"></span><span class="pill ${h>=75?'ok':h>=60?'warn':'crit'}">${h>=75?'HEALTHY':h>=60?'ELEVATED':'STRESSED'}</span></div>
    <div class="card-b">
      <div class="health">
        <div class="ring"><svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="41" fill="none" stroke="var(--line)" stroke-width="7"/>
          <circle cx="48" cy="48" r="41" fill="none" stroke="${hcol}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${off}"/>
        </svg><div class="rc"><div class="rn num">${h}</div><div class="rl">/ 100</div></div></div>
        <div class="health-meta"><b>Yesterday <span class="num">${f.yhealth}</span></b> · Change <b class="num ${cls(hd)}">${sgn(hd)}</b><br/>
        Driven down by rising semiconductor concentration and net exposure. Seven components monitored by the Conductor.</div>
      </div>
    </div>
    <div class="hcomp">${comps}</div></div>`;

  // top risk
  const topRisk=`<div class="card">
    <div class="card-h"><h3>Top risk</h3><span class="sp"></span><span class="pill crit">CRITICAL</span></div>
    <div class="card-b">
      <div style="font-size:13.5px;font-weight:600;margin:6px 0 12px">Semiconductor concentration approaching internal limit</div>
      <div class="kv2" style="margin-bottom:12px">
        <div class="c"><div class="k">Current</div><div class="v num">24.8%</div></div>
        <div class="c"><div class="k">Limit</div><div class="v num">27%</div></div>
        <div class="c"><div class="k">Projected (1D)</div><div class="v num neg">28.3%</div></div>
        <div class="c"><div class="k">Breach prob</div><div class="v num neg">63%</div></div>
      </div>
      <div style="font-size:11.5px;color:var(--muted);margin-bottom:14px">$ at risk <b class="num" style="color:var(--ink)">$18.4M</b> · drivers: NVDA +4.2%, AMD, correlation ↑</div>
      <button class="btn pri sm" data-card="AC-7731">View analysis</button>
      <button class="btn gh sm" data-goto="scenarios">Run scenario</button>
    </div></div>`;

  // top opportunity
  const topOpp=`<div class="card">
    <div class="card-h"><h3>Top opportunity</h3><span class="sp"></span><span class="pill info">OPPORTUNITY</span></div>
    <div class="card-b">
      <div style="display:flex;align-items:baseline;gap:9px;margin:6px 0 12px"><div style="font-size:16px;font-weight:700">META</div><div class="mut" style="font-size:12px">Alpha 84 / 100</div></div>
      <div class="kv2" style="margin-bottom:12px">
        <div class="c"><div class="k">Expected 5D</div><div class="v num">+4.1 / −2.3%</div></div>
        <div class="c"><div class="k">Institutional flow</div><div class="v pos" style="font-size:13px">Positive</div></div>
        <div class="c"><div class="k">Momentum</div><div class="v pos" style="font-size:13px">Positive</div></div>
        <div class="c"><div class="k">Earnings</div><div class="v num">18 days</div></div>
      </div>
      <div style="font-size:11.5px;color:var(--muted);margin-bottom:14px">Portfolio fit <b style="color:var(--pos)">STRONG</b> — diversifies semiconductor concentration.</div>
      <button class="btn pri sm" data-card="AC-7704">View thesis</button>
    </div></div>`;

  // what changed — THESIS / LIMITS rows drill down (›)
  const ch=changed(), drill={THESIS:1,LIMITS:1};
  const wcCats=Object.keys(ch).map(cat=>`<div class="wc-cat"><div class="wc-h">${cat}</div>${
    ch[cat].map(r=>`<div class="wc-row"><span class="lab">${r[0]}</span><span class="chg ${cls(r[2])}">${r[1]}${drill[cat]?'<span class="wc-arrow">›</span>':''}</span></div>`).join('')}</div>`).join('');
  const whatChanged=`<div class="card"><div class="card-h"><h3>What changed since yesterday?</h3><span class="sp"></span><span class="tag">Conductor · ranked</span></div><div class="card-b flush">${wcCats}</div></div>`;

  // action cards (critical+warning)
  const q=CARDS.filter(c=>c.sev!=='opp'&&isOpen(c));
  const nCrit=q.filter(c=>c.sev==='crit').length, nWarn=q.filter(c=>c.sev==='warn').length;
  const actionCards=`<div class="card"><div class="card-h"><h3>Action queue</h3><span class="sp"></span>${nCrit?`<span class="pill crit">${nCrit} critical</span>`:''}${nWarn?`<span class="pill warn">${nWarn} warning</span>`:''}</div><div class="card-b" style="padding:12px 12px 2px">${q.length?q.map(acardMarkup).join(''):'<div class="al-empty" style="padding:28px 10px 36px"><div class="al-empty-ic">✓</div><b>Queue clear</b><div class="mut">Every critical and warning item has been actioned.</div><button class="btn gh sm" data-goto="alerts">Review in Alert center</button></div>'}</div></div>`;

  // limit headroom (compact)
  const lhRows=LIMITS.slice(0,6).map(r=>{
    const st=r[9], pct=parseFloat(r[2]), lim=parseFloat(r[4]), warn=parseFloat(r[3]);
    const w=Math.min(100,pct/lim*100), col=st==='WARN'?'var(--warn)':st==='BREACH'?'var(--crit)':'var(--pos)';
    return `<tr data-limit="${r[0]}"><td class="l">${r[0]}</td><td class="num">${r[2]}</td><td class="c"><span class="hr-bar"><span class="hr-fill" style="width:${w}%;background:${col}"></span><span class="hr-mark" style="left:${warn/lim*100}%"></span></span></td><td class="num">${r[4]}</td><td class="num">${r[6]}</td><td><span class="pill ${st==='WARN'?'warn':st==='BREACH'?'crit':'ok'}">${st}</span></td></tr>`;}).join('');
  const nLimWarn=LIMITS.slice(0,6).filter(r=>r[9]==='WARN').length;
  const headroom=`<div class="card"><div class="card-h"><h3>Limit headroom</h3><span class="sp"></span><span class="pill warn">${nLimWarn} warning</span></div><div class="card-b flush" style="padding-bottom:8px"><div class="tbl-wrap"><table class="t lite"><thead><tr><th class="l">Rule</th><th>Current</th><th class="c">Headroom</th><th>Limit</th><th>1D breach</th><th>Status</th></tr></thead><tbody>${lhRows}</tbody></table></div></div></div>`;

  // catalysts
  const cats=[['12','OCT','CPI · 08:30 ET','Portfolio sensitivity HIGH · scenario −$8.2M','crit'],
    ['09','OCT','JPM earnings','Pre-market · read-across GS, financials','warn'],
    ['16','OCT','AVGO earnings','After close · $62M position','warn'],
    ['18','OCT','NVDA earnings','Largest position · implied move ±8%','crit'],
    ['26','OCT','UNH investor day','Thesis in WARNING · $34M position','neu']];
  const catHtml=cats.map(c=>`<div class="cal-row"><div class="cal-date"><div class="cal-d num">${c[0]}</div><div class="cal-m">${c[1]}</div></div><div class="cal-main"><div class="cal-t">${c[2]}</div><div class="cal-s">${c[3]}</div></div><span class="pill ${c[4]}">${c[4]==='crit'?'HIGH':c[4]==='warn'?'MED':'INFO'}</span></div>`).join('');
  const catalysts=`<div class="card"><div class="card-h"><h3>Upcoming catalysts</h3><span class="sp"></span><span class="tag">portfolio-aware</span></div><div class="card-b flush" style="padding:2px 13px">${catHtml}</div></div>`;

  // movers — gains grow from the left, losses from the right
  const mv=positions().slice().map(p=>({tk:p[0],v:p[6]})).sort((a,b)=>Math.abs(b.v)-Math.abs(a.v)).slice(0,8);
  const mvMax=Math.max(...mv.map(m=>Math.abs(m.v)));
  const mvHtml=mv.map(m=>{const w=Math.abs(m.v)/mvMax*86, pos=m.v>=0;
    return `<div class="mvr" data-pos="${m.tk}"><span class="tk">${m.tk}</span><div class="mvr-track"><span class="mvr-b" style="${pos?'left:0':'right:0'};width:${w}%;background:${pos?'var(--pos)':'var(--crit)'}"></span></div><span class="pnl ${cls(m.v)}">${sgn(m.v)}M</span></div>`;}).join('');
  const movers=`<div class="card"><div class="card-h"><h3>Portfolio movers · today</h3><span class="sp"></span><span class="tag">$ P&L</span></div><div class="card-b" style="padding:12px 13px">${mvHtml}</div></div>`;

  // Briefs follow the selected mandate; detailed positions currently cover Alpha only.
  const deskBriefs={
  "alpha": [
    [
      "Our recommendation",
      "Trim NVDA by the $8.4M proposed in the action card and reduce AMD. This lowers semiconductor concentration while retaining the core holdings."
    ],
    [
      "Why now",
      "Semiconductor exposure is <b>24.8% against a 27% cap</b>, with a projected rise to 28.3%. AMD is using <b>98% of its risk budget for a −4% return</b>, with weaker margin and pricing evidence."
    ],
    [
      "Other holdings",
      "Reduce UNH, which is also flagged for a trim with high risk usage and a negative return. Hold CRM without adding through its nearby catalyst."
    ],
    [
      "Suggested next step",
      "Check the combined concentration after the reductions. Defer a META addition until headroom is restored, then use its existing opportunity case and portfolio-fit assessment to size it."
    ]
  ],
  "global": [
    [
      "Our recommendation",
      "Pause new directional additions and retain the liquidity buffer until fund-specific exposures are available."
    ],
    [
      "Why now",
      "Global Macro shows <b>1.16% VaR and 22% cash</b>, but this terminal has no detailed Global Macro holdings or sensitivities. The available evidence supports holding off on new risk, rather than naming an unsupported position to sell."
    ],
    [
      "Suggested next step",
      "Keep new risk orders on hold pending the Global Macro position and DV01 breakdown. Use that breakdown to size any rate or currency reduction; the Alpha trade proposals do not apply to this fund."
    ]
  ],
  "neutral": [
    [
      "Our recommendation",
      "Maintain the neutral allocation and keep new positions matched across both legs."
    ],
    [
      "Why now",
      "Market Neutral shows <b>4% net and 210% gross exposure</b>. Low net exposure supports retaining the neutral stance, while the substantial gross book warrants care with additional pair size."
    ],
    [
      "Suggested next step",
      "Hold off on increasing gross exposure until the Market Neutral pair and borrow breakdown is available. Preserve beta balance in any adjustment; there is no fund-specific evidence here for a named pair trade."
    ]
  ],
  "digital": [
    [
      "Our recommendation",
      "Pause fresh risk additions and preserve the cash buffer while the portfolio is under pressure."
    ],
    [
      "Why now",
      "Digital Assets shows a <b>−2.10% day, 3.52% VaR and 4% cash</b>. Those headline figures favor maintaining liquidity, but the detailed holdings needed to select a sale or hedge are missing."
    ],
    [
      "Suggested next step",
      "Keep new buys on hold and obtain the Digital Assets holdings and venue balances before sizing reductions. Protect the existing cash buffer; do not reuse Alpha holdings to construct a Digital Assets hedge."
    ]
  ]
};
  const brief=`<div class="card"><div class="card-h"><h3>Point Morning Brief</h3><span class="sp"></span><span class="tag">Demo data · suggested actions</span><button class="btn gh sm" data-action="export-brief">Export</button></div><div class="card-b">
    <div class="brief">
      ${deskBriefs[FUND].map(([heading,copy])=>`<p style="margin:0 0 12px"><b>${heading}.</b> ${copy}</p>`).join('')}
    </div></div></div>`;

  Q('#view-command').innerHTML=`
    <div class="pg-head"><div><div class="pg-eyebrow">${ICO.cmd}<span>Decision workspace</span></div><div class="pg-title">Command center</div><div class="pg-sub">${f.name} · the fund in ten seconds</div></div>
      <div class="pg-acts"><button class="btn gh sm" data-goto="ask">${ICO.book}Ask the book</button><button class="btn gh sm" data-goto="scenarios">Scenario studio</button><button class="btn pri sm" data-goto="decisions">${ICO.zap}Decision queue</button></div></div>
    ${strip}
    <div class="grid g-3">${healthCard}${topRisk}${topOpp}</div>
    <div class="grid g-2b">${whatChanged}${actionCards}</div>
    <div class="grid g-2b">${headroom}${catalysts}</div>
    <div class="grid g-2c">${movers}${brief}</div>
    <div class="foot-note">Point Fund Intelligence · all quantitative values from the deterministic Quant Engine v2.4 · AI narrates, ranks and explains — it does not compute official values. <a href="landing.html">Back to site</a></div>`;
}

function acardMarkup(c){
  const sevl={crit:'CRITICAL',warn:'WARNING',opp:'OPPORTUNITY',info:'INFO'};
  const st=AL[c.id], done=st.status!=='open';
  const foot=done
    ? `<span class="pill ${st.status==='approved'?'ok':'neu'}">${st.status==='approved'?'✓ Approved':'Dismissed'}</span><button class="btn gh sm" data-act="undo" data-id="${c.id}">Undo</button>`
    : `<button class="btn pri sm" data-act="approve" data-id="${c.id}">Approve</button><button class="btn gh sm" data-goto="scenarios">What-if</button><button class="btn gh sm" data-act="dismiss" data-id="${c.id}">Dismiss</button>`;
  return `<div class="acard ${c.sev}${st.read?'':' unread'}${done?' done':''}" data-card="${c.id}" tabindex="0" role="button" aria-label="${sevl[c.sev]}: ${c.title}${st.read?'':' (unread)'}">
    <div class="ac-h">${st.read?'':'<span class="ud" title="Unread"></span>'}<span class="pill ${c.sev==='opp'?'info':c.sev}">${sevl[c.sev]}</span><span class="tag">${c.agent} · ${c.ts} · #${c.id}</span><span class="sp"></span><span class="own${st.owner==='You'?' me':''}">${st.owner==='You'?'Assigned to you':st.owner}</span></div>
    <div class="ac-ttl">${c.title}</div>
    <div class="ac-m">${c.m.map(x=>`<div class="ac-mi"><div class="v num">${x[0]}</div><div class="l">${x[1]}</div></div>`).join('')}</div>
    <div class="ac-foot">${foot}<span class="meta">Conf ${c.conf} · ${c.fresh}</span></div>
  </div>`;
}

/* ---- PORTFOLIO ---- */
let posSort={k:4,dir:-1}, posFilter='all';
function renderPortfolio(){
  const cols=['Ticker','Company','Side','Qty','Mkt Val','% NAV','Day','MTD','YTD','VaR c.','Risk used','Sector','Crowd','Liq','Catalyst','Health'];
  let rows=positions().filter(p=>posFilter==='all'||(posFilter==='long'&&p[2]==='L')||(posFilter==='short'&&p[2]==='S')||(posFilter==='warn'&&(p[17]==='WATCH'||p[17]==='TRIM'))||(posFilter==='semi'&&p[12]==='Technology'));
  rows=rows.slice().sort((a,b)=>{const k=posSort.k; let x=a[k],y=b[k]; if(typeof x==='string'){x=x.toLowerCase();y=y.toLowerCase();} return (x>y?1:x<y?-1:0)*posSort.dir;});
  const body=rows.map(p=>{
    const hc=p[17]==='GOOD'?'ok':p[17]==='TRIM'?'crit':'warn';
    const cw=p[14]==='High'?'crit':p[14]==='Mid'?'warn':'neu';
    const rb=p[11], rbcol=rb>=90?'var(--crit)':rb>=70?'var(--warn)':'var(--pos)';
    return `<tr data-pos="${p[0]}">
      <td class="l tk">${p[0]}</td><td class="l co">${p[1]}</td>
      <td class="l"><span class="side-${p[2]==='L'?'l':'s'}">${p[2]==='L'?'LONG':'SHORT'}</span></td>
      <td class="num">${fmt(p[3])}</td><td class="num">$${p[4].toFixed(1)}M</td><td class="num">${p[5]}%</td>
      <td class="num ${cls(p[6])}">${sgn(p[6])}</td><td class="num ${cls(p[7])}">${sgn(p[7])}</td><td class="num ${cls(p[8])}">${sgn(p[8])}</td>
      <td class="num">${p[9]}%</td>
      <td class="num"><span class="minibar"><i style="width:${rb}%;background:${rbcol}"></i></span> ${rb}%</td>
      <td class="l">${p[12]}</td><td class="l"><span class="pill ${cw}">${p[14]}</span></td><td class="num">${p[15]}d</td>
      <td class="l co">${p[16]}</td><td class="l"><span class="pill ${hc}">${p[17]}</span></td></tr>`;}).join('');
  const heads=cols.map((c,i)=>`<th class="${i<3?'l':''}" data-sort="${colKey(i)}">${c}</th>`).join('');
  const f=FUNDS[FUND];
  Q('#view-portfolio').innerHTML=`
    <div class="pg-head"><div><div class="pg-title">Portfolio</div><div class="pg-sub">${rows.length} positions · ${f.nav} NAV · gross ${f.gross} · net ${f.net}</div></div>
      <input class="srch" placeholder="Search ticker…" id="pos-search"/></div>
    <div class="card"><div class="card-h"><div class="filters">
      ${['all:All','long:Long','short:Short','semi:Technology','warn:Watch/Trim'].map(x=>{const[k,l]=x.split(':');return `<button class="fchip ${posFilter===k?'on':''}" data-pf="${k}">${l}</button>`;}).join('')}
      </div><span class="sp"></span><span class="tag">click a row → position intelligence</span></div>
      <div class="card-b flush"><div class="tbl-wrap"><table class="t"><thead><tr>${heads}</tr></thead><tbody>${body}</tbody></table></div></div></div>`;
}
function colKey(i){return [0,1,2,3,4,5,6,7,8,9,11,12,14,15,16,17][i];}

/* ---- RISK ---- */
function renderRisk(){
  const f=FUNDS[FUND];
  const strip=`<div class="kstrip">
    ${kcell('VaR 99%',f.var,'$93M · 1-day')}${kcell('CVaR 99%','9.8%','$123M tail')}
    ${kcell('Gross',f.gross,'')}${kcell('Net β','56%','lim 60%','warnc')}
    ${kcell('Drawdown','−4.6%','YTD max')}${kcell('Liquidity','2.6d','95% liquidate')}
    ${kcell('Concentration','24.8%','semis · lim 27%','warnc')}</div>`;

  // limit headroom full
  const lh=LIMITS.map(r=>{const st=r[9],pct=parseFloat(r[2])||0,lim=parseFloat(r[4])||1,warn=parseFloat(r[3])||lim;
    const w=Math.min(100,pct/lim*100),col=st==='WARN'?'var(--warn)':st==='BREACH'?'var(--crit)':'var(--pos)';
    return `<tr data-limit="${r[0]}"><td class="l">${r[0]}</td><td class="l co">${r[1]}</td><td class="num">${r[2]}</td><td class="num mut">${r[3]}</td><td class="num">${r[4]}</td><td><span class="hr-bar"><span class="hr-fill" style="width:${w}%;background:${col}"></span><span class="hr-mark" style="left:${Math.min(100,warn/lim*100)}%"></span></span></td><td class="num ${st==='WARN'?'warnc':''}">${r[6]}</td><td class="num">${r[7]}</td><td class="num">${r[8]}</td><td><span class="pill ${st==='WARN'?'warn':st==='BREACH'?'crit':'ok'}">${st}</span></td></tr>`;}).join('');
  const headroom=`<div class="card"><div class="card-h"><h3>Limit headroom & breach forecast</h3><span class="sp"></span><span class="tag">Guideline Engine · click source</span></div><div class="card-b flush"><div class="tbl-wrap"><table class="t"><thead><tr><th class="l">Rule</th><th class="l">Source</th><th>Current</th><th>Warn</th><th>Limit</th><th>Headroom</th><th>1D</th><th>3D</th><th>5D</th><th>Status</th></tr></thead><tbody>${lh}</tbody></table></div></div></div>`;

  // risk attribution waterfall
  const wf=[['Yesterday',7.1,'base'],['NVDA position',0.42,'up'],['Higher vol',0.31,'up'],['Correlation',0.18,'up'],['USD exposure',0.11,'up'],['Other',0.08,'up'],['Today',8.2,'base']];
  let cum=0; const wmax=8.6;
  const wfHtml=wf.map(w=>{let h,bottom=0;
    if(w[2]==='base'){h=w[1]/wmax*100;cum=w[1];} else {h=w[1]/wmax*100;bottom=cum/wmax*100;cum+=w[1];}
    const col=w[2]==='base'?'var(--accent)':'var(--warn)';
    return `<div class="wf-col"><div class="wf-v num">${w[2]==='base'?w[1].toFixed(1):sgn(w[1])}</div><div class="wf-bar" style="height:${h}%;margin-bottom:${bottom}%;background:${col}"></div><div class="wf-lab">${w[0]}</div></div>`;}).join('');
  const waterfall=`<div class="card"><div class="card-h"><h3>What changed my risk? · VaR attribution</h3><span class="sp"></span><div class="filters" aria-label="VaR attribution period"><button class="fchip on" data-range="1D">1D</button><button class="fchip" data-range="1W">1W</button><button class="fchip" data-range="1M">1M</button></div></div><div class="card-b"><div class="wf">${wfHtml}</div><div class="mut" style="font-size:11px;text-align:center;margin-top:8px">VaR rose <b class="num" style="color:var(--ink)">+1.1%</b> (7.1% → 8.2%), driven mainly by the new NVDA risk and rising cross-correlation. Source: Quant Engine v2.4, 09:41 ET.</div></div></div>`;

  // risk budget
  const rb=positions().slice().sort((a,b)=>b[11]-a[11]).slice(0,10).map(p=>{
    const eff=p[19]>=8?'GOOD':p[19]>=0?'FAIR':'POOR'; const ec=eff==='GOOD'?'ok':eff==='FAIR'?'warn':'crit';
    return `<tr data-pos="${p[0]}"><td class="l tk">${p[0]}</td><td class="num">${p[5]}%</td><td class="num">${p[9]}%</td><td class="num">${p[10]}%</td><td class="num">${p[11]}%</td><td class="num ${cls(p[19])}">${sgn(p[19],'%')}</td><td><span class="pill ${ec}">${eff}</span></td></tr>`;}).join('');
  const budget=`<div class="card"><div class="card-h"><h3>Risk budget utilization</h3><span class="sp"></span><span class="pill crit">2 high-risk / low-return</span></div><div class="card-b flush"><div class="tbl-wrap"><table class="t"><thead><tr><th class="l">Position</th><th>Weight</th><th>VaR c.</th><th>Budget</th><th>Used</th><th>Return c.</th><th>Efficiency</th></tr></thead><tbody>${rb}</tbody></table></div></div></div>`;

  // risk efficiency scatter (return vs risk)
  const pts=positions().map(p=>({tk:p[0],x:p[9],y:p[19],mv:p[4]}));
  const xmax=Math.max(...pts.map(p=>p.x))*1.15, ymin=Math.min(...pts.map(p=>p.y))-2, ymax=Math.max(...pts.map(p=>p.y))*1.1;
  const scHtml=pts.map(p=>{
    const px=p.x/xmax*100, py=100-((p.y-ymin)/(ymax-ymin)*100);
    const danger=p.x>6&&p.y<4; const col=danger?'var(--crit)':p.y>8?'var(--pos)':'var(--accent)';
    const sz=Math.max(8,Math.min(18,p.mv/8));
    return `<div class="sc-pt" data-pos="${p.tk}" style="left:${px}%;top:${py}%;width:${sz}px;height:${sz}px;background:${col}" title="${p.tk}"></div><div class="sc-lbl" style="left:${px}%;top:${py}%">${p.tk}</div>`;}).join('');
  const scatter=`<div class="card"><div class="card-h"><h3>Risk efficiency · return vs VaR contribution</h3><span class="sp"></span><span class="tag">bubble = market value · red = trim candidates</span></div><div class="card-b"><div class="scatter">
    <div class="sc-axis" style="left:50%;top:0;bottom:0;width:1px"></div><div class="sc-axis" style="top:50%;left:0;right:0;height:1px"></div>
    <div class="sc-q" style="left:8px;top:8px">High return / low risk</div><div class="sc-q" style="right:8px;top:8px">High return / high risk</div>
    <div class="sc-q" style="left:8px;bottom:8px">Low return / low risk</div><div class="sc-q" style="right:8px;bottom:8px;color:var(--crit)">Low return / HIGH risk · TRIM</div>
    ${scHtml}</div><div class="mut" style="font-size:11px;margin-top:8px">X = VaR contribution · Y = return contribution. The lower-right quadrant flags <b style="color:var(--crit)">AMD</b> and <b style="color:var(--crit)">UNH</b> as trim candidates — high risk, low/negative return.</div></div></div>`;

  // concentration + liquidity
  const sectorAgg={}; positions().forEach(p=>{sectorAgg[p[12]]=(sectorAgg[p[12]]||0)+Math.abs(p[5]);});
  const srt=Object.entries(sectorAgg).sort((a,b)=>b[1]-a[1]);
  const smax=srt[0][1];
  const conc=srt.map(s=>`<div class="bar-row" style="display:flex;align-items:center;gap:10px;margin-bottom:7px;font-size:12px"><span style="width:110px">${s[0]}</span><span style="flex:1;height:7px;background:var(--line);border-radius:4px;overflow:hidden"><i style="display:block;height:100%;width:${s[1]/smax*100}%;background:${s[0]==='Technology'?'var(--warn)':'var(--accent)'};border-radius:4px"></i></span><span class="num" style="width:44px;text-align:right;font-weight:600">${s[1].toFixed(1)}%</span></div>`).join('');
  const concentration=`<div class="card"><div class="card-h"><h3>Sector concentration</h3><span class="sp"></span><span class="pill warn">Tech 29% · cap 35%</span></div><div class="card-b">${conc}</div></div>`;

  const liq=[['< 1 day',62,'var(--pos)'],['1–3 days',26,'var(--pos)'],['3–5 days',8,'var(--warn)'],['5–10 days',3,'var(--warn)'],['> 10 days',1,'var(--crit)']];
  const liqHtml=liq.map(l=>`<div class="bar-row" style="display:flex;align-items:center;gap:10px;margin-bottom:7px;font-size:12px"><span style="width:84px">${l[0]}</span><span style="flex:1;height:7px;background:var(--line);border-radius:4px;overflow:hidden"><i style="display:block;height:100%;width:${l[1]}%;background:${l[2]};border-radius:4px"></i></span><span class="num" style="width:40px;text-align:right;font-weight:600">${l[1]}%</span></div>`).join('');
  const liquidity=`<div class="card"><div class="card-h"><h3>Liquidity · days to liquidate</h3><span class="sp"></span><span class="tag">at 20% ADV</span></div><div class="card-b">${liqHtml}<div class="mut" style="font-size:11px;margin-top:6px">88% of the book liquidates within 3 days. Full liquidation estimate: 2.6 days (95%).</div></div></div>`;

  Q('#view-risk').innerHTML=`<div class="pg-head"><div><div class="pg-title">Risk</div><div class="pg-sub">${f.name} · deterministic Quant Engine v2.4 · updated 09:41 ET</div></div></div>
    ${strip}${headroom}<div class="grid g-2b">${waterfall}${scatter}</div>${budget}<div class="grid g-2">${concentration}${liquidity}</div>`;
}

/* ---- GUIDELINES ---- */
function renderGuidelines(){
  const rows=LIMITS.map(r=>{const st=r[9];
    return `<tr data-limit="${r[0]}"><td class="l">${r[0]}</td><td class="l co">${r[1]}</td><td class="num">${r[2]}</td><td class="num">${r[4]}</td><td class="num">${r[5]}</td><td class="num ${st==='WARN'?'warnc':''}">${r[6]} / ${r[7]} / ${r[8]}</td><td><span class="pill ${st==='WARN'?'warn':st==='BREACH'?'crit':'ok'}">${st}</span></td></tr>`;}).join('');
  Q('#view-guidelines').innerHTML=`<div class="pg-head"><div><div class="pg-title">Guideline Engine</div><div class="pg-sub">Investment mandate · codified, compliance-approved rules · forecast by Quant Engine</div></div><button class="btn gh sm" data-action="propose-rule">Propose rule (AI)</button></div>
    <div class="card"><div class="card-h"><h3>Mandate rules</h3><span class="sp"></span><span class="tag">click a rule → source clause</span><span class="pill warn">3 warning</span></div><div class="card-b flush"><div class="tbl-wrap"><table class="t"><thead><tr><th class="l">Rule</th><th class="l">Source</th><th>Current</th><th>Threshold</th><th>Headroom</th><th>Breach 1/3/5D</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div></div></div>
    <div class="prov" style="margin-top:4px"><b>Governance.</b> AI may <b>propose</b> rules from IMAs, PPMs and side letters, but only compliance-approved rules become active. Each active rule carries a source clause, machine definition, approver and version.</div>`;
}

/* ---- OPPORTUNITIES ---- */
function renderOpps(){
  const rows=OPPS.map(o=>{const fit=o[2]==='HIGH'?'ok':o[2]==='MED'?'warn':'neu';
    return `<tr data-pos="${o[0]}"><td class="l tk">${o[0]}</td><td class="num" style="font-weight:700">${o[1]}</td><td><span class="pill ${fit}">${o[2]}</span></td><td class="num">${o[3]}</td><td class="num">${o[4]}</td><td class="num pos">${o[5]}</td><td class="l pos">${o[6]}</td><td class="num">${o[7]}</td><td class="num">${o[8]}</td><td class="l co">${o[9]}</td><td class="l co">${o[11]}</td><td><button class="btn gh sm" data-card="AC-7704">Thesis</button></td></tr>`;}).join('');
  Q('#view-opportunities').innerHTML=`<div class="pg-head"><div><div class="pg-title">Opportunities</div><div class="pg-sub">Portfolio-aware ideas — every opportunity answers "why is this relevant to <b>this</b> fund?"</div></div></div>
    <div class="card"><div class="card-h"><h3>Ranked ideas</h3><span class="sp"></span><span class="tag">Research & Alpha + Flows + Earnings</span></div><div class="card-b flush"><div class="tbl-wrap"><table class="t"><thead><tr><th class="l">Ticker</th><th>Alpha</th><th>Fit</th><th>Momentum</th><th>Valuation</th><th>Revisions</th><th>Flows</th><th>Sentiment</th><th>Exp 5D</th><th class="l">Catalyst</th><th class="l">Why this fund</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div></div>`;
}

/* ---- SCENARIOS ---- */
const PRESETS=['Rates +50 bp','Nasdaq −5%','S&P 500 −10%','Oil +10%','USD +5%','VIX 35','Semiconductors −10%','BTC −15%','Credit +100 bp'];
const SHOCKS=[['10Y Yield','+50 bp',70],['Nasdaq','−7%',40],['Oil','+12%',62],['USD','+3%',55],['BTC','−15%',30]];
function renderScenarios(){
  const presetHtml=PRESETS.map(p=>`<button class="preset" type="button" data-preset="${p}">${p}</button>`).join('');
  const shockHtml=SHOCKS.map(s=>`<div class="shock-row"><span class="shock-name">${s[0]}</span><div class="shock-slider"><i style="left:${s[2]-6}%;width:12px"></i></div><span class="shock-val">${s[1]}</span></div>`).join('');
  const losers=[['NVDA',-8.4],['AMD',-4.3],['META',-3.9],['AVGO',-3.1],['MSFT',-2.6]];
  const lmax=8.4;
  const loseHtml=losers.map(l=>`<div class="mover"><span class="tk">${l[0]}</span><div class="mv-track"><span class="mv-b" style="right:0;width:${Math.abs(l[1])/lmax*100}%;background:var(--crit)"></span></div><span class="pnl neg">${l[1]}M</span></div>`).join('');
  Q('#view-scenarios').innerHTML=`<div class="pg-head"><div><div class="pg-title">Scenario Studio</div><div class="pg-sub">Shock the book · results from Quant Engine stress API</div></div><button class="btn pri sm" data-action="run-scenario">Run scenario</button></div>
    <div class="grid g-2b">
      <div class="card"><div class="card-h"><h3>Custom scenario</h3><span class="sp"></span></div><div class="card-b">
        <div class="mut" style="font-size:11px;margin-bottom:8px">Presets — click to load</div><div style="margin-bottom:14px">${presetHtml}</div>
        <div class="drw-sl">Active shocks</div>${shockHtml}
        <button class="btn pri" style="margin-top:14px;width:100%" data-action="run-scenario">Run scenario</button></div></div>
      <div class="card"><div class="card-h"><h3>Scenario result</h3><span class="sp"></span><span class="pill crit">2 limits breached</span></div><div class="card-b">
        <div class="kv2" style="margin-bottom:12px">
          <div class="c"><div class="k">Estimated P&L</div><div class="v num neg">−$34.8M</div></div>
          <div class="c"><div class="k">% NAV</div><div class="v num neg">−2.76%</div></div>
          <div class="c"><div class="k">VaR</div><div class="v num">7.4% → 10.9%</div></div>
          <div class="c"><div class="k">Net β</div><div class="v num">0.42 → 0.51</div></div>
        </div>
        <div class="drw-sl">Top loss contributors</div>${loseHtml}
        <div class="drw-sl" style="margin-top:14px">Potential hedges</div>
        <div class="filters"><span class="preset">SMH puts</span><span class="preset">QQQ puts</span><span class="preset">Reduce NVDA</span></div>
      </div></div>
    </div>
    <div class="prov">Stress results are produced by the deterministic Quant Engine stress API against position-level factor betas. AI proposes hedges and explains drivers; it does not compute the stress PnL.</div>`;
}

/* ---- PNL ---- */
function renderPnl(){
  const byName=positions().slice().sort((a,b)=>b[7]-a[7]);
  const max=Math.max(...byName.map(p=>Math.abs(p[7])));
  const bars=byName.map(p=>{const h=Math.abs(p[7])/max*100,pos=p[7]>=0;
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:${pos?'flex-end':'flex-start'};height:100%"><div style="width:72%;${pos?'':'order:2;'}height:${h}%;background:${pos?'var(--pos)':'var(--crit)'};border-radius:${pos?'3px 3px 0 0':'0 0 3px 3px'}"></div><div style="font-size:9px;color:var(--muted);margin-top:4px;${pos?'':'order:1;margin-bottom:4px;margin-top:0'}">${p[0]}</div></div>`;}).join('');
  Q('#view-pnl').innerHTML=`<div class="pg-head"><div><div class="pg-title">P&L Attribution</div><div class="pg-sub">${FUNDS[FUND].name} · reconciled to admin</div></div><div class="filters" aria-label="P&L period"><button class="fchip" data-range="Today">Today</button><button class="fchip on" data-range="MTD">MTD</button><button class="fchip" data-range="QTD">QTD</button><button class="fchip" data-range="YTD">YTD</button></div></div>
    <div class="kstrip"><div class="kcell"><div class="klab">Total MTD</div><div class="kval num pos">+$29.4M</div><div class="ksub pos">+2.33%</div></div>
      ${kcell('Long P&L','+$34.1M','',' pos')}${kcell('Short P&L','−$4.7M','','neg')}${kcell('Factor','+$11.2M','38% of total')}${kcell('Stock-specific','+$18.2M','62% of total')}${kcell('Hit rate','64%','W/L 1.9')}${kcell('vs Bench','+71 bps','net of fees','pos')}</div>
    <div class="card"><div class="card-h"><h3>Attribution by position · MTD</h3><span class="sp"></span><span class="tag">$ P&L</span></div><div class="card-b"><div style="display:flex;align-items:center;height:170px;gap:3px">${bars}</div></div></div>
    <div class="card"><div class="card-h"><h3>P&L reconciliation</h3><span class="sp"></span><span class="pill ok">RECONCILED · 1bp tol</span></div><div class="card-b">
      <div class="kv2" style="margin-bottom:12px"><div class="c"><div class="k">Point P&L</div><div class="v num">$8.43M</div></div><div class="c"><div class="k">Admin P&L</div><div class="v num">$8.42M</div></div><div class="c"><div class="k">Difference</div><div class="v num">$10K</div></div><div class="c"><div class="k">Status</div><div class="v pos" style="font-size:14px">Reconciled</div></div></div>
      <div class="drw-sl">Reconciliation bridge</div>
      ${[['Price effect','+$8.21M'],['FX effect','+$0.08M'],['Trade effect','+$0.19M'],['Corporate actions','$0.00M'],['Fees','−$0.04M'],['Financing','−$0.01M'],['Residual','+$0.01M']].map(r=>`<div class="a-drv"><span>${r[0]}</span><span class="num">${r[1]}</span></div>`).join('')}
    </div></div>`;
}

/* ---- DECISIONS ---- */
function renderDecisions(){
  const djs=DECISIONS.map(d=>{const dc=d.dec==='Approved'?'ok':d.dec==='Dismissed'?'crit':'warn';
    return `<div class="dj"><div class="dj-top"><span class="dj-date">${d.date}</span><span class="dj-rec">${d.rec}</span><span class="sp" style="flex:1"></span><span class="pill ${dc}">${d.dec.toUpperCase()}</span></div>
      <div class="dj-row"><span class="k">Reason</span>${d.reason}</div>
      <div class="dj-row"><span class="k">Decision maker</span>${d.by}</div>
      <div class="dj-row"><span class="k">PM comment</span><i>${d.note}</i></div>
      <div class="dj-out">${d.out.map(o=>`<div class="o"><div class="v num ${o[2]}">${o[1]}</div><div class="l">${o[0]}</div></div>`).join('')}</div></div>`;}).join('');
  Q('#view-decisions').innerHTML=`<div class="pg-head"><div><div class="pg-title">Decision Journal</div><div class="pg-sub">Institutional memory · every Action Card becomes a decision record</div></div></div>
    <div class="kstrip"><div class="kcell"><div class="klab">Accepted hit rate</div><div class="kval num">67%</div><div class="ksub pos">+42 bps avg 5D</div></div>
      ${kcell('Dismissed','18 bps','missed alpha','neg')}${kcell('Risk Agent','82%','effectiveness')}${kcell('Technical','61%','effectiveness')}${kcell('Flows','74%','effectiveness')}${kcell('Macro','69%','effectiveness')}${kcell('Open','4','awaiting decision','warnc')}</div>
    <div class="two"><div><div class="drw-sl" style="margin-bottom:10px">Open queue</div>${CARDS.filter(c=>c.sev!=='opp'&&isOpen(c)).map(acardMarkup).join('')||'<div class="al-empty"><div class="al-empty-ic">✓</div><b>Queue clear</b></div>'}</div>
      <div><div class="drw-sl" style="margin-bottom:10px">Decision history & outcomes</div>${djs}</div></div>`;
}

/* ---- ALERTS ---- */
let alFilter='all', alSev='all', alQuery='';
const alCollapsed={};
const AL_GROUPS=[['crit','Critical','var(--crit)','crit'],['warn','Warnings','var(--warn)','warn'],['opp','Opportunities','var(--accent)','info']];
function alMatches(c,f){
  const st=AL[c.id];
  if(f==='resolved')return st.status!=='open';
  if(st.status!=='open')return false;
  if(f==='unread')return !st.read;
  if(f==='mine')return st.owner==='You';
  return true;
}
function alCounts(){
  const n=f=>CARDS.filter(c=>alMatches(c,f)).length;
  return {all:n('all'),unread:n('unread'),mine:n('mine'),resolved:n('resolved'),
    crit:CARDS.filter(c=>c.sev==='crit'&&isOpen(c)).length,warn:CARDS.filter(c=>c.sev==='warn'&&isOpen(c)).length,opp:CARDS.filter(c=>c.sev==='opp'&&isOpen(c)).length};
}
function renderAlerts(){
  const n=alCounts();
  const stat=(k,l,col)=>`<button class="al-stat${alSev===k?' on':''}" data-al-sev="${k}" aria-pressed="${alSev===k}" title="${alSev===k?'Show all severities':'Show '+l.toLowerCase()+' only'}"><span class="n num">${n[k]}</span><span class="l"><i style="background:${col}"></i>${l}</span></button>`;
  const seg=(k,l)=>`<button class="${alFilter===k?'on':''}" data-al-filter="${k}" aria-pressed="${alFilter===k}">${l}<span class="c num">${n[k]}</span></button>`;
  Q('#view-alerts').innerHTML=`
    <div class="pg-head"><div><div class="pg-eyebrow">${ICO.cmd}<span>Unified inbox</span></div><div class="pg-title">Alert center</div><div class="pg-sub">One unified inbox · duplicates grouped by the Conductor</div></div>
      <div class="pg-acts"><button class="btn gh sm" data-goto="ask">${ICO.book}Ask the book</button><button class="btn gh sm" data-goto="scenarios">Scenario studio</button><button class="btn pri sm" data-al-readall ${n.unread?'':'disabled'}>${ICO.check}Mark all read</button></div></div>
    <div class="al-hero">
      <div class="al-hero-t"><div class="eb">Today · Oct 07, 2026</div><h2>Signal triage</h2><p>${n.crit+n.warn?`${n.crit+n.warn} item${n.crit+n.warn>1?'s':''} need a decision — prioritized by portfolio impact.`:'Nothing needs a decision right now.'}</p></div>
      <div class="al-stats">${stat('crit','Critical','#f97066')}${stat('warn','Warnings','#fdb022')}${stat('opp','Opportunities','#84a9ff')}
        <div class="al-stat static"><span class="n num">09:41</span><span class="l"><i style="background:#32d583"></i>Last sync</span></div></div>
    </div>
    <div class="card al-bar">
      <div class="al-note"><b>Conductor grouping is on.</b> 3 related semiconductor signals merged into <a data-card="AC-7731">#AC-7731</a> · ranked by $ at risk.</div>
      <label class="al-search"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input id="al-q" placeholder="Search alerts, tickers, IDs…" value="${alQuery.replace(/"/g,'&quot;')}" aria-label="Search alerts"/></label>
      <div class="seg" role="group" aria-label="Filter alerts">${seg('all','All')}${seg('unread','Unread')}${seg('mine','Assigned to me')}${seg('resolved','Resolved')}</div>
    </div>
    <div id="al-list"></div>`;
  renderAlertList();
}
function renderAlertList(){
  const q=alQuery.trim().toLowerCase();
  const match=c=>alMatches(c,alFilter)&&(alSev==='all'||c.sev===alSev)&&(!q||[c.title,c.agent,c.id,c.rec,...c.drivers].join(' ').toLowerCase().includes(q));
  const html=AL_GROUPS.map(([k,label,col,pc])=>{
    const items=CARDS.filter(c=>c.sev===k&&match(c)); if(!items.length)return '';
    const shut=!!alCollapsed[k];
    return `<section class="card al-sec${shut?' shut':''}">
      <button class="al-sec-h" data-al-toggle="${k}" aria-expanded="${!shut}"><span class="al-dot" style="background:${col}"></span><h3>${label}</h3><span class="pill ${pc}">${items.length}</span><span class="sp"></span><span class="al-hint">${shut?'Show':'Hide'}</span><svg class="al-chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button>
      ${shut?'':`<div class="al-grid">${items.map(acardMarkup).join('')}</div>`}</section>`;}).join('');
  const filtered=alFilter!=='all'||alSev!=='all'||q;
  const empty=alFilter==='resolved'&&alSev==='all'&&!q
    ? `<div class="card al-empty"><div class="al-empty-ic">↺</div><b>Nothing resolved yet</b><div class="mut">Approved and dismissed alerts land here, with an option to reopen.</div><button class="btn gh sm" data-al-filter="all">Back to open alerts</button></div>`
    : alFilter==='all'&&alSev==='all'&&!q
    ? `<div class="card al-empty"><div class="al-empty-ic">✓</div><b>Inbox zero</b><div class="mut">Every alert has been approved or dismissed. Resolved items stay under <a data-al-filter="resolved">Resolved</a>.</div></div>`
    : `<div class="card al-empty"><div class="al-empty-ic">∅</div><b>No alerts match</b><div class="mut">Try a different filter or search term.</div><button class="btn gh sm" data-al-clear>Clear filters</button></div>`;
  Q('#al-list').innerHTML=(filtered&&html?`<div class="al-active">Showing <b>${[alSev!=='all'?AL_GROUPS.find(g=>g[0]===alSev)[1].toLowerCase():'',{all:'open',unread:'unread',mine:'assigned to you',resolved:'resolved'}[alFilter]].filter(Boolean).join(' · ')}</b>${q?` matching “${q.replace(/</g,'&lt;')}”`:''}<button class="lnk" data-al-clear>Clear</button></div>`:'')+(html||empty);
}
function syncAlertBadges(){
  const u=alCounts().unread, b=Q('#nav a[data-v="alerts"] .cnt');
  if(b){b.textContent=u;b.style.display=u?'':'none';}
  const d=Q('.icon-btn[data-goto="alerts"] .dot'); if(d)d.style.display=u?'':'none';
}
function refreshAlerts(){renderAlerts();renderCommand();renderDecisions();syncAlertBadges();}
let toastT;
function toast(msg,undo){
  let t=Q('#toast'); if(!t){t=document.createElement('div');t.id='toast';t.className='toast';t.setAttribute('role','status');document.body.appendChild(t);}
  t.innerHTML=`<span>${msg}</span>${undo?'<button>Undo</button>':''}`;
  if(undo)t.querySelector('button').onclick=()=>{undo();t.classList.remove('on');};
  t.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('on'),5000);
}
function alertAct(id,act){
  const s=AL[id]; if(!s)return;
  const prev={...s};
  if(act==='undo'){s.status='open';toast(`#${id} restored to inbox`);}
  else{s.status=act==='approve'?'approved':'dismissed'; s.read=true;
    toast(act==='approve'?`Approved #${id} · decision logged to Journal`:`Dismissed #${id}`,()=>{Object.assign(s,prev);refreshAlerts();});}
  closeDrw(); refreshAlerts();
}
function markAllRead(){
  const prev={}; CARDS.forEach(c=>{prev[c.id]=AL[c.id].read; AL[c.id].read=true;});
  refreshAlerts(); toast('All alerts marked as read',()=>{CARDS.forEach(c=>AL[c.id].read=prev[c.id]);refreshAlerts();});
}

/* ---- ASK ---- */
function renderAsk(){
  Q('#view-ask').innerHTML='<div class="pg-head"><div><div class="pg-title">Ask Portfolio Intelligence</div><div class="pg-sub">Discuss the selected fund using the data available in this demo.</div></div></div><div class="card"><div class="card-b"><p>Ask about holdings, performance, or the next suggested portfolio action. Answers use the selected fund’s website data.</p><p>Detailed positions are available for Alpha only. Ask Portfolio Intelligence will explain missing data for the other institutional funds.</p><div class="ask-bar"><input id="ask-in" placeholder="Ask about risk, exposure or a holding…"/><button class="btn pri" id="ask-send">Open chat</button></div></div></div>';
}

/* ---- REPORTS ---- */
function renderReports(){
  const reps=[['Monthly Tear Sheet','Sep 2026','Published','ok'],['Investor Letter','Oct 2026','AI Draft','neu'],['Risk Transparency Report','Q3 2026','Pending Approval','warn'],['DDQ · Castle Peak','On-demand','Approved','ok'],['Performance Attribution','Sep 2026','Published','ok'],['Exposure Report','Weekly','AI Draft','neu']];
  const rows=reps.map(r=>`<tr><td class="l" style="font-weight:600">${r[0]}</td><td class="l co">${r[1]}</td><td><span class="pill ${r[3]}">${r[2]}</span></td><td class="l"><button class="btn gh sm" data-action="report-open" data-report="${r[0]}">Open</button> <button class="btn gh sm" data-action="report-export" data-report="${r[0]}">Export PDF</button></td></tr>`).join('');
  Q('#view-reports').innerHTML=`<div class="pg-head"><div><div class="pg-title">Reporting Center</div><div class="pg-sub">AI Draft → Reviewer → Compliance → Approved → Export · every number carries source provenance</div></div><button class="btn pri sm" data-action="new-report">New report</button></div>
    <div class="card"><div class="card-h"><h3>Reports</h3><span class="sp"></span><span class="tag">approval workflow</span></div><div class="card-b flush"><div class="tbl-wrap"><table class="t"><thead><tr><th class="l">Report</th><th class="l">Period</th><th>Status</th><th class="l">Actions</th></tr></thead><tbody>${rows}</tbody></table></div></div></div>`;
}

/* ---- AUDIT ---- */
function renderAudit(){
  const ev=[['09:41:02','admin','Risk Agent','v2.3','Quant v2.4','AC-7731 composed','—'],['09:38:44','conductor','Conductor','v1.8','—','Grouped 3 semis signals','—'],['09:12:10','admin','—','—','—','AC-7725 dismissed','Admin'],['08:55:31','macro','Macro Agent','v2.0','Quant v2.4','AC-7728 composed','—'],['Oct 01','admin','—','—','—','AC-7701 (NVDA trim) dismissed','Admin']];
  const rows=ev.map(e=>`<tr><td class="l mono">${e[0]}</td><td class="l">${e[1]}</td><td class="l">${e[2]}</td><td class="l co">${e[3]}</td><td class="l co">${e[4]}</td><td class="l">${e[5]}</td><td class="l">${e[6]}</td></tr>`).join('');
  Q('#view-audit').innerHTML=`<div class="pg-head"><div><div class="pg-title">Audit Trail</div><div class="pg-sub">Complete lineage · agent, version, quant version, inputs, decision, approver</div></div><div class="filters"><button class="btn gh sm" data-action="export-audit" data-export-format="csv">Export CSV</button><button class="btn gh sm" data-action="export-audit" data-export-format="json">Export JSON</button></div></div>
    <div class="card"><div class="card-h"><h3>Event log</h3><span class="sp"></span><input class="srch" placeholder="Filter…"/></div><div class="card-b flush"><div class="tbl-wrap"><table class="t"><thead><tr><th class="l">Time</th><th class="l">User</th><th class="l">Agent</th><th class="l">Agent v.</th><th class="l">Quant v.</th><th class="l">Event</th><th class="l">Approver</th></tr></thead><tbody>${rows}</tbody></table></div></div></div>`;
}

/* ======================= DRAWER ======================= */
const ov=Q('#ov'),drw=Q('#drw'),drwInner=Q('#drw-inner');
function openDrw(html){drwInner.innerHTML=html;ov.classList.add('on');drw.classList.add('on');document.body.style.overflow='hidden';
  const x=Q('#drw-x'); if(x)x.onclick=closeDrw;
  QA('#drw [data-approve]').forEach(b=>b.onclick=function(){this.textContent='Approved ✓';this.style.background='var(--pos)';setTimeout(closeDrw,500);});
  QA('#drw .tab').forEach(t=>t.onclick=()=>{QA('#drw .tab').forEach(x=>x.classList.remove('on'));t.classList.add('on');
    QA('#drw [data-tabc]').forEach(c=>c.style.display=c.dataset.tabc===t.dataset.tab?'':'none');});
}
function closeDrw(){ov.classList.remove('on');drw.classList.remove('on');document.body.style.overflow='';}
ov.onclick=closeDrw;
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDrw();Q('#fundsel')?.classList.remove('open');Q('#profile')?.classList.remove('open');setMobileNav(false);}
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('.acard[data-card]')){e.preventDefault();openCard(e.target.dataset.card);}});
document.addEventListener('input',e=>{if(e.target.id==='al-q'){alQuery=e.target.value;renderAlertList();}});

function openCard(id){
  const c=CARDS.find(x=>x.id===id); if(!c)return;
  const st=AL[c.id]; if(!st.read){st.read=true;refreshAlerts();}
  const sevl={crit:'CRITICAL',warn:'WARNING',opp:'OPPORTUNITY'};
  openDrw(`<div class="drw-h"><div class="drw-top"><span class="pill ${c.sev==='opp'?'info':c.sev}">${sevl[c.sev]}</span><span class="tag">${c.agent} · ${c.ts} · #${c.id}</span><button class="drw-x" id="drw-x">✕</button></div><div class="drw-ttl">${c.title}</div></div>
    <div class="drw-b">
      <div class="drw-sec"><div class="drw-sl">Key numbers</div><div class="kv2">${c.m.map(x=>`<div class="c"><div class="k">${x[1]}</div><div class="v num">${x[0]}</div></div>`).join('')}</div></div>
      <div class="drw-sec"><div class="drw-sl">Drivers</div>${c.drivers.map(d=>`<div class="a-drv"><span>${d}</span></div>`).join('')}</div>
      <div class="drw-sec"><div class="drw-sl">Recommended action</div><div class="prov" style="color:var(--ink-2)">${c.rec}</div></div>
      <div class="drw-sec"><div class="drw-sl">Evidence & provenance</div>${c.evidence.map(e=>`<div class="evi"><span class="src">${e[0]}</span><span>${e[1]}</span></div>`).join('')}</div>
      <div class="drw-sec"><div class="prov">Confidence <b>${c.conf}</b> · freshness <b>${c.fresh}</b>. Quantitative values from the Quant Engine; the agent ranks, explains and recommends. Approving creates a decision record in the Journal.</div></div>
      <div style="display:flex;gap:8px;align-items:center">${st.status==='open'
        ?`<button class="btn pri" data-act="approve" data-id="${c.id}">Approve</button><button class="btn gh" data-goto="scenarios">Modify in what-if</button><button class="btn gh" data-act="dismiss" data-id="${c.id}">Dismiss</button>`
        :`<span class="pill ${st.status==='approved'?'ok':'neu'}">${st.status==='approved'?'✓ Approved':'Dismissed'}</span><button class="btn gh" data-act="undo" data-id="${c.id}">Reopen</button>`}<span class="mut" style="margin-left:auto;font-size:11px">Owner · ${st.owner}</span></div>
    </div>`);
}

function openPos(tk){
  const p=positions().find(x=>x[0]===tk); if(!p){return;}
  const hc=p[17]==='GOOD'?'ok':p[17]==='TRIM'?'crit':'warn';
  openDrw(`<div class="drw-h"><div class="drw-top"><span class="fs-ic" style="background:var(--ink)">${p[0].slice(0,2)}</span><div><div class="drw-ttl" style="font-size:18px">${p[0]}</div><div class="mut" style="font-size:12px">${p[1]} · ${p[12]}</div></div><button class="drw-x" id="drw-x">✕</button></div>
    <div class="tabs"><span class="tab on" data-tab="ov">Overview</span><span class="tab" data-tab="risk">Risk</span><span class="tab" data-tab="intel">Intelligence</span><span class="tab" data-tab="thesis">Thesis</span></div></div>
    <div class="drw-b">
      <div data-tabc="ov"><div class="kv2" style="margin-bottom:16px">
        <div class="c"><div class="k">Market value</div><div class="v num">$${Math.abs(p[4]).toFixed(1)}M</div></div>
        <div class="c"><div class="k">% NAV</div><div class="v num">${p[5]}%</div></div>
        <div class="c"><div class="k">Day P&L</div><div class="v num ${cls(p[6])}">${sgn(p[6])}M</div></div>
        <div class="c"><div class="k">YTD P&L</div><div class="v num ${cls(p[8])}">${sgn(p[8])}M</div></div>
        <div class="c"><div class="k">VaR contribution</div><div class="v num">${p[9]}%</div></div>
        <div class="c"><div class="k">Risk budget used</div><div class="v num ${p[11]>=90?'neg':''}">${p[11]}%</div></div>
        <div class="c"><div class="k">Beta</div><div class="v num">${p[18]}</div></div>
        <div class="c"><div class="k">Crowding</div><div class="v" style="font-size:13px">${p[14]}</div></div></div>
        <div class="drw-sl">Point view</div>
        <div class="prov" style="color:var(--ink-2);margin-bottom:12px"><b>Conductor conclusion:</b> ${p[17]==='TRIM'?'Trim — high risk budget for low/negative return.':p[17]==='WATCH'?'Hold / do not add — upside momentum intact but concentration and macro beta make incremental exposure unattractive.':'Core holding — thesis intact, efficient risk.'}</div>
        <div class="drw-sl">Contributing agents</div>
        ${[['Risk',p[17]==='TRIM'?'NEGATIVE':'NEUTRAL'],['Technical',p[6]>=0?'POSITIVE':'NEGATIVE'],['Flows',p[14]==='High'?'CROWDED':'POSITIVE'],['Macro','NEGATIVE'],['Earnings',p[16]==='—'?'NEUTRAL':'WATCH']].map(a=>`<div class="a-drv"><span>${a[0]} Agent</span><span class="pill ${a[1]==='POSITIVE'?'ok':a[1]==='NEGATIVE'||a[1]==='CROWDED'?'crit':'neu'}" style="font-size:9.5px">${a[1]}</span></div>`).join('')}
      </div>
      <div data-tabc="risk" style="display:none"><div class="kv2" style="margin-bottom:12px"><div class="c"><div class="k">VaR contribution</div><div class="v num">${p[9]}%</div></div><div class="c"><div class="k">Risk budget</div><div class="v num">${p[10]}%</div></div><div class="c"><div class="k">Used</div><div class="v num ${p[11]>=90?'neg':''}">${p[11]}%</div></div><div class="c"><div class="k">Return contribution</div><div class="v num ${cls(p[19])}">${sgn(p[19],'%')}</div></div><div class="c"><div class="k">Liquidity</div><div class="v num">${p[15]} days</div></div><div class="c"><div class="k">Factor</div><div class="v" style="font-size:13px">${p[13]}</div></div></div>
        <div class="prov">Efficiency: ${p[19]>=8?'<b style="color:var(--pos)">GOOD</b> — strong return per unit of risk.':p[19]>=0?'<b style="color:var(--warn)">FAIR</b>.':'<b style="color:var(--crit)">POOR</b> — high risk for negative return, trim candidate.'}</div></div>
      <div data-tabc="intel" style="display:none"><div class="drw-sl">Recent filings & news</div>
        <div class="evi"><span class="src">8-K</span><span>Material agreement filed · 1d ago</span></div>
        <div class="evi"><span class="src">Form 4</span><span>Insider activity · aggregated</span></div>
        <div class="evi"><span class="src">Analyst</span><span>Estimate revisions trending ${p[6]>=0?'up':'down'}</span></div>
        <div class="drw-sl" style="margin-top:14px">Sentiment</div><div class="kv2"><div class="c"><div class="k">Current</div><div class="v num">67 / 100</div></div><div class="c"><div class="k">30D change</div><div class="v num pos">+14</div></div></div>
        <div class="drw-sl" style="margin-top:14px">Catalyst</div><div class="prov">${p[16]==='—'?'No scheduled catalyst in the next 30 days.':p[16]}</div></div>
      <div data-tabc="thesis" style="display:none">
        <div class="drw-sl">Thesis alignment</div>
        <div class="kv2" style="margin-bottom:12px"><div class="c"><div class="k">Current</div><div class="v num ${p[17]==='TRIM'?'neg':''}">${p[17]==='TRIM'?'61%':'82%'}</div></div><div class="c"><div class="k">Previous</div><div class="v num">86%</div></div></div>
        ${p[17]==='TRIM'?`<div class="drw-sl">New evidence contradicting thesis</div><div class="prov" style="color:var(--ink-2)">1. Gross-margin guidance weakened.<br/>2. Capex growth exceeded original assumption.<br/>3. Competitor pricing pressure increased.</div>`:`<div class="prov">Thesis intact. Recorded assumptions remain consistent with latest evidence.</div>`}
        <div style="margin-top:14px;display:flex;gap:8px"><button class="btn pri" data-goto="scenarios">Run what-if</button><button class="btn gh" data-approve>Log decision</button></div></div>
    </div>`);
}

/* ======================= FUND SWITCHER + ROUTING ======================= */
function renderFundMenu(){
  const menu=Q('#fundsel-menu');
  menu.innerHTML=`<div class="nav-lab" style="padding:6px 8px 4px">Switch fund · 4</div>`+Object.entries(FUNDS).map(([id,f])=>`<div class="fund-opt ${id===FUND?'on':''}" data-fund="${id}"><span class="fs-ic" style="background:${f.col}">${f.ic}</span><div><div class="fs-name">${f.name}</div><div class="fs-sub">${f.sub}</div></div><span class="fo-aum num">${f.aum}</span></div>`).join('');
  menu.querySelectorAll('.fund-opt').forEach(o=>o.onclick=()=>{selectFund(o.dataset.fund);Q('#fundsel').classList.remove('open');});
}
function selectFund(id){
  FUND=id; const f=FUNDS[id];
  Q('#fs-ic').textContent=f.ic; Q('#fs-ic').style.background=f.col;
  Q('#fs-name').textContent=f.name; Q('#fs-sub').textContent=f.sub;
  try{localStorage.setItem('point-inst-fund',id);}catch(e){}
  renderAll(); renderFundMenu();
  document.dispatchEvent(new Event('point:context'));
}
const RENDER={command:renderCommand,portfolio:renderPortfolio,risk:renderRisk,guidelines:renderGuidelines,
  opportunities:renderOpps,scenarios:renderScenarios,pnl:renderPnl,decisions:renderDecisions,
  alerts:renderAlerts,ask:renderAsk,reports:renderReports,audit:renderAudit};
function renderAll(){Object.values(RENDER).forEach(fn=>fn());}

let VIEW='command';
const VIEW_LABELS={command:'Command center',portfolio:'Portfolio',risk:'Risk monitor',guidelines:'Guidelines',
  opportunities:'Opportunities',scenarios:'Scenario studio',pnl:'P&L attribution',decisions:'Decisions',
  alerts:'Alert center',ask:'Ask Point',reports:'Reports',audit:'Audit trail'};
const TONE={command:'ws',decisions:'ws',alerts:'ws',portfolio:'pf',risk:'pf',guidelines:'pf',opportunities:'pf',scenarios:'mk',pnl:'mk',ask:'dp',reports:'dp',audit:'dp'};
function go(v){
  if(!RENDER[v])return;
  VIEW=v;
  QA('.view').forEach(s=>s.classList.toggle('on',s.id==='view-'+v));
  QA('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.v===v));
  document.body.dataset.tone=TONE[v]||'ws';
  const crumb=Q('#crumb-view'); if(crumb)crumb.textContent=VIEW_LABELS[v]||'Workspace';
  const mobile=Q('#mobile-nav'); if(mobile){mobile.classList.remove('open');mobile.setAttribute('aria-hidden','true');}
  const mobileBtn=Q('#mobile-nav-btn'); if(mobileBtn)mobileBtn.setAttribute('aria-expanded','false');
  const profile=Q('#profile'); if(profile)profile.classList.remove('open');
  const profileBtn=Q('#profile-btn'); if(profileBtn)profileBtn.setAttribute('aria-expanded','false');
  if(window.location.hash!==`#${v}`)window.history.replaceState(null,'',`#${v}`);
  window.scrollTo(0,0);
}

function setMobileNav(open){
  const nav=Q('#mobile-nav'),btn=Q('#mobile-nav-btn'); if(!nav)return;
  nav.classList.toggle('open',open);nav.setAttribute('aria-hidden',String(!open));
  if(btn)btn.setAttribute('aria-expanded',String(open));
}
function renderMobileNav(){
  const items=Q('#mobile-nav-items'),source=Q('#nav'); if(!items||!source)return;
  items.innerHTML=source.innerHTML+'<div class="side-foot">'+Q('.side-foot').innerHTML+'</div>';
  items.querySelectorAll('[data-v]').forEach(link=>link.addEventListener('click',()=>go(link.dataset.v)));
}
function downloadDemoFile(filename,content,type='text/plain;charset=utf-8'){
  const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function runAction(action,control){
  const report=control?.dataset.report||'Point report';
  if(action==='run-scenario'){
    go('scenarios');
    const result=Q('#view-scenarios .card:nth-of-type(2)'); if(result){result.style.outline='2px solid var(--accent)';setTimeout(()=>result.style.outline='',700);}
    toast('Scenario refreshed with the active shock set.');return;
  }
  if(action==='export-brief'){downloadDemoFile(`${FUNDS[FUND].name.replace(/[^a-z0-9]+/gi,'-')}-morning-brief.txt`,Q('#view-command').innerText);toast('Morning brief downloaded.');return;}
  if(action==='propose-rule'){openDrw('<div class="drw-h"><div class="drw-top"><span class="tag">Governance workflow</span><button class="drw-x" id="drw-x">✕</button></div><div class="drw-ttl">Propose a guideline</div></div><div class="drw-b"><p class="prov" style="color:var(--ink-2)">Describe a measurable guardrail. In this demo, proposals are routed to Compliance and do not change active limits.</p><div class="ask-bar"><input id="rule-proposal" placeholder="e.g. Single-name exposure below 8%"/><button class="btn pri" data-action="submit-rule">Send for review</button></div></div>');return;}
  if(action==='submit-rule'){const input=Q('#rule-proposal');if(input?.value.trim()){closeDrw();toast('Guideline proposal sent to Compliance for review.');}else toast('Add a guideline before sending it for review.');return;}
  if(action==='open-fund-menu'){Q('#profile')?.classList.remove('open');Q('#fundsel-btn')?.click();return;}
  if(action==='toggle-profile-theme'){setTheme(document.body.dataset.theme==='light'?'dark':'light');return;}
  if(action==='demo-signout'){toast('Demo mode keeps this workspace signed in.');return;}
  if(action==='new-report'){openDrw('<div class="drw-h"><div class="drw-top"><span class="tag">Reporting center</span><button class="drw-x" id="drw-x">✕</button></div><div class="drw-ttl">New report</div></div><div class="drw-b"><p class="prov" style="color:var(--ink-2)">Choose a report from the approved template library. The new draft will use the selected fund context.</p><button class="btn pri" data-action="create-report">Create investor update</button></div>');return;}
  if(action==='create-report'){closeDrw();toast('Investor update draft created for review.');return;}
  if(action==='report-open'){openDrw(`<div class="drw-h"><div class="drw-top"><span class="tag">Report preview</span><button class="drw-x" id="drw-x">✕</button></div><div class="drw-ttl">${report}</div></div><div class="drw-b"><p class="prov" style="color:var(--ink-2)">Preview is scoped to ${FUNDS[FUND].name}. Values remain illustrative demo data until a reviewer approves the report.</p><button class="btn pri" data-action="report-export" data-report="${report}">Export PDF</button></div>`);return;}
  if(action==='report-export'){downloadDemoFile(`${report.replace(/[^a-z0-9]+/gi,'-')}.txt`,`${report}\n\nPoint demo export for ${FUNDS[FUND].name}.`);toast(`${report} downloaded.`);return;}
  if(action==='export-audit'){const format=control?.dataset.exportFormat||'csv';const rows='time,user,event\n09:41,admin,AC-7731 composed\n09:38,conductor,Signals grouped';downloadDemoFile(`point-audit.${format}`,format==='json'?JSON.stringify([{time:'09:41',user:'admin',event:'AC-7731 composed'}],null,2):rows,format==='json'?'application/json':'text/csv');toast(`Audit ${format.toUpperCase()} downloaded.`);}
}

/* ======================= WIRE ======================= */
renderFundMenu();
try{const sf=localStorage.getItem('point-inst-fund'); if(sf&&FUNDS[sf])FUND=sf; const f=FUNDS[FUND]; Q('#fs-ic').textContent=f.ic;Q('#fs-ic').style.background=f.col;Q('#fs-name').textContent=f.name;Q('#fs-sub').textContent=f.sub;}catch(e){}
renderAll(); syncAlertBadges();
renderMobileNav();
try{setTheme(localStorage.getItem('point-inst-theme')||'light');}catch(e){setTheme('light');}
Q('#theme-btn')?.addEventListener('click',()=>setTheme(document.body.dataset.theme==='light'?'dark':'light'));

Q('#fundsel-btn').onclick=e=>{e.stopPropagation();Q('#fundsel').classList.toggle('open');};
document.addEventListener('click',()=>{Q('#fundsel').classList.remove('open');Q('#profile')?.classList.remove('open');Q('#profile-btn')?.setAttribute('aria-expanded','false');});
Q('#fundsel-menu').onclick=e=>e.stopPropagation();

Q('#profile-btn')?.addEventListener('click',e=>{e.stopPropagation();Q('#fundsel').classList.remove('open');const profile=Q('#profile');const open=!profile.classList.contains('open');profile.classList.toggle('open',open);e.currentTarget.setAttribute('aria-expanded',String(open));});
Q('#profile-menu')?.addEventListener('click',e=>e.stopPropagation());
Q('#mobile-nav-btn')?.addEventListener('click',()=>setMobileNav(!Q('#mobile-nav').classList.contains('open')));
Q('#mobile-nav')?.addEventListener('click',e=>{if(e.target.closest('[data-mobile-close]'))setMobileNav(false);});

QA('#nav a').forEach(a=>a.onclick=()=>go(a.dataset.v));
const initialView=window.location.hash.slice(1);if(RENDER[initialView])go(initialView);
window.addEventListener('hashchange',()=>{const view=window.location.hash.slice(1);if(RENDER[view]&&view!==VIEW)go(view);});

/* delegated clicks */
document.addEventListener('click',e=>{
  const viewLink=e.target.closest('[data-v]'); if(viewLink){e.preventDefault();go(viewLink.dataset.v);return;}
  const action=e.target.closest('[data-action]'); if(action){runAction(action.dataset.action,action);return;}
  const act=e.target.closest('[data-act]'); if(act){alertAct(act.dataset.id,act.dataset.act);return;}
  const nav=e.target.closest('[data-goto]'); if(nav){closeDrw();go(nav.dataset.goto);return;}
  const af=e.target.closest('[data-al-filter]'); if(af){alFilter=af.dataset.alFilter;renderAlerts();return;}
  const as=e.target.closest('[data-al-sev]'); if(as){alSev=alSev===as.dataset.alSev?'all':as.dataset.alSev;renderAlerts();return;}
  const at=e.target.closest('[data-al-toggle]'); if(at){const k=at.dataset.alToggle;alCollapsed[k]=!alCollapsed[k];renderAlertList();return;}
  if(e.target.closest('[data-al-clear]')){alFilter='all';alSev='all';alQuery='';renderAlerts();return;}
  if(e.target.closest('[data-al-readall]')){markAllRead();return;}
  const card=e.target.closest('[data-card]'); if(card&&!e.target.closest('[data-approve]')&&!e.target.closest('[data-goto]')){openCard(card.dataset.card);return;}
  const pos=e.target.closest('[data-pos]'); if(pos){openPos(pos.dataset.pos);return;}
  const pf=e.target.closest('[data-pf]'); if(pf){posFilter=pf.dataset.pf;renderPortfolio();return;}
  const range=e.target.closest('[data-range]'); if(range){const filters=range.closest('.filters');filters?.querySelectorAll('[data-range]').forEach(b=>b.classList.toggle('on',b===range));toast(`Showing ${range.dataset.range} data.`);return;}
  const preset=e.target.closest('[data-preset]'); if(preset){QA('[data-preset]').forEach(p=>p.classList.toggle('on',p===preset));toast(`${preset.dataset.preset} loaded into the scenario.`);return;}
  const th=e.target.closest('th[data-sort]'); if(th){const k=+th.dataset.sort; posSort.dir=(posSort.k===k?-posSort.dir:-1);posSort.k=k;renderPortfolio();return;}
  const hc=e.target.closest('[data-hc]'); if(hc){const c=health()[+hc.dataset.hc];openDrw(`<div class="drw-h"><div class="drw-top"><span class="tag">Health component</span><button class="drw-x" id="drw-x">✕</button></div><div class="drw-ttl">${c[0]} · ${c[1]}/100</div></div><div class="drw-b"><div class="prov" style="color:var(--ink-2);font-size:13px">${c[3]}</div><div class="kv2" style="margin-top:14px"><div class="c"><div class="k">Current</div><div class="v num">${c[1]}</div></div><div class="c"><div class="k">Yesterday</div><div class="v num">${c[1]-c[2]}</div></div><div class="c"><div class="k">Change</div><div class="v num ${cls(c[2])}">${sgn(c[2])}</div></div><div class="c"><div class="k">Benchmark</div><div class="v num">${c[4]}</div></div></div></div>`);return;}
  const lim=e.target.closest('[data-limit]'); if(lim){openLimit(lim.dataset.limit);return;}
  const sg=e.target.closest('[data-ask]'); if(sg){askQ(sg.dataset.ask);return;}
});
function openLimit(name){
  const r=LIMITS.find(x=>x[0]===name); if(!r)return;
  openDrw(`<div class="drw-h"><div class="drw-top"><span class="pill ${r[9]==='WARN'?'warn':'ok'}">${r[9]}</span><span class="tag">${r[1]}</span><button class="drw-x" id="drw-x">✕</button></div><div class="drw-ttl">${r[0]}</div></div>
    <div class="drw-b"><div class="kv2" style="margin-bottom:16px"><div class="c"><div class="k">Current</div><div class="v num">${r[2]}</div></div><div class="c"><div class="k">Warning</div><div class="v num">${r[3]}</div></div><div class="c"><div class="k">Limit</div><div class="v num">${r[4]}</div></div><div class="c"><div class="k">Headroom</div><div class="v num">${r[5]}</div></div></div>
    <div class="drw-sl">Breach forecast</div><div class="kv2" style="margin-bottom:16px"><div class="c"><div class="k">1 day</div><div class="v num ${parseFloat(r[6])>40?'neg':''}">${r[6]}</div></div><div class="c"><div class="k">3 day</div><div class="v num">${r[7]}</div></div><div class="c"><div class="k">5 day</div><div class="v num">${r[8]}</div></div><div class="c"><div class="k">Trend</div><div class="v" style="font-size:13px">${r[9]==='WARN'?'Deteriorating':'Stable'}</div></div></div>
    <div class="drw-sl">Source clause</div><div class="prov" style="color:var(--ink-2)"><b>Document:</b> ${r[1].includes('IMA')?'Investment Management Agreement':'Risk Policy'}<br/><b>Section:</b> ${r[1].split('§')[1]||'—'}<br/><b>Machine rule:</b> <span class="mono">metric ${r[0].toLowerCase().replace(/[^a-z]/g,'_')} ≤ ${r[4]}</span><br/><b>Approved by:</b> Jane Smith (Compliance)<br/><b>Version:</b> 3 · Sep 21, 2026</div>
    <div style="margin-top:14px;display:flex;gap:8px"><button class="btn pri" data-goto="scenarios">Run what-if</button><button class="btn gh" data-goto="portfolio">View positions</button></div></div>`);
}
function askQ(q){ pointChat.open(q); }
Q('#view-ask').addEventListener?.('click',()=>{}); // noop guard
document.addEventListener('click',e=>{
  if(e.target.id==='ask-send'){const inp=Q('#ask-in');if(inp&&inp.value.trim()){askQ(inp.value.trim());inp.value='';}}
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='ask-in'&&e.target.value.trim()){askQ(e.target.value.trim());e.target.value='';}});
Q('#ask-mini-in')?.addEventListener('keydown',e=>{if(e.key==='Enter'){const q=e.target.value.trim();e.target.value='';pointChat.open(q||undefined);}});
Q('#ask-mini')?.addEventListener('click',()=>pointChat.open());

/* role picker */
const ROLES=[['PM · Alpha Fund','command'],['Head of Risk','risk'],['CIO','portfolio'],['Compliance','guidelines'],['Investor Relations','reports']];
let roleI=0;
Q('#role-pick').onclick=()=>{roleI=(roleI+1)%ROLES.length;Q('#rp-role').textContent=ROLES[roleI][0];go(ROLES[roleI][1]);};
function terminalSnapshot(id){
  const full=id==='alpha';
  return PointChatCore.clean({surface:'terminal',fundId:id,fundName:FUNDS[id].name,
    scope:'Illustrative static terminal dataset using the same fund roster as the platform app. Only Alpha has detailed positions. Other terminal screens reuse Alpha placeholders; never attribute those to another fund. Conflicting demo figures must be reported, not reconciled by guessing. Relative dates are historical sample labels.',
    sections:{
      Overview:{fund:FUNDS[id],coverage:full?'Alpha detailed sample is available.':'Only headline fund figures are available. Holdings, risk limits, attribution and scenarios are missing for this fund.'},
      ...(full?{
        Positions:{columns:['ticker','company','side','quantity','marketValueUSDmillions','NAVpercent','dayPnLUSDmillions','MTDPnLUSDmillions','YTDPnLUSDmillions','VaRContributionPercent','riskBudgetPercent','riskUsedPercent','sector','factor','crowding','liquidationDays','catalyst','health','beta','returnPercent'],rows:APEX},
        Risk:{health:HEALTH.alpha,changes:CHANGED.alpha,limits:{columns:['rule','source','current','warning','limit','headroom','oneDayBreachProbability','threeDayBreachProbability','fiveDayBreachProbability','status'],rows:LIMITS}},
        Decisions:{cards:CARDS,history:DECISIONS},
        Research:{columns:['ticker','alphaScore','portfolioFit','momentum','quality','revisions','institutionalFlow','sentiment','fiveDayRangePercent','catalyst','crowding','rationale'],rows:OPPS}
      }:{})
    }});
}
const pointChat=window.PointChat.mount({surface:'terminal',accountScope:()=> 'demo',
  getSnapshot:()=>terminalSnapshot(FUND),getAllSnapshots:()=>Object.keys(FUNDS).map(terminalSnapshot)});
})();
