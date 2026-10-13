/* ============ Point — static app ============ */
(function(){
  'use strict';

  /* ---- view routing ---- */
  const items = document.querySelectorAll('[data-view]');
  const views = document.querySelectorAll('.view');
  const crumb = document.getElementById('crumb-view');
  const titles = {
    dashboard:'Dashboard', brief:'Morning Brief', cards:'Action Cards', conductor:'Point Conductor',
    risk:'Risk & Guideline', tech:'Technical Signals', pnl:'PnL Attribution', ir:'IR & Reporting',
    pos:'Position Intelligence', research:'Research & Alpha', flows:'Fund Flows',
    earnings:'Earnings & Sentiment', macro:'Macro & Regime', digital:'Digital Assets',
    mcp:'Point MCP', execute:'Point Execute', governance:'Governance',
    profile:'My profile', settings:'Account settings', funds:'Manage funds', signout:'Sign out'
  };
  function go(view){
    views.forEach(v=>v.classList.toggle('active', v.id==='view-'+view));
    document.querySelectorAll('.side-item').forEach(a=>a.classList.toggle('active', a.dataset.view===view));
    if(crumb) crumb.textContent = titles[view]||'Dashboard';
    window.scrollTo({top:0,behavior:'smooth'});
  }
  items.forEach(el=>el.addEventListener('click', e=>{
    e.preventDefault();
    go(el.dataset.view);
  }));

  /* ---- IR dashboard / tear sheet template tabs ---- */
  const irTabs = [...document.querySelectorAll('[data-ir-tab]')];
  function selectIrTab(tab){
    const selected = tab.dataset.irTab;
    irTabs.forEach(item=>{
      const active = item === tab;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('.ir-tab-panel').forEach(panel=>{
      const active = panel.id === `ir-${selected}`;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    });
  }
  irTabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>selectIrTab(tab));
    tab.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? irTabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : irTabs.length - 1)) % irTabs.length;
      irTabs[next].focus();
      selectIrTab(irTabs[next]);
    });
  });

  /* ---- per-fund detail datasets (positions + PnL) ---- */
  const flagMap = {
    trim:'pill orange', ok:'pill good', high:'pill red', crowded:'pill orange',
    add:'pill good', stop:'pill red', watch:'pill ok', hedge:'pill red', cover:'pill orange'
  };
  const fundDetail = {
    alpha:{
      shown:'38 of 142 shown',
      positions:[
        ['NVDA','NVIDIA Corp','L','46,000','$8.47M','8.2%','+1.4%','+6.1%','1.82','med','trim'],
        ['AAPL','Apple Inc','L','36,200','$8.47M','6.8%','+0.6%','+2.2%','1.04','low','ok'],
        ['MSFT','Microsoft','L','20,500','$8.46M','6.8%','−0.3%','−2.4%','0.96','high','trim'],
        ['META','Meta Platforms','L','14,300','$8.47M','6.8%','+2.1%','+9.4%','1.21','low','crowded'],
        ['GOOGL','Alphabet','L','42,000','$7.09M','5.7%','+0.4%','+1.1%','1.02','low','ok'],
        ['AMZN','Amazon','L','28,400','$5.72M','4.6%','+0.9%','+3.8%','1.14','low','ok'],
        ['UBER','Uber Tech','L','68,000','$5.61M','4.5%','+1.8%','+7.2%','1.28','low','add'],
        ['TSLA','Tesla','L','17,200','$4.22M','3.4%','−1.1%','−4.6%','1.74','med','stop'],
        ['COIN','Coinbase','L','19,200','$4.21M','3.4%','−2.3%','+11.8%','2.41','med','watch'],
        ['MSTR','MicroStrategy','L','17,500','$6.18M','5.0%','−3.1%','+14.2%','3.12','med','hedge'],
        ['ANET','Arista','L','8,900','$3.67M','2.9%','+1.2%','+5.4%','1.33','low','add'],
        ['UNH','UnitedHealth','S','−9,100','−$4.90M','3.9%','+0.3%','−2.1%','0.74','med','watch'],
        ['WBA','Walgreens','S','−142,000','−$1.18M','0.9%','−1.4%','−8.9%','0.91','low','ok'],
        ['PEP','PepsiCo','S','−21,000','−$3.42M','2.7%','+0.2%','+1.4%','0.58','low','cover']
      ],
      pnlDay:[{t:'NVDA',v:82},{t:'META',v:71},{t:'UBER',v:58},{t:'ANET',v:41},{t:'AMZN',v:33},{t:'MSFT',v:-24},{t:'TSLA',v:-38},{t:'COIN',v:-52},{t:'MSTR',v:-61},{t:'AAPL',v:19}],
      pnlNames:[{t:'NVDA',v:94},{t:'META',v:78},{t:'UBER',v:62},{t:'ANET',v:51},{t:'NFLX',v:41},{t:'GOOGL',v:28},{t:'AMZN',v:22},{t:'AAPL',v:14},{t:'CRM',v:-9},{t:'PEP',v:-14},{t:'TSLA',v:-29},{t:'MSFT',v:-38},{t:'COIN',v:-44},{t:'MSTR',v:-58}]
    },
    global:{
      shown:'24 of 61 shown',
      positions:[
        ['TY','10Y UST future','S','−540','−$62.0M','18%','−0.2%','+1.4%','—','low','hedge'],
        ['ES','S&P 500 future','L','320','$48.2M','14%','+0.4%','+2.1%','1.00','low','ok'],
        ['GC','Gold future','L','180','$34.6M','11%','+0.9%','+6.2%','—','low','add'],
        ['6E','EUR/USD future','L','210','$29.1M','9%','+0.3%','−0.8%','—','med','watch'],
        ['CL','WTI crude future','L','140','$11.2M','4%','+1.4%','+3.1%','—','med','ok'],
        ['DX','USD index future','S','−90','−$9.4M','3%','−0.3%','−1.2%','—','low','ok'],
        ['JPY','USD/JPY future','S','−120','−$8.9M','3%','+0.1%','−2.4%','—','med','watch'],
        ['EEM','EM equity ETF','L','150,000','$6.4M','2.5%','+0.6%','+1.1%','1.05','low','ok'],
        ['FXI','China LC ETF','L','210,000','$6.1M','2.4%','+2.2%','+4.8%','1.10','med','add'],
        ['TLT','20Y Treasury ETF','S','−64,000','−$5.6M','2.1%','−0.4%','+0.9%','—','low','hedge'],
        ['HG','Copper future','L','95','$4.2M','1.6%','+0.8%','+2.6%','—','med','ok'],
        ['BTP','Italy 10Y future','S','−40','−$5.1M','1.9%','−0.1%','+0.5%','—','low','watch']
      ],
      pnlDay:[{t:'Gold',v:71},{t:'ES',v:44},{t:'FXI',v:38},{t:'Crude',v:29},{t:'Copper',v:18},{t:'EUR',v:-12},{t:'JPY',v:-22},{t:'TY',v:-31},{t:'TLT',v:-18},{t:'USD',v:-14}],
      pnlNames:[{t:'Gold',v:88},{t:'Rates',v:-54},{t:'EM eq',v:41},{t:'Energy',v:36},{t:'FX',v:-28},{t:'Equity idx',v:52},{t:'Credit',v:-16},{t:'Copper',v:22}]
    },
    neutral:{
      shown:'20 of 88 shown · 44 pairs',
      positions:[
        ['LLY','Eli Lilly','L','9,800','$8.1M','5.2%','+0.7%','+3.1%','0.62','low','ok'],
        ['NVO','Novo Nordisk','S','−64,000','−$7.9M','5.1%','−0.4%','−1.8%','0.58','low','ok'],
        ['V','Visa','L','22,000','$6.8M','4.4%','+0.3%','+1.2%','0.44','low','ok'],
        ['MA','Mastercard','S','−12,400','−$6.6M','4.2%','−0.2%','−0.9%','0.46','low','ok'],
        ['COST','Costco','L','7,100','$6.4M','4.1%','+0.5%','+2.0%','0.51','low','add'],
        ['WMT','Walmart','S','−78,000','−$6.2M','4.0%','−0.3%','−0.6%','0.49','low','ok'],
        ['HD','Home Depot','L','14,500','$5.9M','3.8%','+0.4%','+1.5%','0.72','low','ok'],
        ['LOW','Lowe\'s','S','−22,000','−$5.7M','3.7%','−0.2%','−0.4%','0.70','low','ok'],
        ['PG','Procter & Gamble','L','34,000','$5.6M','3.6%','+0.1%','+0.8%','0.38','low','ok'],
        ['CL','Colgate','S','−58,000','−$5.4M','3.5%','−0.1%','−0.3%','0.36','low','ok'],
        ['GOOGL','Alphabet','L','21,000','$3.5M','2.3%','+0.4%','+1.0%','0.52','low','ok'],
        ['META','Meta','S','−5,900','−$3.5M','2.2%','−0.3%','−0.7%','0.55','med','watch']
      ],
      pnlDay:[{t:'LLY/NVO',v:34},{t:'V/MA',v:21},{t:'COST/WMT',v:28},{t:'HD/LOW',v:19},{t:'PG/CL',v:9},{t:'GOOG/META',v:-11},{t:'JPM/BAC',v:-7},{t:'KO/PEP',v:14}],
      pnlNames:[{t:'Staples pr',v:41},{t:'Payments pr',v:33},{t:'Retail pr',v:38},{t:'Pharma pr',v:52},{t:'Tech pr',v:-18},{t:'Energy pr',v:-9},{t:'Fins pr',v:12}]
    },
    digital:{
      shown:'10 of 24 shown · 24/7',
      positions:[
        ['BTC','Bitcoin (spot)','L','210','$21.4M','27%','−2.1%','+18.4%','1.00','med','watch'],
        ['ETH','Ethereum (spot)','L','2,800','$10.8M','14%','−3.4%','+9.1%','1.24','med','watch'],
        ['CLSK','CleanSpark','L','720,000','$11.1M','14%','−4.2%','−8.4%','2.90','high','stop'],
        ['SOL','Solana (spot)','L','62,000','$9.4M','12%','−4.8%','+22.1%','1.60','high','watch'],
        ['COIN','Coinbase','L','42,000','$9.2M','12%','−2.3%','+11.8%','2.41','high','hedge'],
        ['MSTR','MicroStrategy','L','17,500','$6.2M','8%','−3.1%','+14.2%','3.12','high','hedge'],
        ['tNVDA','Tokenized NVDA','L','31,000','$5.7M','7%','−2.8%','+3.2%','1.82','med','watch'],
        ['tAAPL','Tokenized AAPL','L','24,000','$5.5M','7%','−1.9%','+1.1%','1.04','low','ok'],
        ['HOOD','Robinhood','L','180,000','$4.1M','5%','−1.2%','+6.0%','1.88','med','watch'],
        ['USDC','USD Coin (cash)','L','3,400,000','$3.4M','4%','0.0%','0.0%','0.00','low','ok']
      ],
      pnlDay:[{t:'SOL',v:61},{t:'BTC',v:38},{t:'ETH',v:22},{t:'tAAPL',v:9},{t:'USDC',v:2},{t:'HOOD',v:-14},{t:'tNVDA',v:-24},{t:'MSTR',v:-41},{t:'COIN',v:-33},{t:'CLSK',v:-58}],
      pnlNames:[{t:'SOL',v:74},{t:'BTC',v:44},{t:'ETH',v:28},{t:'Tokenized',v:-31},{t:'Miners',v:-62},{t:'Exchanges',v:-38},{t:'Treasuries',v:11},{t:'Stable',v:3}]
    }
  };

  function renderPositions(id){
    const rows=document.getElementById('pos-rows'); if(!rows) return;
    const data=(fundDetail[id]||fundDetail.alpha).positions;
    rows.innerHTML=data.map(p=>{
      const dayCls=p[6].startsWith('−')?'dn':(p[6].startsWith('+')?'up':'muted');
      const mtdCls=p[7].startsWith('−')?'dn':(p[7].startsWith('+')?'up':'muted');
      const driftCls=p[9]==='high'?'red':p[9]==='med'?'warn':'muted';
      return `<tr>
        <td>${p[0]}</td><td class="muted">${p[1]}</td>
        <td><span class="pill ${p[2]==='L'?'good':'red'}">${p[2]==='L'?'Long':'Short'}</span></td>
        <td>${p[3]}</td><td>${p[4]}</td><td>${p[5]}</td>
        <td class="${dayCls}">${p[6]}</td><td class="${mtdCls}">${p[7]}</td>
        <td>${p[8]}</td><td class="${driftCls}">${p[9]}</td>
        <td><span class="${flagMap[p[10]]}">${p[10]}</span></td>
      </tr>`;
    }).join('');
    const cnt=document.getElementById('pos-count');
    if(cnt) cnt.textContent=(fundDetail[id]||fundDetail.alpha).shown;
  }

  /* ---- pnl bars ---- */
  function buildBars(el, data){
    if(!el) return;
    const max=Math.max(...data.map(d=>Math.abs(d.v)));
    el.innerHTML=data.map(d=>{
      const h=Math.round(Math.abs(d.v)/max*100);
      const pos=d.v>=0;
      return `<div class="pnl-bar">
        ${pos?`<div class="pnl-col"></div><div class="pb-fill pos" style="height:${h}%"></div>`
             :`<div class="pb-fill neg" style="height:${h}%"></div><div class="pnl-col"></div>`}
        <div class="pb-lab">${d.t}</div>
      </div>`;
    }).join('');
  }
  function renderPnl(id){
    const f=fundDetail[id]||fundDetail.alpha;
    buildBars(document.getElementById('pnl-bars'), f.pnlDay);
    buildBars(document.getElementById('pnl-names'), f.pnlNames);
  }
  /* ---- per-fund dashboard extras (exposure, feed, top card, pnl meta) ---- */
  const fundExtra = {
    alpha:{
      expChip:'Net 62% · lim 60', pnlYtd:'YTD +18.4%', hit:'Hit rate 62% · W/L 1.84', topCardId:'AC-20261007-003',
      exposure:[['Gross',92,'184%',''],['Net β',62,'62%','warn'],['Top 10',38,'38%',''],['Semis',28,'28%',''],['Software',22,'22%',''],['Energy',9,'9%',''],['Crypto β',17,'17%','gold']],
      feed:[
        ['red','Beta-net 63.1% vs 60% IMA limit at open','Risk & Guideline · trim NVDA 12% + SMH put spread · $1.42M at risk','2m','AC-20261007-003'],
        ['red','CPI print tomorrow 08:30 ET · hot-print = −38 bps NAV','Macro & Regime · hedge ladder suggested · 10Y +12bp intraday risk','14m','AC-20261007-004'],
        ['orange','META crowding score 92 — top-decile HF ownership','Fund Flows · de-grossing risk if VIX > 22 · consider halving','26m','AC-20261007-006'],
        ['orange','TSLA stop proximity 0.3 ATR · RSI divergence 5d','Technical Signals · $422M position · trail stop 243.10','41m','AC-20261007-009'],
        ['gold','NEW IPO · Lumen Robotics (LMRX) initiates coverage Thu','Research & Alpha · ranked #4 of 38 new issues · 5d range $19.4–23.8','1h','AC-20261007-014'],
        ['gold','BTC funding +0.082% · OI +18% · crowded longs','Digital Assets · COIN/MSTR put-spread queued · $0.6M premium','Sat 2:14a','AC-20261007-002'],
        ['ghost','IR draft ready · October LP letter · 3 citations pending','IR & Reporting · marketing-rule pre-check: 2 soft flags','2h','']
      ]},
    global:{
      expChip:'Net 38% · lim 50', pnlYtd:'YTD +11.2%', hit:'Hit rate 57% · W/L 1.41', topCardId:'AC-G-001',
      exposure:[['Gross',71,'142%',''],['Net β',38,'38%',''],['Rates DV01',55,'0.6×','warn'],['Commodities',31,'31%','gold'],['FX',24,'24%',''],['Equity idx',28,'28%',''],['EM',14,'14%','']],
      feed:[
        ['red','10Y UST breaking 4.40% — book DV01 at risk into CPI','Macro & Regime · add 0.6× ZN hedge ladder · $4.1M at risk','5m','AC-G-001'],
        ['orange','USD/JPY intervention risk above 158','Macro & Regime · trim short JPY 25% · BOJ headline watch','22m',''],
        ['orange','Gold overbought · RSI 74 after +6.2% MTD','Technical Signals · take partial on GC longs','38m',''],
        ['gold','China stimulus headline — FXI +2.2%','Fund Flows · EM flows turning positive · add on dips','1h',''],
        ['gold','Crude backwardation steepening','Macro & Regime · WTI roll yield favorable · hold CL','2h',''],
        ['ghost','ECB minutes 14:00 · hawkish risk to BTP short','Macro & Regime · watch periphery spreads','3h','']
      ]},
    neutral:{
      expChip:'Net 4% · lim ±10', pnlYtd:'YTD +7.8%', hit:'Hit rate 64% · W/L 1.22', topCardId:'AC-N-001',
      exposure:[['Gross',100,'210%',''],['Net β',4,'4%','good'],['Staples',18,'18%',''],['Payments',15,'15%',''],['Retail',14,'14%',''],['Pharma',12,'12%',''],['Tech',9,'9%','']],
      feed:[
        ['orange','Staples pair PG/CL at 60-day spread wide','PnL Attribution · mean-reversion setup · add 15%','9m','AC-N-001'],
        ['orange','NVO borrow fee spiked to 180bp','Fund Flows · short-leg cost rising · review LLY/NVO pair','25m',''],
        ['gold','Payments pair V/MA · V revisions turning +','Research & Alpha · tilt pair toward V','44m',''],
        ['ghost','Net exposure 4% · within ±10% band','Risk & Guideline · beta-neutral maintained','1h',''],
        ['ghost','Factor check · low momentum/size tilt','Risk & Guideline · style-neutral confirmed','2h','']
      ]},
    digital:{
      expChip:'Net 71% · lim 75', pnlYtd:'YTD +34.1%', hit:'Hit rate 51% · W/L 1.96', topCardId:'AC-D-001',
      exposure:[['Gross',48,'96%',''],['Net β',71,'71%','warn'],['BTC',41,'41%','gold'],['ETH',14,'14%','gold'],['Alt',12,'12%','gold'],['Tokenized',14,'14%',''],['Miners',20,'20%','warn']],
      feed:[
        ['red','BTC funding +0.082% · OI +18% · liquidation cluster 98–99k','Digital Assets · de-risk MSTR/COIN · put-spread queued','2m','AC-D-001'],
        ['red','CLSK −4.2% · breaking 200-day · stop hit','Technical Signals · miners rolling over · cut CLSK','18m',''],
        ['orange','tNVDA basis −2.8% vs NYSE Fri close','Digital Assets · weekend gap-risk into Monday open','26m',''],
        ['gold','SOL +22% MTD · momentum accelerating','Research & Alpha · add on pullback to range low','1h',''],
        ['gold','Stablecoin mint +$1.4B · liquidity gauge up','Fund Flows · risk-on signal for majors','2h',''],
        ['ghost','USDC 4% cash buffer · 24/7 VaR within limit','Risk & Guideline · redemption friction low','3h','']
      ]}
  };

  /* top-card detail for non-alpha funds (alpha reuses its existing card) */
  const fundCards = { global: [
    {lvl:'CRIT', agent:'Macro & Regime', id:'AC-G-001', ts:'5 min ago',
     title:'10Y UST breaking 4.40% — book DV01 at risk into CPI',
     metrics:[['$4.1M','At risk','red'],['0.6×','Hedge ratio',''],['1.8 bps','Carry cost',''],['−$9.4M','If 10Y +50bp','']],
     body:'Add a 0.6× ZN hedge ladder ahead of CPI. Drivers: 10Y through 4.40%, hot-print risk, duration-long book.',
     detail:{
       summary:'Rates are breaking out with CPI tomorrow. The book carries <b>long duration</b> via EM and equity-index exposure; the agent proposes a cheap DV01 ladder to neutralize most of the rate risk into the print.',
       drivers:[{t:'10Y breaks 4.40%',s:'Services PPI hot; term premium rising',w:'main'},{t:'Book DV01 long',s:'EM + index futures carry duration',w:'−$9.4M/50bp'},{t:'CPI tomorrow 08:30',s:'Hot-print scenario compounds',w:'event'}],
       trades:[{act:'buy',tk:'ZN 10Y future ladder',sz:'0.6× book DV01',det:'Short rates via futures; neutralizes ~60% of duration into CPI.'},{act:'sell',tk:'JPY short trim',sz:'−25%',det:'Reduce intervention risk above 158.'}],
       whatif:[['Book DV01','1.0×','0.4×'],['Hot-CPI PnL','−$4.1M','−$1.4M'],['Carry','—','1.8 bps/mo']],
       evidence:[{ag:'Fund Flows',tx:'Rate-vol sellers crowded; a hot print forces fast unwind.'},{ag:'Risk & Guideline',tx:'Within loss cap but dents MTD; hedge keeps headroom.'}],
       timeline:[{t:'Rates breakout flagged',s:'06:02 · 10Y > 4.40%',st:'done'},{t:'DV01 ladder sized',s:'06:09 · 0.6×',st:'done'},{t:'Awaiting your approval',s:'now',st:'active'}],
       reasoning:'A probability-weighted CPI grid shows asymmetric downside; the ladder cuts hot-print loss by two-thirds for under 2 bps/month carry.'
     }},
    {lvl:'WARN', agent:'Macro & Regime', id:'AC-G-002', ts:'22 min ago',
     title:'USD/JPY intervention risk above 158 — trim the short',
     metrics:[['158','Line in sand','warn'],['−25%','Trim size',''],['−22 bp','MTD on JPY','bad'],['$8.9M','Short notional','']],
     body:'BOJ headline risk is rising with spot pinned above 158. Trim the yen short by a quarter before the print.',
     detail:{
       summary:'The yen short is the book’s main intervention risk. Spot is testing <b>158</b>, the level desks treat as the BOJ line, and the position is already a <b>−22 bp</b> MTD drag.',
       drivers:[{t:'Spot above 158',s:'Intervention rhetoric picked up overnight',w:'main'},{t:'Short notional $8.9M',s:'Largest single FX gap in the book',w:'size'},{t:'CPI tomorrow',s:'A hot print can gap USD/JPY further — or reverse it',w:'event'}],
       trades:[{act:'buy',tk:'JPY cover',sz:'25% of the short',det:'Reduce intervention gap without giving up the yield-differential thesis.'}],
       whatif:[['JPY short','$8.9M','$6.7M'],['Gap if −3% squeeze','−$1.6M','−$1.2M'],['Yield thesis','kept','kept']],
       evidence:[{ag:'Position Intel',tx:'BOJ officials flagged “one-sided” moves in the last 12 hours.'},{ag:'Risk & Guideline',tx:'Single-pair FX is 9% vs a 15% cap — trim is optional, not a breach.'}],
       timeline:[{t:'Intervention watch raised',s:'04:10 · spot > 158',st:'done'},{t:'Trim sized',s:'04:12 · 25%',st:'done'},{t:'Awaiting your decision',s:'now',st:'active'}],
       reasoning:'The yield-differential thesis is intact, but the gap risk is no longer symmetric. Cutting a quarter keeps the expression and caps the squeeze.'
     }},
    {lvl:'WARN', agent:'Technical Signals', id:'AC-G-003', ts:'38 min ago',
     title:'Gold RSI 74 after +6.2% MTD — take a partial',
     metrics:[['74','RSI','warn'],['+6.2%','MTD','good'],['20%','Suggested trim',''],['$34.6M','GC long','']],
     body:'The gold long is extended. Take 20% off into overbought RSI while the real-rate thesis stays in place.',
     detail:{
       summary:'Gold is the book’s best MTD contributor and now <b>overbought (RSI 74)</b>. The agent wants a partial, not an exit.',
       drivers:[{t:'RSI 74',s:'+6.2% MTD, above both moving averages',w:'extended'},{t:'Specs crowded long',s:'CoT positioning in the top decile',w:'fragile'},{t:'Real-rate thesis intact',s:'CB buying and the cut path still support the long',w:'hold core'}],
       trades:[{act:'sell',tk:'GC Gold',sz:'−20% · ~$6.9M',det:'Scale out into strength; leave the core for the CPI print.'}],
       whatif:[['Gold weight','11%','8.8%'],['If −3% pullback','−$1.0M','−$0.8M'],['Thesis','full','core retained']],
       evidence:[{ag:'Fund Flows',tx:'Spec longs in gold are crowded on the same side as the book.'},{ag:'Macro & Regime',tx:'A hot CPI that lifts real yields is the risk to the residual long.'}],
       timeline:[{t:'RSI band hit',s:'05:20 · 74',st:'done'},{t:'Partial sized',s:'05:21 · 20%',st:'done'},{t:'Awaiting your decision',s:'now',st:'active'}],
       reasoning:'Crowded and extended is a reason to harvest, not to abandon the thesis. Twenty percent restores room to add back if CPI is cold.'
     }},
    {lvl:'IDEA', agent:'Fund Flows', id:'AC-G-004', ts:'1h ago',
     title:'China stimulus bid FXI +2.2% — add EM on dips',
     metrics:[['+2.2%','FXI day','good'],['+$1.6B','FXI ETF flow',''],['#2','Cross-asset rank',''],['$6.1M','Current FXI','']],
     body:'Stimulus headlines turned EM flows positive. Add to FXI on a dip; the cross-asset rank already has EM second.',
     detail:{
       summary:'Overnight China stimulus lifted <b>FXI +2.2%</b> and turned EM ETF flows positive. The research rank already has EM at <b>#2</b>.',
       drivers:[{t:'Stimulus headline',s:'Package details support the FXI long',w:'catalyst'},{t:'ETF flow +$1.6B',s:'FXI inflows confirming the move',w:'flow'},{t:'Rank #2',s:'Behind gold in the cross-asset screen',w:'fit'}],
       trades:[{act:'buy',tk:'FXI',sz:'+$2.0M on a −1% dip',det:'Add only if the open gives back part of the gap.'}],
       whatif:[['FXI weight','2.4%','3.2%'],['EM sleeve','14%','16%'],['Net','38%','39%']],
       evidence:[{ag:'Research & Alpha',tx:'EM composite 0.84, second only to gold.'},{ag:'Macro & Regime',tx:'Adds a little equity beta; still inside the 50% net cap.'}],
       timeline:[{t:'Headline ingested',s:'05:30',st:'done'},{t:'Flow confirmation',s:'05:48 · ETF prints',st:'done'},{t:'Idea queued',s:'now',st:'active'}],
       reasoning:'The add is conditional on a dip so the book does not chase the gap. Net stays well inside the cap.'
     }}
  ], neutral: [
    {lvl:'WARN', agent:'PnL Attribution', id:'AC-N-001', ts:'9 min ago',
     title:'Staples pair PG/CL at 60-day spread wide — add to pair',
     metrics:[['+2.1σ','Spread z','warn'],['$1.1M','Pair notional',''],['0.02','Net beta',''],['64%','Pair hit rate','good']],
     body:'Mean-reversion setup: the PG/CL spread is 2.1σ wide with no fundamental catalyst. Agent suggests adding 15% to the pair, beta-neutral.',
     detail:{
       summary:'The long-PG / short-CL pair has stretched to <b>+2.1σ</b> on the 60-day spread with no earnings or news catalyst — a classic mean-reversion add that keeps the book beta-neutral.',
       drivers:[{t:'Spread z-score +2.1σ',s:'Widest in 60 days',w:'signal'},{t:'No catalyst',s:'Neither name reports for 18d',w:'clean'},{t:'Borrow stable',s:'CL short fee 32bp',w:'ok'}],
       trades:[{act:'buy',tk:'PG (long leg)',sz:'+$0.17M',det:'Add 15% to the long leg.'},{act:'sell',tk:'CL (short leg)',sz:'−$0.17M',det:'Match the short leg; net beta ~0.'}],
       whatif:[['Pair z','+2.1σ','+2.1σ'],['Pair notional','$1.1M','$1.3M'],['Net beta','0.02','0.02']],
       evidence:[{ag:'Research & Alpha',tx:'Both names fairly valued; divergence is technical, not fundamental.'},{ag:'Risk & Guideline',tx:'Add keeps net exposure inside ±10% band.'}],
       timeline:[{t:'Spread flagged',s:'05:30 · 60-day z-score',st:'done'},{t:'Pair sized',s:'05:31 · beta-neutral add',st:'done'},{t:'Awaiting your decision',s:'now',st:'active'}],
       reasoning:'Market-neutral alpha comes from pair convergence; a 2.1σ dislocation with no catalyst is a high-hit-rate add that does not change the book’s factor profile.'
     }},
    {lvl:'WARN', agent:'Fund Flows', id:'AC-N-002', ts:'25 min ago',
     title:'NVO borrow fee spiked to 180bp — review the short leg',
     metrics:[['180bp','Borrow fee','warn'],['LLY/NVO','Pair',''],['5.1%','Short weight',''],['180','vs 32bp CL','']],
     body:'The Novo short is getting expensive. Review the LLY/NVO pair before the fee eats the spread.',
     detail:{
       summary:'Borrow on the <b>NVO short leg jumped to 180bp</b>. The pair thesis is intact, but carry on the short is no longer cheap.',
       drivers:[{t:'Fee 180bp',s:'Up sharply versus the rest of the short book',w:'cost'},{t:'Pair still the #1 spread',s:'Score gap vs NVO remains the reason to be short',w:'thesis'},{t:'No earnings for 12d',s:'Time to reassess size before the print',w:'window'}],
       trades:[{act:'buy',tk:'NVO cover 20%',sz:'−20% of the short leg',det:'Shrink the expensive leg and keep LLY unless the spread collapses.'}],
       whatif:[['Borrow drag','180bp','144bp blended'],['Pair notional','$7.9M','$6.3M'],['Net beta','0.04','0.05']],
       evidence:[{ag:'PnL Attribution',tx:'Pair is still a winner; the fee is the new drag, not the spread.'},{ag:'Risk & Guideline',tx:'A smaller short stays inside the single-pair cap.'}],
       timeline:[{t:'Fee spike flagged',s:'05:20',st:'done'},{t:'Cover sized',s:'05:22 · 20%',st:'done'},{t:'Awaiting your decision',s:'now',st:'active'}],
       reasoning:'Keep the pair, pay less for it. Covering a fifth of NVO protects the hit rate without flipping the book to a naked long.'
     }},
    {lvl:'IDEA', agent:'Research & Alpha', id:'AC-N-003', ts:'44 min ago',
     title:'V/MA revisions turning — tilt the pair toward Visa',
     metrics:[['V','Favor','good'],['+1','Revision',''],['4.4%','V weight',''],['0.02','Net beta','']],
     body:'Estimate revisions now favor Visa over Mastercard. Tilt the existing pair; do not add market beta.',
     detail:{
       summary:'The payments pair is balanced. New revisions favor <b>Visa</b>. The agent wants a tilt, not a new directional bet.',
       drivers:[{t:'V revisions +1',s:'Volume data ahead of MA',w:'signal'},{t:'Spread tightening',s:'Technicals already leaning V',w:'confirm'},{t:'Beta stays ~0',s:'Add V only against MA',w:'constraint'}],
       trades:[{act:'buy',tk:'V',sz:'+$0.8M',det:'Increase the long leg.'},{act:'sell',tk:'MA',sz:'−$0.8M',det:'Match on the short leg so net beta does not move.'}],
       whatif:[['V weight','4.4%','4.9%'],['MA short','4.2%','4.7%'],['Net beta','0.04','0.04']],
       evidence:[{ag:'Earnings & Sentiment',tx:'Visa tone constructive; Mastercard still neutral.'},{ag:'Technical Signals',tx:'V/MA spread is tightening in Visa’s favor.'}],
       timeline:[{t:'Revisions refreshed',s:'05:40',st:'done'},{t:'Tilt sized beta-neutral',s:'05:41',st:'done'},{t:'Idea queued',s:'now',st:'active'}],
       reasoning:'Pair selection is the whole mandate. A revision gap is a reason to tilt, and matching legs keeps the book market-neutral.'
     }}
  ], digital: [
    {lvl:'CRIT', agent:'Digital Assets', id:'AC-D-001', ts:'2 min ago',
     title:'BTC funding +0.082% · OI +18% — crowded longs into Monday',
     metrics:[['−$2.6M','Crypto-β risk','red'],['+18%','OI 24h',''],['0.6M','Hedge premium',''],['Mon','Risk window','']],
     body:'Crowded-long setup with dense liquidation clusters below. De-risk MSTR/COIN via a defined-risk put spread, sized to budget, checked by Risk.',
     detail:{
       summary:'Perp funding spiked to <b>+0.082%</b> with OI <b>+18%</b> and liquidation clusters at 98–99k — a fragile crowded-long structure. The fund’s MSTR/COIN beta is exposed into Monday.',
       drivers:[{t:'Funding +0.082%',s:'60-day high',w:'crowded'},{t:'OI +18% 24h',s:'Leverage building',w:'fragile'},{t:'Liquidation cluster 98–99k',s:'Dense longs below spot',w:'gap-risk'}],
       trades:[{act:'buy',tk:'MSTR Nov put spread',sz:'$0.6M premium',det:'Hedge highest-beta name (3.12× BTC).'},{act:'buy',tk:'COIN Nov put spread',sz:'$0.3M premium',det:'Optional second leg (2.41× beta).'}],
       whatif:[['Crypto-β downside','−$2.6M','−$1.1M'],['MSTR 24h impact','−$1.84M','hedged'],['Premium','—','$0.6M']],
       evidence:[{ag:'Risk & Guideline',tx:'Crypto-β 71% near 75% cap; hedge keeps headroom.'},{ag:'Technical Signals',tx:'CLSK already broke 200-day; miners leading lower.'}],
       timeline:[{t:'Funding spike detected',s:'Sat 02:14 · 24/7 monitor',st:'done'},{t:'Book impact mapped',s:'Sat 02:15',st:'done'},{t:'Put spread queued',s:'now',st:'active'}],
       reasoning:'The 24/7 agent caught this over the weekend. Rather than sell into thin Sunday liquidity, it translates the crypto signal into equity-beta risk and queues a defined-risk Monday hedge, pre-checked against limits.'
     }},
    {lvl:'CRIT', agent:'Technical Signals', id:'AC-D-002', ts:'18 min ago',
     title:'CLSK broke the 200-day — stop is hit, cut the miner',
     metrics:[['−4.2%','Today','bad'],['200d','Broken','red'],['$11.1M','Position',''],['2.90','BTC beta','']],
     body:'CleanSpark broke its 200-day on thin weekend volume. The stop is hit. Cut the miner before the cash open.',
     detail:{
       summary:'<b>CLSK is through its 200-day</b> and is the book’s worst name. The stop fired over the weekend; the agent wants it sold at the open.',
       drivers:[{t:'200-day break',s:'−4.2% on thin volume',w:'stop'},{t:'Miners leading lower',s:'High-beta complex rolling over with funding',w:'regime'},{t:'2.90 BTC beta',s:'Largest beta in the miner sleeve',w:'risk'}],
       trades:[{act:'sell',tk:'CLSK',sz:'full position · $11.1M',det:'Market-on-open. Do not average down through a broken stop.'}],
       whatif:[['Miner sleeve','20%','6%'],['Crypto-β','71%','64%'],['If −8% Monday','−$0.9M','flat']],
       evidence:[{ag:'Digital Assets',tx:'Funding spike and OI build are hitting miners first.'},{ag:'Risk & Guideline',tx:'Cutting CLSK is the cleanest way back from the 75% crypto-β cap.'}],
       timeline:[{t:'Stop hit',s:'Sun 11:20',st:'done'},{t:'Exit queued for the open',s:'Sun 11:22',st:'done'},{t:'Awaiting your approval',s:'now',st:'active'}],
       reasoning:'A broken stop on the highest-beta miner is not a debate. Selling it also pulls crypto-β off the cap before the hedge is even filled.'
     }},
    {lvl:'WARN', agent:'Digital Assets', id:'AC-D-003', ts:'26 min ago',
     title:'tNVDA basis −2.8% versus Friday’s NYSE close',
     metrics:[['−2.8%','Basis','warn'],['$5.7M','tNVDA',''],['Mon','Gap into open',''],['1.82','Equity beta','']],
     body:'Tokenized NVDA traded at a 2.8% discount all weekend. Treat Monday’s cash open as a gap, not a new thesis.',
     detail:{
       summary:'The tokenized NVDA line is <b>2.8% cheap to Friday’s NYSE close</b>. That discount is a weekend gap warning for the cash open, not a reason to add.',
       drivers:[{t:'Basis −2.8%',s:'xStocks / Ondo versus Friday official close',w:'gap'},{t:'Depth is thin',s:'Weekend prints are not full size',w:'caution'},{t:'Equity beta 1.82',s:'The gap lands on a high-beta sleeve',w:'pnl'}],
       trades:[{act:'sell',tk:'tNVDA trim 15%',sz:'~$0.9M',det:'Reduce into the open if the cash market confirms the discount.'}],
       whatif:[['tNVDA','$5.7M','$4.8M'],['If cash opens −2.8%','−$160k','−$135k'],['Thesis','unchanged','unchanged']],
       evidence:[{ag:'Technical Signals',tx:'No cash-market confirmation until 09:30. Size the response, do not front-run it.'},{ag:'Risk & Guideline',tx:'Trim stays inside single-name and crypto-β bands.'}],
       timeline:[{t:'Basis flagged',s:'Mon 04:30 · 24/7 monitor',st:'done'},{t:'Open plan set',s:'04:32 · 15% if confirmed',st:'done'},{t:'Awaiting the cash open',s:'now',st:'active'}],
       reasoning:'Weekend tokenized prints lead the cash open. The conductor keeps this as a warning until the NYSE price confirms it.'
     }},
    {lvl:'IDEA', agent:'Research & Alpha', id:'AC-D-004', ts:'1h ago',
     title:'SOL leads the coin rank — add only on a pullback',
     metrics:[['#1','Coin rank','good'],['+22%','MTD',''],['$9.4M','Current',''],['1.60','BTC beta','']],
     body:'Solana is the top-ranked coin on momentum and on-chain flow. Add on a pullback, not into the spike.',
     detail:{
       summary:'SOL is <b>#1 of the coin universe</b> and +22% MTD. The agent wants more, but only if price gives some back.',
       drivers:[{t:'Momentum + on-chain flow',s:'Activity and stablecoin inflows both up',w:'rank'},{t:'Already 12% of NAV',s:'Do not chase a vertical move',w:'size'},{t:'ETF optionality',s:'Still only partly in the price',w:'upside'}],
       trades:[{act:'buy',tk:'SOL',sz:'+$1.5M below today’s low',det:'Resting bid. Cancel if funding stays above 0.08%.'}],
       whatif:[['SOL weight','12%','14%'],['Crypto-β','71%','73%'],['Vs 75% cap','4 pts','2 pts']],
       evidence:[{ag:'Fund Flows',tx:'Spot demand is real; perp funding is the reason not to pay up.'},{ag:'Risk & Guideline',tx:'The add fits only if CLSK is cut — otherwise crypto-β breaches 75%.'}],
       timeline:[{t:'Universe re-ranked',s:'Mon 05:10',st:'done'},{t:'Bid placed conditional',s:'05:12',st:'done'},{t:'Idea queued',s:'now',st:'active'}],
       reasoning:'Rank and funding disagree. The conductor allows the add only after the CLSK stop is honored, so the cap still has room.'
     }},
    {lvl:'IDEA', agent:'Fund Flows', id:'AC-D-005', ts:'2h ago',
     title:'Stablecoin mint +$1.4B — liquidity gauge is risk-on',
     metrics:[['+$1.4B','Mint 24h','good'],['outflow','Exchanges',''],['bullish','Majors',''],['4%','USDC cash','']],
     body:'A large stablecoin mint and exchange outflows say spot demand is rising. Use it as context for BTC and ETH, not as a new trade.',
     detail:{
       summary:'<b>$1.4B of stablecoins minted</b> and coins are leaving exchanges. That is a risk-on liquidity gauge for the majors you already hold.',
       drivers:[{t:'Mint +$1.4B',s:'Fresh buying power on chain',w:'liquidity'},{t:'Exchange outflows',s:'Historically bullish for BTC and ETH',w:'positioning'},{t:'Cash buffer 4%',s:'USDC is already the dry powder',w:'capacity'}],
       trades:[{act:'buy',tk:'No new order',sz:'context only',det:'Supports holding BTC and ETH. Do not add until the funding spike cools.'}],
       whatif:[['BTC weight','27%','27%'],['Cash','4%','4%'],['Action','hold','hold']],
       evidence:[{ag:'Digital Assets',tx:'Funding is still elevated, so the mint is a reason to hold, not to lever.'},{ag:'Macro & Regime',tx:'Liquidity gauge agrees with a risk-on read unless CPI is hot.'}],
       timeline:[{t:'Mint detected',s:'Sat 06:40',st:'done'},{t:'Classified as context',s:'Sat 06:44',st:'done'},{t:'Noted on the brief',s:'now',st:'active'}],
       reasoning:'Not every positive flow is a trade. With funding crowded, this card explains why the majors are held while the hedges go on the high-beta names.'
     }}
  ] };

  function renderExposure(id){
    const box=document.getElementById('exposure-bars'); if(!box) return;
    const fx=fundExtra[id]||fundExtra.alpha;
    box.innerHTML=fx.exposure.map(r=>{
      const cls=r[3];
      const fillCls=cls?('fill '+cls):'fill';
      const valCls=cls==='warn'?'bar-val warn':(cls==='good'?'bar-val good':'bar-val');
      return `<div class="bar-row"><span class="bar-lab">${r[0]}</span><div class="bar"><div class="${fillCls}" style="width:${r[1]}%"></div></div><span class="${valCls}">${r[2]}</span></div>`;
    }).join('');
    const chip=document.getElementById('exposure-chip'); if(chip) chip.textContent=fx.expChip;
  }
  function renderFeed(id){
    const ul=document.getElementById('live-feed'); if(!ul) return;
    const fx=fundExtra[id]||fundExtra.alpha;
    const lvlTxt={red:'CRIT',orange:'WARN',gold:'IDEA',ghost:'INFO'};
    ul.innerHTML=fx.feed.map(f=>{
      const linked=f[4]&&cardIndex[f[4]];
      const cls=linked?'f-row clickable':'f-row';
      const dc=linked?` data-card="${f[4]}"`:'';
      return `<li class="${cls}"${dc}><span class="pill ${f[0]}">${lvlTxt[f[0]]||'INFO'}</span><div><div class="f-title">${f[1]}</div><div class="f-sub">${f[2]}</div></div><span class="f-time">${f[3]}</span></li>`;
    }).join('');
  }
  function renderPnlMeta(id){
    const fx=fundExtra[id]||fundExtra.alpha;
    setText('pnl-ytd', fx.pnlYtd); setText('pnl-hit', fx.hit);
  }
  function renderTopCard(id){
    const box=document.getElementById('top-card'); if(!box) return;
    const fx=fundExtra[id]||fundExtra.alpha;
    const c=cardIndex[fx.topCardId]; if(!c) return;
    box.setAttribute('data-card', c.id);
    box.className='card critical clickable';
    box.innerHTML=`
      <div class="card-head">
        <span class="chip crit">${c.lvl==='CRIT'?'CRITICAL':c.lvl}</span>
        <span class="chip-meta">Action Card · ${c.agent} Agent · ${c.ts||''}</span>
        <span class="spacer"></span>
        <span class="chip ghost">#${c.id}</span>
      </div>
      <h3 class="card-title">${c.title}</h3>
      <div class="metrics">${c.metrics.map(m=>`<div class="metric"><div class="m-val ${m[2]}">${m[0]}</div><div class="m-lab">${m[1]}</div></div>`).join('')}</div>
      <div class="card-body"><div>${c.body}</div></div>
      <div class="card-foot">
        <button class="btn primary">Approve</button>
        <button class="btn dark">Modify in What-If</button>
        <button class="btn ghost">Dismiss</button>
        <span class="meta right">Signed by ${c.agent} Agent · audit logged</span>
      </div>`;
  }

  /* ---- Decision briefs: recommendation, evidence, and a question for the desk ---- */
  const agentMeta = {
    risk:{n:'Risk & Guideline Agent',i:'🛡',sq:'red'},
    tech:{n:'Technical Signals Agent',i:'📈',sq:'red'},
    pnl:{n:'PnL Attribution Agent',i:'⚖︎',sq:'red'},
    ir:{n:'IR & Reporting Agent',i:'📝',sq:'red'},
    pos:{n:'Position Intelligence Agent',i:'📰',sq:'red'},
    research:{n:'Research & Alpha Agent',i:'🔍',sq:'gold'},
    flows:{n:'Fund Flows & Positioning Agent',i:'≋',sq:'gold'},
    earnings:{n:'Earnings & Sentiment Agent',i:'💬',sq:'gold'},
    macro:{n:'Macro & Regime Agent',i:'🌍',sq:'gold'},
    digital:{n:'Digital Assets & Tokenization Agent',i:'◉',sq:'gold'}
  };
  // Each entry is [recommendation, why it matters, decision to discuss].
  // Copy describes the illustrative fund snapshot, not live analysis or human approval.
  const decisionBriefs = {
    alpha:{
      risk:[
        'Make room under the investment mandate before adding risk.',
        'The projected opening exposure is <b>63.1% against a 60% limit</b>. That makes restoring headroom the first discussion for the desk. A partial NVDA reduction with a semiconductor hedge is worth comparing with a larger outright trim.',
        'Ask Risk to compare both options in the scenario view. Which restores enough headroom while retaining the positions you still have conviction in? Confirm the effect before approving a trade.'
      ],
      tech:[
        'Review the vulnerable positions before changing the whole book.',
        'NVDA is stretched and its momentum is weakening; TSLA is close to its trailing stop. These signals suggest reviewing position size and exit levels, while leaving the stronger trends alone. They do not, by themselves, invalidate the investment theses.',
        'Recheck the NVDA trim alongside the risk brief, and agree how to handle TSLA if its stop is reached. Would a smaller position serve the thesis better than a tighter stop?'
      ],
      pnl:[
        'Put MSFT through a fresh conviction review before committing more risk.',
        'The fund is up <b>18.4% year to date</b>, but MSFT has detracted while using 18% of the risk budget. The question is whether the expected return still justifies that allocation, rather than whether a recent loser should automatically be sold.',
        'Ask the covering analyst what could change the earnings outlook and over what horizon. Compare holding the position with a partial trim; keep the allocation only if the forward case supports it.'
      ],
      ir:[
        'Finish the evidence and disclosure checks before circulating the LP letter.',
        'The October draft has a clear performance story, but <b>two review flags remain</b>. Investors should understand both what drove the gains and the risks still in the portfolio, rather than receive a list of returns without context.',
        'Have the reporting owner resolve the flags and reconcile the performance exhibits. Ask whether the letter explains the current risk decisions plainly enough for an investor to challenge them.'
      ],
      pos:[
        'Bring MSFT back to the investment discussion; keep NVDA and UNH under review.',
        'Slower Azure growth challenges the MSFT thesis. NVDA insider sales and the activist filing also warrant a closer look, but those headlines alone do not establish that the business case has changed.',
        'Ask each covering analyst to separate new evidence from market noise. What would change the valuation, position size, or exit condition? Record that answer before deciding whether to reduce exposure.'
      ],
      research:[
        'Take UBER into diligence as a candidate for available risk budget.',
        'UBER leads the research ranking, with SPOT and ANET also screening well. That is a useful starting point for investigation, but a high score does not tell us whether the current price or portfolio fit is attractive.',
        'Compare the upside case, downside case, and overlap with existing holdings. Would a small starter position improve the book after the exposure issue is resolved?'
      ],
      flows:[
        'Review whether META and NVDA are sized for a crowded exit.',
        'Both names sit near the top of the crowding measures. Shared ownership can amplify selling when funds reduce risk together, even if the company outlook remains sound.',
        'Compare a modest reduction with the cost of protection. Decide what change in volatility or liquidity would trigger action, rather than treating crowding alone as a sell signal.'
      ],
      earnings:[
        'Use the next bank results to challenge the consumer assumptions in the book.',
        'The JPM tone estimate points to a more cautious outlook, which could matter for the payments holdings. It is a model signal ahead of the release, not confirmed guidance.',
        'Ask the analyst covering V and MA which comments on spending and credit would change the thesis. Verify the reporting calendar and revisit the positions after the actual results.'
      ],
      macro:[
        'Price protection around CPI before choosing how much risk to carry through it.',
        'The hot-inflation scenario implies a <b>38 basis point portfolio loss</b>. A partial interest-rate hedge may soften that outcome, but it will cost carry and can also reduce gains if the release is benign.',
        'Compare the unhedged and hedged outcomes, including the cost if nothing happens. Agree the downside the fund is willing to accept before selecting the hedge size.'
      ],
      digital:[
        'Treat the crypto-linked equities as a shared risk when reviewing protection.',
        'COIN, MSTR, and HOOD connect the equity book to crypto sentiment. Elevated funding suggests leveraged investors could unwind together, while tokenized share prices offer an early, imperfect warning of a cash-market gap.',
        'Review the combined exposure before assessing the proposed put spread. Confirm prices and liquidity in the underlying market; a thin weekend quote is not enough reason to trade.'
      ]
    },
    global:{
      risk:[
        'Focus the risk discussion on interest rates ahead of CPI.',
        'The book has room under its exposure limits, but a <b>50 basis point rise in the 10-year yield implies a $9.4M loss</b> in the stress scenario. Being inside a limit does not make this concentration comfortable.',
        'Compare a partial rate hedge with reducing the underlying positions. Agree how much event risk to retain, and review the yen short separately for intervention risk.'
      ],
      tech:[
        'Consider taking some profit in gold while retaining the core thesis.',
        'Gold has gained <b>6.2% this month</b> and looks stretched on the technical measures. That supports a sizing discussion, rather than an automatic exit; the longer-term case may still hold.',
        'Compare a partial reduction with holding through CPI. Set the conditions for rebuilding the position, and check whether the move in Treasury futures reinforces the rate-risk concern.'
      ],
      pnl:[
        'Review whether the rate position still earns its place in the book.',
        'Gold and equity-index exposure are supporting the month while rates and FX detract. The fund remains up <b>11.2% year to date</b>, but that aggregate result can hide how much the next outcome depends on duration.',
        'Ask the rates analyst to restate the thesis and the evidence that would disprove it. Separate a deliberate event position from an exposure the team has simply carried forward.'
      ],
      ir:[
        'Explain the portfolio choices behind the return in the next investor letter.',
        'The <b>11.2% year-to-date gain</b> needs context: what gold contributed, why rates detracted, and how the team is managing the next inflation release. The scenario exhibit can make those trade-offs easier to understand.',
        'Reconcile the attribution and derivatives disclosures before sign-off. Does the letter explain both why the positions remain and what would cause the team to change them?'
      ],
      pos:[
        'Assign a clear response plan to the macro catalysts that can change the book.',
        'CPI, central-bank communication, and intervention headlines can affect several positions at once. China stimulus and OPEC commentary also need to be assessed against the specific EM and commodity theses.',
        'Have each analyst name the release or policy change that would alter their view. Prioritize the rate and yen exposures, and distinguish confirmed policy from headline speculation.'
      ],
      research:[
        'Test the EM opportunity against the existing macro exposures before adding.',
        'Gold and EM lead the cross-asset screen, and China stimulus supports further investigation. An attractive ranking may still add to the same rate or dollar sensitivity already driving the portfolio.',
        'Compare the opportunity with the current gold allocation under both inflation outcomes. What new source of return would the position add, and at what entry price?'
      ],
      flows:[
        'Check the exit plan for gold and crude before increasing either position.',
        'Speculative positioning is crowded in both markets. Positive EM inflows are encouraging, but flow momentum can reverse; it should support the investment case rather than replace it.',
        'Review available liquidity and the effect of a positioning unwind. Would a smaller allocation leave more flexibility if the macro view is right but the market moves against it first?'
      ],
      earnings:[
        'Use company results to test the macro view where they offer direct evidence.',
        'Bank commentary can inform the credit outlook, while producers and retailers can shed light on demand. These are supporting inputs for this fund; the inflation and policy releases remain the more direct catalysts.',
        'Ask analysts to bring only findings that challenge a portfolio assumption. Would weaker consumer demand or producer guidance change the rate or commodity positions?'
      ],
      macro:[
        'Decide the acceptable CPI loss before settling on a hedge.',
        'The curve and dollar positions express a view on the policy path. Their outcome depends on the inflation surprise, so one forecast is less useful than comparing the hot and cold scenarios already shown below.',
        'Review the rate hedge across both outcomes, including its carry. Agree what part of the macro conviction to retain and what result would prompt a reassessment.'
      ],
      digital:[
        'Use crypto liquidity as a supporting signal for the macro discussion.',
        'Stablecoin issuance and Bitcoin flows may help interpret risk appetite, but this fund has minimal direct crypto exposure. These observations alone do not justify adding a new asset class to the book.',
        'Look for confirmation in the dollar, rates, and broader flows. Does the crypto signal strengthen the existing thesis, or is it moving for reasons specific to that market?'
      ]
    },
    neutral:{
      risk:[
        'Keep the low market exposure, but review the cost of maintaining the pairs.',
        'Net exposure is <b>4%, within the ±10% band</b>. That leaves directional headroom, but gross exposure and rising NVO borrow costs still matter: a balanced pair can lose money through financing or a change in the relationship.',
        'Review borrow, liquidity, and pair concentration before adding size. If the NVO short is reduced, check the long leg too so the adjustment does not introduce an unintended market bet.'
      ],
      tech:[
        'Investigate the wider PG/CL spread before treating it as an entry.',
        'The pair is <b>2.1 standard deviations from its recent average</b>. That may offer a convergence opportunity, but a statistical gap is only useful if the economic relationship remains intact.',
        'Check for fresh news and changes in relative earnings expectations. Consider an addition only after confirming the thesis, borrow availability, and balance between the two legs.'
      ],
      pnl:[
        'Review the lagging technology pair while preserving the sources of convergence gains.',
        'Pharma and staples are contributing while the technology pair detracts. The <b>7.8% year-to-date return</b> supports the strategy so far, but does not establish that every pair still has a sound convergence case.',
        'Ask the pair owner what should close the gap and when. Compare the expected gain after financing with the cost of waiting before retaining or reallocating the risk.'
      ],
      ir:[
        'Explain how the fund makes money without implying that neutral means risk-free.',
        'The investor story is steady pair convergence with limited market exposure. Borrow costs, liquidity, and a breakdown in a pair relationship still deserve explanation alongside the <b>7.8% year-to-date gain</b>.',
        'Have the reporting owner check the neutrality and risk exhibits against the book. Can an investor understand both the source of returns and the circumstances in which the strategy could lose?'
      ],
      pos:[
        'Revisit the economics of LLY/NVO as the short becomes more expensive.',
        'NVO borrow has risen to <b>180 basis points</b>, which reduces the return available from convergence. The same review should consider both companies and their event calendars; holding two legs does not remove company-specific risk.',
        'Compare holding, resizing both legs, and exiting the pair after financing costs. Confirm the earnings and dividend dates before deciding that the event exposure is balanced.'
      ],
      research:[
        'Prioritize pair ideas that remain attractive after borrow and factor checks.',
        'LLY/NVO and V/MA screen well on relative scores, while COST/WMT deserves investigation. A score gap is a research lead, not proof that the two prices will converge.',
        'Ask for a concrete convergence catalyst and a reason the gap exists. Compare the expected return after financing, and reject candidates that depend on an unintended market or sector bet.'
      ],
      flows:[
        'Review crowding on each leg, especially the NVO short.',
        'Rising short interest can make borrow harder to obtain and an exit more expensive. A low net market exposure does not protect the fund from a squeeze in one side of a pair.',
        'Confirm borrow availability and the liquidity of both legs. Decide how the pair would be resized if the short becomes costly, without assuming the long can be left unchanged.'
      ],
      earnings:[
        'Prepare a joint earnings review for both sides of each pair.',
        'Relative guidance from LLY/NVO and V/MA can change the convergence case. Similar reporting dates help organize the review, but do not guarantee that the two earnings reactions will offset each other.',
        'Agree which difference in guidance would justify a tilt or an exit. Check the actual release timing and review the residual exposure if only one leg moves sharply.'
      ],
      macro:[
        'Retain the neutral stance while checking what a macro shock could still disturb.',
        'The illustrated CPI scenarios have a small direct portfolio impact. Financing, borrow costs, and changing relationships between the legs can still matter even when the market sensitivity is close to zero.',
        'Review those indirect risks before paying for a broad market hedge. Use an overlay only if the residual exposure warrants it, and recheck neutrality after any pair adjustment.'
      ],
      digital:[
        'Keep digital assets as a monitoring input for this mandate.',
        'Direct crypto exposure is near zero. Tokenized share prices may provide a reference, but differences in liquidity and trading hours can make an apparent discount difficult to capture.',
        'Check whether any existing leg has material crypto sensitivity. Investigate a basis opportunity only if settlement, costs, and the mandate support it; there is no need to create a directional position.'
      ]
    },
    digital:{
      risk:[
        'Create more room below the crypto exposure limit before adding to winners.',
        'Crypto sensitivity is <b>71% against a 75% cap</b>, with concentration in MSTR and COIN. The proposed protection deserves review, but it should not be assumed to solve the exposure limit or exchange-liquidity risks.',
        'Compare reducing a position with buying the put spread under the downside scenarios. Confirm the remaining exposure and available liquidity before considering another addition.'
      ],
      tech:[
        'Review the CLSK stop before considering a new SOL allocation.',
        'CLSK has broken its 200-day trend, while SOL remains a strong performer. The immediate question is whether to reduce the weaker position; chasing the winner first could add risk while the fund is close to its cap.',
        'Confirm the stop policy and executable market prices, then assess the effect of a reduction. Revisit a SOL entry only after checking the remaining risk budget and funding conditions.'
      ],
      pnl:[
        'Separate the gains in the major coins from the losses in the equity-linked positions.',
        'SOL and BTC are contributing, while miners, exchanges, and tokenized assets detract. The <b>34.1% year-to-date gain</b> should not obscure how much risk the weaker holdings consume during a drawdown.',
        'Review whether the miners still offer a better forward return than the alternatives. Compare a CLSK reduction with retaining it, using the thesis and risk budget as well as its recent loss.'
      ],
      ir:[
        'Lead the investor discussion with how the fund manages its volatility.',
        'The <b>34.1% year-to-date return</b> is only part of the story. Investors also need to understand custody, round-the-clock trading, and what happens if an exchange or tokenized market becomes difficult to access.',
        'Reconcile the return and risk exhibits, and verify the custody disclosures. Make sure the letter explains current protections and their limits before it is circulated.'
      ],
      pos:[
        'Give the desk a response plan for the events that can change holdings outside cash-market hours.',
        'COIN communication, MSTR financing, token unlocks, and exchange incidents can affect different parts of the book. A large wallet movement is a reason to investigate, not proof of an impending sale.',
        'Confirm the source and affected holdings for each material alert. Assign a review owner and agree what evidence would justify a position change, including when the desk is unstaffed.'
      ],
      research:[
        'Keep SOL on the candidate list, but resolve the existing risk pressure first.',
        'SOL leads the coin ranking while miners look weaker. That relative strength supports further work; it does not remove the entry-price risk or create additional capacity below the portfolio limit.',
        'Compare a measured SOL addition with retaining cash after any reduction. Define the entry conditions and downside case before deciding whether the expected gain justifies more exposure.'
      ],
      flows:[
        'Balance the supportive spot flows against the build-up in leverage.',
        'ETF inflows and stablecoin issuance suggest improving liquidity, but open interest is up <b>18%</b>. Spot demand and crowded leveraged positions can coexist, so the combined signal calls for care with sizing.',
        'Check whether inflows persist as funding cools. Avoid increasing leverage solely because flows look positive; agree what evidence would indicate an unwind instead.'
      ],
      earnings:[
        'Use the equity-linked results to test whether business performance supports the crypto exposure.',
        'COIN trading-volume commentary, MSTR financing, and miner cost guidance matter in different ways. A rising coin price does not necessarily improve the economics of every company held.',
        'Confirm the release times and ask the covering analysts what would change earnings or dilution assumptions. Reassess the relevant position after the evidence arrives, rather than trading on tone alone.'
      ],
      macro:[
        'Review crypto and growth-equity exposure together ahead of CPI.',
        'The elevated Bitcoin–Nasdaq relationship suggests that a macro sell-off could hit both parts of the book. Rising stablecoin liquidity is supportive, but may not offset a rate or dollar shock.',
        'Compare the combined downside scenario with the proposed protection. Decide how much shared market risk to carry and what change in the relationship would alter that decision.'
      ],
      digital:[
        'Prepare for a leverage unwind before acting on apparent weekend discounts.',
        'Elevated funding and open interest suggest crowded longs. Discounts in tokenized shares may flag a difficult cash open, but thin trading and differences in market access can also explain part of the gap.',
        'Review protection on MSTR and COIN, check exchange liquidity, and confirm underlying prices before acting on the tokenized basis. Keep the position-size decision separate from the monitoring signal.'
      ]
    }
  };
  Object.keys(agentMeta).forEach(k=>{
    const view=document.getElementById('view-'+k); if(!view) return;
    const head=view.querySelector('.view-head'); if(!head) return;
    const m=agentMeta[k];
    const el=document.createElement('section');
    el.className='decision-brief'+(m.sq==='gold'?' gold':'');
    el.setAttribute('aria-labelledby', 'decision-title-'+k);
    el.innerHTML=`
      <div class="db-head">
        <div class="db-icon" aria-hidden="true">${m.i}</div>
        <div>
          <h2 class="db-title" id="decision-title-${k}">Decision brief</h2>
          <div class="db-sub" id="decision-context-${k}"></div>
        </div>
        <span class="db-badge">Demo data</span>
      </div>
      <div class="db-body" id="decision-body-${k}"></div>`;
    head.insertAdjacentElement('afterend', el);
  });
  function renderDecisionBriefs(fund){
    const set=decisionBriefs[fund]||decisionBriefs.alpha;
    const selected=funds.find(f=>f.id===fund)||funds[0];
    Object.keys(agentMeta).forEach(k=>{
      const box=document.getElementById('decision-body-'+k); if(!box) return;
      document.getElementById('decision-context-'+k).textContent=selected.name+' · For the investment discussion';
      const [recommendation, rationale, discussion]=set[k];
      box.innerHTML=`<h3 class="db-recommendation">${recommendation}</h3>
        <p class="db-rationale">${rationale}</p>
        <div class="db-discussion"><h4>For the desk</h4><p>${discussion}</p></div>`;
    });
  }

  /* ---- per-fund detailed view tables ---- */
  const viewTables = {
    alpha:{
      riskKpis:[['VaR 99% · 1d','$ 14.3 M','1.15% of NAV'],['CVaR 99%','$ 21.8 M','worst 1% tail'],['Max drawdown YTD','−4.6%','Jun 12'],['Days to liquidate','2.4','90% at 20% ADV']],
      riskLimits:[
        ['Beta-adj net exposure',['warn','62.1%'],'60%',['warn','−2.1 pts'],'<b class="red">71%</b> / 78% / 82%','<span class="pill red">BREACH 1d</span>'],
        ['Gross exposure','184%','220%','36 pts','3% / 6% / 9%','<span class="pill good">OK</span>'],
        ['Single-name max','8.2% (NVDA)','10%','1.8 pts','12% / 18% / 22%','<span class="pill ok">watch</span>'],
        ['Sector cap · Semis','28%','30%','2 pts','22% / 31% / 38%','<span class="pill ok">watch</span>'],
        ['Crypto β exposure','17%','20%','3 pts','14% / 19% / 24%','<span class="pill ok">watch</span>'],
        ['VaR vs. NAV','1.15%','1.75%','60 bp','1% / 3% / 5%','<span class="pill good">OK</span>'],
        ['Days-to-liquidate','2.4','5.0','2.6d','0% / 1% / 2%','<span class="pill good">OK</span>']],
      tech:[
        ['NVDA','184.10','↑ above both','72','bear div','+2.1σ','175.4 (−5%)','low','<span class="pill red">CRIT · trim</span>'],
        ['TSLA','245.60','flat','58','rolling over','+0.8σ','243.1 (−1%)','mid','<span class="pill orange">WARN · stop near</span>'],
        ['META','592.44','↑ above both','66','pos','+1.4σ','561.0','low','<span class="pill orange">WARN · crowded</span>'],
        ['MSFT','412.90','↑ fading','49','bear cross','−1.1σ','398.0','low','<span class="pill orange">WARN · trim</span>'],
        ['AMD','168.30','↓ 50<200','44','neg','+1.8σ','161.0','low','<span class="pill orange">WARN</span>'],
        ['AAPL','234.00','↑','54','neutral','−0.2σ','222.5','low','<span class="pill good">OK</span>'],
        ['GOOGL','168.80','↑','51','neutral','−0.4σ','161.0','low','<span class="pill good">OK</span>']],
      pnlKpis:[['Day','+34 bps','$ 4.24 M','up'],['MTD','+1.82%','$ 22.7 M','up'],['QTD','+4.9%','$ 61.1 M','up'],['YTD','+18.4%','$ 229.6 M','up']],
      pnlTrims:[
        ['MSFT','284d','14d · <b class="red">expired</b>',['dn','−24 bp'],'18%','none in 20d','<span class="pill orange">Trim 25%</span>'],
        ['CRM','161d','22d',['dn','−9 bp'],'11%','Dreamforce +9d','<span class="pill ghost">Hold · catalyst near</span>'],
        ['NFLX','98d','18d',['up','+41 bp'],'8%','Earnings +12d','<span class="pill good">Hold</span>'],
        ['PEP (short)','72d','30d',['dn','−6 bp'],'5%','Earnings +3d','<span class="pill orange">Cover 50%</span>'],
        ['SNOW','44d','26d',['up','+17 bp'],'14%','Investor day +18d','<span class="pill good">Hold</span>']],
      posDrift:[
        ['NVDA','P. Shah','284d','Hyperscaler capex ↑, DGX cycle','Insider sales + 13D + skew spike',['orange','medium'],'<span class="pill orange">reassess</span>'],
        ['MSFT','K. Lee','420d','Copilot adoption, Azure growth','Azure decel 2Q, Copilot pricing cut',['red','high'],'<span class="pill red">trim</span>'],
        ['CRM','P. Shah','161d','Margin story, AI Cloud','Dreamforce near · tone cautious',['good','low'],'<span class="pill good">hold</span>'],
        ['UNH','M. O’Brien','88d','Medical loss ratio recovery','MLR flat; investor day +8d',['orange','medium'],'<span class="pill orange">watch</span>']],
      universe:[
        ['1','UBER',['good','0.89'],'84','↑↑','+2','pos','82.4–85.1','80.0–89.2','strong'],
        ['2','SPOT',['good','0.86'],'72','↑','+1','pos','441–452','432–466','fit'],
        ['3','ANET',['good','0.82'],'88','↑','+3','pos','412–421','402–432','fit'],
        ['4','LMRX (IPO)','0.80','n/a','new','init +3','pos','19.4–21.0','19.4–23.8','strong'],
        ['5','CLSK','0.78','61','↑↑','+1','pos','15.1–15.9','14.6–17.2','fit · crypto β'],
        ['496','WBA',['bad','0.14'],'42','↓↓','−4','neg','8.1–8.4','7.8–8.7','short'],
        ['497','HOG',['bad','0.13'],'44','↓','−3','neg','22.1–23.0','21.4–23.8','short']],
      crowding:[
        ['META',['warn','92'],'14.1%','+7 pts','1.1%','steep','<span class="pill red">de-gross risk</span>'],
        ['NVDA',['warn','88'],'18.4%','+3 pts','1.4%','steep','<span class="pill orange">watch</span>'],
        ['GOOGL','71','11.0%','+1','0.8%','mild','<span class="pill ghost">neutral</span>'],
        ['UBER','52','8.7%','+2','1.0%','mild','<span class="pill good">OK</span>'],
        ['COIN','66','9.4%','+1','3.6%','steep','<span class="pill orange">watch</span>'],
        ['WBA (short)','24','3.1%','−1','12.4%','flat','<span class="pill good">OK</span>']],
      tone:[
        ['JPM (upcoming)','Thu 09:00',['orange','−0.21'],'↑','cautious consumer','V · MA · AXP'],
        ['NFLX','Sep 24',['good','+0.34'],'↓','raised','DIS · ROKU'],
        ['NVDA','Aug 28',['good','+0.18'],'flat','strong','AVGO · AMD · ANET'],
        ['MSFT','Jul 30',['bad','−0.42'],'↑↑','reaffirmed','AMZN AWS · GOOGL'],
        ['META','Jul 31',['good','+0.22'],'↓','reaffirmed','GOOGL · PINS · SNAP']],
      betas:[
        ['NVDA','−0.42','−0.18','+0.02','−0.63',['dn','−$ 820k']],
        ['MSFT','−0.31','−0.11','+0.01','−0.49',['dn','−$ 410k']],
        ['META','−0.28','−0.14','+0.01','−0.52',['dn','−$ 362k']],
        ['XLE basket','+0.14','−0.22','+0.61','−0.18',['up','+$ 141k']],
        ['UNH (short)','+0.09','+0.04','−0.02','+0.11',['up','+$ 61k']]],
      bridge:[
        ['COIN','0.86 BTC','$ 42.1 M',['dn','−$ 760k'],'<span class="pill orange">watch</span>'],
        ['MSTR','1.42 BTC','$ 61.8 M',['dn','−$ 1.84 M'],'<span class="pill red">put spread queued</span>'],
        ['HOOD','0.44 BTC','$ 18.4 M',['dn','−$ 170k'],'<span class="pill ghost">OK</span>'],
        ['CLSK','1.14 BTC','$ 11.1 M',['dn','−$ 266k'],'<span class="pill good">OK</span>']]
    },
    global:{
      riskKpis:[['VaR 99% · 1d','$ 9.8 M','1.16% of NAV'],['CVaR 99%','$ 15.1 M','worst 1% tail'],['Max drawdown YTD','−3.1%','Aug 4'],['Days to liquidate','1.2','futures liquid']],
      riskLimits:[
        ['Portfolio DV01',['warn','0.9×'],'1.0×',['warn','0.1×'],'<b class="red">64%</b> / 71% / 75%','<span class="pill red">BREACH 1d</span>'],
        ['Net exposure','38%','50%','12 pts','3% / 5% / 8%','<span class="pill good">OK</span>'],
        ['Gross exposure','142%','200%','58 pts','1% / 2% / 3%','<span class="pill good">OK</span>'],
        ['FX single-pair','9% (JPY)','15%','6 pts','18% / 24% / 29%','<span class="pill ok">watch</span>'],
        ['Commodity VaR','31%','40%','9 pts','12% / 18% / 24%','<span class="pill ok">watch</span>'],
        ['Leverage (futures)','3.1×','5.0×','1.9×','0% / 1% / 2%','<span class="pill good">OK</span>'],
        ['VaR vs. NAV','1.16%','1.75%','59 bp','1% / 2% / 4%','<span class="pill good">OK</span>']],
      tech:[
        ['GC Gold','2,412','↑ above both','74','pos','+2.3σ','2,350 (−3%)','—','<span class="pill orange">WARN · overbought</span>'],
        ['TY 10Y','108.4','↓ 50<200','31','bear trend','+1.6σ','109.2','—','<span class="pill gold">signal · short</span>'],
        ['ES S&P','5,842','↑','58','pos','+0.5σ','5,710','—','<span class="pill good">OK</span>'],
        ['CL Crude','78.2','↑','61','pos','+1.1σ','74.5','—','<span class="pill good">OK</span>'],
        ['DX USD','101.6','flat','55','neutral','+0.3σ','100.2','—','<span class="pill ok">watch · breakout</span>'],
        ['HG Copper','4.21','↑','57','turning up','+0.9σ','4.02','—','<span class="pill good">OK</span>'],
        ['6E EUR','1.086','↓','46','neg','−0.6σ','1.078','—','<span class="pill ok">watch</span>']],
      pnlKpis:[['Day','−12 bps','−$ 1.01 M','dn'],['MTD','+0.9%','$ 7.6 M','up'],['QTD','+3.1%','$ 26.1 M','up'],['YTD','+11.2%','$ 94.3 M','up']],
      pnlTrims:[
        ['Short 10Y (TY)','40d','—',['up','+22 bp'],'22%','CPI +1d','<span class="pill good">Hold · catalyst</span>'],
        ['Long Gold (GC)','95d','—',['up','+71 bp'],'18%','FOMC +14d','<span class="pill orange">Trim 20% · overbought</span>'],
        ['Long FXI','28d','—',['up','+38 bp'],'9%','stimulus','<span class="pill good">Add</span>'],
        ['Short JPY','61d','—',['dn','−22 bp'],'11%','BOJ risk','<span class="pill orange">Trim 25%</span>'],
        ['Long Crude (CL)','52d','—',['up','+29 bp'],'8%','OPEC+ +10d','<span class="pill good">Hold</span>']],
      posDrift:[
        ['Long Gold','Suresh','95d','Real-rate decline, CB buying','CB buying persists; RSI overbought',['orange','medium'],'<span class="pill orange">trim</span>'],
        ['Short 10Y','K. Lee','40d','Sticky inflation, term premium','PPI hot; thesis strengthening',['good','low'],'<span class="pill good">hold</span>'],
        ['Long FXI','P. Shah','28d','China stimulus inflection','Stimulus headline confirmed',['good','low'],'<span class="pill good">add</span>'],
        ['Short JPY','Suresh','61d','Yield differential','Intervention risk rising',['red','high'],'<span class="pill red">reduce</span>']],
      universe:[
        ['1','Gold (GC)',['good','0.91'],'—','↑↑','—','pos','2,400–2,420','2,360–2,460','strong'],
        ['2','EM (EEM)',['good','0.84'],'—','↑','—','pos','41.2–42.0','40.1–43.4','fit'],
        ['3','Copper (HG)',['good','0.79'],'—','↑','—','pos','4.18–4.25','4.05–4.38','fit'],
        ['4','Crude (CL)','0.74','—','↑','—','pos','77.5–79.1','75.0–81.2','fit'],
        ['5','S&P (ES)','0.68','—','↑','—','neutral','5,820–5,865','5,760–5,910','hold'],
        ['28','USD (DX)',['bad','0.22'],'—','↓','—','neg','101.2–101.9','100.4–102.3','short']],
      crowding:[
        ['Gold (spec CoT)',['warn','89'],'—','+9%','—','—','<span class="pill orange">crowded long</span>'],
        ['Crude (spec CoT)','78','—','+6%','—','—','<span class="pill ok">watch</span>'],
        ['10Y (rate-vol)',['warn','84'],'—','short','—','steep','<span class="pill red">unwind risk</span>'],
        ['USD (net short)','66','—','building','—','—','<span class="pill ghost">neutral</span>'],
        ['EM (EEM flows)','41','—','+$1.2B','—','mild','<span class="pill good">turning +</span>']],
      tone:[
        ['JPM (upcoming)','Thu 09:00',['orange','−0.21'],'↑','cautious consumer','rate / credit view'],
        ['Fed (FOMC)','Sep 18',['orange','−0.15'],'↑','data-dependent','rates · USD'],
        ['ECB','Sep 12',['bad','−0.28'],'↑↑','hawkish hold','EUR · BTP'],
        ['Oil majors (XOM)','Aug 2',['good','+0.12'],'flat','capex steady','crude · HG'],
        ['Retailers (WMT)','Aug 15',['orange','−0.18'],'↑','cautious','consumer macro']],
      betas:[
        ['ES S&P','−0.38','−0.16','+0.03','−0.71',['dn','−$ 1.42 M']],
        ['TY 10Y (short)','+0.92','+0.08','−0.01','+0.14',['up','+$ 2.10 M']],
        ['GC Gold','−0.24','−0.61','+0.08','+0.22',['dn','−$ 540k']],
        ['CL Crude','+0.11','−0.34','+0.88','−0.12',['up','+$ 180k']],
        ['6E EUR','−0.06','−0.82','+0.02','−0.09',['dn','−$ 410k']]],
      bridge:[
        ['(no direct crypto)','—','—','—','<span class="pill ghost">monitoring only</span>'],
        ['BTC–DXY correlation','−0.42','—','—','<span class="pill ghost">macro signal</span>'],
        ['Stablecoin supply','+$1.4B','—','—','<span class="pill good">risk-on</span>']]
    },
    neutral:{
      riskKpis:[['VaR 99% · 1d','$ 6.1 M','0.39% of NAV'],['CVaR 99%','$ 8.4 M','worst 1% tail'],['Max drawdown YTD','−1.8%','May 20'],['Days to liquidate','3.1','paired unwind']],
      riskLimits:[
        ['Net exposure',['good','4%'],'±10%','6 pts','1% / 1% / 2%','<span class="pill good">OK</span>'],
        ['Gross exposure','210%','240%','30 pts','4% / 7% / 10%','<span class="pill ok">watch</span>'],
        ['Single-pair max','6.2% (LLY/NVO)','8%','1.8 pts','9% / 14% / 18%','<span class="pill ok">watch</span>'],
        ['Factor net (momentum)','0.03','±0.15','ample','0% / 1% / 2%','<span class="pill good">OK</span>'],
        ['Short borrow avg','96 bp','200 bp','104 bp','2% / 4% / 6%','<span class="pill good">OK</span>'],
        ['Beta to S&P','0.04','±0.10','ample','0% / 1% / 1%','<span class="pill good">OK</span>'],
        ['VaR vs. NAV','0.39%','1.00%','61 bp','0% / 1% / 2%','<span class="pill good">OK</span>']],
      tech:[
        ['LLY/NVO','pair','spread +2.1σ','—','mean-rev','+2.1σ','conv target','—','<span class="pill orange">WARN · add</span>'],
        ['PG/CL','pair','spread +2.1σ','—','mean-rev','+2.1σ','conv target','—','<span class="pill orange">WARN · add</span>'],
        ['COST/WMT','pair','spread +1.4σ','—','widening','+1.4σ','—','—','<span class="pill ok">watch</span>'],
        ['V/MA','pair','spread +0.8σ','—','tightening','+0.8σ','—','—','<span class="pill good">OK</span>'],
        ['HD/LOW','pair','spread −0.3σ','—','neutral','−0.3σ','—','—','<span class="pill good">OK</span>'],
        ['GOOGL/META','pair','spread +0.5σ','—','neutral','+0.5σ','—','—','<span class="pill good">OK</span>']],
      pnlKpis:[['Day','+9 bps','$ 1.40 M','up'],['MTD','+0.7%','$ 10.9 M','up'],['QTD','+2.1%','$ 32.8 M','up'],['YTD','+7.8%','$ 121.7 M','up']],
      pnlTrims:[
        ['PG/CL pair','120d','—',['up','+41 bp'],'12%','reversion','<span class="pill good">Add 15%</span>'],
        ['GOOG/META pair','64d','—',['dn','−18 bp'],'9%','earnings','<span class="pill orange">Reduce</span>'],
        ['LLY/NVO pair','88d','—',['up','+52 bp'],'14%','GLP-1 data','<span class="pill good">Hold</span>'],
        ['COST/WMT pair','44d','—',['up','+28 bp'],'8%','holiday sales','<span class="pill good">Hold</span>'],
        ['V/MA pair','72d','—',['up','+33 bp'],'10%','JPM read','<span class="pill good">Hold</span>']],
      posDrift:[
        ['LLY/NVO','P. Shah','88d','GLP-1 share shift to LLY','On track; GLP-1 data +12d',['good','low'],'<span class="pill good">hold</span>'],
        ['V/MA','M. O’Brien','72d','V volume growth edge','V revisions turning +',['good','low'],'<span class="pill good">tilt V</span>'],
        ['PG/CL','K. Lee','120d','Valuation spread','Spread 2.1σ wide — add',['good','low'],'<span class="pill good">add</span>'],
        ['GOOG/META','P. Shah','64d','Ad-share rotation','Converging faster than modeled',['orange','medium'],'<span class="pill orange">reduce</span>']],
      universe:[
        ['1','LLY/NVO',['good','0.88'],'—','rev','+2','pos','spread','conv 2.1σ','strong pair'],
        ['2','V/MA',['good','0.81'],'—','rev','+1','pos','spread','conv 0.8σ','fit'],
        ['3','COST/WMT',['good','0.77'],'—','rev','+1','pos','spread','widen 1.4σ','fit'],
        ['4','HD/LOW','0.71','—','neutral','0','neutral','spread','±0.3σ','hold'],
        ['5','PG/CL','0.69','—','rev','+1','pos','spread','conv 2.1σ','add'],
        ['44','KO/PEP',['bad','0.31'],'—','div','−1','neg','spread','−1.2σ','unwind']],
      crowding:[
        ['LLY/NVO pair','58','long 14% / short 6%','+2','NVO 4.1%','mild','<span class="pill good">OK</span>'],
        ['GOOG/META pair','62','crowded both legs','+3','1.1%','mild','<span class="pill ok">watch</span>'],
        ['V/MA pair','49','long 11% / short 9%','+1','1.0%','mild','<span class="pill good">OK</span>'],
        ['PG/CL pair','37','balanced','0','0.9%','flat','<span class="pill good">OK</span>'],
        ['NVO (short leg)','—','—','—','4.1%','—','<span class="pill orange">borrow 180bp</span>']],
      tone:[
        ['LLY vs NVO','both +12d',['good','+0.20 / −0.05'],'↓ / ↑','LLY raised','pair tilt → LLY'],
        ['V vs MA','both +6d',['good','+0.14 / +0.02'],'↓','V edge','pair tilt → V'],
        ['COST vs WMT','both +9d',['good','+0.18 / −0.10'],'↓ / ↑','COST strong','pair tilt → COST'],
        ['PG vs CL','both +14d',['ghost','+0.04 / −0.02'],'flat','in line','neutral'],
        ['GOOG vs META','both +11d',['orange','+0.05 / +0.22'],'↓','META stronger','reduce pair']],
      betas:[
        ['LLY/NVO pair','−0.02','−0.01','0.00','−0.03',['dn','−$ 40k']],
        ['V/MA pair','−0.01','0.00','0.00','−0.02',['dn','−$ 22k']],
        ['Net book','+0.01','−0.02','+0.01','−0.05',['dn','−$ 118k']],
        ['Residual beta','0.04','−0.03','+0.01','−0.08','≈ flat'],
        ['(hedge overlay)','—','—','—','—','neutralizes']],
      bridge:[
        ['(no direct crypto)','—','—','—','<span class="pill ghost">monitoring only</span>'],
        ['Hedge-leg β check','≈ 0','—','—','<span class="pill good">clean</span>']]
    },
    digital:{
      riskKpis:[['24/7 VaR 99%','$ 11.2 M','3.52% of NAV'],['CVaR 99%','$ 18.9 M','worst 1% tail'],['Max drawdown YTD','−12.4%','Sep 2'],['Days to liquidate','1.8','exchange depth']],
      riskLimits:[
        ['Crypto-β exposure',['warn','71%'],'75%',['warn','4 pts'],'<b class="red">68%</b> / 74% / 79%','<span class="pill red">near limit</span>'],
        ['Single-name max','14% (CLSK)','15%','1 pt','22% / 29% / 35%','<span class="pill ok">watch</span>'],
        ['Net exposure','71%','80%','9 pts','14% / 19% / 24%','<span class="pill ok">watch</span>'],
        ['Stablecoin buffer','4.0%','min 3%','1 pt','—','<span class="pill good">OK</span>'],
        ['Exchange concentration','38%','50%','12 pts','3% / 6% / 9%','<span class="pill good">OK</span>'],
        ['24/7 VaR vs. NAV','3.52%','4.00%','48 bp','8% / 14% / 19%','<span class="pill ok">watch</span>']],
      tech:[
        ['CLSK','15.4','↓ 50<200','38','bear break','+2.2σ','stop hit','high','<span class="pill red">CRIT · cut</span>'],
        ['SOL','242','↑↑','71','pos','+2.6σ','218','high','<span class="pill gold">signal · momo</span>'],
        ['MSTR','352.10','↑','71','bear div','+2.9σ','330.0','mid','<span class="pill orange">WARN</span>'],
        ['COIN','218.70','↑','63','pos','+2.4σ','204.0','mid','<span class="pill orange">WARN</span>'],
        ['BTC','101,842','↑ above both','54','rolling','+1.2σ','96,500','mid','<span class="pill ok">watch · funding</span>'],
        ['ETH','3,842','↑','49','neg','−0.4σ','3,640','mid','<span class="pill ok">watch</span>'],
        ['tNVDA','184.10','basis −2.8%','—','gap','—','—','—','<span class="pill ok">weekend gap</span>']],
      pnlKpis:[['Day','−2.1%','−$ 6.80 M','dn'],['MTD','+6.4%','$ 20.4 M','up'],['QTD','+14.2%','$ 45.2 M','up'],['YTD','+34.1%','$ 108.6 M','up']],
      pnlTrims:[
        ['CLSK','44d','9d · <b class="red">expired</b>',['dn','−62 bp'],'14%','200-day break','<span class="pill red">Exit</span>'],
        ['SOL','31d','18d',['up','+74 bp'],'12%','momentum','<span class="pill good">Hold · trail stop</span>'],
        ['MSTR','120d','—',['dn','−41 bp'],'8%','BTC beta','<span class="pill orange">Hedge</span>'],
        ['tNVDA','14d','—',['dn','−24 bp'],'7%','basis gap','<span class="pill ok">Watch</span>'],
        ['BTC spot','210d','—',['up','+44 bp'],'27%','funding','<span class="pill good">Hold · hedged</span>']],
      posDrift:[
        ['CLSK','P. Shah','44d','Low-cost BTC mining','Hashprice falling; 200-day break',['red','high'],'<span class="pill red">exit</span>'],
        ['SOL','Suresh','31d','Ecosystem + ETF optionality','Momentum + flows confirm',['good','low'],'<span class="pill good">hold</span>'],
        ['MSTR','K. Lee','120d','BTC-per-share accretion','Premium to NAV elevated',['orange','medium'],'<span class="pill orange">hedge</span>'],
        ['COIN','M. O’Brien','98d','Volume + regulatory clarity','Funding crowded; squeeze risk',['orange','medium'],'<span class="pill orange">watch</span>']],
      universe:[
        ['1','SOL',['good','0.90'],'—','↑↑','—','pos','238–246','228–262','strong'],
        ['2','BTC',['good','0.82'],'—','↑','—','pos','100.1k–103k','97k–108k','fit'],
        ['3','ETH',['good','0.76'],'—','↑','—','pos','3,800–3,890','3,640–4,020','fit'],
        ['4','tAAPL','0.70','—','basis','—','neutral','231–236','—','arb'],
        ['5','HOOD','0.64','—','↑','+1','pos','22.4–23.6','21.8–24.9','fit'],
        ['24','CLSK',['bad','0.28'],'—','↓↓','−2','neg','14.6–15.4','13.9–16.1','exit']],
      crowding:[
        ['BTC (ETF)',['warn','86'],'—','+$1.4B','—','—','<span class="pill orange">crowded long</span>'],
        ['MSTR',['warn','81'],'9.0%','+2','4.2%','steep','<span class="pill orange">watch</span>'],
        ['SOL','72','—','+$0.3B','—','—','<span class="pill ok">momentum</span>'],
        ['COIN','66','9.4%','+1','3.6%','steep','<span class="pill orange">watch</span>'],
        ['CLSK','34','5.1%','−2','8.4%','flat','<span class="pill good">OK</span>']],
      tone:[
        ['COIN (pre-announce)','16:30 today',['orange','−0.10'],'↑','volume-driven','MSTR · HOOD'],
        ['MSTR','Aug 1',['good','+0.25'],'↓','BTC accretion','COIN · miners'],
        ['CLSK','Aug 8',['bad','−0.35'],'↑↑','cost pressure','miners'],
        ['HOOD','Jul 31',['good','+0.16'],'↓','crypto rev up','COIN'],
        ['RIOT','Aug 6',['bad','−0.22'],'↑','hashprice','CLSK · MARA']],
      betas:[
        ['BTC','−0.58','−0.31','+0.04','−0.74',['dn','−$ 1.90 M']],
        ['ETH','−0.66','−0.28','+0.03','−0.81',['dn','−$ 980k']],
        ['MSTR','−0.82','−0.44','+0.05','−1.12',['dn','−$ 1.52 M']],
        ['COIN','−0.71','−0.38','+0.04','−0.96',['dn','−$ 760k']],
        ['CLSK','−0.94','−0.41','+0.06','−1.24',['dn','−$ 410k']]],
      bridge:[
        ['BTC spot','1.00','$ 21.4 M',['dn','−$ 449k'],'<span class="pill ok">watch</span>'],
        ['ETH spot','1.24','$ 10.8 M',['dn','−$ 367k'],'<span class="pill ok">watch</span>'],
        ['MSTR','1.42','$ 6.2 M',['dn','−$ 184k'],'<span class="pill red">hedge</span>'],
        ['COIN','0.86','$ 9.2 M',['dn','−$ 160k'],'<span class="pill orange">watch</span>'],
        ['CLSK','1.14','$ 11.1 M',['dn','−$ 266k'],'<span class="pill red">cut</span>']]
    }
  };
  function vrow(cells){ return '<tr>'+cells.map(c=>Array.isArray(c)?`<td class="${c[0]}">${c[1]}</td>`:`<td>${c}</td>`).join('')+'</tr>'; }
  function vfill(id, rows){ const b=document.getElementById(id); if(b) b.innerHTML=(rows||[]).map(vrow).join(''); }
  function vkpi(id, kpis){ const g=document.getElementById(id); if(!g) return; g.innerHTML=(kpis||[]).map(k=>`<div class="kpi"><div class="k-lab">${k[0]}</div><div class="k-val ${k[3]||''}">${k[1]}</div><div class="k-sub">${k[2]}</div></div>`).join(''); }
  function renderViews(fund){
    const d=viewTables[fund]||viewTables.alpha;
    vkpi('risk-kpis', d.riskKpis); vfill('risk-limits', d.riskLimits);
    vfill('tech-rows', d.tech);
    vkpi('pnl-kpis', d.pnlKpis); vfill('pnl-trims', d.pnlTrims);
    vfill('pos-drift', d.posDrift);
    vfill('research-universe', d.universe);
    vfill('flows-crowding', d.crowding);
    vfill('earnings-tone', d.tone);
    vfill('macro-betas', d.betas);
    vfill('digital-bridge', d.bridge);
  }

  /* ---- per-fund secondary panels ---- */
  const panelData = {
    alpha:{
      whatifSelect:'Trim NVDA 12% + SMH Nov 215/205 put spread',
      whatif:[['Beta-net','62.1% → <b class="good">55.4%</b>'],['Gross','184% → 172%'],['VaR 99%','$14.3M → $11.1M'],['Alpha cost','6 bps'],['Carry cost','0.4 bps/mo'],['Breach prob 1d','<b class="good">9%</b>']],
      stress:[['−5% equities · +50bp 10Y','−$ 23.4 M'],['Semis −8%','−$ 11.6 M'],['BTC −15% + funding spike','−$ 6.1 M'],['USD +3% DXY','−$ 2.9 M'],['Vol regime (VIX >30)','−$ 18.0 M']],
      pnlStats:[['Hit rate','62%'],['W/L ratio','1.84'],['Alpha half-life','14d']],
      cal:[['Tue Oct 8','CPI 08:30 · <span class="red">macro</span>'],['Wed Oct 9','JPM Q3 earnings pre-mkt'],['Thu Oct 10','LMRX coverage initiations'],['Thu Oct 10','Fed minutes 14:00'],['Fri Oct 11','UNH Q3 · PPI 08:30'],['Mon Oct 14','WFC + C earnings'],['Wed Oct 16','NVDA GTC keynote']],
      news:[['05:12','Bloomberg','<b>Nvidia</b> insider sales total $220M over 10 days','pill red','neg'],['04:48','Reuters','<b>Meta</b> secures EU AI compliance ruling','pill good','pos'],['03:21','13D filing','<b>Elliott</b> discloses 1.9% in NVDA','pill orange','watch'],['22:40','Semafor','Semi tariffs: Treasury eases TSMC carve-outs','pill good','pos'],['20:11','8-K','<b>SNOW</b> CFO transition, reaffirms guide','pill ghost','neutral']],
      explainName:'UBER (long)',
      explain:[['Quality',84,'0.84'],['Momentum',78,'0.78'],['Revisions',71,'0.71'],['Sentiment',68,'0.68'],['Macro fit',62,'0.62']],
      explainTxt:'Model attributes <b>0.89</b> to: free-cash-flow inflection, autonomous optionality now partially priced, CFO insider buying ($2.1M on 09/22), and positive EBITDA revisions. Risk: delivery-margin compression if GLP-1 demand drag persists.',
      divergence:[['<b>META</b> — Point long · 4 of top-10 funds trimming','pill orange','divergent'],['<b>UBER</b> — Point long · Lone Pine, Tiger initiations','pill good','aligned'],['<b>MSFT</b> — Point long · Viking cut 40% QoQ','pill orange','divergent'],['<b>UNH</b> — Point short · Berkshire added','pill red','counter'],['<b>CRM</b> — Point long · ValueAct topped up','pill good','aligned']],
      etf:[['SPY',70,'','+$ 3.1 B'],['QQQ',52,'','+$ 1.8 B'],['SMH',28,'','+$ 0.7 B'],['IWM',34,'bad','−$ 0.9 B'],['XLE',14,'','+$ 0.3 B'],['IBIT (BTC)',46,'gold','+$ 1.4 B'],['ETHA (ETH)',12,'gold','+$ 0.2 B']],
      social:[['NVDA',22,58,'58/22'],['TSLA',38,42,'42/38'],['META',14,68,'68/14'],['COIN',20,60,'60/20'],['AMD',28,48,'48/28']],
      scenario:[['Base case','<b class="good">+$ 1.2 M</b>'],['Hot CPI (+0.4% MoM core)','<b class="dn">−$ 4.78 M · −38 bps</b>'],['Cold CPI (0.1%)','<b class="up">+$ 6.1 M · +49 bps</b>'],['Fed +25 surprise','<b class="dn">−$ 7.9 M</b>'],['10Y +50 bp','<b class="dn">−$ 9.4 M</b>'],['Risk-off (VIX >30)','<b class="dn">−$ 18.0 M</b>']]
    },
    global:{
      whatifSelect:'Add 0.6× ZN DV01 ladder + trim JPY short',
      whatif:[['DV01','0.9× → <b class="good">0.4×</b>'],['Net','38% → 34%'],['VaR 99%','$9.8M → $7.1M'],['Carry','1.8 bps/mo'],['Hot-CPI PnL','−$4.78M → −$1.4M'],['Breach prob 1d','<b class="good">11%</b>']],
      stress:[['10Y +50bp','−$ 9.4 M'],['Hot CPI (+0.4% core)','−$ 4.78 M'],['USD +3% DXY','−$ 6.2 M'],['Oil −10%','−$ 3.1 M'],['Risk-off (VIX >30)','−$ 12.4 M']],
      pnlStats:[['Hit rate','57%'],['W/L ratio','1.41'],['Avg hold','9d']],
      cal:[['Tue Oct 8','CPI 08:30 · <span class="red">key print</span>'],['Thu Oct 10','Fed minutes 14:00'],['Thu Oct 10','3Y / 10Y auctions'],['Fri Oct 11','PPI 08:30'],['Wed Oct 16','ECB minutes'],['Thu Oct 17','China GDP'],['Fri Oct 18','OPEC+ monthly report']],
      news:[['05:30','Bloomberg','China unveils <b>stimulus</b> package; FXI bid','pill good','pos'],['04:10','Reuters','<b>BOJ</b> signals intervention risk above 158','pill orange','watch'],['02:50','WSJ','Services <b>PPI</b> runs hot — rate-vol bid','pill red','neg'],['22:05','FT','<b>OPEC+</b> holds output; crude backwardation','pill good','pos'],['19:40','Fed wire','Treasury hints slower <b>QT</b> taper','pill good','pos']],
      explainName:'Gold (long)',
      explain:[['Momentum',88,'0.88'],['Real-rate fit',82,'0.82'],['CB demand',76,'0.76'],['Flow',71,'0.71'],['Macro regime',69,'0.69']],
      explainTxt:'Model attributes <b>0.91</b> to: falling real rates into the cut cycle, persistent central-bank buying, ETF inflows (+$1.9B 5d), and a weakening USD. Risk: a hot CPI that reprices the Fed path and lifts real yields.',
      divergence:[['<b>Gold</b> — Point long · specs crowded same side','pill orange','crowded'],['<b>10Y</b> — Point short · rate-vol sellers aligned','pill good','aligned'],['<b>USD</b> — Point short · CTAs flipping short','pill good','aligned'],['<b>EM</b> — Point long · inflows turning positive','pill good','aligned'],['<b>JPY</b> — Point short · intervention counter-risk','pill red','counter']],
      etf:[['TLT (bonds)',40,'bad','−$ 1.2 B'],['GLD (gold)',66,'gold','+$ 1.9 B'],['UUP (USD)',24,'bad','−$ 0.5 B'],['FXI (China)',58,'','+$ 1.6 B'],['EEM (EM)',44,'','+$ 1.1 B'],['USO (oil)',30,'','+$ 0.6 B'],['DBC (commod)',22,'','+$ 0.4 B']],
      social:[['Gold',16,62,'62/16'],['Crude',30,50,'50/30'],['USD',34,40,'40/34'],['China/FXI',22,58,'58/22'],['Rates',44,32,'32/44']],
      scenario:[['Base case','<b class="good">+$ 2.1 M</b>'],['Hot CPI (+0.4% core)','<b class="up">+$ 2.4 M · short rates win</b>'],['Cold CPI (0.1%)','<b class="dn">−$ 3.2 M</b>'],['Fed +25 surprise','<b class="up">+$ 3.8 M</b>'],['10Y +50 bp','<b class="up">+$ 2.1 M</b>'],['Risk-off (VIX >30)','<b class="dn">−$ 12.4 M</b>']]
    },
    neutral:{
      whatifSelect:'Add 15% to PG/CL pair (beta-neutral)',
      whatif:[['Net beta','0.04 → <b class="good">0.02</b>'],['Gross','210% → 212%'],['VaR 99%','$6.1M → $6.0M'],['Pair z','+2.1σ add'],['Carry','0.2 bps/mo'],['Breach prob 1d','<b class="good">1%</b>']],
      stress:[['−5% equities (beta-hedged)','−$ 1.8 M'],['Pair divergence +1σ','−$ 2.4 M'],['Borrow +100bp','−$ 0.9 M'],['Factor shock (momentum)','−$ 1.1 M'],['Vol regime (VIX >30)','−$ 2.0 M']],
      pnlStats:[['Hit rate','64%'],['W/L ratio','1.22'],['Pair conv.','11d']],
      cal:[['Tue Oct 8','CPI (low book impact)'],['Wed Oct 9','LLY / NVO both report +12d'],['Fri Oct 11','V / MA both +6d'],['Mon Oct 14','COST / WMT pair events'],['Wed Oct 16','PG / CL pair +14d'],['Thu Oct 17','index rebalance preview'],['Fri Oct 18','borrow-rate review']],
      news:[['05:20','Bloomberg','<b>Novo</b> borrow fee spikes to 180bp','pill orange','watch'],['04:30','Reuters','<b>Lilly</b> GLP-1 share gains confirmed','pill good','pos'],['03:00','8-K','<b>Visa</b> volume data ahead of MA','pill good','pos'],['21:30','WSJ','Staples valuation spread at 60-day wide','pill ghost','neutral'],['18:15','filing','Index rebalance preview — pair flows','pill ghost','neutral']],
      explainName:'LLY/NVO (pair)',
      explain:[['Pair z-score',88,'0.88'],['Fundamental gap',74,'0.74'],['Borrow avail',71,'0.71'],['Revisions',66,'0.66'],['Beta neutrality',92,'0.92']],
      explainTxt:'Model attributes <b>0.88</b> to the long-LLY / short-NVO spread: GLP-1 share shift to LLY, a 2.1σ valuation dislocation with no catalyst, ample borrow, and near-zero net beta. Risk: a surprise NVO trial read-out.',
      divergence:[['<b>LLY/NVO</b> — pair · smart money tilts LLY','pill good','aligned'],['<b>V/MA</b> — pair · consensus favors V','pill good','aligned'],['<b>GOOG/META</b> — pair · crowded both legs','pill orange','crowded'],['<b>PG/CL</b> — pair · no smart-money signal','pill ghost','neutral'],['<b>NVO</b> — short leg · borrow pressure building','pill orange','watch']],
      etf:[['XLP staples',38,'','+$ 0.5 B'],['XLV health',52,'','+$ 0.9 B'],['XLY discr',30,'bad','−$ 0.4 B'],['XLK tech',46,'','+$ 0.8 B'],['XLF fins',34,'','+$ 0.6 B'],['Momentum ETF',20,'bad','−$ 0.3 B'],['Low-vol ETF',28,'','+$ 0.4 B']],
      social:[['LLY',14,66,'66/14'],['NVO',38,40,'40/38'],['V',18,60,'60/18'],['MA',24,52,'52/24'],['COST',16,64,'64/16']],
      scenario:[['Base case','<b class="good">+$ 0.4 M</b>'],['Hot CPI (+0.4% core)','<b class="dn">−$ 0.3 M · < ±8 bps</b>'],['Cold CPI (0.1%)','<b class="up">+$ 0.5 M</b>'],['Fed +25 surprise','<b class="dn">−$ 0.6 M</b>'],['10Y +50 bp','<b class="dn">−$ 0.4 M</b>'],['Risk-off (VIX >30)','<b class="dn">−$ 2.0 M</b>']]
    },
    digital:{
      whatifSelect:'Buy MSTR/COIN put spread ($0.6M premium)',
      whatif:[['Crypto-β','71% → <b class="good">58%</b>'],['Net','71% → 61%'],['24/7 VaR','$11.2M → $8.4M'],['Premium','$0.6M'],['Carry','n/a'],['Breach prob 1d','<b class="good">22%</b>']],
      stress:[['BTC −15% + funding spike','−$ 6.1 M'],['Alt −25% (SOL/CLSK)','−$ 7.8 M'],['Exchange outage / depeg','−$ 4.2 M'],['Risk-off (VIX >30)','−$ 9.0 M'],['Tokenized gap −5%','−$ 1.4 M']],
      pnlStats:[['Hit rate','51%'],['W/L ratio','1.96'],['Avg hold','6d']],
      cal:[['Sat / Sun','24/7 — weekend coverage'],['Mon Oct 7','COIN pre-announce 16:30'],['Tue Oct 8','CPI 08:30 (BTC-rate β)'],['Wed Oct 9','token unlock · ARB'],['Thu Oct 10','spot ETH ETF flow data'],['Fri Oct 11','SEC crypto roundtable'],['Ongoing','on-chain whale alerts']],
      news:[['Sat 02:14','on-chain','<b>BTC</b> funding +0.082%, OI +18%','pill red','neg'],['Sat 06:40','Glassnode','Stablecoin mint <b>+$1.4B</b> — risk-on','pill good','pos'],['Sun 11:20','exchange','<b>CLSK</b> breaks 200-day on thin volume','pill red','neg'],['Sun 19:05','SEC','Crypto roundtable scheduled Fri','pill orange','watch'],['Mon 04:30','venue','<b>tNVDA</b> basis −2.8% vs NYSE close','pill orange','watch']],
      explainName:'SOL (long)',
      explain:[['Momentum',90,'0.90'],['ETF optionality',78,'0.78'],['On-chain flow',74,'0.74'],['Sentiment',70,'0.70'],['Liquidity',64,'0.64']],
      explainTxt:'Model attributes <b>0.90</b> to: accelerating price momentum (+22% MTD), spot-ETF optionality, rising on-chain activity and stablecoin inflows. Risk: a broad risk-off that hits high-beta alts first.',
      divergence:[['<b>BTC</b> — Point long · ETF flows crowded long','pill orange','crowded'],['<b>SOL</b> — Point long · momentum funds aligned','pill good','aligned'],['<b>MSTR</b> — Point long · premium to NAV elevated','pill orange','watch'],['<b>CLSK</b> — Point long · miners being sold','pill red','counter'],['<b>COIN</b> — Point long · funding crowded','pill orange','watch']],
      etf:[['IBIT (BTC)',70,'gold','+$ 1.4 B'],['ETHA (ETH)',24,'gold','+$ 0.2 B'],['Spot SOL fund',40,'gold','+$ 0.3 B'],['Stablecoin mint',66,'','+$ 1.4 B'],['Exchange outflow',48,'','bullish'],['Miner ETF',28,'bad','−$ 0.2 B'],['Tokenized RWA',18,'','+$ 0.1 B']],
      social:[['BTC',28,56,'56/28'],['SOL',14,72,'72/14'],['ETH',22,58,'58/22'],['COIN',20,60,'60/20'],['CLSK',46,34,'34/46']],
      scenario:[['Base case','<b class="good">+$ 1.8 M</b>'],['Hot CPI (+0.4% core)','<b class="dn">−$ 3.4 M · BTC-rate β</b>'],['Cold CPI (0.1%)','<b class="up">+$ 4.2 M</b>'],['BTC −15%','<b class="dn">−$ 6.1 M</b>'],['Alt −25%','<b class="dn">−$ 7.8 M</b>'],['Risk-off (VIX >30)','<b class="dn">−$ 9.0 M</b>']]
    }
  };
  const marketData = {
    alpha:{
      macroKpis:[['CPI YoY','3.1%','+0.1 vs. prior'],['Core PCE','2.8%','target 2.0'],['Fed funds','4.75%','market: 2 cuts by Mar'],['Book stance','Risk-on tilt','net 62% · semis-led']],
      events:[
        ['06:11:42','Macro','CPI nowcast → 3.12% YoY · re-ran Risk, PnL, Flows'],
        ['06:11:08','Digital','tNVDA basis −2.81% · triggered Risk gap-check'],
        ['06:10:51','Risk','Beta-net 63.1% · breach prob 71% · Action Card composed'],
        ['06:10:40','Flows','META crowding 92 → de-gross alert to Risk'],
        ['06:10:22','Technical','TSLA RSI divergence 5d · stop proximity 0.3 ATR'],
        ['06:09:58','PosIntel','NVDA 13D (Elliott) ingested · thesis-drift ↑'],
        ['06:09:30','Earnings','JPM transcript primed · tone −0.21 forecast'],
        ['06:09:04','Research','Universe re-ranked · UBER #1 · 12 new ideas'],
        ['06:08:41','Conductor','De-duplicated 4 semis alerts → 1 ranked card']],
      irLetter:[
        '<b>Dear Partner,</b>',
        'October brought a two-sided tape. The Alpha fund delivered a <b>+1.82% net return</b> for the month and <b>+18.4% YTD</b>, ahead of the benchmark’s <b>+9.7%</b>. Attribution was dominated by stock-specific wins in Communications and Semiconductors, offset by a drag from large-cap software where our Microsoft thesis has entered a resting phase.',
        'We tightened net exposure after the agent team flagged <b>beta-adjusted net drifting toward the IMA cap</b>; a defined-risk hedge on the semi-complex preserves the long thesis while restoring headroom. On digital assets, we continue the 24/7 monitor on tokenized equities — our edge is being awake before the Monday open…',
        '<span class="muted">[auto-generated · 2 citations pending · 4 compliance soft-flags resolved]</span>']
    },
    global:{
      macroKpis:[['CPI YoY','3.1%','+0.1 vs. prior'],['Core PCE','2.8%','target 2.0'],['Fed funds','4.75%','market: 2 cuts by Mar'],['Book stance','Duration short','curve steepener']],
      events:[
        ['06:11:42','Macro','CPI nowcast → 3.12% YoY · re-ran rate-book DV01'],
        ['06:11:08','Macro','10Y through 4.40% · hedge ladder sized'],
        ['06:10:51','Flows','CoT: specs crowded long gold & crude'],
        ['06:10:22','Technical','Gold RSI 74 · take-partial signal'],
        ['06:09:58','Macro','BOJ intervention risk > 158 · trim JPY short'],
        ['06:09:30','Research','Cross-asset re-rank · gold #1 · EM #2'],
        ['06:09:04','PosIntel','China stimulus headline ingested · FXI bid'],
        ['06:08:41','Conductor','Merged 3 rate alerts → 1 DV01 card'],
        ['06:08:12','Macro','3Y auction 13:00 · calendar flagged']],
      irLetter:[
        '<b>Dear Partner,</b>',
        'The Global Macro fund returned <b>−0.12% on the day</b> but remains <b>+11.2% YTD</b>. Gains were led by a long-gold position and a short-duration expression in the rate complex; FX detracted modestly as the yen stayed resilient on intervention risk.',
        'Into tomorrow’s CPI we run a <b>0.6× DV01 hedge ladder</b> that caps a hot-print drawdown for under two basis points of monthly carry, while retaining most of the cold-print upside. We added to EM on the China-stimulus headline and trimmed the yen short ahead of potential BOJ action.',
        '<span class="muted">[auto-generated · derivatives-use disclosure updated · scenario-PnL exhibit attached]</span>']
    },
    neutral:{
      macroKpis:[['CPI YoY','3.1%','+0.1 vs. prior'],['Core PCE','2.8%','target 2.0'],['Fed funds','4.75%','market: 2 cuts by Mar'],['Book stance','Beta-neutral','net 4% · pairs']],
      events:[
        ['06:11:42','PnL','PG/CL spread +2.1σ · mean-rev add flagged'],
        ['06:11:08','Flows','NVO borrow fee 180bp · short-leg watch'],
        ['06:10:51','Research','Pair re-rank · LLY/NVO #1 by score spread'],
        ['06:10:22','Risk','Net beta 0.04 · beta-neutral confirmed'],
        ['06:09:58','Earnings','LLY/NVO earnings aligned +12d · event-neutral'],
        ['06:09:30','Technical','V/MA spread tightening · tilt V'],
        ['06:09:04','PosIntel','Index rebalance preview · pair flows'],
        ['06:08:41','Conductor','No single-name drift · 44 pairs balanced'],
        ['06:08:12','Risk','Factor net style-neutral · low momentum tilt']],
      irLetter:[
        '<b>Dear Partner,</b>',
        'The Market Neutral fund compounded <b>+0.09% on the day</b> and <b>+7.8% YTD</b> with a realized net beta of <b>0.04</b>. Returns came almost entirely from pair convergence — pharma (LLY/NVO) and staples (PG/CL) led, while a tech pair was the sole detractor.',
        'We added 15% to the PG/CL pair as its spread reached a <b>2.1σ</b> dislocation with no catalyst, and flagged a rising borrow cost on the NVO short leg. Factor and market-beta exposures remain neutral by construction; a 1-day VaR of <b>0.39%</b> of NAV keeps the book inside every risk band.',
        '<span class="muted">[auto-generated · factor-neutrality attestation included · Sharpe exhibit attached]</span>']
    },
    digital:{
      macroKpis:[['CPI YoY','3.1%','+0.1 vs. prior'],['Core PCE','2.8%','target 2.0'],['Fed funds','4.75%','market: 2 cuts by Mar'],['Book stance','High-beta','crypto-β 71%']],
      events:[
        ['Sat 02:14','Digital','BTC funding +0.082% · OI +18% · put-spread queued'],
        ['Sat 06:40','Flows','Stablecoin mint +$1.4B · risk-on gauge'],
        ['Sun 11:20','Technical','CLSK breaks 200-day · stop hit'],
        ['Sun 19:05','PosIntel','SEC crypto roundtable scheduled Fri'],
        ['Mon 04:30','Digital','tNVDA basis −2.8% · weekend gap-check'],
        ['Mon 05:10','Research','Coin re-rank · SOL #1 on momentum'],
        ['Mon 05:40','Risk','Crypto-β 71% near 75% cap · hedge queued'],
        ['Mon 06:02','Conductor','Weekend events → 2 ranked cards for open'],
        ['Mon 06:11','Digital','MSTR 1.42× BTC-β · exposure mapped']],
      irLetter:[
        '<b>Dear Partner,</b>',
        'The Digital Assets fund fell <b>−2.1% on the day</b> but holds a <b>+34.1% YTD</b> — the strongest of the complex and, predictably, the most volatile. Solana led the book higher this month while the mining complex (CleanSpark) was the principal drag after breaking its 200-day average.',
        'Our 24/7 monitor caught a weekend funding spike (+0.082%, OI +18%) and queued a defined-risk MSTR/COIN put spread for the Monday open, sized to budget and pre-checked by the Risk agent. Crypto-β sits at <b>71%</b> of a 75% cap; custody and tokenized-asset disclosures are front-loaded in this letter.',
        '<span class="muted">[auto-generated · digital-asset governance Q&A expanded · on-chain transparency exhibit attached]</span>']
    }
  };
  function renderPanels(fund){
    const d=panelData[fund]||panelData.alpha;
    const md=marketData[fund]||marketData.alpha;
    const mk=document.getElementById('macro-kpis');
    if(mk) mk.innerHTML=md.macroKpis.map(k=>`<div class="kpi"><div class="k-lab">${k[0]}</div><div class="k-val">${k[1]}</div><div class="k-sub">${k[2]}</div></div>`).join('');
    const elog=document.getElementById('eventlog');
    if(elog) elog.innerHTML=md.events.map(e=>`<li><span class="et">${e[0]}</span><span class="ea">${e[1]}</span><span class="em">${e[2]}</span></li>`).join('');
    const ir=document.getElementById('ir-letter');
    if(ir){
      ir.innerHTML=md.irLetter.map(p=>`<p>${p}</p>`).join('');
      try{const saved=localStorage.getItem(`ir-draft:${fund}:dashboard`);if(saved)ir.innerHTML=saved;}catch(e){}
    }
    // what-if
    const sel=document.getElementById('risk-whatif-select');
    if(sel) sel.options[0] ? (sel.options[0].text=d.whatifSelect) : null;
    const wi=document.getElementById('risk-whatif');
    if(wi) wi.innerHTML=d.whatif.map(c=>`<div class="wi-cell"><div class="wi-k">${c[0]}</div><div class="wi-v">${c[1]}</div></div>`).join('');
    // stress
    const st=document.getElementById('risk-stress');
    if(st) st.innerHTML='<div class="st-head">Stress tests</div>'+d.stress.map(r=>`<div class="st-row"><span>${r[0]}</span><b class="dn">${r[1]}</b></div>`).join('');
    // pnl stats
    const ps=document.getElementById('pnl-stats');
    if(ps) ps.innerHTML=d.pnlStats.map(k=>`<div><div class="kv-k">${k[0]}</div><div class="kv-v">${k[1]}</div></div>`).join('');
    // catalyst calendar
    const cal=document.getElementById('pos-cal');
    if(cal) cal.innerHTML=d.cal.map(c=>`<li><b>${c[0]}</b><span>${c[1]}</span></li>`).join('');
    // news
    const nw=document.getElementById('pos-news');
    if(nw) nw.innerHTML=d.news.map(n=>`<li><span class="t">${n[0]}</span><span class="src">${n[1]}</span><div>${n[2]}</div><span class="${n[3]}">${n[4]}</span></li>`).join('');
    // research explain
    const exName=document.getElementById('research-explain-name'); if(exName) exName.textContent=d.explainName;
    const ex=document.getElementById('research-explain');
    if(ex) ex.innerHTML=d.explain.map(r=>`<div class="ex-row"><div class="ex-k">${r[0]}</div><div class="ex-bar"><div class="ex-fill" style="width:${r[1]}%"></div></div><div class="ex-v">${r[2]}</div></div>`).join('')+`<div class="ex-txt">${d.explainTxt}</div>`;
    // flows divergence
    const dv=document.getElementById('flows-divergence');
    if(dv) dv.innerHTML=d.divergence.map(r=>`<li><div>${r[0]}</div><span class="${r[1]}">${r[2]}</span></li>`).join('');
    // etf flows
    const etf=document.getElementById('flows-etf');
    if(etf) etf.innerHTML=d.etf.map(r=>`<div class="etf-row"><span>${r[0]}</span><div class="bar"><div class="fill ${r[2]}" style="width:${r[1]}%"></div></div><b class="${r[3].includes('−')?'dn':''}">${r[3]}</b></div>`).join('');
    // social
    const soc=document.getElementById('earnings-social');
    if(soc) soc.innerHTML=d.social.map(s=>`<div class="s-row"><span>${s[0]}</span><div class="sent"><div class="sent-neg" style="width:${s[1]}%"></div><div class="sent-pos" style="width:${s[2]}%"></div></div><b>${s[3]}</b></div>`).join('');
    // macro scenario
    const sc=document.getElementById('macro-scenario');
    if(sc) sc.innerHTML=d.scenario.map(r=>`<div class="sc-row"><span>${r[0]}</span>${r[1]}</div>`).join('');
  }

  function renderDetail(id){
    renderPositions(id); renderPnl(id);
    renderExposure(id); renderFeed(id); renderPnlMeta(id); renderTopCard(id);
    renderDecisionBriefs(id); renderViews(id); renderPanels(id);
    renderBrief(id); renderActionCards(id); renderConductor(id);
    if(window.__tagRows) window.__tagRows();
  }

  /* ---- line chart (reusable) ---- */
  function lineChart(id, series, opts){
    const svg = document.getElementById(id);
    if(!svg) return;
    opts = opts||{};
    const W=500,H=220,pad=28, top=14, bot=H-26;
    const all = series.flatMap(s=>s.data);
    const min=Math.min(...all), max=Math.max(...all);
    const n = series[0].data.length;
    const x = i => pad + i*(W-pad*2)/(n-1);
    const y = v => top + (max-v)/(max-min)*(bot-top);
    let out='';
    // gridlines
    for(let g=0; g<=4; g++){
      const yy = top + g*(bot-top)/4;
      out += `<line x1="${pad}" y1="${yy}" x2="${W-pad}" y2="${yy}" stroke="#2c2621" stroke-width="1"/>`;
    }
    series.forEach(s=>{
      let d='';
      s.data.forEach((v,i)=>{ d += (i?'L':'M')+x(i).toFixed(1)+' '+y(v).toFixed(1)+' '; });
      out += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.w||2.5}" stroke-linejoin="round" stroke-linecap="round" ${s.dash?`stroke-dasharray="${s.dash}"`:''}/>`;
      s.data.forEach((v,i)=>{ if(s.dots!==false) out += `<circle cx="${x(i)}" cy="${y(v)}" r="${s.r||2.6}" fill="${s.color}"/>`; });
    });
    // x labels
    (opts.labels||[]).forEach((lab,i)=>{
      out += `<text x="${x(i)}" y="${H-8}" fill="#8a7e6e" font-size="9" text-anchor="middle" font-family="Inter">${lab}</text>`;
    });
    svg.innerHTML = out;
  }

  const wkLabels=['Fri 2p','Fri 4p','Fri 8p','Sat','Sun AM','Sun PM','Mon 6a','Mon 9:30'];
  lineChart('tok-chart', [
    {data:[100,100.5,null], color:'#e8e0d2', w:3, dots:true},
    {data:[100,100.5,100.2,99.1,98.4,97.2,97.3,97.4], color:'#d4a42b', r:3}
  ], {labels:wkLabels});
  // primary listing only shows Fri points, re-draw clean:
  lineChart('tok-chart', [
    {data:[100,100.5,100.5,100.5,100.5,100.5,100.5,100.5], color:'#5c564c', w:1.5, dash:'4 4', dots:false},
    {data:[100,100.5,100.2,99.1,98.4,97.2,97.3,97.4], color:'#d4a42b', r:3}
  ], {labels:wkLabels});

  lineChart('weekend-chart', [
    {data:[235.8,235.8,235.8,235.8,235.8,235.8,235.8,235.8], color:'#e8e0d2', w:1.5, dash:'4 4', dots:false},
    {data:[235.8,235.4,234.1,233.2,232.6,231.0,231.2,231.4], color:'#d4a42b', r:3}
  ], {labels:wkLabels});

  /* ---- action cards ---- */
  const cards = [
    {lvl:'CRIT', agent:'Risk & Guideline', id:'AC-20261007-003', ts:'2 min ago',
     title:'Beta-adjusted net 63.1% vs 60% IMA limit at open',
     metrics:[['71%','Breach prob 1d','red'],['9%','After trades','good'],['6 bps','Alpha cost',''],['$1.42M','At risk','']],
     body:'Trim NVDA 12% (~$8.4M) + buy SMH Nov 215/205 put spread. Drivers: semis beta drift, tokenized −2.8%, hot CPI risk.',
     detail:{
       summary:'The book is projected to open at <b>63.1% beta-adjusted net</b> on Monday — above the <b>60% IMA cap</b>. The agent has composed the smallest trade set that restores headroom at the lowest alpha cost.',
       drivers:[
         {t:'Semiconductor beta drift',s:'NVDA, AMD, SMH betas re-estimated +0.18 over 20d',w:'+1.4 pts'},
         {t:'Tokenized-equity weekend move',s:'tNVDA −2.8% on xStocks while cash market closed',w:'+0.5 pts'},
         {t:'Hot CPI risk (Macro agent)',s:'Growth-multiple compression raises effective net',w:'+0.3 pts'},
         {t:'Pending orders',s:'2 unfilled GTC buys in semis add to projected open',w:'+0.2 pts'}
       ],
       trades:[
         {act:'sell',tk:'NVDA',sz:'−5,520 sh · ~$8.4M',det:'Trim 12% of the position. Executes VWAP over first 30 min; est. slippage 3 bp.'},
         {act:'buy',tk:'SMH Nov 215/205 put spread',sz:'240 lots · $0.42M premium',det:'Defined-risk hedge on the semi-complex; preserves the long thesis while cutting beta.'}
       ],
       whatif:[
         ['Beta-adj net','62.1%','55.4%'],['Gross','184%','172%'],['VaR 99%','$14.3M','$11.1M'],
         ['Breach prob 1d','71%','9%'],['Top-10 concentration','38%','36%']
       ],
       evidence:[
         {ag:'Technical Signals',tx:'NVDA RSI 72, bearish MACD divergence; stop at 175.4 (−5%).'},
         {ag:'Position Intel',tx:'NVDA 13D filed by Elliott; $220M insider sales over 10 sessions — thesis drift ↑.'},
         {ag:'Digital Assets',tx:'tNVDA basis −2.81%; weekend gap flows into Monday open projection.'},
         {ag:'Macro & Regime',tx:'CPI tomorrow; hot-print scenario adds +0.3 pts to effective net.'}
       ],
       timeline:[
         {t:'Signals ingested',s:'06:08:12 · positions, tokenized basis, pending orders',st:'done'},
         {t:'Breach projected',s:'06:10:51 · 63.1% vs 60% · prob 71%',st:'done'},
         {t:'Trade set optimized',s:'06:10:53 · minimized alpha cost (6 bps)',st:'done'},
         {t:'Awaiting your approval',s:'now · routes to OMS on approve',st:'active'},
         {t:'Compliance sign-off',s:'pending · auto-logged with rationale',st:''}
       ],
       reasoning:'The engine searched 1,240 candidate trade combinations and selected the pair that restores IMA headroom with the <b>lowest combined alpha cost (6 bps)</b> and <b>lowest financing drag</b>. Trimming NVDA directly reduces the largest beta contributor; the SMH put spread hedges residual semi beta without realizing the full long. Projected post-trade breach probability falls from <b>71% to 9%</b>.'
     }},
    {lvl:'CRIT', agent:'Macro & Regime', id:'AC-20261007-004', ts:'14 min ago',
     title:'CPI tomorrow 08:30 — hot-print = −38 bps NAV',
     metrics:[['−38 bps','Hot scenario','red'],['1.8 bps','Hedge cost',''],['0.6×','DV01 ratio',''],['$4.78M','At risk','']],
     body:'Deploy 10Y DV01 hedge ladder at 0.6× book. Cold-print upside +49 bps. Pre-trade what-if shows <2bps carry.',
     detail:{
       summary:'Tomorrow\'s CPI print is the dominant near-term risk. A hot core print (+0.4% MoM) maps to <b>−38 bps NAV</b> through rate and multiple channels. The agent proposes a cheap DV01 ladder that caps the downside.',
       drivers:[
         {t:'Core CPI consensus 0.3% MoM',s:'Whisper skewed hot after services PPI',w:'main'},
         {t:'Rate sensitivity',s:'Book DV01 long-duration growth names',w:'−24 bps'},
         {t:'Multiple compression',s:'Semis + software de-rate on higher terminal',w:'−14 bps'}
       ],
       trades:[
         {act:'buy',tk:'10Y UST DV01 hedge',sz:'0.6× book DV01',det:'Short via ZN futures ladder; neutralizes 60% of rate exposure into the print.'},
         {act:'buy',tk:'SPY Oct 580 put',sz:'180 lots',det:'Tail hedge for multiple-compression leg; rolls off Friday.'}
       ],
       whatif:[
         ['Hot-print NAV','−38 bps','−12 bps'],['Cold-print NAV','+49 bps','+44 bps'],
         ['Carry cost','—','1.8 bps/mo'],['Net duration','4.2y','1.7y']
       ],
       evidence:[
         {ag:'Fund Flows',tx:'Rate-vol sellers crowded; a hot print forces fast unwind.'},
         {ag:'Risk & Guideline',tx:'Scenario PnL −$4.78M at hot print; within loss cap but dents MTD.'},
         {ag:'Digital Assets',tx:'BTC−Nasdaq correlation elevated; crypto adds to risk-off beta.'}
       ],
       timeline:[
         {t:'Economic calendar flagged',s:'06:02 · CPI 08:30 ET tomorrow',st:'done'},
         {t:'Scenario PnL computed',s:'06:09 · hot/base/cold grid',st:'done'},
         {t:'Hedge ladder sized',s:'06:09 · 0.6× DV01, 1.8 bps carry',st:'done'},
         {t:'Awaiting your approval',s:'now',st:'active'}
       ],
       reasoning:'The agent ran a probability-weighted CPI grid (hot 30% / base 55% / cold 15%) against position-level rate and vol betas. The recommended ladder cuts hot-print downside by <b>two-thirds</b> for under <b>2 bps/month</b> carry, while retaining most of the cold-print upside — an asymmetric, cheap insurance trade into a known event.'
     }},
    {lvl:'WARN', agent:'Fund Flows', id:'AC-20261007-006', ts:'26 min ago',
     title:'META crowding score 92 — de-grossing risk',
     metrics:[['92','Crowding','warn'],['14.1%','HF ownership',''],['+7pts','QoQ Δ',''],['$8.47M','Position','']],
     body:'Top-decile hedge-fund ownership. If VIX breaks 22, de-gross risk is elevated. Consider halving or Dec OTM put spread.',
     detail:{
       summary:'META sits in the <b>top decile</b> of hedge-fund crowding. In a vol spike, crowded names de-gross first. The agent flags position-size risk and offers two ways to pre-empt it.',
       drivers:[
         {t:'HF ownership 14.1%',s:'+7 pts QoQ from 13F aggregation',w:'score +18'},
         {t:'Smart-money divergence',s:'4 of top-10 funds trimming into strength',w:'score +9'},
         {t:'Options skew steep',s:'Downside puts bid; dealers short gamma',w:'score +6'}
       ],
       trades:[
         {act:'sell',tk:'META',sz:'−7,150 sh · ~$4.2M',det:'Halve the position to drop out of the top crowding decile.'},
         {act:'buy',tk:'META Dec 540/500 put spread',sz:'120 lots',det:'Alternative: keep the long, cap de-gross downside for the quarter.'}
       ],
       whatif:[
         ['Crowding score','92','74'],['Position weight','6.8%','3.4%'],
         ['De-gross VaR','$2.1M','$0.9M'],['Thesis retained','full','full']
       ],
       evidence:[
         {ag:'Research & Alpha',tx:'Fundamental thesis intact; this is a positioning risk, not a thesis break.'},
         {ag:'Earnings & Sentiment',tx:'Tone +0.22 last call; guidance reaffirmed — no catalyst to force selling yet.'},
         {ag:'Technical Signals',tx:'RSI 66, extended; stop reference 561.0.'}
       ],
       timeline:[
         {t:'13F/positioning refreshed',s:'06:04 · crowding model re-scored',st:'done'},
         {t:'De-gross scenario run',s:'06:10 · VIX>22 trigger',st:'done'},
         {t:'Awaiting your decision',s:'now',st:'active'}
       ],
       reasoning:'Crowding is a <b>conditional</b> risk — it only bites in a vol event. The agent therefore frames this as optional risk reduction rather than a mandated trim: halving removes the exposure outright, while the put spread keeps the thesis on and insures the tail for one quarter.'
     }},
    {lvl:'WARN', agent:'Technical Signals', id:'AC-20261007-009', ts:'41 min ago',
     title:'TSLA stop proximity 0.3 ATR · RSI divergence',
     metrics:[['0.3','ATR to stop','warn'],['243.10','Trail stop',''],['−4.6%','MTD','bad'],['$4.22M','Position','']],
     body:'5-day RSI bearish divergence; MACD rolling over. Trail stop at 243.10 to protect gains. $422M notional.',
     detail:{
       summary:'TSLA is <b>0.3 ATR</b> from its trailing stop with a confirmed 5-day RSI divergence. The agent recommends tightening the stop to lock gains rather than exiting outright.',
       drivers:[
         {t:'Price near trailing stop',s:'Last 245.60 vs stop 243.10 (0.3 ATR)',w:'trigger'},
         {t:'RSI bearish divergence',s:'Price higher high, RSI lower high over 5d',w:'warn'},
         {t:'MACD rolling over',s:'Signal-line cross pending',w:'warn'}
       ],
       trades:[
         {act:'sell',tk:'TSLA trail stop → 243.10',sz:'17,200 sh protected',det:'Raise stop from 238.0 to 243.10; triggers market-on-touch.'},
         {act:'sell',tk:'TSLA',sz:'−5,160 sh (optional 30%)',det:'Alternative: de-risk a third now ahead of potential breakdown.'}
       ],
       whatif:[
         ['Downside if stopped','−$0.9M','capped'],['MTD locked','−4.6%','−4.6%'],['Beta contribution','0.26','0.18']
       ],
       evidence:[
         {ag:'Position Intel',tx:'No fresh catalyst; delivery read next week is the next event.'},
         {ag:'Fund Flows',tx:'Retail flows softening; options put/call rising.'}
       ],
       timeline:[
         {t:'Stop proximity triggered',s:'05:44 · 0.3 ATR band',st:'done'},
         {t:'Divergence confirmed',s:'05:45 · 5d RSI',st:'done'},
         {t:'Awaiting your decision',s:'now',st:'active'}
       ],
       reasoning:'With the thesis unchanged but momentum weakening, the agent prefers a <b>tightened stop</b> over an outright exit — it protects the embedded gain while leaving upside open if the breakout resumes. The optional 30% trim is offered for lower risk tolerance.'
     }},
    {lvl:'WARN', agent:'PnL Attribution', id:'AC-20261007-011', ts:'1h ago',
     title:'MSFT alpha half-life expired — trim candidate',
     metrics:[['−24 bps','MTD','bad'],['14d','Half-life','red'],['18%','Risk budget',''],['284d','Thesis age','']],
     body:'Alpha half-life expired, no catalyst in 20 days, Azure deceleration. Agent suggests trimming 25% of the position.',
     detail:{
       summary:'MSFT\'s measured alpha half-life has <b>expired</b> while it still consumes <b>18% of risk budget</b>. The agent flags it for a trim to redeploy risk into higher-conviction names.',
       drivers:[
         {t:'Alpha half-life 14d · expired',s:'Realized alpha decayed below threshold',w:'main'},
         {t:'No catalyst in 20d',s:'Next event is earnings +28d',w:'—'},
         {t:'Azure deceleration',s:'2Q growth guide cut; Copilot pricing pressure',w:'thesis'}
       ],
       trades:[
         {act:'sell',tk:'MSFT',sz:'−5,125 sh · ~$2.1M (25%)',det:'Trim a quarter; redeploy into UBER/ANET where composite scores lead.'}
       ],
       whatif:[
         ['Risk budget used','18%','13%'],['MTD drag','−24 bps','−18 bps'],['Freed risk','—','$2.1M']
       ],
       evidence:[
         {ag:'Earnings & Sentiment',tx:'Tone −0.42 last call, hedging language ↑↑.'},
         {ag:'Research & Alpha',tx:'MSFT composite 0.51 vs UBER 0.89 — better risk-adjusted redeployment.'},
         {ag:'Position Intel',tx:'Thesis drift HIGH: Azure decel contradicts original growth driver.'}
       ],
       timeline:[
         {t:'Attribution refreshed',s:'05:30 · half-life recomputed',st:'done'},
         {t:'Flagged for trim',s:'05:31 · risk-budget heavy',st:'done'},
         {t:'Awaiting your decision',s:'now',st:'active'}
       ],
       reasoning:'This is a <b>capital-efficiency</b> call, not a loss-cut. The position is not broken, but its alpha has decayed while its risk draw remains high. Trimming 25% frees budget for names the Research agent ranks materially higher on a risk-adjusted basis.'
     }},
    {lvl:'IDEA', agent:'Research & Alpha', id:'AC-20261007-014', ts:'1h ago',
     title:'UBER ranked #1 of 503 — long idea',
     metrics:[['0.89','Composite','good'],['84','Quality',''],['82.4–85.1','1d range',''],['80–89.2','5d range','']],
     body:'FCF inflection, autonomous optionality, CFO insider buying $2.1M, positive EBITDA revisions. Thesis fit: strong.',
     detail:{
       summary:'UBER tops the ranked universe at <b>0.89 composite</b>. The agent proposes a starter long sized to risk budget, with explainable factor attribution.',
       drivers:[
         {t:'FCF inflection',s:'Trailing FCF turned positive, accelerating',w:'quality'},
         {t:'Autonomous optionality',s:'Only partially priced vs comps',w:'upside'},
         {t:'CFO insider buy $2.1M',s:'Open-market purchase 09/22',w:'signal'},
         {t:'EBITDA revisions +',s:'3 of 4 analysts raised',w:'momentum'}
       ],
       trades:[
         {act:'buy',tk:'UBER',sz:'+34,000 sh · ~$2.8M starter',det:'Half-size entry; add on pullback to 80.0 (5d range low).'}
       ],
       whatif:[
         ['Position weight','0%','2.2%'],['Portfolio composite','—','+0.01'],['Expected 5d range','80.0','89.2']
       ],
       evidence:[
         {ag:'Fund Flows',tx:'Lone Pine, Tiger-cub initiations — smart money aligned.'},
         {ag:'Earnings & Sentiment',tx:'Management tone constructive; no hedging flags.'},
         {ag:'Risk & Guideline',tx:'Adds 0.4 pts gross, within all limits.'}
       ],
       timeline:[
         {t:'Universe ranked',s:'06:09 · 503 names scored',st:'done'},
         {t:'Trading range modeled',s:'06:09 · realized+implied vol',st:'done'},
         {t:'Idea queued for PM',s:'now',st:'active'}
       ],
       reasoning:'The ranking is <b>explainable</b>: 0.89 decomposes into quality 0.84, momentum 0.78, revisions 0.71, sentiment 0.68, macro-fit 0.62. The dominant swing factor is the FCF inflection, with insider buying as a confirming signal. Risk flags: delivery-margin compression if GLP-1 demand drag persists.'
     }},
    {lvl:'IDEA', agent:'Digital Assets', id:'AC-20261007-002', ts:'Sat 2:14a',
     title:'BTC funding +0.082% · OI +18% · crowded longs',
     metrics:[['+0.082%','Funding','warn'],['+18%','OI 24h',''],['0.6M','Premium',''],['Mon','Risk window','']],
     body:'COIN/MSTR exposure at risk Monday. Defined-risk put spread queued, sized to budget, checked by Risk agent.',
     detail:{
       summary:'BTC perp funding spiked to <b>+0.082%</b> with OI <b>+18%</b> — classic crowded-long setup. Your COIN/MSTR crypto-beta is exposed into Monday. A defined-risk put spread is queued.',
       drivers:[
         {t:'Perp funding +0.082%',s:'8h funding at 60-day high',w:'crowded'},
         {t:'Open interest +18% 24h',s:'Leverage building fast',w:'fragile'},
         {t:'Liquidation clusters below',s:'Dense longs at 98–99k',w:'gap-risk'}
       ],
       trades:[
         {act:'buy',tk:'MSTR Nov put spread',sz:'$0.6M premium',det:'Defined-risk hedge on highest crypto-beta name (1.42× BTC).'},
         {act:'buy',tk:'COIN Nov put spread',sz:'$0.3M premium',det:'Optional second leg on 0.86× BTC-beta exposure.'}
       ],
       whatif:[
         ['Crypto-β downside','−$2.6M','−$1.1M'],['MSTR 24h impact','−$1.84M','hedged'],['Premium','—','$0.6M']
       ],
       evidence:[
         {ag:'Risk & Guideline',tx:'Crypto-β exposure 17% vs 20% cap; hedge keeps headroom.'},
         {ag:'Cross-asset bridge',tx:'BTC−Nasdaq correlation regime elevated; spillover risk real.'}
       ],
       timeline:[
         {t:'Funding spike detected',s:'Sat 02:14 · 24/7 monitor',st:'done'},
         {t:'Book impact mapped',s:'Sat 02:15 · COIN/MSTR beta',st:'done'},
         {t:'Put spread queued for PM',s:'now',st:'active'}
       ],
       reasoning:'The 24/7 agent caught this over the weekend — a window your desk does not staff. Rather than sell equity on an illiquid Saturday, it <b>translates the crypto signal into equity risk</b> and queues a defined-risk hedge for Monday, pre-checked against limits by the Risk agent.'
     }},
    {lvl:'IDEA', agent:'Earnings & Sentiment', id:'AC-20261007-013', ts:'2h ago',
     title:'JPM Thu — read-across to V, MA, AXP',
     metrics:[['−0.21','Tone Δ','warn'],['71%','Confidence',''],['Thu 09:00','Print',''],['3','Read-across','']],
     body:'Tone model suggests cautious consumer guidance. Supplier read-across for V, MA, AXP. Confidence 71%.',
     detail:{
       summary:'JPM reports Thursday. The tone model projects a <b>cautious consumer guide (−0.21 Δ)</b>, with read-across to payments names you hold.',
       drivers:[
         {t:'Tone Δ −0.21 forecast',s:'Hedging language rising vs prior calls',w:'71% conf'},
         {t:'Consumer-credit signals',s:'Delinquency upticks in card data',w:'watch'},
         {t:'Read-across chain',s:'V, MA, AXP share consumer-spend exposure',w:'3 names'}
       ],
       trades:[
         {act:'sell',tk:'V / MA (optional pre-trim)',sz:'de-risk 15%',det:'Reduce payments beta ahead of a potentially cautious read-across.'},
         {act:'buy',tk:'XLF Oct put (optional)',sz:'80 lots',det:'Basket hedge for the financials read-through.'}
       ],
       whatif:[
         ['Payments beta','0.31','0.26'],['Event VaR','$1.2M','$0.7M'],['Carry','—','0.9 bps']
       ],
       evidence:[
         {ag:'Fund Flows',tx:'Financials positioning heavy; crowded into the print.'},
         {ag:'Macro & Regime',tx:'Rate path supports NIM but consumer stress is the swing factor.'}
       ],
       timeline:[
         {t:'Transcript model primed',s:'06:09 · prior-call baselines loaded',st:'done'},
         {t:'Read-across mapped',s:'06:09 · V/MA/AXP linkage',st:'done'},
         {t:'Watch queued pre-print',s:'now',st:'active'}
       ],
       reasoning:'This is a <b>pre-print watch</b>, not a mandate. The tone model has 71% confidence — meaningful but not decisive — so the agent surfaces optional, cheap de-risking rather than forcing a trade. The value is the <b>supplier/customer read-across</b>: one bank print informs three of your payments holdings.'
     }}
  ];
  const lvlCls = {CRIT:'pill red', WARN:'pill orange', IDEA:'pill gold'};
  const cardsByFund = {alpha:cards, global:fundCards.global, neutral:fundCards.neutral, digital:fundCards.digital};
  const cardIndex = {};
  Object.values(cardsByFund).flat().forEach(c=>cardIndex[c.id]=c);

  function cardMarkup(c,critClass){
    return `<div class="card clickable ${c.lvl==='CRIT'&&critClass!==false?'critical':''}" data-card="${c.id}" data-lvl="${c.lvl}">
        <div class="card-head">
          <span class="${lvlCls[c.lvl]}">${c.lvl}</span>
          <span class="chip-meta">${c.agent}${c.ts?' · '+c.ts:''}</span>
          <span class="spacer"></span>
          <span class="card-open-hint">Details ›</span>
        </div>
        <h3 class="card-title">${c.title}</h3>
        <div class="metrics">
          ${c.metrics.map(m=>`<div class="metric"><div class="m-val ${m[2]}">${m[0]}</div><div class="m-lab">${m[1]}</div></div>`).join('')}
        </div>
        <div class="card-body">${c.body}</div>
        <div class="card-foot">
          <button class="btn primary">Approve</button>
          <button class="btn dark">What-If</button>
          <button class="btn ghost">Dismiss</button>
          <span class="meta right">#${c.id}</span>
        </div>
      </div>`;
  }
  function renderActionCards(fund){
    const list=cardsByFund[fund]||cardsByFund.alpha;
    const grid=document.getElementById('cards-grid');
    if(grid) grid.innerHTML=list.map(c=>cardMarkup(c)).join('');
    const n=lvl=>list.filter(c=>c.lvl===lvl).length;
    const set=(id,v)=>{const el=document.getElementById(id); if(el) el.textContent=v;};
    set('cards-n-all', list.length);
    set('cards-n-crit', n('CRIT'));
    set('cards-n-warn', n('WARN'));
    set('cards-n-idea', n('IDEA'));
    set('cards-badge', list.length);
    set('hero-cards', list.length+' action cards');
    set('hero-crit', n('CRIT')+' critical');
    const critEl=document.getElementById('hero-crit');
    if(critEl) critEl.style.color = n('CRIT')===0 ? 'var(--good)' : '';
    document.querySelectorAll('#view-cards .filters .chip-btn').forEach((b,i)=>b.classList.toggle('active', i===0));
  }

  const briefs = {
  "alpha": {
    "eyebrow": "Morning Brief · Alpha Fund · Demo data · For the investment discussion",
    "title": "Start with mandate headroom. <span class=\"orange\">Then decide which risks are worth retaining.</span>",
    "approve": "Approve all 2 critical",
    "overnight": "The weaker semiconductor indications and crowded crypto positioning deserve attention because both affect exposures already in the fund. The first priority is to review the projected mandate breach; the next is to decide how much inflation-event risk to retain. Treat the weekend prices as signals to confirm at the cash open.",
    "findings": [
      [
        "red",
        "Risk",
        "Projected opening exposure is <b>63.1% against the 60% limit</b>. Compare a partial NVDA reduction with a semiconductor hedge, and confirm which combination restores adequate headroom."
      ],
      [
        "red",
        "Macro",
        "The hot-CPI scenario implies a loss of <b>38 basis points</b>. Price the rate hedge against that downside and the upside it would give away if the release is benign."
      ],
      [
        "gold",
        "Flows",
        "META crowding could make an exit harder if investors sell together. Review the position size and cost of protection while liquidity is available."
      ],
      [
        "red",
        "Research",
        "Ask the MSFT analyst to refresh the forward return case and the NVDA analyst to assess the new filings. Recent losses and headlines are reasons to review conviction, not conclusions on their own."
      ]
    ],
    "decisions": [
      "Ask Risk to compare the proposed NVDA trim and semiconductor protection. Choose a response only after checking the resulting mandate headroom.",
      "Agree the portfolio loss the desk is willing to accept through CPI, then decide whether the proposed rate hedge offers value at the quoted cost.",
      "Review META sizing with the covering analyst. Compare retaining the position, reducing it, and buying protection against the strength of the thesis."
    ],
    "pnl": [
      "−$ 2.14 M",
      "dn",
      "tokenized semis + BTC drag"
    ],
    "head": [
      "0.4 pts",
      "warn",
      "Beta-net vs. IMA 60%"
    ],
    "cal": [
      "<b>08:30</b> Chicago Fed index",
      "<b>10:00</b> Consumer credit",
      "<b>13:00</b> 3Y auction",
      "<b>16:30</b> COIN Q3 pre-announce",
      "<b>Tue 08:30</b> <span class=\"red\">CPI</span>"
    ],
    "ask": [
      "What's my worst-case NAV if CPI prints 0.5% MoM core?",
      "<b>−72 bps</b> NAV under the hot-print scenario; drivers: 10Y +18bp, semis −3.4%, growth multiple compression. Macro agent has a hedge ladder queued (cost 1.8bps). <a>Open what-if →</a>"
    ]
  },
  "global": {
    "eyebrow": "Morning Brief · Global Macro Fund · Demo data · For the investment discussion",
    "title": "Make the CPI risk a deliberate choice. <span class=\"orange\">Review duration, then the yen and gold.</span>",
    "approve": "Approve the 1 critical",
    "overnight": "Higher yields put the existing rate exposure under pressure, while the yen short faces intervention risk and gold has extended its gains. These call for separate sizing decisions. The CPI discussion should establish how much downside the desk is prepared to carry before choosing a hedge.",
    "findings": [
      [
        "red",
        "Rates",
        "A <b>50 basis point rise in the 10-year yield implies a $9.4M loss</b> in the stress case. Compare reducing duration with the proposed partial Treasury hedge."
      ],
      [
        "gold",
        "FX",
        "USD/JPY around 158 raises intervention concerns for the yen short. Consider a partial reduction if the potential squeeze outweighs the remaining upside."
      ],
      [
        "gold",
        "Gold",
        "Gold has risen <b>6.2% this month</b> and looks stretched. Taking some profit may preserve flexibility while retaining the core real-rate view."
      ],
      [
        "gold",
        "Research",
        "China stimulus makes EM worth revisiting. Check whether an addition would diversify the book or increase the same dollar and rate sensitivities."
      ]
    ],
    "decisions": [
      "Compare the proposed rate hedge with a smaller underlying position across both CPI outcomes. Confirm carry and acceptable loss before choosing the size.",
      "Review a partial reduction of the yen short and agree what intervention evidence would prompt a further change.",
      "Discuss taking some profit in gold. Keep an EM addition conditional on valuation and portfolio fit rather than reacting to the stimulus headline."
    ],
    "pnl": [
      "−$ 1.01 M",
      "dn",
      "rates and FX vs. gold"
    ],
    "head": [
      "0.1×",
      "warn",
      "DV01 headroom vs. 1.0× cap"
    ],
    "cal": [
      "<b>08:30</b> <span class=\"red\">CPI</span>",
      "<b>13:00</b> 3Y auction",
      "<b>14:00</b> Fed minutes Thu",
      "<b>Wed</b> ECB minutes",
      "<b>Thu</b> China GDP"
    ],
    "ask": [
      "What does a hot CPI do to this book?",
      "<b>−$4.1M</b> unhedged, about <b>−$1.4M</b> with the 0.6× ladder. The short-rate position wins if the print is hot; gold and EM give some of it back. <a>Open what-if →</a>"
    ]
  },
  "neutral": {
    "eyebrow": "Morning Brief · Market Neutral Fund · Demo data · For the investment discussion",
    "title": "Keep the book balanced. <span class=\"orange\">Test the pair opportunity and the cost of waiting.</span>",
    "approve": "No critical cards",
    "overnight": "The wider PG/CL spread may offer an opportunity, but it needs a fresh check of the relationship before adding size. Higher NVO borrow costs make the LLY/NVO review more immediate. Any adjustment should preserve the intended balance of the two legs.",
    "findings": [
      [
        "gold",
        "Pairs",
        "PG/CL is <b>2.1 standard deviations from its recent average</b>. Check for changes in the companies or relative earnings expectations before assuming the gap will close."
      ],
      [
        "gold",
        "Borrow",
        "NVO borrow has risen to <b>180 basis points</b>. Recalculate the expected pair return after financing and compare it with resizing or exiting."
      ],
      [
        "gold",
        "Research",
        "Revisions favor Visa over Mastercard. Ask whether the difference is already reflected in prices before tilting the pair."
      ],
      [
        "red",
        "Risk",
        "Net exposure is <b>4%, within the ±10% band</b>. Preserve that balance, while checking gross exposure and the liquidity of each leg."
      ]
    ],
    "decisions": [
      "Ask the staples analyst to validate the PG/CL convergence case. Consider a matched addition only if the relationship and available borrow still support it.",
      "Review LLY/NVO after financing costs. If reducing the short, reassess the long at the same time to avoid an unintended directional position.",
      "Compare the proposed Visa tilt with keeping V/MA unchanged. Require a clear earnings argument and check the resulting factor exposure."
    ],
    "pnl": [
      "+$ 1.40 M",
      "up",
      "pair convergence"
    ],
    "head": [
      "6 pts",
      "up",
      "Net vs. ±10% band"
    ],
    "cal": [
      "<b>Tue</b> CPI · low book impact",
      "<b>+6d</b> V and MA both report",
      "<b>+12d</b> LLY and NVO",
      "<b>Thu</b> index rebalance preview",
      "<b>Fri</b> borrow-rate review"
    ],
    "ask": [
      "How much does CPI move this book?",
      "Under <b>±8 bps</b>. The pairs are beta-neutral by construction, so the print shows up in financing and borrow, not in direction. <a>Open what-if →</a>"
    ]
  },
  "digital": {
    "eyebrow": "Morning Brief · Digital Assets Fund · Demo data · For the investment discussion",
    "title": "Make room for uncertainty. <span class=\"orange\">Review the stop and protection before adding risk.</span>",
    "approve": "Approve all 2 critical",
    "overnight": "The funding spike suggests crowded leveraged positions, while the CLSK trend break calls for a stop-policy review. Strength in SOL is worth following, but the fund should settle those existing risks before considering another addition. Confirm weekend indications against executable prices.",
    "findings": [
      [
        "red",
        "Protection",
        "MSTR and COIN share exposure to a crypto unwind. Compare the proposed put spread with reducing the positions; check both the premium and remaining portfolio sensitivity."
      ],
      [
        "red",
        "Technical",
        "CLSK has broken its 200-day trend. Confirm the stop policy and trading conditions before deciding how to reduce the position."
      ],
      [
        "gold",
        "Digital",
        "The tokenized NVDA discount may warn of a weak cash open. Wait for confirmation in the underlying market before treating it as a position-sizing signal."
      ],
      [
        "gold",
        "Research",
        "SOL remains a research candidate, and spot flows are supportive. Neither removes the risk from crowded leverage or creates room below the exposure cap."
      ]
    ],
    "decisions": [
      "Review the proposed MSTR/COIN protection against a direct reduction. Agree the downside to accept and verify the exposure left after either choice.",
      "Resolve the CLSK stop with the position owner, using executable prices and the existing policy. Check the effect on mandate headroom.",
      "Revisit SOL only after the risk review. Set entry conditions and a downside case rather than adding solely because it has outperformed."
    ],
    "pnl": [
      "−$ 6.80 M",
      "dn",
      "miners, funding, tokenized gap"
    ],
    "head": [
      "4 pts",
      "warn",
      "Crypto-β 71% vs. 75% cap"
    ],
    "cal": [
      "<b>24/7</b> weekend coverage live",
      "<b>09:30</b> cash open · tNVDA gap",
      "<b>16:30</b> COIN pre-announce",
      "<b>Tue 08:30</b> <span class=\"red\">CPI</span>",
      "<b>Fri</b> SEC crypto roundtable"
    ],
    "ask": [
      "What if BTC drops 15% before I hedge?",
      "About <b>−$6.1M</b> unhedged, closer to <b>−$2.6M</b> on the MSTR/COIN sleeve once the put spread is on. Cutting CLSK does more for the cap than the hedge does. <a>Open what-if →</a>"
    ]
  }
};
  function renderBrief(fund){
    const b=briefs[fund]||briefs.alpha;
    const set=(id,v)=>{const el=document.getElementById(id); if(el) el.textContent=v;};
    const html=(id,v)=>{const el=document.getElementById(id); if(el) el.innerHTML=v;};
    set('brief-eyebrow', b.eyebrow);
    html('brief-title', b.title);
    set('brief-approve', b.approve);
    html('brief-overnight', b.overnight);
    html('brief-findings', b.findings.map(f=>`<li><span class="tag ${f[0]}">${f[1]}</span> ${f[2]}</li>`).join(''));
    html('brief-decisions', b.decisions.map(d=>`<li>${d}</li>`).join(''));
    const pnl=document.getElementById('brief-pnl');
    if(pnl){ pnl.textContent=b.pnl[0]; pnl.className='sc-val '+b.pnl[1]; }
    set('brief-pnl-sub', b.pnl[2]);
    const head=document.getElementById('brief-head');
    if(head){ head.textContent=b.head[0]; head.className='sc-val '+b.head[1]; }
    set('brief-head-sub', b.head[2]);
    html('brief-cal', b.cal.map(c=>`<li>${c}</li>`).join(''));
    set('brief-ask-q', b.ask[0]);
    html('brief-ask-a', b.ask[1]);
  }

  const conductorCopy = {
    alpha:{
      eyebrow:'Point Conductor · Alpha Fund',
      title:'Ten agents, one semi-complex problem.',
      chip:'De-duplicated 4 semis alerts → 1 card',
      meta:'Alpha Fund',
      focusTitle:'Today\'s composition · Alpha',
      focus:'Four overnight semiconductor signals were the same risk. The conductor collapsed them into <b>one critical card</b> (beta-net 63.1% vs. the 60% IMA cap) and left CPI and META crowding as separate cards, because those are different risks. Ranked by dollars at risk, the NVDA trim is first.',
      matrix:[
        ['Macro','8','1','4','2','—','3'],
        ['Flows','5','0','2','3','1','—'],
        ['Digital','6','0','1','0','1','0'],
        ['Earnings','1','2','7','5','0','2'],
        ['Pos Intel','4','3','1','—','0','2']
      ]
    },
    global:{
      eyebrow:'Point Conductor · Global Macro Fund',
      title:'The rate book is the whole story today.',
      chip:'Merged 3 rate alerts → 1 DV01 card',
      meta:'Global Macro Fund',
      focusTitle:'Today\'s composition · Global Macro',
      focus:'CPI, the 4.40% break, and long book DV01 were three alerts about one exposure. The conductor merged them into <b>a single 0.6× ZN ladder</b> and kept the yen trim and the gold partial separate. China stimulus is an idea, not a risk.',
      matrix:[
        ['Macro','—','2','6','1','—','4'],
        ['Flows','3','0','1','1','5','—'],
        ['Digital','1','0','0','0','2','0'],
        ['Earnings','0','1','2','1','3','1'],
        ['Pos Intel','2','1','1','—','4','1']
      ]
    },
    neutral:{
      eyebrow:'Point Conductor · Market Neutral Fund',
      title:'No single-name drift. The conductor is watching pairs.',
      chip:'44 pairs balanced · 0 critical',
      meta:'Market Neutral Fund',
      focusTitle:'Today\'s composition · Market Neutral',
      focus:'Nothing breached a limit and no single name drifted. The conductor ranked a <b>pair add</b> (PG/CL at +2.1σ), a <b>borrow warning</b> on the NVO short, and a <b>Visa tilt</b> inside V/MA. Net beta stays 0.04. There is no critical card on this fund.',
      matrix:[
        ['Macro','1','0','1','0','—','0'],
        ['Flows','1','0','2','2','0','—'],
        ['Digital','0','0','0','0','0','0'],
        ['Earnings','0','1','3','2','0','1'],
        ['Pos Intel','0','1','1','—','0','2']
      ]
    },
    digital:{
      eyebrow:'Point Conductor · Digital Assets Fund',
      title:'Weekend coverage is the edge on this book.',
      chip:'2 ranked cards queued for the open',
      meta:'Digital Assets Fund',
      focusTitle:'Today\'s composition · Digital Assets',
      focus:'The desk was dark. The conductor kept the weekend tape: funding and open interest became the <b>MSTR/COIN hedge</b>, and the CLSK 200-day break became a <b>separate stop</b> because it is a different decision. The tNVDA basis stays a warning until the cash open confirms it. SOL is an idea only after CLSK is sold, so crypto-β does not tag the 75% cap.',
      matrix:[
        ['Macro','3','1','2','1','—','2'],
        ['Flows','2','0','1','1','1','—'],
        ['Digital','6','2','3','1','4','2'],
        ['Earnings','1','1','2','2','1','1'],
        ['Pos Intel','2','2','1','—','1','2']
      ]
    }
  };
  function renderConductor(fund){
    const c=conductorCopy[fund]||conductorCopy.alpha;
    const set=(id,v)=>{const el=document.getElementById(id); if(el) el.textContent=v;};
    const html=(id,v)=>{const el=document.getElementById(id); if(el) el.innerHTML=v;};
    set('conductor-eyebrow', c.eyebrow);
    set('conductor-title', c.title);
    set('conductor-chip', c.chip);
    set('conductor-focus-meta', c.meta);
    set('conductor-focus-title', c.focusTitle);
    html('conductor-focus-body', c.focus);
    const mx=document.getElementById('handoff-matrix');
    if(!mx) return;
    const head='<div class="mx-head"><span></span><span>Risk</span><span>Tech</span><span>PnL</span><span>Pos</span><span>Macro</span><span>Flows</span></div>';
    const rows=c.matrix.map(r=>'<div class="mx-row"><span class="mx-lab">'+r[0]+'</span>'+r.slice(1).map(cell=>{
      if(cell==='—') return '<span class="c self">—</span>';
      const hot=parseInt(cell,10)>=3;
      return `<span class="c${hot?' on':''}">${cell}</span>`;
    }).join('')+'</div>').join('');
    mx.innerHTML=head+rows;
  }

  /* ---- card detail drawer ---- */
  const overlay=document.getElementById('drawer-overlay');
  const drawer=document.getElementById('drawer');
  const dwInner=document.getElementById('drawer-inner');

  function openCard(id){
    const c=cardIndex[id]; if(!c||!drawer) return;
    const d=c.detail||{};
    const sec=(h,inner,count)=>`<div class="dw-sec"><div class="dw-sec-h">${h}${count?`<span class="count">· ${count}</span>`:''}</div>${inner}</div>`;
    const metrics=`<div class="dw-metrics">${c.metrics.map(m=>`<div class="dw-m"><div class="v ${m[2]}">${m[0]}</div><div class="l">${m[1]}</div></div>`).join('')}</div>`;
    const drivers=d.drivers?sec('Drivers',d.drivers.map(x=>`<div class="dw-driver"><span class="dot"></span><div><div class="dd-t">${x.t}</div><div class="dd-s">${x.s}</div></div><span class="dd-w">${x.w||''}</span></div>`).join(''),d.drivers.length):'';
    const trades=d.trades?sec('Recommended trades',d.trades.map(x=>`<div class="dw-trade"><div class="dw-trade-top"><span class="act ${x.act}">${x.act.toUpperCase()}</span><span class="tk">${x.tk}</span><span class="sz">${x.sz}</span></div><div class="det">${x.det}</div></div>`).join(''),d.trades.length):'';
    const whatif=d.whatif?sec('Pre-trade what-if',`<table class="dw-wtable"><thead><tr><th>Metric</th><th>Before</th><th></th><th>After</th></tr></thead><tbody>${d.whatif.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td class="dw-arrow">→</td><td><b>${r[2]}</b></td></tr>`).join('')}</tbody></table>`):'';
    const evidence=d.evidence?sec('Cross-agent evidence',d.evidence.map(x=>`<div class="dw-evi"><span class="ag">${x.ag}</span><span class="tx">${x.tx}</span></div>`).join(''),d.evidence.length):'';
    const timeline=d.timeline?sec('Audit timeline',`<div class="dw-timeline">${d.timeline.map(x=>`<div class="dw-tl ${x.st||''}"><div class="tl-t">${x.t}</div><div class="tl-s">${x.s}</div></div>`).join('')}</div>`):'';
    const reasoning=d.reasoning?sec('Agent reasoning',`<div class="dw-reason">${d.reasoning}</div>`):'';
    const summary=d.summary?`<div class="dw-reason" style="margin-bottom:24px">${d.summary}</div>`:'';

    dwInner.innerHTML=`
      <div class="dw-head">
        <div class="dw-top">
          <span class="${lvlCls[c.lvl]}">${c.lvl}</span>
          <span class="chip-meta">${c.agent} · ${c.ts||''} · #${c.id}</span>
          <button class="dw-close" id="dw-close" aria-label="Close">✕</button>
        </div>
        <div class="dw-title">${c.title}</div>
        <div class="dw-sub">Composed by Point Conductor · ranked by $ at risk</div>
      </div>
      <div class="dw-body">
        ${summary}
        ${sec('Key metrics',metrics)}
        ${drivers}${trades}${whatif}${evidence}${reasoning}${timeline}
      </div>
      <div class="dw-foot">
        <button class="btn primary" data-approve>Approve</button>
        <button class="btn dark">Modify in What-If</button>
        <button class="btn ghost" id="dw-dismiss">Dismiss</button>
        <span class="meta">Signed by ${c.agent} Agent · audit logged</span>
      </div>`;
    overlay.classList.add('show');
    drawer.classList.add('show');
    drawer.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    dwInner.scrollTop=0;
    document.getElementById('dw-close').onclick=closeCard;
    document.getElementById('dw-dismiss').onclick=closeCard;
    dwInner.querySelector('[data-approve]').onclick=function(){ this.textContent='Approved ✓'; this.style.background='var(--good)'; setTimeout(closeCard,500); };
  }
  function closeCard(){
    if(!drawer) return;
    overlay.classList.remove('show');
    drawer.classList.remove('show');
    drawer.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  }
  if(overlay) overlay.addEventListener('click',closeCard);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeCard(); });

  /* delegate clicks: open drawer unless an action button was clicked */
  document.addEventListener('click',e=>{
    const el=e.target.closest('[data-card]');
    if(el && !e.target.closest('.btn')){ openCard(el.dataset.card); }
  });

  /* ---- event log (live sim) ---- */
  /* event log is rendered per-fund via renderPanels */

  /* ---- search focus with ⌘K ---- */
  document.addEventListener('keydown', e=>{
    if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){
      e.preventDefault();
      const s=document.querySelector('.search input'); if(s) s.focus();
    }
  });

  /* ---- row tagging for filters ---- */
  const cryptoSet=['COIN','MSTR','HOOD','CLSK','BTC','ETH','SOL','USDC','TNVDA','TAAPL','TTSLA','TSPY','TMETA'];
  const futSet=['TY','ES','GC','6E','CL','DX','JPY','HG','BTP'];
  function tagPositions(){
    document.querySelectorAll('#pos-rows tr').forEach(tr=>{
      const tk=(tr.children[0]?.textContent||'').toUpperCase();
      const side=(tr.children[2]?.textContent||'').toLowerCase().includes('short')?'short':'long';
      let kind='equity';
      if(cryptoSet.includes(tk)) kind='crypto';
      else if(futSet.includes(tk)) kind='future';
      else if(tk.includes('/')) kind='pair';
      if(tk==='USDC') kind='cash';
      tr.dataset.tags=side+' '+kind;
    });
  }
  function tagTech(){
    document.querySelectorAll('#tech-rows tr').forEach(tr=>{
      const rsi=parseFloat(tr.children[3]?.textContent)||0;
      const macd=(tr.children[4]?.textContent||'').toLowerCase();
      const volz=parseFloat((tr.children[5]?.textContent||'').replace('σ','').replace('−','-').replace('+',''))||0;
      const atr=(tr.children[6]?.textContent||'').toLowerCase();
      const sig=(tr.children[8]?.textContent||'').toLowerCase();
      const t=[];
      if(atr.includes('stop')||sig.includes('stop')||sig.includes('cut')||sig.includes('crit')) t.push('stops');
      if(rsi>=70||rsi<=35||/div|cross|bear|break|neg/.test(macd)) t.push('rsi');
      if(Math.abs(volz)>=2) t.push('volume');
      if(sig.includes('earn')||/gap|basis/.test(sig)) t.push('earnings');
      tr.dataset.tags=t.join(' ')||'other';
    });
  }
  function tagUniverse(){
    document.querySelectorAll('#research-universe tr').forEach(tr=>{
      const tk=(tr.children[1]?.textContent||'').toUpperCase();
      const fit=(tr.children[9]?.textContent||'').toLowerCase();
      let cat='long';
      if(/short|unwind|exit/.test(fit)) cat='short';
      if(tk.includes('IPO')) cat='ipo';
      tr.dataset.tags=cat;
    });
  }
  window.__tagRows=function(){
    tagPositions(); tagTech(); tagUniverse();
    document.querySelectorAll('.seg').forEach(seg=>{ seg.querySelectorAll('.seg-btn').forEach((x,i)=>x.classList.toggle('active',i===0)); });
  };

  /* ---- functional segmented filters ---- */
  const segKeyMap={'all':'','long':'long','short':'short','options':'option','crypto':'crypto',
    'stops':'stops','rsi/macd':'rsi','volume':'volume','earnings move':'earnings',
    'long ideas':'long','short ideas':'short','ipo/lock-ups':'ipo','ipo':'ipo'};
  document.querySelectorAll('.seg').forEach(seg=>{
    const card=seg.closest('.card'); const tbody=card?card.querySelector('tbody'):null;
    seg.querySelectorAll('.seg-btn').forEach(b=>b.addEventListener('click',()=>{
      seg.querySelectorAll('.seg-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      if(!tbody) return;
      const key=segKeyMap[b.textContent.trim().toLowerCase()];
      [...tbody.querySelectorAll('tr')].forEach(tr=>{
        tr.style.display=(!key||(tr.dataset.tags||'').indexOf(key)>=0)?'':'none';
      });
    }));
  });

  /* ---- functional Action-Cards filters ---- */
  document.querySelectorAll('.filters').forEach(f=>{
    const grid=document.getElementById('cards-grid');
    f.querySelectorAll('.chip-btn').forEach(b=>b.addEventListener('click',()=>{
      f.querySelectorAll('.chip-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      if(!grid) return;
      const label=b.textContent.trim().toLowerCase();
      const lvl=label.startsWith('critical')?'CRIT':label.startsWith('warning')?'WARN':label.startsWith('idea')?'IDEA':'';
      [...grid.querySelectorAll('[data-lvl]')].forEach(c=>{
        c.style.display=(!lvl||c.dataset.lvl===lvl)?'':'none';
      });
    }));
  });

  /* ---- click-to-sort on all data tables ---- */
  function cellVal(td){
    if(!td) return '';
    const t=td.textContent.trim();
    const m=t.replace(/[,$%×σ]/g,'').replace(/−/g,'-').match(/-?\d+(\.\d+)?/);
    return (m && /^[\s$+\-−]*[\d.,]/.test(t)) ? parseFloat(m[0]) : t.toLowerCase();
  }
  document.querySelectorAll('.tbl').forEach(table=>{
    const ths=table.querySelectorAll('thead th'); if(!ths.length) return;
    ths.forEach((th,i)=>{
      th.classList.add('th-sort');
      th.addEventListener('click',()=>{
        const tbody=table.querySelector('tbody'); if(!tbody) return;
        const rows=[...tbody.querySelectorAll('tr')].filter(r=>r.style.display!=='none');
        const asc=th.dataset.asc!=='asc';
        ths.forEach(t=>{t.removeAttribute('data-asc');t.classList.remove('sorted-asc','sorted-desc');});
        th.dataset.asc=asc?'asc':'desc';
        th.classList.add(asc?'sorted-asc':'sorted-desc');
        rows.sort((a,b)=>{
          const av=cellVal(a.children[i]), bv=cellVal(b.children[i]);
          if(typeof av==='number'&&typeof bv==='number') return asc?av-bv:bv-av;
          return asc?String(av).localeCompare(String(bv)):String(bv).localeCompare(String(av));
        });
        rows.forEach(r=>tbody.appendChild(r));
      });
    });
  });
  document.querySelectorAll('.auto-opt').forEach(o=>o.addEventListener('click',()=>{
    document.querySelectorAll('.auto-opt').forEach(x=>x.classList.remove('active'));
    o.classList.add('active');
  }));

  /* ---- approve buttons give feedback ---- */
  document.addEventListener('click', e=>{
    const b = e.target.closest('.btn.primary');
    if(b && b.textContent.trim()==='Approve'){
      if(activeAccount==='user'){
        b.textContent='Needs CIO';
        b.style.background='var(--warn)';
        return;
      }
      b.textContent='Approved ✓'; b.style.background='var(--good)';
      setTimeout(()=>{ const card=b.closest('.card'); if(card) card.style.opacity='.55'; }, 150);
    }
  });

  /* ---- fund switcher ---- */
  const funds = [
    {id:'alpha', name:'Alpha Fund', sub:'Equity L/S · flagship', color:'#e8603b', init:'AL',
     aum:'$1.248 B', aumD:'+$6.1M · 24h', pnl:'+34 bps', pnlUp:true, pnlD:'$ 4.24 M · vs. $2.1M bench',
     exp:'184% / 62%', expD:'Net ↑ 3.1pts since Fri close', var:'$ 14.3 M', varD:'1.15% of NAV',
     cards:'7 action cards', crit:'2 critical'},
    {id:'global', name:'Global Macro Fund', sub:'Macro · multi-asset', color:'#d4a42b', init:'GM',
     aum:'$842.0 M', aumD:'−$2.3M · 24h', pnl:'−12 bps', pnlUp:false, pnlD:'−$ 1.01 M · vs. +$0.4M bench',
     exp:'142% / 38%', expD:'Net flat since Fri close', var:'$ 9.8 M', varD:'1.16% of NAV',
     cards:'4 action cards', crit:'1 critical'},
    {id:'neutral', name:'Market Neutral Fund', sub:'Equity MN · low beta', color:'#58b06a', init:'MN',
     aum:'$1.560 B', aumD:'+$1.2M · 24h', pnl:'+9 bps', pnlUp:true, pnlD:'$ 1.40 M · vs. $0.2M bench',
     exp:'210% / 4%', expD:'Net 4% · within band', var:'$ 6.1 M', varD:'0.39% of NAV',
     cards:'3 action cards', crit:'0 critical'},
    {id:'digital', name:'Digital Assets Fund', sub:'Crypto + tokenized', color:'#6c7bf0', init:'DA',
     aum:'$318.4 M', aumD:'−$8.9M · 24h', pnl:'−2.1%', pnlUp:false, pnlD:'−$ 6.80 M · 24/7 book',
     exp:'96% / 71%', expD:'Net ↑ 6pts on BTC drift', var:'$ 11.2 M', varD:'3.52% of NAV',
     cards:'5 action cards', crit:'2 critical'}
  ];
  /* ---- fund-specific sample data for all IR tear sheet templates ---- */
  const irTearData={
    alpha:{name:'Alpha Fund',strategy:'Global long/short equity',monthly:'+1.82%',ytd:'+18.4%',net:'62%',gross:'184%',longExp:'123%',shortExp:'-61%',aum:'$1.248B',benchName:'S&P 500 TR',bench:'+3.72%',qtd:'+5.14%',long:'+4.51%',short:'+0.63%',returns:[['2026','1.2%','0.8%','2.1%','-0.6%','1.4%','2.8%','1.1%','1.6%','1.82%','18.4%'],['2025','0.9%','1.6%','-0.4%','1.2%','0.7%','1.9%','1.3%','-0.2%','1.1%','12.6%'],['2024','0.5%','1.1%','1.8%','-0.3%','0.9%','1.4%','0.7%','1.2%','-0.5%','10.8%']],snapshot:[['Strategy','Long/short equity'],['Inception','January 2021'],['Gross exposure','184%'],['Annualized volatility','11.6%'],['Largest drawdown','-8.2%'],['Reference index','S&P 500 TR']],mixTitle:'Exposure by sector',mix:[['Information technology',31],['Communication services',21],['Consumer discretionary',16],['Healthcare',12],['Cash & other',10]],allocTitle:'Exposure by market cap',allocation:[['Large cap',56],['Mid cap',31],['Small cap',13]],positions:[['NVIDIA','Long','6.4%','+0.42%','AI infrastructure'],['Microsoft','Long','5.8%','-0.11%','Cloud platform'],['Meta Platforms','Long','5.1%','+0.28%','Digital advertising'],['PepsiCo','Short','-3.2%','+0.07%','Consumer hedge']],attr:[['Long stock selection','+3.84%'],['Short stock selection','+0.63%'],['Sector allocation','+0.91%'],['Cash & expenses','-0.24%']],risk:[['ANNUALIZED RETURN - ITD','14.2%'],['ANNUALIZED VOLATILITY','11.6%'],['SHARPE RATIO','1.18'],['MAX DRAWDOWN','-8.2%']]},
    global:{name:'Global Macro Fund',strategy:'Global macro - multi-asset',monthly:'-0.12%',ytd:'+11.2%',net:'38%',gross:'142%',longExp:'90%',shortExp:'-52%',aum:'$842.0M',benchName:'Macro Blend',bench:'+1.46%',qtd:'+2.18%',long:'+1.54%',short:'+0.64%',returns:[['2026','0.8%','1.1%','-0.5%','1.7%','2.2%','1.4%','1.8%','0.6%','-0.12%','11.2%'],['2025','1.2%','0.4%','0.9%','-1.1%','1.7%','0.8%','1.2%','0.5%','0.7%','8.9%'],['2024','0.7%','0.9%','1.3%','0.2%','-0.4%','1.1%','0.6%','0.8%','0.3%','7.2%']],snapshot:[['Strategy','Global macro'],['Inception','March 2018'],['Gross exposure','142%'],['Annualized volatility','8.9%'],['Largest drawdown','-6.4%'],['Reference index','Macro Blend']],mixTitle:'Exposure by asset class',mix:[['Rates',34],['Foreign exchange',22],['Equity index',18],['Commodities',16],['Cash & other',10]],allocTitle:'Risk allocation',allocation:[['Rates',40],['FX',24],['Equities',18],['Commodities',18]],positions:[['10Y Treasury future','Long','18.0%','-0.24%','Duration hedge'],['Gold future','Long','11.0%','+0.31%','Inflation hedge'],['EUR/USD','Short','-9.0%','+0.12%','Relative rates'],['WTI crude','Long','4.0%','-0.08%','Supply outlook']],attr:[['Rates & duration','+0.82%'],['FX positioning','+0.46%'],['Commodities','+1.08%'],['Cash & expenses','-0.18%']],risk:[['ANNUALIZED RETURN - ITD','9.6%'],['ANNUALIZED VOLATILITY','8.9%'],['SHARPE RATIO','1.07'],['MAX DRAWDOWN','-6.4%']]},
    neutral:{name:'Market Neutral Fund',strategy:'Equity market neutral - paired',monthly:'+0.27%',ytd:'+7.8%',net:'4%',gross:'210%',longExp:'107%',shortExp:'-103%',aum:'$1.560B',benchName:'Neutral Composite',bench:'+0.82%',qtd:'+1.34%',long:'+0.92%',short:'+0.42%',returns:[['2026','0.6%','0.7%','0.5%','0.8%','0.4%','0.9%','0.6%','0.7%','0.27%','7.8%'],['2025','0.5%','0.6%','0.4%','0.7%','0.6%','0.5%','0.8%','0.3%','0.5%','6.6%'],['2024','0.4%','0.5%','0.6%','0.3%','0.5%','0.4%','0.6%','0.5%','0.4%','5.7%']],snapshot:[['Strategy','Equity market neutral'],['Inception','June 2019'],['Gross exposure','210%'],['Annualized volatility','4.2%'],['Largest drawdown','-3.1%'],['Reference index','Neutral Composite']],mixTitle:'Exposure by sector',mix:[['Healthcare',26],['Consumer staples',22],['Financials',20],['Industrials',16],['Other',16]],allocTitle:'Pair allocation',allocation:[['Healthcare pairs',26],['Consumer pairs',24],['Payments pairs',20],['Industrials pairs',16],['Other pairs',14]],positions:[['LLY / NVO','Long / short','5.2%','+0.22%','Pharma pair'],['V / MA','Long / short','4.4%','+0.14%','Payments pair'],['COST / WMT','Long / short','4.1%','+0.09%','Retail pair'],['HD / LOW','Long / short','3.8%','-0.03%','Home improvement']],attr:[['Pair selection','+0.72%'],['Spread convergence','+0.48%'],['Financing & borrow','+0.24%'],['Cash & expenses','-0.10%']],risk:[['ANNUALIZED RETURN - ITD','8.1%'],['ANNUALIZED VOLATILITY','4.2%'],['SHARPE RATIO','1.42'],['MAX DRAWDOWN','-3.1%']]},
    digital:{name:'Digital Assets Fund',strategy:'Digital assets - liquid token markets',monthly:'-2.1%',ytd:'+34.1%',net:'71% crypto beta',gross:'96%',longExp:'83%',shortExp:'-12%',aum:'$318.4M',benchName:'Digital Asset 30',bench:'+6.2%',qtd:'+8.7%',long:'+7.9%',short:'+0.8%',returns:[['2026','4.8%','2.2%','6.1%','3.4%','4.7%','6.2%','5.1%','5.0%','-2.1%','34.1%'],['2025','3.1%','-1.8%','4.5%','2.2%','5.4%','-2.1%','4.8%','3.7%','1.6%','28.4%'],['2024','2.4%','1.9%','3.2%','-1.1%','4.6%','2.8%','3.4%','1.2%','2.2%','24.7%']],snapshot:[['Strategy','Digital assets'],['Inception','October 2020'],['Gross exposure','96%'],['24/7 VaR - 99%','$11.2M'],['Largest drawdown','-18.6%'],['Reference index','Digital Asset 30']],mixTitle:'Exposure by asset',mix:[['Bitcoin',42],['Ethereum',24],['Solana',14],['Digital equities',12],['Cash & other',8]],allocTitle:'Portfolio mix',allocation:[['Layer 1 assets',57],['DeFi & protocols',17],['Digital equities',14],['Cash & other',12]],positions:[['Bitcoin','Long','28.0%','-0.84%','Core digital asset'],['Ethereum','Long','16.0%','-0.42%','Smart contract platform'],['Solana','Long','9.0%','+0.31%','High beta growth'],['MSTR','Long','7.0%','-0.53%','Equity beta proxy']],attr:[['Bitcoin & Ethereum','+6.12%'],['Altcoin selection','+3.38%'],['Digital equities','-0.42%'],['Cash & expenses','-0.38%']],risk:[['ANNUALIZED RETURN - ITD','22.8%'],['ANNUALIZED VOLATILITY','38.4%'],['SHARPE RATIO','0.91'],['MAX DRAWDOWN','-18.6%']]}
  };
  const irMonths=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep'];
  const irKpis=(items,extra='')=>`<div class="tear-kpis ${extra}">${items.map(([label,value])=>`<div><span>${label}</span><b>${value}</b></div>`).join('')}</div>`;
  // Clear the old persistent demo queue state so the report returns to its original controls.
  try{for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(key&&key.startsWith('ir-compliance:'))localStorage.removeItem(key);}}catch(e){}
  const irActions=(report,fund)=>{
    return `<div class="ir-actions" data-ir-report="${report}"><button class="btn primary" data-ir-action="submit">Send to compliance</button><button class="btn ghost" data-ir-action="edit">Edit</button><button class="btn ghost" data-ir-action="save" hidden>Save</button><button class="btn ghost" data-ir-action="cancel" hidden>Cancel</button><button class="btn dark" data-ir-action="export">Export .docx</button><span class="ir-action-message" data-ir-message role="status" aria-live="polite"></span></div>`;
  };
  function renderIRTearSheets(id){
    const d=irTearData[id]||irTearData.alpha;
    const headings=['Year',...irMonths,'YTD'].map(x=>`<th>${x}</th>`).join('');
    const retRows=d.returns.map(row=>`<tr><th>${row[0]}</th>${row.slice(1).map(v=>`<td>${v}</td>`).join('')}</tr>`).join('');
    const snapshot=d.snapshot.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    const monthly=`<article class="tear"><div class="tear-title-row"><div><div class="tear-kicker">MONTHLY FACTSHEET &middot; SEPTEMBER 2026</div><h2>${d.name}</h2><p>${d.strategy} &middot; USD &middot; Net of fees</p></div><div class="tear-period">AS OF<br><b>30 SEP 2026</b></div></div>${irKpis([['MONTHLY RETURN',d.monthly],['YTD RETURN',d.ytd],['NET EXPOSURE',d.net],['FUND AUM',d.aum]])}<div class="tear-columns"><div class="tear-block"><h3>Monthly net returns</h3><div class="tear-table-wrap"><table class="tear-table"><thead><tr>${headings}</tr></thead><tbody>${retRows}</tbody></table></div></div><aside class="tear-block tear-side"><h3>Fund snapshot</h3><dl>${snapshot}</dl></aside></div></article>`;
    const mix=d.mix.map(([name,n])=>`<div class="exposure-row"><span>${name}</span><div class="exposure-track"><i style="width:${n}%"></i></div><b>${n}%</b></div>`).join('');
    const palette=['var(--gold)','#687f75','#aeb8a5','#8b7861','#687f75'];
    const stack=d.allocation.map(([name,n],i)=>`<i title="${name}: ${n}%" style="width:${n}%;background:${palette[i%palette.length]}"></i>`).join('');
    const allocation=d.allocation.map(([name,n],i)=>`<div><i style="background:${palette[i%palette.length]}"></i><span>${name}</span><b>${n}%</b></div>`).join('');
    const positions=d.positions.map(row=>`<tr><th>${row[0]}</th><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td><td>${row[4]}</td></tr>`).join('');
    const exposure=`<article class="tear"><div class="tear-title-row"><div><div class="tear-kicker">PORTFOLIO &amp; EXPOSURE &middot; Q3 2026</div><h2>${d.name}</h2><p>Portfolio positioning at 30 September 2026 &middot; USD</p></div><div class="tear-period">STRATEGY<br><b>${d.strategy}</b></div></div>${irKpis([['LONG EXPOSURE',d.longExp],['SHORT EXPOSURE',d.shortExp],['NET / GROSS',`${d.net} / ${d.gross}`]],'three')}<div class="tear-columns"><div class="tear-block"><h3>${d.mixTitle}</h3><div class="exposure-list">${mix}</div></div><aside class="tear-block tear-side"><h3>${d.allocTitle}</h3><div class="cap-stack">${stack}</div><div class="cap-legend">${allocation}</div><div class="tear-callout"><span>PORTFOLIO PROFILE</span><b>${d.gross} gross exposure</b><small>Net exposure: ${d.net}</small></div></aside></div><div class="tear-block"><h3>Largest positions</h3><div class="tear-table-wrap"><table class="tear-table"><thead><tr><th>Position</th><th>Side</th><th>Weight</th><th>Contribution &middot; Q3</th><th>Portfolio role</th></tr></thead><tbody>${positions}</tbody></table></div></div></article>`;
    const returnWidths=[d.qtd,d.bench,d.long,d.short].map(x=>Math.abs(parseFloat(x)));
    const maxReturn=Math.max(...returnWidths,1);
    const bar=(label,value,kind='')=>`<div><span>${label}</span><div><i class="${kind}" style="width:${Math.max(8,Math.round(Math.abs(parseFloat(value))/maxReturn*100))}%"></i></div><b>${value}</b></div>`;
    const attribution=d.attr.map(([name,value])=>`<div><span>${name}</span><b class="${value.startsWith('-')?'dn':'up'}">${value}</b></div>`).join('');
    const risk=irKpis(d.risk,'four risk-kpis');
    const performance=`<article class="tear"><div class="tear-title-row"><div><div class="tear-kicker">PERFORMANCE &amp; ATTRIBUTION &middot; Q3 2026</div><h2>${d.name}</h2><p>Net performance compared with ${d.benchName}</p></div><div class="tear-period">QUARTER ENDED<br><b>30 SEP 2026</b></div></div>${irKpis([['FUND &middot; QTD',d.qtd],['FUND &middot; YTD',d.ytd],[`${d.benchName.toUpperCase()} &middot; QTD`,d.bench]],'three')}<div class="tear-columns"><div class="tear-block"><h3>Quarterly return comparison</h3><div class="return-bars">${bar(d.name,d.qtd)}${bar(d.benchName,d.bench,'benchmark')}${bar('Long book',d.long)}${bar('Short book',d.short,'short')}</div><div class="tear-callout"><span>QUARTERLY RETURN</span><b>${d.qtd}</b><small>Fund net return for the quarter</small></div></div><aside class="tear-block tear-side"><h3>Return attribution &middot; Q3</h3><div class="attribution-list">${attribution}<div class="total"><span>Net fund return</span><b>${d.qtd}</b></div></div></aside></div><div class="tear-block"><h3>Risk &amp; return profile</h3>${risk}</div></article>`;
    [['ir-template1','template1',monthly],['ir-template2','template2',exposure],['ir-template3','template3',performance]].forEach(([panelId,report,html])=>{
      const panel=document.getElementById(panelId); if(!panel) return;
      panel.innerHTML=html.replace('<article class="tear">',`<article class="tear" data-ir-doc="${report}">`)+irActions(report,id);
      try{const saved=localStorage.getItem(`ir-draft:${id}:${report}`);const doc=panel.querySelector('[data-ir-doc]');if(saved&&doc)doc.innerHTML=saved;}catch(e){}
    });
  }
  const fundSwitch=document.getElementById('fund-switch');
  const fundMenu=document.getElementById('fund-menu');
  const fundBtnName=document.getElementById('fund-btn-name');
  let activeFund='alpha';
  let activeAccount='admin';
  const setText=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};

  const ACCOUNTS={
    admin:{
      id:'admin', name:'Admin', init:'AD', email:'admin@goldenhillsindia.com',
      role:'CIO', access:'Full access', desk:'Investment office', loc:'Mumbai · IST',
      phone:'+91 22 4000 0142', emp:'GH-0142', joined:'March 2019', tz:'Asia/Kolkata',
      autonomy:'Confirm — one-click approval sends the trade',
      agents:'All ten agents, Point Conductor, MCP and Execute',
      funds:['alpha','global','neutral','digital'],
      canApprove:true, canManage:true,
      blurb:'Sees every fund, approves Action Cards, and changes who else can sign in.',
      activity:[
        ['06:11 ET','Approved nothing yet','2 critical cards are waiting on the Alpha book'],
        ['Fri 16:28','Modified a hedge','Hot-CPI ladder saved instead of sent'],
        ['Fri 16:12','Signed the SMH spread','Suresh had already checked the premium'],
        ['Fri 16:04','Approved the META trim','50% reduction, audit #AC-20261006-087']
      ]
    },
    user:{
      id:'user', name:'User', init:'US', email:'user@goldenhillsindia.com',
      role:'Analyst', access:'Limited access', desk:'Research', loc:'Mumbai · IST',
      phone:'+91 22 4000 2281', emp:'GH-2281', joined:'January 2024', tz:'Asia/Kolkata',
      autonomy:'Alert only — cards can be read, not approved',
      agents:'Research & Alpha, Earnings & Sentiment, Position Intel',
      funds:['alpha','neutral'],
      canApprove:false, canManage:false,
      blurb:'Reads the Alpha and Market Neutral books. Approvals and the other two funds stay with the CIO.',
      activity:[
        ['06:08 ET','Opened the morning brief','Alpha semiconductor note, read only'],
        ['05:40 ET','Ranked the payments pair','V/MA tilt drafted for the CIO'],
        ['Fri 18:10','Exported a tear sheet','September Alpha sheet, no LP send'],
        ['Fri 11:02','Commented on UBER','Composite 0.89 left on the research card']
      ]
    }
  };
  function account(){ return ACCOUNTS[activeAccount]||ACCOUNTS.admin; }
  function allowedFunds(){
    const a=ACCOUNTS[activeAccount];
    return a ? funds.filter(f=>a.funds.includes(f.id)) : funds;
  }
  function renderFundMenu(){
    if(!fundMenu) return;
    const list=allowedFunds();
    fundMenu.innerHTML='<div class="fund-menu-h">Switch fund · '+list.length+'</div>'+
      list.map(f=>`<div class="fund-opt ${f.id===activeFund?'active':''}" data-fund="${f.id}">
        <span class="fund-ic" style="background:${f.color}">${f.init}</span>
        <div><div class="fo-name">${f.name}</div><div class="fo-sub">${f.sub}</div></div>
        ${f.id===activeFund?'<span class="fo-check">✓</span>':`<span class="fo-aum">${f.aum}</span>`}
      </div>`).join('')+
      '<div class="fund-menu-foot"><a id="fund-manage-link">Manage funds</a></div>';
    fundMenu.querySelectorAll('.fund-opt').forEach(o=>o.addEventListener('click',()=>{
      selectFund(o.dataset.fund); fundSwitch.classList.remove('open');
    }));
    const manage=document.getElementById('fund-manage-link');
    if(manage) manage.onclick=e=>{ e.stopPropagation(); fundSwitch.classList.remove('open'); go('funds'); };
  }
  function selectFund(id){
    const a=ACCOUNTS[activeAccount];
    if(a && !a.funds.includes(id)) return;
    const f=funds.find(x=>x.id===id); if(!f) return;
    activeFund=id;
    renderIRTearSheets(id);
    if(fundBtnName) fundBtnName.textContent=f.name;
    setText('hero-fund', f.name.replace(/ Fund$/,''));
    const cardList=cardsByFund[id]||cardsByFund.alpha;
    const critN=cardList.filter(c=>c.lvl==='CRIT').length;
    setText('hero-cards', cardList.length+' action cards');
    setText('hero-crit', critN+' critical');
    setText('kpi-aum', f.aum); setText('kpi-aum-d', f.aumD);
    setText('kpi-pnl', f.pnl); setText('kpi-pnl-d', f.pnlD);
    setText('kpi-exp', f.exp); setText('kpi-exp-d', f.expD);
    setText('kpi-var', f.var); setText('kpi-var-d', f.varD);
    const pnlEl=document.getElementById('kpi-pnl');
    if(pnlEl){ pnlEl.classList.toggle('up',f.pnlUp); pnlEl.classList.toggle('dn',!f.pnlUp); }
    const aumD=document.getElementById('kpi-aum-d');
    if(aumD){ const up=!f.aumD.includes('−'); aumD.classList.toggle('up',up); aumD.classList.toggle('dn',!up); }
    const critEl=document.getElementById('hero-crit');
    if(critEl) critEl.style.color = critN===0 ? 'var(--good)' : '';
    const dot=document.querySelector('.fund-dot'); if(dot) dot.style.background=f.color;
    renderDetail(id);
    syncIRDashboardStatus(id);
    try{ localStorage.setItem('point-fund', id); }catch(e){}
    renderFundMenu();
    document.dispatchEvent(new Event('point:context'));
  }
  try{ const sa=localStorage.getItem('point-account'); if(sa && ACCOUNTS[sa]) activeAccount=sa; }catch(e){}
  renderFundMenu();
  let _restored=false;
  function syncIRDashboardStatus(fund){
    const bar=document.querySelector('[data-ir-report="dashboard"]');if(!bar)return;
    const submit=bar.querySelector('[data-ir-action="submit"]');
    if(submit){submit.textContent='Send to compliance';submit.disabled=false;}
  }

  function irXmlEscape(value){return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');}
  function irCrc32(bytes){let crc=-1;for(let i=0;i<bytes.length;i++){crc^=bytes[i];for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xEDB88320:0);}return (crc^-1)>>>0;}
  function irMakeDocx(text){
    const enc=new TextEncoder();
    const files=[
      ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
      ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
      ['word/document.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${text.split(/\r?\n/).map(line=>`<w:p><w:r><w:t xml:space="preserve">${irXmlEscape(line)}</w:t></w:r></w:p>`).join('')}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`]
    ].map(([name,content])=>({name:enc.encode(name),data:enc.encode(content)}));
    const chunks=[],central=[];let offset=0;
    const u16=n=>[n&255,(n>>>8)&255],u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
    const append=(target,arr)=>target.push(new Uint8Array(arr));
    files.forEach(file=>{
      const crc=irCrc32(file.data),local=[...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(file.data.length),...u32(file.data.length),...u16(file.name.length),...u16(0)];
      chunks.push(new Uint8Array(local),file.name,file.data);
      const c=[...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(file.data.length),...u32(file.data.length),...u16(file.name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset)];
      central.push(new Uint8Array(c),file.name);offset+=local.length+file.name.length+file.data.length;
    });
    const centralSize=central.reduce((n,b)=>n+b.length,0),end=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(centralSize),...u32(offset),...u16(0)]);
    return new Blob([...chunks,...central,end],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  }
  const irConfirmOverlay=document.getElementById('ir-confirm-overlay');
  const irConfirmCard=document.getElementById('ir-confirm-card');
  let irConfirmReturnFocus=null;
  function openIRConfirmation(button,report){
    if(!irConfirmOverlay||!irConfirmCard)return;
    const fundName=(funds.find(f=>f.id===activeFund)||funds[0]).name;
    const reportName=report==='dashboard'?'investor letter':report==='template1'?'monthly factsheet':report==='template2'?'portfolio and exposure report':'performance and attribution report';
    const copy=irConfirmOverlay.querySelector('[data-ir-confirm-copy]');
    if(copy)copy.textContent=`Your ${fundName} ${reportName} is marked for compliance review.`;
    irConfirmReturnFocus=button.closest('[data-ir-report]')?.querySelector('[data-ir-action="edit"]')||button;
    irConfirmOverlay.hidden=false;irConfirmCard.focus();
  }
  function closeIRConfirmation(){
    if(!irConfirmOverlay)return;
    irConfirmOverlay.hidden=true;
    if(irConfirmReturnFocus&&!irConfirmReturnFocus.disabled)irConfirmReturnFocus.focus();
  }
  irConfirmOverlay?.addEventListener('click',event=>{if(event.target===irConfirmOverlay||event.target.closest('[data-ir-close]'))closeIRConfirmation();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&irConfirmOverlay&&!irConfirmOverlay.hidden)closeIRConfirmation();});
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-ir-action]');if(!button)return;
    const bar=button.closest('[data-ir-report]');if(!bar)return;
    const report=bar.dataset.irReport, action=button.dataset.irAction, key=`ir-draft:${activeFund}:${report}`;
    const target=report==='dashboard'?document.getElementById('ir-letter'):document.querySelector(`#ir-${report} [data-ir-doc]`);
    const message=bar.querySelector('[data-ir-message]'),status=bar.querySelector('[data-ir-status]');
    const say=text=>{if(message)message.textContent=text;};
    if(!target){say('Report content is unavailable.');return;}
    if(action==='edit'){
      target.dataset.irBackup=target.innerHTML;target.contentEditable='true';target.classList.add('ir-editing');target.focus();
      button.hidden=true;bar.querySelector('[data-ir-action="save"]').hidden=false;bar.querySelector('[data-ir-action="cancel"]').hidden=false;bar.querySelector('[data-ir-action="submit"]').disabled=true;say('Edit the report, then save or cancel.');
    }else if(action==='save'){
      target.contentEditable='false';target.classList.remove('ir-editing');delete target.dataset.irBackup;
      try{localStorage.setItem(key,target.innerHTML);localStorage.removeItem(`ir-compliance:${activeFund}:${report}`);}catch(e){say('Could not save this draft in browser storage.');return;}
      bar.querySelector('[data-ir-action="edit"]').hidden=false;button.hidden=true;bar.querySelector('[data-ir-action="cancel"]').hidden=true;
      const submit=bar.querySelector('[data-ir-action="submit"]');submit.disabled=false;submit.textContent='Send to compliance';
      if(status){status.textContent='Draft saved';status.classList.remove('good');status.classList.add('ghost');}say('Draft saved on this device.');
    }else if(action==='cancel'){
      if(target.dataset.irBackup!==undefined)target.innerHTML=target.dataset.irBackup;
      target.contentEditable='false';target.classList.remove('ir-editing');delete target.dataset.irBackup;
      bar.querySelector('[data-ir-action="edit"]').hidden=false;bar.querySelector('[data-ir-action="save"]').hidden=true;button.hidden=true;
      const stillQueued=(()=>{try{return localStorage.getItem(`ir-compliance:${activeFund}:${report}`)==='queued';}catch(e){return false;}})();
      const submit=bar.querySelector('[data-ir-action="submit"]');submit.disabled=stillQueued;
      if(status){status.textContent=stillQueued?'Queued for compliance':'Draft';status.classList.toggle('good',stillQueued);status.classList.toggle('ghost',!stillQueued);}
      say('Edits canceled.');
    }else if(action==='submit'){
      if(target.isContentEditable){say('Save or cancel your edits before submitting.');return;}
      say('');openIRConfirmation(button,report);
    }else if(action==='export'){
      const fundName=(funds.find(f=>f.id===activeFund)||funds[0]).name;
      const reportName=report==='dashboard'?'Investor Letter':report==='template1'?'Monthly Factsheet':report==='template2'?'Portfolio Exposure':'Performance Attribution';
      const blob=irMakeDocx(`${fundName} - ${reportName}\n\n${target.innerText.trim()}`),url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download=`${fundName.replace(/[^a-z0-9]+/gi,'-')}-${reportName.replace(/[^a-z0-9]+/gi,'-')}.docx`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);say('DOCX downloaded.');
    }
  });
  try{
    const sf=localStorage.getItem('point-fund');
    if(sf && account().funds.includes(sf)){ selectFund(sf); _restored=true; }
  }catch(e){}
  if(!_restored) selectFund(account().funds.includes(activeFund)?activeFund:account().funds[0]);
  if(document.getElementById('fund-btn')){
    document.getElementById('fund-btn').addEventListener('click',e=>{
      e.stopPropagation();
      document.getElementById('profile')?.classList.remove('open');
      fundSwitch.classList.toggle('open');
    });
  }

  /* ---- profile menu ---- */
  const profile=document.getElementById('profile');
  const profileBtn=document.getElementById('profile-btn');
  if(profileBtn){
    profileBtn.addEventListener('click',e=>{
      e.stopPropagation();
      fundSwitch?.classList.remove('open');
      profile.classList.toggle('open');
    });
    profile.querySelectorAll('.pm-item').forEach(it=>it.addEventListener('click',e=>{
      e.preventDefault();
      const dest=it.dataset.go;
      profile.classList.remove('open');
      if(dest) go(dest);
    }));
  }

  const defaultPrefs=id=>({
    brief:true, crit:true, digest:id==='admin', email:id==='admin',
    landing:id==='admin'?'dashboard':'brief', timeout:id==='admin'?'8 hours':'1 hour'
  });
  function loadPrefs(){
    try{ const raw=localStorage.getItem('point-prefs-'+activeAccount); if(raw) return Object.assign(defaultPrefs(activeAccount), JSON.parse(raw)); }catch(e){}
    return defaultPrefs(activeAccount);
  }
  function savePrefs(p){ try{ localStorage.setItem('point-prefs-'+activeAccount, JSON.stringify(p)); }catch(e){} }

  function renderAccountPages(){
    const a=account();
    const prefs=loadPrefs();
    const avCls=a.id==='user'?'avatar user':'avatar';
    const fields=[
      ['Email',a.email],['Phone',a.phone],['Employee ID',a.emp],['Desk',a.desk],
      ['Location',a.loc],['Time zone',a.tz],['Joined',a.joined],['Autonomy',a.autonomy]
    ];
    const rights=a.canApprove
      ? [['Approve Action Cards','Yes — trades leave on your click'],['Manage fund access','Yes — all four funds'],['Export audit','Yes — CSV and JSON'],['Point Execute','Yes — within the guardrails']]
      : [['Approve Action Cards','No — the CIO has to sign'],['Manage fund access','No — you can open the two funds you cover'],['Export audit','Read-only tear sheets only'],['Point Execute','No — alert tier']];
    Qset('view-profile', `
      <div class="view-head"><div><div class="eyebrow">Account · ${a.role}</div><h1 class="h2">My profile</h1></div><span class="chip">${a.access}</span></div>
      <div class="card">
        <div class="id-hero">
          <span class="${avCls}" style="width:64px;height:64px;border-radius:16px;font-size:20px">${a.init}</span>
          <div><div class="id-name">${a.name}</div><div class="id-mail">${a.email}</div><div style="margin-top:8px"><span class="pill orange">${a.role}</span> <span class="pill ghost">${a.desk}</span></div></div>
        </div>
        <p style="margin:0 0 16px;color:var(--txt-2);font-size:13.5px;line-height:1.5">${a.blurb}</p>
        <div class="kv">${fields.map(f=>`<span>${f[0]}</span><b>${f[1]}</b>`).join('')}</div>
      </div>
      <div class="grid-2">
        <div class="card"><div class="card-head"><h3 class="card-title">What this login can do</h3></div>
          ${rights.map(r=>`<div class="act-row"><div><b>${r[0]}</b><small>${r[1]}</small></div></div>`).join('')}
          <div class="act-row"><div><b>Agents</b><small>${a.agents}</small></div></div>
        </div>
        <div class="card"><div class="card-head"><h3 class="card-title">Recent activity</h3><span class="chip ghost">this login</span></div>
          ${a.activity.map(r=>`<div class="act-row"><div><b>${r[1]}</b><small>${r[2]}</small></div><small style="margin-left:auto;white-space:nowrap">${r[0]}</small></div>`).join('')}
        </div>
      </div>`);

    const tog=(key,on)=>`<button type="button" class="toggle ${on?'on':''}" data-pref="${key}" aria-label="${key}"><i></i></button>`;
    const fundOpts=a.funds.map(id=>{ const f=funds.find(x=>x.id===id); return `<option value="${id}" ${prefs.fund===id?'selected':''}>${f.name}</option>`; }).join('');
    Qset('view-settings', `
      <div class="view-head"><div><div class="eyebrow">Account · ${a.name}</div><h1 class="h2">Account settings</h1></div><span class="chip ghost" id="settings-saved">Changes save on this browser</span></div>
      <div class="grid-2">
        <div class="card"><div class="card-head"><h3 class="card-title">Notifications</h3></div>
          <div class="set-row"><div><b>Morning brief</b><small>Delivered at 05:58 ET for the funds you cover.</small></div>${tog('brief',prefs.brief)}</div>
          <div class="set-row"><div><b>Critical cards</b><small>Ping when a card is ranked critical on your book.</small></div>${tog('crit',prefs.crit)}</div>
          <div class="set-row"><div><b>Conductor digest</b><small>${a.canApprove?'A short note when alerts are merged into one card.':'Off for this login — digests go to the CIO.'}</small></div>${tog('digest',prefs.digest)}</div>
          <div class="set-row"><div><b>Email as well as in-app</b><small>Sends to ${a.email}.</small></div>${tog('email',prefs.email)}</div>
        </div>
        <div class="card"><div class="card-head"><h3 class="card-title">Security</h3></div>
          <div class="set-row"><div><b>Password</b><small>Last changed 12 Sep 2026. This demo does not store a password.</small></div><button class="btn ghost" type="button" id="pw-btn">Send reset link</button></div>
          <div class="set-row"><div><b>Two-factor</b><small>${a.canApprove?'Authenticator app, required for CIO approval.':'Not required on the analyst login.'}</small></div><span class="pill ${a.canApprove?'good':'ghost'}">${a.canApprove?'On':'Off'}</span></div>
          <div class="set-row"><div><b>Session timeout</b><small>Idle time before this browser is signed out.</small></div>
            <select class="set-select" id="pref-timeout">${['30 minutes','1 hour','8 hours','Until I sign out'].map(t=>`<option ${prefs.timeout===t?'selected':''}>${t}</option>`).join('')}</select></div>
          <div class="set-row"><div><b>This browser</b><small>Signed in as ${a.name}. Theme is kept after sign-out.</small></div><span class="pill ghost">Current</span></div>
        </div>
      </div>
      <div class="card"><div class="card-head"><h3 class="card-title">Workspace</h3></div>
        <div class="set-row"><div><b>Theme</b><small>Same control as the sun and moon in the header.</small></div>
          <span style="display:flex;gap:8px"><button class="btn ghost" type="button" data-theme-set="dark">Dark</button><button class="btn ghost" type="button" data-theme-set="light">Light</button></span></div>
        <div class="set-row"><div><b>Open on</b><small>Where sign-in lands for this account.</small></div>
          <select class="set-select" id="pref-landing">${[['dashboard','Dashboard'],['brief','Morning Brief'],['cards','Action Cards'],['profile','My profile']].map(o=>`<option value="${o[0]}" ${prefs.landing===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div>
        <div class="set-row"><div><b>Default fund</b><small>Only funds this login is allowed to open.</small></div>
          <select class="set-select" id="pref-fund">${fundOpts}</select></div>
      </div>`);

    const rows=funds.map(f=>{
      const open=a.funds.includes(f.id);
      const seat=f.id==='alpha'?(a.canApprove?'CIO':'Covering analyst'):f.id==='neutral'?(a.canApprove?'CIO':'Read'):a.canApprove?'CIO':'No seat';
      return `<div class="fund-access">
        <span class="fund-ic" style="background:${f.color}">${f.init}</span>
        <div style="flex:1"><b style="font-size:14px">${f.name}</b><div style="font-size:12px;color:var(--txt-3);margin-top:2px">${f.sub} · your seat: ${seat}</div></div>
        <span class="pill ${open?'good':'ghost'}">${open?'Can open':'Locked'}</span>
        ${open?`<button class="btn primary" type="button" data-open-fund="${f.id}">Open</button>`:`<button class="btn ghost" type="button" data-ask-fund="${f.id}">Request access</button>`}
      </div>`;
    }).join('');
    Qset('view-funds', `
      <div class="view-head"><div><div class="eyebrow">Account · ${a.name}</div><h1 class="h2">Manage funds</h1></div><span class="chip">${a.funds.length} of 4 open</span></div>
      <div class="card"><div class="card-head"><h3 class="card-title">Fund access</h3><span class="chip ghost">${a.canManage?'You grant seats':'Seats are granted by the CIO'}</span></div>
        <div class="card-b" style="padding-top:0">${rows}</div>
      </div>
      <p style="color:var(--txt-3);font-size:12.5px;line-height:1.5">Opening a fund loads that book on the dashboard, the morning brief, the action cards and the conductor. A locked fund stays off the switcher until the CIO adds this login.</p>`);

    Qset('view-signout', `
      <div class="view-head"><div><div class="eyebrow">Account · session</div><h1 class="h2">Sign out</h1></div></div>
      <div class="grid-2">
        <div class="card">
          <div class="card-head"><h3 class="card-title">This session</h3><span class="pill good">Signed in</span></div>
          <div class="kv">
            <span>Login</span><b>${a.name}</b>
            <span>Email</span><b>${a.email}</b>
            <span>Role</span><b>${a.role} · ${a.access}</b>
            <span>Started</span><b>05:58 ET · this browser</b>
            <span>Timeout</span><b>${prefs.timeout}</b>
            <span>Still open</span><b>${a.canApprove?'Critical cards stay in the queue for the next CIO sign-in.':'Nothing of yours is waiting on an approval.'}</b>
          </div>
          <div class="card-foot">
            <button class="btn ghost" type="button" id="stay-in">Stay signed in</button>
            <button class="btn primary" type="button" id="do-signout" style="background:var(--bad)">Sign out</button>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3 class="card-title">What sign-out does</h3></div>
          <div class="act-row"><div><b>Ends</b><small>This login, the fund you had open, and any half-written approval.</small></div></div>
          <div class="act-row"><div><b>Stays</b><small>Theme, notification toggles and the default fund for ${a.name}. They are stored on this browser, per login.</small></div></div>
          <div class="act-row"><div><b>Next</b><small>You land on the sign-in screen and can enter as Admin or as User.</small></div></div>
        </div>
      </div>`);

    document.querySelectorAll('#view-settings [data-pref]').forEach(btn=>{
      btn.onclick=()=>{
        if(btn.dataset.pref==='digest' && !a.canApprove) return;
        const p=loadPrefs();
        p[btn.dataset.pref]=!btn.classList.contains('on');
        btn.classList.toggle('on', p[btn.dataset.pref]);
        savePrefs(p);
        const note=document.getElementById('settings-saved'); if(note) note.textContent='Saved';
      };
    });
    const digestBtn=document.querySelector('#view-settings [data-pref="digest"]');
    if(digestBtn && !a.canApprove) digestBtn.disabled=true;
    const timeout=document.getElementById('pref-timeout');
    if(timeout) timeout.onchange=()=>{ const p=loadPrefs(); p.timeout=timeout.value; savePrefs(p); };
    const landing=document.getElementById('pref-landing');
    if(landing) landing.onchange=()=>{ const p=loadPrefs(); p.landing=landing.value; savePrefs(p); };
    const fundSel=document.getElementById('pref-fund');
    if(fundSel){
      if(!fundSel.value) fundSel.value=a.funds.includes(activeFund)?activeFund:a.funds[0];
      fundSel.onchange=()=>{ const p=loadPrefs(); p.fund=fundSel.value; savePrefs(p); selectFund(fundSel.value); };
    }
    document.querySelectorAll('[data-theme-set]').forEach(b=>b.onclick=()=>{ applyTheme(b.dataset.themeSet); try{ localStorage.setItem('point-theme', b.dataset.themeSet); }catch(e){} });
    const pw=document.getElementById('pw-btn');
    if(pw) pw.onclick=function(){ this.textContent='Link sent'; };
    document.querySelectorAll('[data-open-fund]').forEach(b=>b.onclick=()=>{ selectFund(b.dataset.openFund); go('dashboard'); });
    document.querySelectorAll('[data-ask-fund]').forEach(b=>b.onclick=function(){ this.textContent='Requested'; this.disabled=true; });
    const stay=document.getElementById('stay-in'); if(stay) stay.onclick=()=>go('dashboard');
    const out=document.getElementById('do-signout'); if(out) out.onclick=showLogin;
  }
  function Qset(id, html){ const el=document.getElementById(id); if(el) el.innerHTML=html; }

  function paintAccount(){
    const a=account();
    const headerAv=document.getElementById('header-av');
    const pmAv=document.getElementById('pm-av');
    if(headerAv){ headerAv.textContent=a.init; headerAv.className='avatar sm'+(a.id==='user'?' user':''); }
    if(pmAv){ pmAv.textContent=a.init; pmAv.className='avatar'+(a.id==='user'?' user':''); }
    setText('profile-label', a.name);
    setText('pm-name', a.name);
    setText('pm-mail', a.email);
    setText('pm-role', a.role+' · '+a.access);
    setText('hero-name', a.name);
    const box=document.getElementById('pm-accounts');
    if(box){
      box.innerHTML=Object.values(ACCOUNTS).map(ac=>`<button type="button" class="pm-acct ${ac.id===activeAccount?'on':''}" data-account="${ac.id}">
        <span class="avatar sm ${ac.id==='user'?'user':''}">${ac.init}</span>
        <span><b>${ac.name}</b><small>${ac.role} · ${ac.access}</small></span>
        ${ac.id===activeAccount?'<span class="pm-check">✓</span>':''}
      </button>`).join('');
      box.querySelectorAll('[data-account]').forEach(b=>b.onclick=e=>{
        e.stopPropagation();
        applyAccount(b.dataset.account);
        profile.classList.remove('open');
      });
    }
    renderAccountPages();
  }
  function applyAccount(id){
    if(!ACCOUNTS[id]) return;
    activeAccount=id;
    try{ localStorage.setItem('point-account', id); }catch(e){}
    if(!account().funds.includes(activeFund)) selectFund(account().funds[0]);
    else renderFundMenu();
    paintAccount();
  }
  function showLogin(){
    const gate=document.getElementById('login-gate');
    const picks=document.getElementById('login-picks');
    if(!gate||!picks) return;
    picks.innerHTML=Object.values(ACCOUNTS).map(a=>`<button type="button" class="acct-card" data-signin="${a.id}">
      <span class="avatar ${a.id==='user'?'user':''}">${a.init}</span>
      <b>${a.name}</b>
      <div class="role">${a.email}<br/>${a.role} · ${a.access}</div>
      <p>${a.blurb}</p>
    </button>`).join('');
    picks.querySelectorAll('[data-signin]').forEach(b=>b.onclick=()=>{
      gate.hidden=true;
      applyAccount(b.dataset.signin);
      const landing=(loadPrefs().landing)||'dashboard';
      go(ACCOUNTS[b.dataset.signin] && document.getElementById('view-'+landing) ? landing : 'dashboard');
    });
    gate.hidden=false;
  }
  paintAccount();
  /* close popovers on outside click / Esc */
  document.addEventListener('click',()=>{ fundSwitch?.classList.remove('open'); profile?.classList.remove('open'); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ fundSwitch?.classList.remove('open'); profile?.classList.remove('open'); } });

  /* ---- theme toggle ---- */
  const themeBtn = document.getElementById('theme-btn');
  function applyTheme(t){
    document.body.setAttribute('data-theme', t);
    const moon = document.querySelector('.ic-moon'), sun = document.querySelector('.ic-sun');
    if(moon) moon.style.display = t==='light' ? 'none' : '';
    if(sun)  sun.style.display  = t==='light' ? '' : 'none';
  }
  let saved='dark';
  try{ saved = localStorage.getItem('point-theme') || 'dark'; }catch(e){}
  applyTheme(saved);
  if(themeBtn) themeBtn.addEventListener('click', ()=>{
    const next = document.body.getAttribute('data-theme')==='light' ? 'dark' : 'light';
    applyTheme(next);
    try{ localStorage.setItem('point-theme', next); }catch(e){}
  });


  if(window.__tagRows) window.__tagRows();

  /* ---- Selected-fund data adapter for the private OpenAI demo ---- */
  function chatSnapshot(id){
    const fund=funds.find(f=>f.id===id);
    if(!fund || !account().funds.includes(id)) throw new Error('Choose an available fund.');
    const detail=fundDetail[id], tables=viewTables[id], panels=panelData[id];
    const table=(bodyId,rows)=>({
      columns:Array.from(document.getElementById(bodyId).closest('table').querySelectorAll('thead th'),th=>th.textContent.trim()),
      rows:rows.map(row=>row.map(cell=>Array.isArray(cell)?cell[1]:cell))
    });
    return PointChatCore.clean({surface:'platform',fundId:id,fundName:fund.name,
      scope:'Static illustrative demo. Partial holdings only, not a live book. Dates are the original sample dates. Displayed market values and percentages may not reconcile with AUM; do not silently repair them. Current and projected figures differ. Conflicting macro scenarios must be identified by source. Unlabeled chart values have no verified unit.',
      sections:{
        Overview:{fund,exposures:fundExtra[id].exposure.map(r=>({metric:r[0],value:r[2]})),product:'Point supports an investment discussion with ten specialist agents, decision briefs and illustrative action cards. This chatbot cannot approve or execute trades.'},
        Positions:{coverage:'Only '+detail.positions.length+' rows are supplied. The display says '+detail.shown+'. The supplied list is not the complete portfolio.',holdings:table('pos-rows',detail.positions),thesisDrift:table('pos-drift',tables.posDrift),news:panels.news,catalysts:panels.cal},
        Risk:{metrics:tables.riskKpis,limits:table('risk-limits',tables.riskLimits),stressScenarios:panels.stress,proposedWhatIf:{proposal:panels.whatifSelect,results:panels.whatif}},
        Technical:{signals:table('tech-rows',tables.tech)},
        Performance:{metrics:tables.pnlKpis,statistics:panels.pnlStats,reviewCandidates:table('pnl-trims',tables.pnlTrims),dayChart:{unit:'unspecified in source',values:detail.pnlDay},monthlyChart:{unit:'unspecified in source',values:detail.pnlNames}},
        Research:{rankedUniverse:table('research-universe',tables.universe),explanationFor:panels.explainName,factors:panels.explain,explanation:panels.explainTxt},
        Flows:{crowding:table('flows-crowding',tables.crowding),divergence:panels.divergence,etf:panels.etf},
        Earnings:{tone:table('earnings-tone',tables.tone),social:panels.social},
        Macro:{metrics:marketData[id].macroKpis,betas:table('macro-betas',tables.betas),scenarios:panels.scenario},
        Digital:{bridge:table('digital-bridge',tables.bridge)},
        Reporting:{letter:marketData[id].irLetter},
        Briefs:{decisionBriefs:decisionBriefs[id],morningBrief:briefs[id],actionCards:cardsByFund[id],activity:fundExtra[id].feed}
      }});
  }
  const pointChat=window.PointChat.mount({surface:'platform',accountScope:()=>activeAccount,
    getSnapshot:()=>chatSnapshot(activeFund),getAllSnapshots:()=>allowedFunds().map(f=>chatSnapshot(f.id))});
  document.querySelectorAll('.btn').forEach(button=>{
    if(/ask point/i.test(button.textContent)) button.addEventListener('click',event=>{event.preventDefault();pointChat.open();});
  });
  const chatSearch=document.querySelector('.search input');
  if(chatSearch) chatSearch.addEventListener('keydown',event=>{
    if(event.key==='Enter'){event.preventDefault();const question=chatSearch.value.trim();chatSearch.value='';pointChat.open(question||undefined);}
  });

  /* open from hash */
  const h = (location.hash||'').replace('#','');
  if(h && titles[h]) go(h);
})();
