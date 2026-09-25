import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadTokens, tokensForMode, resolve, resolvedCss, MODES } from '../scripts/lib/tokens.mjs';
import { root, fixture, contrast } from './helpers.mjs';

const { sets } = loadTokens(join(root, 'tokens'));
const css = readFileSync(join(root, 'src/tokens.css'), 'utf8');

test('every token name from 0.1.0 is still emitted', () => {
  const legacy = readFileSync(fixture('legacy-token-names.txt'), 'utf8').trim().split('\n');
  const emitted = new Set([...css.matchAll(/^\s*(--[a-z0-9-]+):/gm)].map((m) => m[1]));
  const missing = legacy.filter((n) => !emitted.has(n));
  assert.deepEqual(missing, []);
});

test('light and dark define the same semantic tokens', () => {
  assert.deepEqual(sets.light.map((t) => t.name), sets.dark.map((t) => t.name));
});

test('every alias resolves in both modes', () => {
  for (const mode of MODES) {
    const byPath = tokensForMode(sets, mode);
    for (const t of byPath.values()) assert.doesNotThrow(() => resolve(t, byPath), `${mode}: ${t.path}`);
  }
});

test('$root tokens drop the $root segment from the CSS name', () => {
  const primary = sets.primitive.find((t) => t.path === 'color.primary.$root');
  assert.equal(primary.name, '--color-primary');
});

// [foreground, background, minimum ratio]. 4.5 = WCAG AA text, 3 = non-text UI (1.4.11).
const PAIRS = [
  ['color.text.default', 'color.background.default', 4.5],
  ['color.text.default', 'color.background.raised', 4.5],
  ['color.text.muted', 'color.background.default', 4.5],
  ['color.text.muted', 'color.background.raised', 4.5],
  ['color.text.subtle', 'color.background.default', 4.5],
  ['color.text.subtle', 'color.background.raised', 4.5],
  ['color.text.subtle', 'color.background.interactive', 4.5],
  ['color.text.link', 'color.background.default', 4.5],
  ['color.text.link', 'color.background.raised', 4.5],
  ['color.text.link-hover', 'color.background.default', 4.5],
  ['color.text.on-action', 'color.action.primary.$root', 4.5],
  ['color.text.on-action', 'color.action.primary.hover', 4.5],
  ['color.action.primary.$root', 'color.background.interactive', 4.5],
  ['color.text.muted', 'color.background.muted', 4.5],
  ['color.text.default', 'color.background.interactive-hover', 4.5],
  ['color.text.success', 'color.background.success', 4.5],
  ['color.text.warning', 'color.background.warning', 4.5],
  ['color.text.error', 'color.background.error', 4.5],
  ['color.text.info', 'color.background.info', 4.5],
  ['color.text.error', 'color.background.raised', 4.5],
  ['color.border.focus', 'color.background.default', 3],
  ['color.border.interactive', 'color.background.interactive', 3],
  ['color.border.interactive', 'color.background.interactive-hover', 3],
];

for (const mode of MODES) {
  test(`WCAG contrast in ${mode} mode`, () => {
    const byPath = tokensForMode(sets, mode);
    const failures = [];
    for (const [fg, bg, min] of PAIRS) {
      const a = resolvedCss(byPath.get(fg), byPath);
      const b = resolvedCss(byPath.get(bg), byPath);
      const ratio = contrast(a, b);
      if (ratio < min) failures.push(`${fg} ${a} on ${bg} ${b}: ${ratio.toFixed(2)} < ${min}`);
    }
    assert.deepEqual(failures, []);
  });
}
