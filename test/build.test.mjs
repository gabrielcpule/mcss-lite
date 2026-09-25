import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../scripts/lib/generate.mjs';
import { root } from './helpers.mjs';

const files = generate(root);

test('build is deterministic', () => {
  assert.deepEqual([...generate(root)], [...files]);
});

test('tokens.css has light default, dark and auto themes', () => {
  const css = files.get('src/tokens.css');
  assert.match(css, /:root,\n\[data-theme="light"\],\n\[data-theme="auto"\] \{\n  color-scheme: light;/);
  assert.match(css, /\[data-theme="dark"\] \{\n  color-scheme: dark;/);
  assert.match(css, /@media \(prefers-color-scheme: dark\) \{\n  \[data-theme="auto"\] \{/);
});

test('component tokens are re-declared in every theme block (light, dark, auto-dark, print)', () => {
  const css = files.get('src/tokens.css');
  assert.equal(css.match(/--button-primary-background:/g).length, 4);
  assert.match(css, /@media print \{\n  :root,\n  \[data-theme\] \{\n    color-scheme: light;/);
});

test('dist/mcss-lite.css bundles every layer in order without @import', () => {
  const bundle = files.get('dist/mcss-lite.css');
  assert.doesNotMatch(bundle, /@import/);
  const order = ['@layer global, layout, component, utility;', '@layer global {', '@layer layout {', '@layer component {', '@layer utility {'].map((s) => bundle.indexOf(s));
  assert.ok(order.every((i, n) => i >= 0 && (n === 0 || i > order[n - 1])), order.join(','));
});

test('Figma files are importable: no composites, no $root, px dimensions, aliases kept', () => {
  const primitive = files.get('dist/figma/primitive.tokens.json');
  assert.doesNotMatch(primitive, /"shadow"|"cubicBezier"|"fontFamily"|\$root/);
  const p = JSON.parse(primitive);
  assert.deepEqual(p.space['4'].$value, { value: 16, unit: 'px' });
  assert.equal(p.color.primary.default.$value.hex, '#005a9c');
  const light = JSON.parse(files.get('dist/figma/semantic.light.tokens.json'));
  const dark = JSON.parse(files.get('dist/figma/semantic.dark.tokens.json'));
  assert.equal(light.color.action.primary.default.$value, '{color.primary.default}');
  assert.equal(dark.color.action.primary.default.$value, '{color.blue.600}');
  const component = JSON.parse(files.get('dist/figma/component.tokens.json'));
  assert.equal(component.card.shadow, undefined, 'aliases to code-only tokens are skipped');
  assert.equal(component.button.primary.background.$value, '{color.action.primary.default}');
});

test('manifest lists every block and token', () => {
  const m = JSON.parse(files.get('dist/mcss-lite.manifest.json'));
  assert.ok(m.blocks.some((b) => b.block === 'c-button' && b.examples[0].html.includes('c-button--primary')));
  assert.ok(m.tokens.some((t) => t.name === '--color-text-default' && t.value.dark === '#e6edf4'));
  assert.equal(m.rules.length, 5);
});

test('AGENTS.md carries the rules and the block table', () => {
  const agents = files.get('AGENTS.md');
  assert.match(agents, /Never invent class or token names/);
  assert.match(agents, /\| `c-button` \| component \|/);
  assert.match(agents, /npx mcss-lite validate/);
});
