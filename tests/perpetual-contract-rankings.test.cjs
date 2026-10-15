const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const marketSnapshot = require('../data/perpetual-markets.js');
const appSource = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

test('October 15 exchange-level perpetual rankings preserve the supplied CEX and DEX market rows', () => {
  const rankings = marketSnapshot.contractRankings;

  assert.equal(rankings.asOfLabel, '15 Oct 2026 · approximately 9:29 a.m.–12:05 p.m. IST');
  assert.equal(rankings.cex.length, 10);
  assert.equal(rankings.dex.length, 10);
  assert.deepEqual(rankings.cex[0], ['Binance', 'BTC', '$80,942.06', '—', '—', '$23.12B', '$7.42B']);
  assert.deepEqual(rankings.dex[0], ['Hyperliquid', 'BTC', '$80,755.37', '—', '—', '$4.06B', '$3.19B']);
});

test('exchange-level perpetual rankings are displayed only for the first fund', () => {
  assert.match(appSource, /section\.hidden\s*=\s*fund\s*!==\s*'alpha'/);
});
