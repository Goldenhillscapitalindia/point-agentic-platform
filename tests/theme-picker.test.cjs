const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { palettes, storageKey, normalizePalette, getTokens } = require('../theme-picker.js');
const styles = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const groups = ['ws', 'pf', 'mk', 'dp'];

function rgb(hex) {
  assert.match(hex, /^#[\da-f]{6}$/i, `Expected a concrete six-digit hex color, received ${hex}`);
  return [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
}

function luminance(channels) {
  const linear = channels.map(channel => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
  return (values[1] + 0.05) / (values[0] + 0.05);
}

function rgba(value) {
  const match = /^rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*(0?\.\d+|0|1)\s*\)$/.exec(value);
  assert.ok(match, `Expected a concrete rgba color, received ${value}`);
  const channels = match.slice(1, 4).map(Number);
  assert.ok(channels.every(channel => channel >= 0 && channel <= 255));
  return { channels, opacity: Number(match[4]) };
}

function surfaces(theme) {
  const rule = theme === 'light'
    ? styles.match(/body\[data-theme="light"\]\s*\{([^}]+)\}/)
    : styles.match(/:root\s*\{([^}]+)\}/);
  assert.ok(rule, `The ${theme} surface tokens must exist`);
  const tokens = Object.fromEntries([...rule[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)]
    .map(([, name, value]) => [name, value.trim()]));
  return ['--bg', '--bg-2', '--panel', '--panel-2', '--sb']
    .map(name => ({ name, channels: rgb(tokens[name]) }));
}

test('appearance offers six distinct named color sets with four squad colors each', () => {
  assert.equal(palettes.length, 6);
  assert.equal(new Set(palettes.map(palette => palette.id)).size, 6);
  assert.equal(new Set(palettes.map(palette => palette.name)).size, 6);
  assert.equal(new Set(palettes.map(palette => palette.colors.join(',').toUpperCase())).size, 6);
  for (const palette of palettes) {
    assert.match(palette.id, /^[a-z][a-z0-9-]*$/);
    assert.ok(palette.name.trim().length > 0);
    assert.equal(palette.colors.length, groups.length);
    assert.equal(new Set(palette.colors.map(color => color.toUpperCase())).size, groups.length);
    palette.colors.forEach(rgb);
  }
});

test('stored palette choices survive normalization and malformed choices fall back safely', () => {
  assert.equal(storageKey, 'point-palette');
  for (const palette of palettes) assert.equal(normalizePalette(palette.id), palette.id);
  for (const invalid of [undefined, null, '', 'removed-palette', 'null', '{broken',
    JSON.stringify({ id: palettes[1].id }), {}, [], 7, false]) {
    assert.equal(normalizePalette(invalid), palettes[0].id);
    for (const theme of ['light', 'dark']) {
      assert.deepEqual(getTokens(invalid, theme), getTokens(palettes[0].id, theme));
    }
  }
});

test('switching display mode preserves all four selected colors and supplies their interaction tokens', () => {
  for (const palette of palettes) {
    const light = getTokens(palette.id, 'light');
    const dark = getTokens(palette.id, 'dark');
    for (const [index, group] of groups.entries()) {
      const prefix = `--${group}`;
      assert.equal(light[prefix], palette.colors[index]);
      assert.equal(dark[prefix], light[prefix]);
      assert.notEqual(light[`${prefix}-ink`], dark[`${prefix}-ink`]);
      for (const tokens of [light, dark]) {
        for (const suffix of ['', '-2', '-ink']) rgb(tokens[prefix + suffix]);
        for (const suffix of ['-soft', '-line']) rgba(tokens[prefix + suffix]);
        assert.notEqual(tokens[prefix], tokens[`${prefix}-2`], 'Hover must be distinguishable from the base color');
      }
    }
  }
});

test('sidebar and button text meets normal-text contrast on every palette and hover color', () => {
  for (const palette of palettes) {
    for (const theme of ['light', 'dark']) {
      const tokens = getTokens(palette.id, theme);
      const foreground = rgb(tokens['--ws-on']);
      for (const group of groups) {
        for (const suffix of ['', '-2']) {
          const ratio = contrast(foreground, rgb(tokens[`--${group}${suffix}`]));
          assert.ok(ratio >= 4.5, `${palette.name} ${theme} ${group}${suffix}: text contrast ${ratio.toFixed(2)} is below 4.5`);
        }
      }
    }
  }
});

test('colored text stays readable on app surfaces and soft badges in light and dark modes', () => {
  for (const theme of ['light', 'dark']) {
    for (const palette of palettes) {
      const tokens = getTokens(palette.id, theme);
      for (const group of groups) {
        const foreground = rgb(tokens[`--${group}-ink`]);
        const soft = rgba(tokens[`--${group}-soft`]);
        for (const surface of surfaces(theme)) {
          const softBackground = surface.channels.map((channel, index) =>
            channel * (1 - soft.opacity) + soft.channels[index] * soft.opacity);
          for (const [kind, background] of [['surface', surface.channels], ['soft badge', softBackground]]) {
            const ratio = contrast(foreground, background);
            assert.ok(ratio >= 4.5,
              `${palette.name} ${theme} ${group} ${kind} on ${surface.name}: contrast ${ratio.toFixed(2)} is below 4.5`);
          }
        }
      }
    }
  }
});
