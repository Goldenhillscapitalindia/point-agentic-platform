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
    mcp:'Point MCP', execute:'Point Execute', governance:'Governance'
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
  const fundCards = [
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
     }}
  ];

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

  function renderDetail(id){
    renderPositions(id); renderPnl(id);
    renderExposure(id); renderFeed(id); renderPnlMeta(id); renderTopCard(id);
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
  const cardIndex = {}; cards.forEach(c=>cardIndex[c.id]=c);
  fundCards.forEach(c=>cardIndex[c.id]=c);

  function cardMarkup(c,critClass){
    return `<div class="card clickable ${c.lvl==='CRIT'&&critClass!==false?'critical':''}" data-card="${c.id}">
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
  const grid = document.getElementById('cards-grid');
  if(grid){ grid.innerHTML = cards.map(c=>cardMarkup(c)).join(''); }

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
  const evts = [
    ['06:11:42','Macro','CPI nowcast updated → 3.12% YoY · re-ran Risk, PnL, Flows'],
    ['06:11:08','Digital','tNVDA basis −2.81% · triggered Risk gap-check'],
    ['06:10:51','Risk','Beta-net projection 63.1% · breach prob 71% · Action Card composed'],
    ['06:10:40','Flows','META crowding 92 → de-gross alert to Risk'],
    ['06:10:22','Technical','TSLA RSI divergence 5d · stop proximity 0.3 ATR'],
    ['06:09:58','PosIntel','NVDA 13D (Elliott) ingested · thesis-drift ↑'],
    ['06:09:30','Earnings','JPM transcript model primed · tone −0.21 forecast'],
    ['06:09:04','Research','Universe re-ranked · UBER #1 · 12 new ideas'],
    ['06:08:41','Conductor','De-duplicated 4 semis alerts → 1 ranked card'],
    ['06:08:12','Digital','BTC funding +0.082% · OI +18% · put-spread queued'],
  ];
  const log = document.getElementById('eventlog');
  if(log){
    log.innerHTML = evts.map(e=>`<li><span class="et">${e[0]}</span><span class="ea">${e[1]}</span><span class="em">${e[2]}</span></li>`).join('');
  }

  /* ---- search focus with ⌘K ---- */
  document.addEventListener('keydown', e=>{
    if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){
      e.preventDefault();
      const s=document.querySelector('.search input'); if(s) s.focus();
    }
  });

  /* ---- segmented + filter button toggles (visual only) ---- */
  document.querySelectorAll('.seg').forEach(seg=>{
    seg.querySelectorAll('.seg-btn').forEach(b=>b.addEventListener('click',()=>{
      seg.querySelectorAll('.seg-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
    }));
  });
  document.querySelectorAll('.filters').forEach(f=>{
    f.querySelectorAll('.chip-btn').forEach(b=>b.addEventListener('click',()=>{
      f.querySelectorAll('.chip-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
    }));
  });
  document.querySelectorAll('.auto-opt').forEach(o=>o.addEventListener('click',()=>{
    document.querySelectorAll('.auto-opt').forEach(x=>x.classList.remove('active'));
    o.classList.add('active');
  }));

  /* ---- approve buttons give feedback ---- */
  document.addEventListener('click', e=>{
    const b = e.target.closest('.btn.primary');
    if(b && b.textContent.trim()==='Approve'){
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
  const fundSwitch=document.getElementById('fund-switch');
  const fundMenu=document.getElementById('fund-menu');
  const fundBtnName=document.getElementById('fund-btn-name');
  let activeFund='alpha';
  const setText=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};

  function renderFundMenu(){
    if(!fundMenu) return;
    fundMenu.innerHTML='<div class="fund-menu-h">Switch fund · 4</div>'+
      funds.map(f=>`<div class="fund-opt ${f.id===activeFund?'active':''}" data-fund="${f.id}">
        <span class="fund-ic" style="background:${f.color}">${f.init}</span>
        <div><div class="fo-name">${f.name}</div><div class="fo-sub">${f.sub}</div></div>
        ${f.id===activeFund?'<span class="fo-check">✓</span>':`<span class="fo-aum">${f.aum}</span>`}
      </div>`).join('')+
      '<div class="fund-menu-foot"><a>+ Add or manage funds</a></div>';
    fundMenu.querySelectorAll('.fund-opt').forEach(o=>o.addEventListener('click',()=>{
      selectFund(o.dataset.fund); fundSwitch.classList.remove('open');
    }));
  }
  function selectFund(id){
    const f=funds.find(x=>x.id===id); if(!f) return;
    activeFund=id;
    if(fundBtnName) fundBtnName.textContent=f.name;
    setText('hero-fund', f.name.replace(/ Fund$/,''));
    setText('hero-cards', f.cards);
    setText('hero-crit', f.crit);
    setText('kpi-aum', f.aum); setText('kpi-aum-d', f.aumD);
    setText('kpi-pnl', f.pnl); setText('kpi-pnl-d', f.pnlD);
    setText('kpi-exp', f.exp); setText('kpi-exp-d', f.expD);
    setText('kpi-var', f.var); setText('kpi-var-d', f.varD);
    const pnlEl=document.getElementById('kpi-pnl');
    if(pnlEl){ pnlEl.classList.toggle('up',f.pnlUp); pnlEl.classList.toggle('dn',!f.pnlUp); }
    const aumD=document.getElementById('kpi-aum-d');
    if(aumD){ const up=!f.aumD.includes('−'); aumD.classList.toggle('up',up); aumD.classList.toggle('dn',!up); }
    const critEl=document.getElementById('hero-crit');
    if(critEl) critEl.style.color = f.crit.startsWith('0') ? 'var(--good)' : '';
    const dot=document.querySelector('.fund-dot'); if(dot) dot.style.background=f.color;
    renderDetail(id);
    try{ localStorage.setItem('point-fund', id); }catch(e){}
    renderFundMenu();
  }
  renderFundMenu();
  let _restored=false;
  try{ const sf=localStorage.getItem('point-fund'); if(sf && funds.find(x=>x.id===sf)){ selectFund(sf); _restored=true; } }catch(e){}
  if(!_restored) renderDetail(activeFund);
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
    profile.querySelectorAll('.pm-item').forEach(it=>it.addEventListener('click',()=>{
      const label=it.textContent.trim();
      if(label==='Manage funds'){ profile.classList.remove('open'); fundSwitch?.classList.add('open'); }
      else { profile.classList.remove('open'); }
    }));
  }
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

  /* ---- AI summary at the top of each agent view ---- */
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
  const aiSummaries = {
    risk:[
      'Beta-adjusted net projected <b>63.1%</b> vs. the <b>60% IMA cap</b> — breach probability <b>71%</b> at Monday open.',
      'Smallest restoring trade set: trim <b>NVDA 12%</b> + SMH put spread; alpha cost just <b>6 bps</b>.',
      'VaR 99% <b>$14.3M</b> (1.15% NAV), CVaR $21.8M — comfortably inside the 1.75% limit.',
      'Semis sector <b>28% vs 30% cap</b> (watch); crypto-β 17% vs 20% cap.',
      'Stress: −5% equities / +50bp 10Y = <b>−$23.4M</b>; a VIX>30 shock = −$18.0M.',
      'Days-to-liquidate <b>2.4</b> at 20% ADV — well within the 5-day limit.',
      '9 IMA rules monitored: <b>1 projected breach</b>, 3 on watch, 5 clear.',
      'Recommended action is queued with a full timestamped audit trail for compliance.'
    ],
    tech:[
      '<b>1 critical, 4 warnings</b> across the book — ranked by $ at risk and de-duplicated.',
      'NVDA RSI <b>72</b> with bearish MACD divergence — trim signal, ATR stop 175.4 (−5%).',
      'TSLA sits <b>0.3 ATR</b> from its trailing stop with a 5-day RSI divergence.',
      'MSFT 50-DMA fading below the 200 — a bearish cross is forming (trim flag).',
      'MSTR volume z-score <b>+2.9σ</b>; momentum extended, divergence building.',
      'COIN and MSTR carry elevated short-squeeze risk on crypto-β names.',
      'AAPL, GOOGL and AMZN trends remain intact — no action required.',
      'Alerts are tiered Critical/Warning and routed to both PM and CIO.'
    ],
    pnl:[
      'Day <b>+34 bps</b> ($4.24M); MTD +1.82%; YTD <b>+18.4%</b> vs. benchmark +9.7%.',
      'Return is <b>60% stock-specific</b>, 24% factor, 16% residual.',
      'Top contributors NVDA, META, UBER; main drags MSTR, COIN, TSLA.',
      'Hit rate <b>62%</b>, win/loss 1.84, alpha half-life 14 days.',
      'MSFT alpha half-life <b>expired</b> (−24 bps MTD) — flagged as a trim candidate.',
      'PEP short underperforming — cover 50% ahead of its earnings.',
      'Factor tilt: positive momentum & quality, low value exposure.',
      'Risk-budget check: MSFT at <b>18% usage</b> flagged for reallocation.'
    ],
    ir:[
      'October LP letter drafted (v3, <b>92% ready</b>) — 2 citations pending.',
      'SEC Marketing-Rule pre-check: 4 soft flags resolved, <b>2 remaining</b>.',
      'Performance narrative: +1.82% MTD, +18.4% YTD — ahead of benchmark.',
      'DDQ library holds <b>142 Q&A</b>; 3 answers refreshed this week.',
      'Q3 risk-transparency report scheduled for <b>Oct 15</b>.',
      'Tear sheets: September sent to 142 LPs; October draft in review.',
      'Castle Peak prospect DDQ (68 questions) approved.',
      'Every output carries an approval trail for compliance and LPs.'
    ],
    pos:[
      '<b>3 thesis-drift alerts</b>: NVDA (medium), MSFT (high), UNH (medium).',
      'NVDA: Elliott 13D + <b>$220M insider sales</b> — thesis drift rising.',
      'MSFT: Azure deceleration contradicts the original growth thesis (high drift).',
      'Catalyst calendar: CPI (Tue), JPM (Wed), LMRX coverage (Thu).',
      '24h news sentiment: META positive (EU ruling), NVDA negative (insiders).',
      'Short-report & litigation scan: no new material items.',
      'Analyst revisions: UBER and ANET positive; WBA negative.',
      'Sentiment is tracked per holding vs. the analyst’s original thesis.'
    ],
    research:[
      'Universe re-ranked — <b>503 names scored</b>, 12 new ideas today.',
      'Top long <b>UBER (0.89)</b>: FCF inflection, CFO insider buy, positive revisions.',
      '#2 SPOT, #3 ANET; new IPO <b>LMRX ranked #4</b> of 38 new issues.',
      'Lowest-ranked shorts: WBA (0.14), HOG (0.13).',
      'Scoring is explainable: quality, momentum, revisions, sentiment, macro-fit.',
      'Trading ranges modeled — UBER 1d 82.4–85.1, 5d <b>80.0–89.2</b>.',
      'Ideas are tuned to the fund’s thesis and risk budget.',
      'CLSK (0.78) flagged — a crypto-β long with accelerating momentum.'
    ],
    flows:[
      'META crowding <b>92</b> (top decile) — de-grossing risk if VIX breaks 22.',
      'NVDA crowding 88; HF ownership 18.4%, <b>+3 pts QoQ</b>.',
      'Smart-money divergence: Viking cut MSFT 40%; Berkshire added UNH.',
      '5-day ETF flows: SPY +$3.1B, QQQ +$1.8B, <b>IWM −$0.9B</b>.',
      'IBIT (BTC ETF) <b>+$1.4B</b> — crypto inflows accelerating.',
      'Short interest: WBA 12.4%, COIN 3.6%.',
      'Aligned with you: UBER (Lone Pine/Tiger) and CRM (ValueAct).',
      'Crowding and smart-money divergence are scored per holding.'
    ],
    earnings:[
      '<b>6 prints this week</b>; 112 transcripts parsed with bot-filtered social.',
      'JPM Thursday: tone <b>−0.21</b> forecast (71% conf) — cautious consumer guide.',
      'Read-across chain: JPM → <b>V, MA, AXP</b>.',
      'NFLX tone +0.34 (guidance raised); MSFT tone −0.42 (hedging up).',
      'Social sentiment: META <b>68/14</b> positive; TSLA mixed 42/38.',
      'Guidance-change detector flags demand, pricing and capex mentions.',
      'Supplier/customer read-across is summarized for fast consumption.',
      'Quarter-over-quarter tone shift is tracked per name.'
    ],
    macro:[
      'Regime: <b>late-cycle, tightening</b> bias; CPI 3.1%, core PCE 2.8%.',
      'CPI tomorrow 08:30 — a hot print (+0.4% core) maps to <b>−38 bps NAV</b>.',
      'Fed funds 4.75%; market pricing <b>2 cuts by March</b>.',
      '10Y 4.38% (+6bp); DXY 101.6; WTI $78.2.',
      'Position-level macro betas computed across 10Y, DXY, WTI and VIX.',
      'Scenario PnL: 10Y +50bp = <b>−$9.4M</b>; risk-off (VIX>30) = −$18.0M.',
      'Hedge ladder (0.6× DV01) queued ahead of CPI for 1.8 bps carry.',
      'A regime shift auto-reruns Risk, PnL and Flows on the live book.'
    ],
    digital:[
      '24/7/365 monitor: BTC <b>$101,842</b> (−2.1%), ETH $3,842 (−3.4%).',
      'BTC perp funding <b>+0.082%</b>, OI +18% — crowded longs.',
      'Tokenized basis: tNVDA −2.81%, tAAPL −1.86% vs. NYSE close.',
      'Weekend gap-risk mapped to the book <b>before Monday open</b>.',
      'Crypto-β bridge: COIN 0.86, MSTR 1.42, HOOD 0.44 (to BTC).',
      'MSTR/COIN put-spread queued, sized to budget, checked by Risk.',
      'Liquidation clusters 98–99k; stablecoin mint +$1.4B (risk-on).',
      'Defined-risk structures on top-10 coins; 24/7 VaR within limit.'
    ]
  };
  Object.keys(aiSummaries).forEach(k=>{
    const view=document.getElementById('view-'+k); if(!view) return;
    const head=view.querySelector('.view-head'); if(!head) return;
    const m=agentMeta[k]||{n:'Point Agent',i:'✦',sq:'red'};
    const gold=m.sq==='gold';
    const el=document.createElement('div');
    el.className='ai-summary'+(gold?' gold':'');
    el.innerHTML=`
      <div class="ais-head">
        <div class="ais-icon${gold?' gold':''}">${m.i}</div>
        <div>
          <div class="ais-title"><span class="ais-spark">✦</span> AI Summary</div>
          <div class="ais-sub">Synthesized by the ${m.n} · 8 key points · updated just now</div>
        </div>
        <div class="ais-badge"><span class="ais-dot"></span>live</div>
      </div>
      <div class="ais-points">${aiSummaries[k].map(p=>`<div class="ais-pt${gold?' gold':''}"><span class="pm">▸</span><span>${p}</span></div>`).join('')}</div>`;
    head.insertAdjacentElement('afterend', el);
  });

  /* open from hash */
  const h = (location.hash||'').replace('#','');
  if(h && titles[h]) go(h);
})();
