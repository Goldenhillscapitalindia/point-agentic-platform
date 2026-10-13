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

  /* ---- AI summaries (per fund × per agent) ---- */
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
    alpha:{
      risk:['Beta-adjusted net <b>63.1%</b> vs. <b>60% IMA cap</b> — breach probability <b>71%</b> at open.','Restoring set: trim <b>NVDA 12%</b> + SMH put spread; alpha cost just 6 bps.','VaR 99% <b>$14.3M</b> (1.15% NAV); semis 28% vs 30% cap.','Stress −5% equities / +50bp 10Y = <b>−$23.4M</b>.','Days-to-liquidate 2.4 at 20% ADV — inside the 5-day limit.','9 IMA rules: 1 breach, 3 on watch, 5 clear.'],
      tech:['1 critical, 4 warnings; NVDA RSI <b>72</b> with bearish MACD divergence.','TSLA <b>0.3 ATR</b> from trailing stop; RSI divergence 5d.','MSFT 50-DMA fading below 200 — bearish cross forming.','MSTR volume z-score <b>+2.9σ</b>, extended.','AAPL, GOOGL, AMZN trends intact — no action.','Alerts tiered Critical/Warning to PM and CIO.'],
      pnl:['Day +34 bps; YTD <b>+18.4%</b> vs. bench +9.7%.','60% stock-specific; top NVDA/META/UBER, drags MSTR/COIN.','Hit rate 62%, W/L 1.84, alpha half-life 14d.','MSFT half-life expired (−24 bps) — trim candidate.','Momentum & quality factors positive.','MSFT at 18% risk-budget flagged for reallocation.'],
      ir:['October LP letter v3 (92% ready) — +18.4% YTD narrative.','Marketing-Rule pre-check: 2 soft flags remaining.','DDQ library 142 Q&A; 3 refreshed this week.','Q3 risk-transparency report scheduled Oct 15.','September tear sheets sent to 142 LPs.','Castle Peak prospect DDQ (68 Q) approved.'],
      pos:['<b>3 thesis-drift alerts</b>: NVDA (med), MSFT (high), UNH (med).','NVDA: Elliott 13D + <b>$220M insider sales</b>.','MSFT: Azure deceleration contradicts the thesis.','Catalysts: CPI (Tue), JPM (Wed), LMRX (Thu).','24h news: META positive (EU ruling), NVDA negative.','Revisions: UBER/ANET positive, WBA negative.'],
      research:['503 names scored; top long <b>UBER (0.89)</b>.','SPOT #2, ANET #3; new IPO LMRX #4 of 38.','Lowest shorts: WBA 0.14, HOG 0.13.','Ranges: UBER 1d 82.4–85.1, 5d 80.0–89.2.','Explainable quality/momentum/revisions scoring.','CLSK (0.78) — crypto-β long with momentum.'],
      flows:['META crowding <b>92</b>; NVDA 88 (top decile).','Viking cut MSFT 40%; Berkshire added UNH.','ETF flows: SPY +$3.1B, IWM −$0.9B.','IBIT (BTC) +$1.4B — crypto inflows rising.','Aligned with you: UBER, CRM.','De-gross risk if VIX breaks 22.'],
      earnings:['JPM Thu tone <b>−0.21</b> — read-across V/MA/AXP.','NFLX +0.34 (raised); MSFT −0.42 (hedging up).','META social sentiment <b>68/14</b> positive.','6 prints this week; 112 transcripts parsed.','Guidance-change detector active.','QoQ tone shift tracked per name.'],
      macro:['Late-cycle, tightening; CPI 3.1%, core PCE 2.8%.','Hot CPI (+0.4% core) = <b>−38 bps NAV</b>.','Fed funds 4.75%; 2 cuts priced by March.','Position betas across 10Y, DXY, WTI, VIX.','Scenario: 10Y +50bp = −$9.4M.','Hedge ladder (0.6× DV01) queued for 1.8 bps.'],
      digital:['Crypto exposure via <b>COIN/MSTR/HOOD</b> (equity β).','BTC funding +0.082% — hedge the equity-crypto β.','Tokenized basis signals weekend gap for semis.','Crypto-β 17% of book vs 20% cap.','MSTR/COIN put-spread queued, checked by Risk.','24/7 coverage ahead of the Monday open.']
    },
    global:{
      risk:['Book DV01 <b>long</b> — 10Y +50bp = <b>−$9.4M</b>; CPI is the key risk.','Net 38% vs 50% cap; gross 142% — ample headroom.','VaR 99% <b>$9.8M</b> (1.16% NAV); rate-vol dominates.','Hedge ladder (0.6× DV01) restores neutrality for 1.8 bps.','FX gap risk: USD/JPY intervention above 158.','Commodity tail: crude −10% = −$3.1M.'],
      tech:['Gold RSI <b>74</b> after +6.2% MTD — overbought, take partial.','10Y future momentum breaking down — trend short confirmed.','DXY coiling at range highs; breakout watch.','Crude backwardation steepening — roll yield positive.','Copper MACD turning up.','Signals on futures/ETF proxies, ranked by $ at risk.'],
      pnl:['Day −12 bps; YTD <b>+11.2%</b>.','Gold +88 and equity-index lead; rates −54 the drag.','Attribution dominated by <b>macro factor</b>, not single names.','FX detracting (−28); commodities +36.','Hit rate 57%, W/L 1.41.','Duration positioning the main swing into CPI.'],
      ir:['October letter frames <b>+11.2% YTD</b> macro positioning.','Emphasis on rate/FX risk management into the print.','DDQ: duration & leverage questions refreshed.','Derivatives-use disclosure updated for the futures book.','Monthly tear sheet in review.','Scenario-PnL exhibit added for LPs.'],
      pos:['Catalyst watch is <b>macro-driven</b>: CPI, ECB minutes, BOJ.','China stimulus headline lifting FXI/EM.','OPEC+ commentary a crude swing factor.','Fed-speak calendar mapped to the rate book.','Treasury auction schedule tracked (3Y today).','FX-intervention headlines monitored.'],
      research:['Cross-asset ranking: <b>gold & EM</b> screen top.','Rate regime favors value/short-duration equities.','Commodity momentum: crude and copper positive.','DXY model signals USD fade into cuts.','Scenario ranges on futures (ES, GC, CL).','Ideas tuned to the macro thesis.'],
      flows:['CFTC <b>CoT</b>: spec longs crowded in gold & crude.','Rate-vol sellers positioned short — unwind risk.','EM inflows turning positive on China stimulus.','USD net-short building.','Bond-fund flows into duration.','Positioning-squeeze alerts on commodities.'],
      earnings:['Earnings are <b>second-order</b>; macro prints dominate.','Bank earnings read-through to the rate/credit view.','Commodity-producer guidance informs crude/copper.','Central-bank communications parsed like transcripts.','Consumer-health signals from retailer prints.','Tone model applied to Fed/ECB speeches.'],
      macro:['Macro is the <b>core book</b> — regime drives everything.','CPI tomorrow: hot = −$4.78M; cold = +$6.1M.','Curve steepener + USD-short the primary expression.','Fed-funds-future path: 2 cuts by March.','Commodity-rate correlation regime elevated.','DV01 ladder centrally managed here.'],
      digital:['Crypto as a <b>macro-liquidity</b> gauge for the book.','Stablecoin supply +$1.4B — risk-on signal.','BTC–DXY and BTC–rates correlations tracked.','Minimal direct crypto exposure; monitoring only.','Gold vs BTC store-of-value rotation watched.','On-chain flows as a sentiment input.']
    },
    neutral:{
      risk:['Net exposure <b>4%</b> — beta-neutral, inside the ±10% band.','Gross 210% across <b>44 pairs</b>; single-pair cap 6%.','VaR 99% <b>$6.1M</b> (0.39% NAV) — lowest of the complex.','Factor exposures style-neutral; low momentum/size tilt.','Short-leg borrow watch: NVO at 180bp.','Market shock −5% = −$1.8M (largely hedged).'],
      tech:['Pair spreads tracked vs 60-day z — PG/CL at <b>+2.1σ</b>.','LLY/NVO pair mean-reverting toward fair value.','V/MA spread tightening — momentum favoring V.','No single-name stop triggers (hedged legs).','Volume anomalies clean across pairs.','Technicals used for pair timing, not direction.'],
      pnl:['Day +9 bps; YTD <b>+7.8%</b> — low vol, steady.','PnL is <b>pair convergence</b>: pharma +52, staples +41.','Tech pair −18 the main drag.','Hit rate 64%, W/L 1.22 — high consistency.','Factor PnL ≈ 0 by design (beta-neutral).','Staples pair add flagged on a 2.1σ spread.'],
      ir:['October letter: <b>+7.8% YTD</b>, low-beta consistency story.','Marketing-Rule clean; Sharpe/pair-hit-rate exhibits added.','DDQ: market-neutral construction & borrow questions.','Factor-neutrality attestation included.','Tear sheet highlights the 0.39% VaR.','Investor-call deck drafted.'],
      pos:['Pair-level catalysts: both legs’ earnings dates aligned.','NVO borrow-fee spike flagged on the short leg.','No single-name thesis drift (hedged construction).','Dividend/ex-dates checked for pair carry.','Index-rebalance flow watch for pairs.','Event-neutrality maintained across pairs.'],
      research:['Ranking drives <b>pair selection</b>, not direction.','Top pairs: LLY/NVO, V/MA by score spread.','Factor-balanced candidates only.','Borrow-availability screen on short legs.','Reversion ranges modeled per pair.','New pair idea: COST/WMT spread widening.'],
      flows:['Pair-level crowding: both legs’ HF ownership tracked.','NVO short interest rising — borrow pressure.','Smart-money aligned on the V/MA tilt.','13F pair-overlap screen is clean.','ETF-rebalance flows mapped to pairs.','De-gross risk low (market-neutral).'],
      earnings:['<b>Pair-aligned</b> earnings dates keep the book event-neutral.','LLY vs NVO guidance comparison drives the tilt.','V vs MA tone spread informs pair weight.','Hedging-language delta between legs flagged.','Post-earnings drift modeled per pair.','No naked single-name event risk.'],
      macro:['Macro impact is <b>minimized by design</b> (net 4%).','CPI-scenario NAV impact < ±8 bps.','Rate sensitivity near zero across pairs.','Regime shifts affect borrow/financing, not direction.','Factor-neutrality holds through the print.','Hedge overlay only for residual beta.'],
      digital:['Near-zero crypto exposure — <b>monitoring only</b>.','Tokenized-equity basis used as an arb reference.','Crypto-β of any hedge leg is checked.','24/7 risk alerts for residual exposure.','No directional digital-asset bets.','Stablecoin-depeg watch for cash management.']
    },
    digital:{
      risk:['Crypto-β <b>71%</b> vs 75% cap — nearing the limit.','24/7 VaR <b>$11.2M</b> (3.52% NAV) — highest of the funds.','BTC −15% + funding spike = <b>−$6.1M</b>.','Exchange & stablecoin-depeg alerts active round the clock.','MSTR/COIN beta concentrated; put-spread queued.','Weekend gap-risk mapped before the Monday open.'],
      tech:['CLSK <b>−4.2%</b> breaking 200-day — stop hit, miners leading lower.','BTC momentum rolling over with funding +0.082%.','SOL +22% MTD — momentum accelerating, add on pullback.','MSTR volume z <b>+2.9σ</b>; squeeze risk both ways.','tNVDA/tAAPL basis signals a weekend gap.','24/7 signal engine — nights and weekends covered.'],
      pnl:['Day −2.1%; YTD <b>+34.1%</b> — highest return, highest vol.','SOL +74 and BTC +44 lead; miners −62 the drag.','Tokenized −31, exchanges −38 detracting today.','Hit rate 51%, W/L 1.96 — fat-tailed winners.','Stablecoin carry +3.','CLSK flagged for exit after the 200-day break.'],
      ir:['October letter: <b>+34.1% YTD</b>, 24/7 digital-assets mandate.','Custody, tokenized-asset & crypto-risk disclosures front-loaded.','DDQ: digital-asset governance Q&A expanded.','On-chain transparency exhibit for LPs.','Volatility/risk framing emphasized.','Tear sheet notes the 3.52% VaR.'],
      pos:['24/7 catalyst radar: token unlocks, ETF flows, exploits.','SEC/CFTC action calendar monitored.','COIN pre-announce 16:30; MSTR capital-raise watch.','On-chain whale-wallet & exchange-flow alerts.','Stablecoin mint/burn as a liquidity gauge.','Weekend headline coverage (desk unstaffed).'],
      research:['Top-10 coin ranking: <b>SOL</b> leads on momentum.','Tokenized-equity basis opportunities screened.','Miners (CLSK) ranked low on the breakdown.','BTC/ETH ETF-flow momentum positive.','Defined-risk structures sized to budget.','24/7 ranking refresh.'],
      flows:['Spot <b>BTC ETF +$1.4B</b>, ETH +$0.2B.','Stablecoin mint +$1.4B — liquidity rising.','Exchange net-flows: outflows (bullish).','OI +18% — leverage crowding.','Whale wallets accumulating.','De-gross trigger on funding + VIX.'],
      earnings:['COIN & MSTR prints are the key equity-crypto reads.','COIN pre-announce 16:30 today.','Miner (CLSK) cost-guidance watched.','Exchange-volume commentary a demand signal.','Crypto-treasury updates (MSTR BTC/share).','Social sentiment bot-filtered on top coins.'],
      macro:['<b>BTC–Nasdaq correlation</b> regime elevated.','Macro risk-off = crypto-β drawdown; CPI watched.','Real-rate moves drive BTC as a duration proxy.','USD liquidity & stablecoin supply tracked.','Fed path feeds crypto risk appetite.','24/7 macro-event monitor (weekends included).'],
      digital:['Core mandate: BTC <b>$101,842</b>, ETH $3,842, SOL top mover.','Funding +0.082%, OI +18% — crowded longs.','Tokenized tNVDA −2.81%, tAAPL −1.86% basis.','MSTR 1.42× / COIN 0.86× BTC-β bridge.','Liquidation clusters 98–99k; stablecoin mint +$1.4B.','24/7 VaR, exchange & depeg alerts live.']
    }
  };
  // inject the summary card shell into each agent view once
  Object.keys(agentMeta).forEach(k=>{
    const view=document.getElementById('view-'+k); if(!view) return;
    const head=view.querySelector('.view-head'); if(!head) return;
    const m=agentMeta[k]; const gold=m.sq==='gold';
    const el=document.createElement('div');
    el.className='ai-summary'+(gold?' gold':'');
    el.innerHTML=`
      <div class="ais-head">
        <div class="ais-icon${gold?' gold':''}">${m.i}</div>
        <div>
          <div class="ais-title"><span class="ais-spark">✦</span> AI Summary</div>
          <div class="ais-sub">Synthesized by the ${m.n} · updated just now</div>
        </div>
        <div class="ais-badge"><span class="ais-dot"></span>live</div>
      </div>
      <div class="ais-points" id="ais-points-${k}"></div>`;
    head.insertAdjacentElement('afterend', el);
  });
  function renderAISummary(fund){
    const set=aiSummaries[fund]||aiSummaries.alpha;
    Object.keys(agentMeta).forEach(k=>{
      const box=document.getElementById('ais-points-'+k); if(!box) return;
      const gold=agentMeta[k].sq==='gold';
      const pts=set[k]||aiSummaries.alpha[k]||[];
      box.innerHTML=pts.map(p=>`<div class="ais-pt${gold?' gold':''}"><span class="pm">▸</span><span>${p}</span></div>`).join('');
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
    if(ir) ir.innerHTML=md.irLetter.map(p=>`<p>${p}</p>`).join('');
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
    renderAISummary(id); renderViews(id); renderPanels(id);
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
  const cardIndex = {}; cards.forEach(c=>cardIndex[c.id]=c);
  fundCards.forEach(c=>cardIndex[c.id]=c);

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


  if(window.__tagRows) window.__tagRows();

  /* ============ Ask Point chatbot ============ */
  (function setupAskPoint(){
    const fab=document.createElement('button');
    fab.className='askp-fab'; fab.id='askp-fab';
    fab.innerHTML='<span class="fab-i">◑</span> Ask Point';
    const panel=document.createElement('aside');
    panel.className='askp'; panel.id='askp';
    panel.innerHTML=`
      <div class="askp-head">
        <span class="askp-logo"><svg viewBox="0 0 32 32"><path fill="#fff" d="M16 3C10 3 6 8 6 14c0 4 2 7 5 9v3c0 1 .5 2 2 2h6c1.5 0 2-1 2-2v-3c3-2 5-5 5-9 0-6-5-11-10-11Zm-1 3h2v18h-2V6Z"/></svg></span>
        <div><div class="askp-ht">Ask Point</div><div class="askp-hs">Agentic intelligence · reads your live book</div></div>
        <span class="askp-fundtag" id="askp-fundtag">Alpha Fund</span>
        <button class="askp-x" id="askp-x" aria-label="Close">✕</button>
      </div>
      <div class="askp-body" id="askp-body"></div>
      <div class="askp-sugg" id="askp-sugg"></div>
      <div class="askp-input">
        <input id="askp-text" placeholder="Ask about the book…" autocomplete="off"/>
        <button id="askp-send" aria-label="Send">↑</button>
      </div>`;
    document.body.appendChild(fab);
    document.body.appendChild(panel);
    const body=panel.querySelector('#askp-body');
    const sugg=panel.querySelector('#askp-sugg');
    const input=panel.querySelector('#askp-text');
    const fundtag=panel.querySelector('#askp-fundtag');
    let greeted=false;

    const curFund=()=>funds.find(x=>x.id===activeFund)||funds[0];
    const fD=()=>fundDetail[activeFund]||fundDetail.alpha;
    const vT=()=>viewTables[activeFund]||viewTables.alpha;
    const mD=()=>marketData[activeFund]||marketData.alpha;
    const pD=()=>panelData[activeFund]||panelData.alpha;
    const topCard=()=>cardIndex[(fundExtra[activeFund]||fundExtra.alpha).topCardId];
    const strip=s=>(Array.isArray(s)?(s[1]||''):(s||'')).toString().replace(/<[^>]+>/g,'');

    function addMsg(html, who){
      const el=document.createElement('div');
      el.className='am '+who; el.innerHTML=html;
      body.appendChild(el); body.scrollTop=body.scrollHeight;
      return el;
    }
    function typing(){
      const t=document.createElement('div');
      t.className='am-typing'; t.innerHTML='<span></span><span></span><span></span>';
      body.appendChild(t); body.scrollTop=body.scrollHeight; return t;
    }
    const SUGG=['How are we doing?','Any limit breaches?','Biggest positions','What should I trim?','What\'s crowded?','Macro outlook'];
    function renderSugg(){ sugg.innerHTML=SUGG.map(s=>`<span class="askp-chip">${s}</span>`).join(''); }
    renderSugg();
    sugg.addEventListener('click',e=>{ const c=e.target.closest('.askp-chip'); if(c){ send(c.textContent); } });

    function answer(qRaw){
      const q=(qRaw||'').toLowerCase();
      const f=curFund(), d=fD(), vt=vT(), md=mD(), pd=pD();
      const has=(...ks)=>ks.some(k=>q.includes(k));
      const money=v=>`<span class="amv">${v}</span>`;
      // switch fund
      for(const fu of funds){
        const nm=fu.name.toLowerCase().replace(' fund','');
        if((q.includes('switch')||q.includes('go to')||q.includes('open'))&&(q.includes(nm)||q.includes(fu.id))){
          selectFund(fu.id);
          return `Switched to the <b>${fu.name}</b>. The whole workspace now reflects it — AUM ${money(fu.aum)}, day PnL ${money(fu.pnl)}. Ask me anything about this book.`;
        }
      }
      // ticker lookup
      const tkMatch=(q.toUpperCase().match(/\b[A-Z]{2,5}\b/g)||[]);
      for(const tk of tkMatch){
        const p=d.positions.find(x=>x[0].toUpperCase()===tk);
        if(p){
          return `<b>${p[0]}</b> — ${p[1]}: ${p[2]==='L'?'long':'short'} ${p[3]}, market value ${money(p[4])} (${p[5]} of book). Day ${money(p[6])}, MTD ${money(p[7])}, beta ${p[8]}. Agent flag: <b>${p[10]}</b>.`;
        }
      }
      if(has('hello','hi ','hey','hi','hola')) return `Hi — I'm <b>Ask Point</b>, watching the <b>${f.name}</b>. I can tell you performance, risk & limits, positions, crowding, macro, or details on any holding. What would you like?`;
      if(has('help','what can you','what do you do','capab')) return `I read the <b>${f.name}</b>'s live book. Try:<ul><li>"How are we doing?" — performance</li><li>"Any limit breaches?" — risk</li><li>"Biggest positions" / "What should I trim?"</li><li>"What's crowded?" — positioning</li><li>"Macro outlook" — regime & CPI</li><li>Or a ticker, e.g. "${d.positions[0][0]}"</li></ul>`;
      if(has('which fund','current fund','what fund','where am i')) return `You're viewing the <b>${f.name}</b> (${f.sub}) — AUM ${money(f.aum)}. Switch with the header fund picker, or ask me to "switch to Digital Assets".`;
      if(has('list fund','what fund','all fund','funds')) return `There are four books:<ul><li><b>Alpha Fund</b> — equity L/S</li><li><b>Global Macro</b> — futures, rates, FX</li><li><b>Market Neutral</b> — paired, beta ≈ 0</li><li><b>Digital Assets</b> — crypto + tokenized</li></ul>Say "switch to <i>name</i>" and everything updates.`;
      if(has('aum','how big','size of','how much money','assets under')) return `<b>${f.name}</b> runs ${money(f.aum)} in AUM (${f.aumD}).`;
      if(has('how are we','performance','return','pnl','p&l','doing','profit','up or down')){
        const k=vt.pnlKpis;
        return `<b>${f.name}</b> performance — Day ${money(k[0][1])} (${k[0][2]}), MTD ${money(k[1][1])}, QTD ${money(k[2][1])}, YTD ${money(k[3][1])}. Hit rate ${pd.pnlStats[0][1]}, W/L ${pd.pnlStats[1][1]}.`;
      }
      if(has('breach','limit','ima','guideline','headroom','over the limit')){
        const br=vt.riskLimits.find(r=>/BREACH|near/.test(strip(r[5])+strip(r[r.length-1])));
        if(br){ const tc=topCard();
          return `⚠️ <b>${strip(br[0])}</b> is at <b>${strip(br[1])}</b> vs. a ${strip(br[2])} limit — breach path ${strip(br[4])}. Recommended: ${tc?tc.body:'see the Risk agent card'}`;
        }
        return `All limits are currently within range for the <b>${f.name}</b> — no projected breaches.`;
      }
      if(has('var','value at risk','how risky','risk level','downside')){
        const mag=v=>Math.abs(parseFloat((v||'').replace(/[^\d.]/g,''))||0);
        const worst=[...pd.stress].sort((a,b)=>mag(b[1])-mag(a[1]))[0];
        return `<b>${f.name}</b> 1-day 99% VaR is ${money(f.var)} (${f.varD}). Worst stress scenario: <b>${strip(worst[0])}</b> → ${money(strip(worst[1]))}.`;
      }
      if(has('net','gross','exposure','leverage','how long')) return `<b>${f.name}</b> exposure: gross/net ${money(f.exp)}. ${f.expD}.`;
      if(has('biggest','largest','top position','top holding','concentrat','main position')){
        const ps=d.positions.slice(0,3).map(p=>`<li><b>${p[0]}</b> ${p[4]} (${p[5]})</li>`).join('');
        return `Top positions in the <b>${f.name}</b>:<ul>${ps}</ul>`;
      }
      if(has('trim','sell','reduce','cut','what should i','recommend','action','do now','next best')){
        const tc=topCard();
        return tc?`Top action for the <b>${f.name}</b> — <b>${tc.title}</b>. ${tc.body} <br><span class="amv">Open the dashboard card for the full what-if & approval.</span>`:`No critical action right now.`;
      }
      if(has('crowd','de-gross','degross','positioning','consensus')){
        const c=vt.crowding[0];
        return `Most crowded in the <b>${f.name}</b>: <b>${strip(c[0])}</b> — crowding ${strip(c[1])}${c[2]&&c[2]!=='—'?', ownership '+c[2]:''}. Flag: ${strip(c[c.length-1])}.`;
      }
      if(has('macro','cpi','inflation','fed','rate','regime','interest')){
        const sc=pd.scenario.find(r=>/hot cpi/i.test(r[0]));
        return `Macro: CPI 3.1% YoY, Fed funds 4.75% (2 cuts priced by March). Book stance: <b>${md.macroKpis[3][1]}</b>. ${sc?'Hot-CPI scenario for this book: '+money(strip(sc[1])):''}.`;
      }
      if(has('crypto','bitcoin','btc','ethereum','eth','token','digital asset')){
        return `Digital read: BTC $101,842 (−2.1%), ETH $3,842 (−3.4%). Perp funding +0.082%, OI +18% — crowded longs. Tokenized tNVDA basis −2.81% vs NYSE. ${activeFund==='digital'?'This book is the Digital Assets fund.':'Your crypto-β here is '+(f.exp)+'.'}`;
      }
      if(has('brief','overnight','summary','catch me up','what happened','what\'s new','whats new')){
        const fe=fundExtra[activeFund]||fundExtra.alpha;
        const items=fe.feed.slice(0,3).map(x=>`<li>${x[1]}</li>`).join('');
        return `Overnight for the <b>${f.name}</b> — ${f.cards}, ${f.crit}:<ul>${items}</ul>`;
      }
      if(has('thank','thanks','cheers','great','nice','cool')) return `Anytime. Ask me anything else about the book.`;
      if(has('who are you','what is point','about point')) return `Point is an agentic decision layer — ten specialist agents watch the portfolio and the market, predict what matters, and recommend the next best action. I'm the chat front-end to that team.`;
      return `I can help with <b>performance</b>, <b>risk & limits</b>, <b>positions</b>, <b>crowding</b>, <b>macro</b>, or a specific <b>ticker</b> for the <b>${f.name}</b>. Try one of the suggestions below, or rephrase.`;
    }

    function send(text){
      const t=(text||input.value).trim(); if(!t) return;
      input.value='';
      addMsg(strip(t), 'user');
      const tp=typing();
      setTimeout(()=>{ tp.remove(); let a; try{ a=answer(t); }catch(e){ a='Sorry — I hit a snag on that one. Try rephrasing, or ask about performance, risk & limits, positions, crowding, macro, or a ticker.'; } addMsg(a, 'bot'); }, 420+Math.random()*320);
    }
    function openPanel(prefill){
      fundtag.textContent=curFund().name;
      fab.classList.add('hide'); panel.classList.add('open');
      if(!greeted){ greeted=true;
        addMsg(`Hi — I'm <b>Ask Point</b>. I'm watching the <b>${curFund().name}</b> and can answer questions about performance, risk, positions, crowding and macro. What would you like to know?`, 'bot');
      }
      if(prefill){ send(prefill); } else { setTimeout(()=>input.focus(),120); }
    }
    function closePanel(){ panel.classList.remove('open'); fab.classList.remove('hide'); }

    fab.addEventListener('click',()=>openPanel());
    panel.querySelector('#askp-x').addEventListener('click',closePanel);
    panel.querySelector('#askp-send').addEventListener('click',()=>send());
    input.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); send(); } });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape') closePanel(); });

    // wire existing "Ask Point" buttons + the top search
    document.querySelectorAll('.btn').forEach(b=>{
      if(/ask point/i.test(b.textContent)) b.addEventListener('click',ev=>{ ev.preventDefault(); openPanel(); });
    });
    const topSearch=document.querySelector('.search input');
    if(topSearch) topSearch.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); const v=topSearch.value.trim(); topSearch.value=''; openPanel(v||undefined); } });
  })();

  /* open from hash */
  const h = (location.hash||'').replace('#','');
  if(h && titles[h]) go(h);
})();
