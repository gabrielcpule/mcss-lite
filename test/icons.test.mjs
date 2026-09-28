import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadIcons, checkIcons, buildSprite, ICON_PREFIX } from '../scripts/lib/icons.mjs';
import { root } from './helpers.mjs';

const icons = loadIcons(root);
const sprite = readFileSync(join(root, 'dist/mcss-lite.icons.svg'), 'utf8');

test('the sprite holds all 20 icons, each a clean 24-unit symbol', () => {
  assert.equal(icons.length, 20);
  assert.deepEqual(checkIcons(icons), []);
  const ids = [...sprite.matchAll(/<symbol id="([^"]+)" viewBox="0 0 24 24">/g)].map((m) => m[1]);
  assert.deepEqual(ids, icons.map((i) => `${ICON_PREFIX}${i.name}`));
});

test('every shape keeps a 2px stroke at any size, and severity icons differ in shape', () => {
  const shapes = [...sprite.matchAll(/<(path|circle|rect|line|polyline|polygon)\b[^>]*>/g)];
  assert.ok(shapes.length > 20);
  for (const [s] of shapes) assert.match(s, /vector-effect="non-scaling-stroke"/);
  assert.doesNotMatch(sprite, /\s(?:fill|stroke|style)="(?!position)/, 'stroke and fill come from .c-icon');
  const outline = (name) => icons.find((i) => i.name === name).body.match(/^<(\w+)/)[1];
  assert.deepEqual(['info', 'success', 'warning', 'error'].map(outline), ['circle', 'rect', 'path', 'path']);
});

test('checkIcons refuses fills, other grids and foreign elements', () => {
  const bad = [
    { name: 'a', file: 'icons/a.svg', svg: '<svg viewBox="0 0 16 16"><path d="M0 0"/></svg>', body: '<path d="M0 0"/>' },
    { name: 'b', file: 'icons/b.svg', svg: '<svg viewBox="0 0 24 24"><path fill="red" d="M0 0"/></svg>', body: '<path fill="red" d="M0 0"/>' },
    { name: 'c', file: 'icons/c.svg', svg: '<svg viewBox="0 0 24 24"><text>x</text></svg>', body: '<text>x</text>' },
  ];
  const errors = checkIcons(bad).join('\n');
  assert.match(errors, /24-unit grid/);
  assert.match(errors, /attribute fill is not allowed/);
  assert.match(errors, /<text> is not allowed/);
});

test('the sprite is deterministic and says how to use it', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.equal(buildSprite(icons, pkg), sprite);
  assert.match(sprite, /Inline this file once in <body>/);
});
