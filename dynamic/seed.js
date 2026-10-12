/* Generate two realistic sample portfolio workbooks (one per company)
   into ./samples so the upload flow can be tested immediately. */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'samples');
fs.mkdirSync(dir, { recursive: true });

function build(file, fundName, nav, cash, positions) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(positions), 'Positions');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
    { Field: 'FundName', Value: fundName },
    { Field: 'NAV', Value: nav },
    { Field: 'Cash', Value: cash },
    { Field: 'AsOf', Value: '2026-10-09' }
  ]), 'Fund');
  XLSX.writeFile(wb, path.join(dir, file));
  console.log('wrote samples/' + file + '  (' + positions.length + ' positions)');
}

/* Company A — Apex Capital · Long/Short tech-heavy equity */
build('apex-portfolio.xlsx', 'Apex Long/Short Equity', 1260000000, 8.3, [
  ['NVDA','NVIDIA Corp','Long',120000,903,'Technology',1.82,1.4,6.1,18.4,2],
  ['META','Meta Platforms','Long',150000,565,'Comm Svcs',1.21,2.1,4.2,15.1,1],
  ['MSFT','Microsoft','Long',200000,413,'Technology',0.96,-0.4,-2.1,9.2,1],
  ['AMZN','Amazon','Long',380000,191,'Cons Disc',1.14,0.9,3.8,11.0,1],
  ['GOOGL','Alphabet','Long',420000,169,'Comm Svcs',1.02,0.6,1.1,6.4,1],
  ['AVGO','Broadcom','Long',48000,1294,'Technology',1.44,1.4,3.3,10.6,2],
  ['AMD','Adv Micro Dev','Long',310000,170,'Technology',1.78,-1.2,-3.1,-2.4,1],
  ['LLY','Eli Lilly','Long',68000,903,'Health Care',0.62,0.4,2.0,8.1,2],
  ['JPM','JPMorgan','Long',240000,234,'Financials',1.08,0.3,1.4,4.9,1],
  ['GS','Goldman Sachs','Long',92000,485,'Financials',1.18,0.2,0.9,3.2,1],
  ['COST','Costco','Long',52000,785,'Cons Staples',0.72,0.5,2.0,2.9,1],
  ['UNH','UnitedHealth','Long',58000,588,'Health Care',0.74,-0.3,-1.8,-3.2,1],
  ['XOM','Exxon Mobil','Long',280000,120,'Energy',0.66,-0.6,0.8,5.1,1],
  ['ANET','Arista Networks','Long',62000,416,'Technology',1.33,0.9,2.1,4.4,2],
  ['TSLA','Tesla','Short',65000,245,'Cons Disc',1.74,-1.1,2.2,3.1,1],
  ['PEP','PepsiCo','Short',120000,163,'Cons Staples',0.58,0.1,0.6,1.4,1],
  ['INTC','Intel','Short',540000,22,'Technology',1.05,0.3,1.4,2.2,1],
  ['WBA','Walgreens','Short',820000,8.4,'Cons Staples',0.91,0.5,2.8,4.4,1]
].map(r => ({ Ticker:r[0],Name:r[1],Side:r[2],Quantity:r[3],Price:r[4],Sector:r[5],Beta:r[6],DayChangePct:r[7],MTD:r[8],YTD:r[9],LiqDays:r[10] })));

/* Company B — Helios Asset Management · Diversified value/income */
build('helios-portfolio.xlsx', 'Helios Diversified Value', 840000000, 12.0, [
  ['BRK.B','Berkshire Hathaway','Long',180000,462,'Financials',0.82,0.3,1.1,7.4,1],
  ['JNJ','Johnson & Johnson','Long',240000,162,'Health Care',0.55,0.2,0.9,3.1,1],
  ['PG','Procter & Gamble','Long',160000,168,'Cons Staples',0.41,0.1,0.6,4.2,1],
  ['KO','Coca-Cola','Long',420000,70,'Cons Staples',0.48,0.0,0.4,6.1,1],
  ['CVX','Chevron','Long',180000,158,'Energy',0.64,-0.5,0.4,5.8,1],
  ['WMT','Walmart','Long',210000,82,'Cons Staples',0.49,0.4,1.5,9.4,1],
  ['HD','Home Depot','Long',68000,401,'Cons Disc',0.72,0.4,1.5,2.6,1],
  ['MCD','McDonald\'s','Long',72000,298,'Cons Disc',0.66,0.2,0.8,4.0,1],
  ['PFE','Pfizer','Long',640000,28,'Health Care',0.61,-0.3,-0.9,-4.1,1],
  ['VZ','Verizon','Long',520000,42,'Comm Svcs',0.44,0.1,0.5,8.2,1],
  ['DUK','Duke Energy','Long',180000,108,'Utilities',0.38,0.2,0.7,3.4,2],
  ['NEE','NextEra Energy','Long',160000,78,'Utilities',0.52,0.3,1.0,5.1,2],
  ['T','AT&T','Long',640000,22,'Comm Svcs',0.46,0.1,0.4,6.8,1],
  ['MMM','3M','Long',120000,132,'Industrials',0.88,-0.2,0.3,2.1,1],
  ['IBM','IBM','Long',110000,228,'Technology',0.74,0.3,1.1,12.4,1],
  ['CSCO','Cisco','Long',280000,52,'Technology',0.86,0.2,0.9,4.4,1],
  ['BA','Boeing','Short',60000,178,'Industrials',1.38,-0.8,-2.1,-9.4,1],
  ['NFLX','Netflix','Short',18000,790,'Comm Svcs',1.26,0.4,1.1,3.9,1]
].map(r => ({ Ticker:r[0],Name:r[1],Side:r[2],Quantity:r[3],Price:r[4],Sector:r[5],Beta:r[6],DayChangePct:r[7],MTD:r[8],YTD:r[9],LiqDays:r[10] })));

console.log('Samples ready in ./samples — upload them in the app to test.');
