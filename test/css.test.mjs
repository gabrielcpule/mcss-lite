import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './helpers.mjs';

const css = (f) => readFileSync(join(root, 'src', f), 'utf8');

test('hidden always wins over component display values', () => {
  assert.match(css('global.css'), /\[hidden\] \{\s*display: none !important;/);
});

test('a themed subtree paints its own text and background', () => {
  assert.match(css('global.css'), /\[data-theme\] \{\s*color: var\(--color-text-default\);\s*background-color: var\(--color-background-default\);/);
  assert.match(css('components.css'), /\.c-card \{\s*color: var\(--color-text-default\);/);
});

test('l-stack is a flex column; inline parts keep their own width', () => {
  const layout = css('layout.css');
  assert.match(layout, /\.l-stack \{\s*display: flex;\s*flex-direction: column;/);
  assert.match(layout, /\.c-button, \.c-badge\) \{\s*align-self: flex-start;/);
  assert.match(layout, /\.l-center \{\s*width: 100%;/);
});

test('the error edge is a real border so it survives forced-colors mode', () => {
  assert.match(css('components.css'), /\.c-input\[data-state="error"\] \{[^}]*border-block-end-width: var\(--border-width-thicker\);/);
});

test('responsive grid never forces a column wider than its container', () => {
  assert.match(css('layout.css'), /minmax\(min\(17\.5rem, 100%\), 1fr\)/);
});
