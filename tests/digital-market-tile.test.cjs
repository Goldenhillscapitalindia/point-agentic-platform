const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const page = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('Digital Assets shows the supplied October 15 BTC snapshot price', () => {
  assert.match(page, /<div class="kpi"><div class="k-lab">BTC<\/div><div class="k-val">\$ 80,949\.06<\/div>/);
  assert.doesNotMatch(page, /<div class="kpi"><div class="k-lab">BTC<\/div><div class="k-val">\$ 101,842<\/div>/);
});
