import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runChecks } from '../scripts/lib/check.mjs';
import { root } from './helpers.mjs';

const components = readFileSync(join(root, 'src/components.css'), 'utf8');
const withExtra = (css) => ({ css: { 'components.css': components.replace(/}\s*$/, `${css}\n}\n`) }, skipFreshness: true });

test('the repo passes its own checks', () => {
  assert.deepEqual(runChecks(root), []);
});

const CASES = [
  ['a class missing from the contracts', '.c-button--warning { color: var(--color-text-error); }', /class \.c-button--warning is not defined/],
  ['a state missing from the contract', '.c-button[data-state="busy"] { opacity: 1; }', /state c-button\[data-state="busy"\] is not in the c-button contract/],
  ['an unknown token', '.c-button { color: var(--color-brand-500); }', /var\(--color-brand-500\) is not a token/],
  ['a primitive color in a component', '.c-button { color: var(--color-gray-900); }', /is a primitive color/],
  ['a raw hex color', '.c-button { color: #ff0000; }', /raw color value/],
  ['a raw rgba() color', '.c-button { color: rgba(0, 0, 0, 0.5); }', /raw color value/],
];
for (const [what, css, pattern] of CASES) {
  test(`check fails on ${what}`, () => {
    const errors = runChecks(root, withExtra(css));
    assert.ok(errors.some((e) => pattern.test(e)), errors.join('\n'));
  });
}

test('check fails when a contract class has no CSS', () => {
  const css = components.replace('.c-badge--info', '.c-badge--unused');
  const errors = runChecks(root, { css: { 'components.css': css }, skipFreshness: true });
  assert.ok(errors.some((e) => /c-badge--info has no CSS/.test(e)), errors.join('\n'));
});
