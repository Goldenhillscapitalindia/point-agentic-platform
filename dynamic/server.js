/* ============================================================
   Point — Dynamic Fund Intelligence Terminal
   Multi-tenant backend. Each fund company uploads an Excel
   portfolio; the server parses it, computes metrics, and
   serves everything through a JSON API.
   ============================================================ */
const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4200;
const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

/* ---------- tenants (two fund management companies) ---------- */
const COMPANIES = {
  apex:   { id: 'apex',   name: 'Apex Capital Management',   color: '#3157d5', short: 'AX' },
  helios: { id: 'helios', name: 'Helios Asset Management',   color: '#8a4fd8', short: 'HE' }
};

/* ---------- helpers ---------- */
const num = v => { const n = parseFloat(String(v).replace(/[$,%\s]/g, '')); return isFinite(n) ? n : 0; };
const str = v => (v == null ? '' : String(v)).trim();

function pick(row, keys) {
  // case/space-insensitive column lookup
  const norm = {};
  Object.keys(row).forEach(k => { norm[k.toLowerCase().replace(/[^a-z0-9]/g, '')] = row[k]; });
  for (const key of keys) {
    const nk = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (norm[nk] !== undefined && norm[nk] !== '') return norm[nk];
  }
  return undefined;
}

/* Parse an uploaded workbook into normalized positions + fund meta */
function parseWorkbook(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  // positions sheet: first sheet named like "positions"/"holdings", else first sheet
  const posSheetName = wb.SheetNames.find(n => /position|holding|portfolio/i.test(n)) || wb.SheetNames[0];
  const rowsRaw = XLSX.utils.sheet_to_json(wb.Sheets[posSheetName], { defval: '' });

  const positions = rowsRaw.map(r => {
    const ticker = str(pick(r, ['ticker', 'symbol']));
    if (!ticker) return null;
    const sideRaw = str(pick(r, ['side', 'direction', 'longshort'])).toUpperCase();
    let qty = num(pick(r, ['quantity', 'qty', 'shares', 'units']));
    const price = num(pick(r, ['price', 'last', 'lastprice', 'mark', 'close']));
    let mv = pick(r, ['marketvalue', 'mktval', 'mv', 'value', 'notional']);
    mv = mv !== undefined && mv !== '' ? num(mv) : qty * price;
    const side = sideRaw.startsWith('S') || qty < 0 || mv < 0 ? 'S' : 'L';
    if (side === 'S') { qty = -Math.abs(qty); mv = -Math.abs(mv); }
    else { qty = Math.abs(qty); mv = Math.abs(mv); }
    return {
      ticker,
      name: str(pick(r, ['name', 'company', 'security', 'description'])) || ticker,
      side,
      qty,
      price,
      mv,                                  // signed, in $ (raw units from sheet)
      sector: str(pick(r, ['sector', 'industry', 'gics'])) || 'Unclassified',
      beta: num(pick(r, ['beta'])) || (side === 'S' ? -1 : 1),
      dayPct: num(pick(r, ['daychange', 'daychangepct', 'day', 'dayreturn', 'change'])),
      mtdPct: num(pick(r, ['mtd', 'mtdreturn', 'mtdpct'])),
      ytdPct: num(pick(r, ['ytd', 'ytdreturn', 'ytdpct'])),
      liqDays: num(pick(r, ['liquidity', 'daystoliquidate', 'liqdays'])) || 1
    };
  }).filter(Boolean);

  // fund meta sheet (optional)
  let meta = {};
  const metaSheet = wb.SheetNames.find(n => /fund|meta|summary/i.test(n));
  if (metaSheet) {
    const mrows = XLSX.utils.sheet_to_json(wb.Sheets[metaSheet], { defval: '' });
    const flat = {};
    mrows.forEach(r => {
      const keys = Object.keys(r);
      if (keys.length >= 2) flat[str(r[keys[0]]).toLowerCase().replace(/[^a-z0-9]/g, '')] = r[keys[1]];
      Object.assign(flat, Object.fromEntries(Object.entries(r).map(([k, v]) => [k.toLowerCase().replace(/[^a-z0-9]/g, ''), v])));
    });
    meta.fundName = str(flat.fundname || flat.name || flat.fund);
    meta.nav = num(flat.nav || flat.aum || flat.netassetvalue);
    meta.cash = num(flat.cash || flat.cashpct);
    meta.asOf = str(flat.asof || flat.date);
  }
  return { positions, meta, sheets: wb.SheetNames };
}

/* Compute portfolio metrics from normalized positions */
function computeMetrics(positions, meta) {
  const grossSum = positions.reduce((a, p) => a + Math.abs(p.mv), 0);
  const netSum   = positions.reduce((a, p) => a + p.mv, 0);
  const longSum  = positions.filter(p => p.side === 'L').reduce((a, p) => a + p.mv, 0);
  const shortSum = positions.filter(p => p.side === 'S').reduce((a, p) => a + p.mv, 0);
  // NAV: from meta if provided, else net market value (long - |short|) grossed up by cash
  const cashPct = meta.cash || 0;
  const nav = meta.nav && meta.nav > 0 ? meta.nav : netSum / (1 - cashPct / 100 || 1);
  const dayPnl = positions.reduce((a, p) => a + p.mv * (p.dayPct / 100), 0);
  const betaNet = positions.reduce((a, p) => a + p.mv * p.beta, 0) / (nav || 1) * 100;

  // per-position derived
  const enriched = positions.map(p => ({
    ...p,
    navPct: nav ? p.mv / nav * 100 : 0,
    dayPnl: p.mv * (p.dayPct / 100),
    mtdPnl: p.mv * (p.mtdPct / 100),
    ytdPnl: p.mv * (p.ytdPct / 100),
    varc: nav ? Math.abs(p.mv * p.beta) / grossSum * 100 : 0
  })).sort((a, b) => Math.abs(b.mv) - Math.abs(a.mv));

  // sector concentration
  const sectorMap = {};
  enriched.forEach(p => { sectorMap[p.sector] = (sectorMap[p.sector] || 0) + Math.abs(p.navPct); });
  const sectors = Object.entries(sectorMap).map(([k, v]) => ({ sector: k, pct: v })).sort((a, b) => b.pct - a.pct);

  // top-10 concentration
  const top10 = enriched.slice(0, 10).reduce((a, p) => a + Math.abs(p.navPct), 0);

  // simple VaR proxy: beta-weighted gross * 1-day market vol assumption (1.1%) * 2.33 (99%)
  const marketVol = 0.011, z = 2.33;
  const betaGross = enriched.reduce((a, p) => a + Math.abs(p.mv * p.beta), 0);
  const var99 = betaGross * marketVol * z;

  // liquidity buckets
  const liqBuckets = [['< 1 day', 0], ['1–3 days', 0], ['3–5 days', 0], ['> 5 days', 0]];
  enriched.forEach(p => {
    const d = p.liqDays, w = Math.abs(p.navPct);
    if (d < 1) liqBuckets[0][1] += w; else if (d <= 3) liqBuckets[1][1] += w;
    else if (d <= 5) liqBuckets[2][1] += w; else liqBuckets[3][1] += w;
  });

  return {
    nav, grossSum, netSum, longSum, shortSum,
    grossPct: nav ? grossSum / nav * 100 : 0,
    netPct:   nav ? netSum / nav * 100 : 0,
    betaNet,
    dayPnl,
    dayPnlPct: nav ? dayPnl / nav * 100 : 0,
    cashPct,
    var99, var99Pct: nav ? var99 / nav * 100 : 0,
    top10, longCount: positions.filter(p => p.side === 'L').length,
    shortCount: positions.filter(p => p.side === 'S').length,
    sectors, liqBuckets,
    positions: enriched
  };
}

/* persistence */
function savePortfolio(company, payload) {
  fs.writeFileSync(path.join(DATA_DIR, company + '.json'), JSON.stringify(payload, null, 2));
}
function loadPortfolio(company) {
  const f = path.join(DATA_DIR, company + '.json');
  if (!fs.existsSync(f)) return null;
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; }
}

/* ======================= API ======================= */
app.get('/api/companies', (req, res) => {
  res.json(Object.values(COMPANIES).map(c => ({
    ...c,
    hasData: !!loadPortfolio(c.id),
    uploadedAt: loadPortfolio(c.id)?.uploadedAt || null,
    fundName: loadPortfolio(c.id)?.meta?.fundName || null
  })));
});

app.get('/api/:company/portfolio', (req, res) => {
  const c = COMPANIES[req.params.company];
  if (!c) return res.status(404).json({ error: 'Unknown company' });
  const data = loadPortfolio(c.id);
  if (!data) return res.json({ company: c, empty: true });
  res.json({ company: c, ...data });
});

app.post('/api/:company/upload', upload.single('file'), (req, res) => {
  const c = COMPANIES[req.params.company];
  if (!c) return res.status(404).json({ error: 'Unknown company' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const { positions, meta, sheets } = parseWorkbook(req.file.buffer);
    if (!positions.length) return res.status(422).json({ error: 'No positions found. Expected a sheet with a Ticker column.' });
    const metrics = computeMetrics(positions, meta);
    const payload = {
      meta: { fundName: meta.fundName || c.name + ' Fund', asOf: meta.asOf || new Date().toISOString().slice(0, 10) },
      metrics, sheets,
      uploadedAt: new Date().toISOString(),
      fileName: req.file.originalname
    };
    savePortfolio(c.id, payload);
    res.json({ ok: true, company: c, positions: positions.length, fundName: payload.meta.fundName });
  } catch (e) {
    res.status(500).json({ error: 'Parse failed: ' + e.message });
  }
});

app.delete('/api/:company/portfolio', (req, res) => {
  const c = COMPANIES[req.params.company];
  if (!c) return res.status(404).json({ error: 'Unknown company' });
  const f = path.join(DATA_DIR, c.id + '.json');
  if (fs.existsSync(f)) fs.unlinkSync(f);
  res.json({ ok: true });
});

/* downloadable Excel template */
app.get('/api/template.xlsx', (req, res) => {
  const positions = [
    { Ticker: 'NVDA', Name: 'NVIDIA Corp', Side: 'Long', Quantity: 120000, Price: 903, Sector: 'Technology', Beta: 1.82, DayChangePct: 1.4, MTD: 6.1, YTD: 18.4, LiqDays: 2 },
    { Ticker: 'META', Name: 'Meta Platforms', Side: 'Long', Quantity: 150000, Price: 565, Sector: 'Comm Svcs', Beta: 1.21, DayChangePct: 2.1, MTD: 4.2, YTD: 15.1, LiqDays: 1 },
    { Ticker: 'TSLA', Name: 'Tesla', Side: 'Short', Quantity: 65000, Price: 245, Sector: 'Cons Disc', Beta: 1.74, DayChangePct: -1.1, MTD: 2.2, YTD: 3.1, LiqDays: 1 }
  ];
  const fund = [{ Field: 'FundName', Value: 'Your Fund Name' }, { Field: 'NAV', Value: 1260000000 }, { Field: 'Cash', Value: 8.3 }, { Field: 'AsOf', Value: new Date().toISOString().slice(0, 10) }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(positions), 'Positions');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fund), 'Fund');
  const out = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="point-portfolio-template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(out);
});

app.listen(PORT, () => console.log(`Point dynamic terminal running → http://localhost:${PORT}`));
