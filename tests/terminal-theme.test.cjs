const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('institutional terminal uses the platform dark surface system', () => {
  const terminal = fs.readFileSync(path.join(__dirname, '..', 'institutional.html'), 'utf8');
  const appStyles = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
  const rootTokens = source => Object.fromEntries(
    [...source.match(/:root\s*\{([^}]+)\}/)[1].matchAll(/--([\w-]+):\s*([^;]+);/g)]
      .map(([, name, value]) => [name, value.trim()])
  );
  const terminalTokens = rootTokens(terminal);
  const appTokens = rootTokens(appStyles);

  assert.match(terminal, /Fraunces/);
  assert.match(terminal, /JetBrains\+Mono/);
  for (const [terminalToken, appToken] of [
    ['bg', 'bg'], ['panel', 'panel'], ['accent', 'ws'],
    ['accent-2', 'ws-2'], ['accent-ink', 'ws-ink']
  ]) {
    assert.ok(appTokens[appToken], `Platform token ${appToken} must exist`);
    assert.equal(terminalTokens[terminalToken], appTokens[appToken], `${terminalToken} must match the platform`);
  }
  assert.doesNotMatch(terminal, /--bg:#f6f7f9/);
});

test('institutional terminal header follows the application navigation pattern', () => {
  const terminal = fs.readFileSync(path.join(__dirname, '..', 'institutional.html'), 'utf8');

  assert.match(terminal, /class="crumbs"/);
  assert.match(terminal, /class="crumb back-link"/);
  assert.match(terminal, /class="top-tools"/);
  assert.match(terminal, /class="profile-btn"/);
});

test('institutional terminal exposes persistent full-page light and dark themes', () => {
  const terminal = fs.readFileSync(path.join(__dirname, '..', 'institutional.html'), 'utf8');
  const behavior = fs.readFileSync(path.join(__dirname, '..', 'institutional.js'), 'utf8');

  assert.match(terminal, /body\[data-theme="light"\]/);
  assert.match(terminal, /id="theme-btn"/);
  assert.match(behavior, /point-inst-theme/);
  assert.match(behavior, /function setTheme\(/);
});

test('institutional terminal uses the application fund roster', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const terminal = fs.readFileSync(path.join(__dirname, '..', 'institutional.js'), 'utf8');
  const fundNames = ['Alpha Fund', 'Global Macro Fund', 'Market Neutral Fund', 'Digital Assets Fund'];

  for (const name of fundNames) {
    assert.match(app, new RegExp(`name:'${name}'`));
    assert.match(terminal, new RegExp(`name:'${name}'`));
  }
  assert.match(terminal, /let FUND='alpha'/);
});

test('institutional terminal sidebar uses the Point Agentic Solutions lockup', () => {
  const terminal = fs.readFileSync(path.join(__dirname, '..', 'institutional.html'), 'utf8');

  assert.match(terminal, /class="brand-mark"/);
  assert.match(terminal, /Agentic Solutions/);
});

test('institutional terminal exposes app-style navigation and actionable controls', () => {
  const terminal = fs.readFileSync(path.join(__dirname, '..', 'institutional.html'), 'utf8');
  const behavior = fs.readFileSync(path.join(__dirname, '..', 'institutional.js'), 'utf8');

  assert.match(terminal, /<button class="profile-btn" id="profile-btn"/);
  assert.match(terminal, /id="profile-menu"/);
  assert.match(terminal, /id="mobile-nav-btn"/);
  assert.match(behavior, /function runAction\(/);
  assert.match(behavior, /action==='run-scenario'/);
  assert.match(behavior, /action==='export-brief'/);
  assert.match(behavior, /e\.target\.closest\('\[data-v\]'\)/);
});

test('institutional terminal uses P&L notation', () => {
  const terminal = fs.readFileSync(path.join(__dirname, '..', 'institutional.html'), 'utf8');
  const behavior = fs.readFileSync(path.join(__dirname, '..', 'institutional.js'), 'utf8');

  assert.match(terminal, />P&L attribution</);
  assert.match(behavior, /pnl:'P&L attribution'/);
});
