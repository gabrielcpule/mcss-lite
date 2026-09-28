import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { generate } from '../scripts/lib/generate.mjs';
import { loadContracts } from '../scripts/lib/contracts.mjs';
import { createValidator } from '../scripts/lib/validate.mjs';
import { validateSchema } from '../scripts/lib/schema.mjs';
import { namespaceIds } from '../scripts/lib/pages.mjs';
import { loadIcons } from '../scripts/lib/icons.mjs';
import { root } from './helpers.mjs';

const files = generate(root);
const contracts = loadContracts(join(root, 'components'));
const icons = loadIcons(root).map((i) => i.name);
const pages = [...files].filter(([rel]) => rel.startsWith('demo/') && rel.endsWith('.html'));

test('every contract has a part sheet, and the inventory lists every block', () => {
  const inventory = files.get('demo/status.html');
  for (const c of contracts) {
    const sheet = `demo/components/${c.file.replace('.json', '.html')}`;
    assert.ok(files.has(sheet), `missing ${sheet}`);
    assert.ok(inventory.includes(`<code>${c.block}</code>`), `inventory misses ${c.block}`);
  }
});

test('generated pages have no duplicate ids and pass the validator', () => {
  const validate = createValidator(contracts, { icons });
  for (const [rel, html] of pages) {
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    assert.deepEqual(dupes, [], `${rel} repeats ids: ${dupes.join(', ')}`);
    const errors = validate(html).filter((i) => i.level === 'error');
    assert.deepEqual(errors, [], `${rel}: ${errors.map((e) => e.message).join('; ')}`);
  }
});

test('relative links and assets in generated pages resolve', () => {
  for (const [rel, html] of pages) {
    for (const m of html.matchAll(/\s(?:href|src)="([^"#:]+)(?:#[^"]*)?"/g)) {
      const target = normalize(join(dirname(rel), m[1]));
      assert.ok(files.has(target) || existsSync(join(root, target)), `${rel} links to missing ${m[1]}`);
    }
  }
});

test('the schema accepts beta and since, and rejects unknown statuses', () => {
  const schema = JSON.parse(readFileSync(join(root, 'schemas/component.schema.json'), 'utf8'));
  const base = { name: 'X', block: 'c-x', layer: 'component', description: 'x' };
  assert.deepEqual(validateSchema(schema, { ...base, status: 'beta', since: '0.4.0' }), []);
  assert.ok(validateSchema(schema, { ...base, status: 'experimental' }).length > 0);
  assert.ok(validateSchema(schema, { ...base, status: 'stable', since: 'soon' }).length > 0);
  const state = (s) => validateSchema(schema, { ...base, status: 'beta', states: [s] });
  assert.deepEqual(state({ name: 'checked', description: 'On.', native: true, selector: ':checked' }), []);
  assert.ok(state({ name: 'checked', description: 'On.', native: true }).some((e) => /selector/.test(e)), 'a native state needs its selector');
});

test('snippet ids are namespaced together with their references', () => {
  assert.equal(
    namespaceIds('<p id="why">x</p><button aria-describedby="why other">b</button><label for="why">l</label>', 's1'),
    '<p id="why-s1">x</p><button aria-describedby="why-s1 other">b</button><label for="why-s1">l</label>',
  );
});

test('a "don\'t" that names a rule really triggers it', () => {
  const validate = createValidator(contracts, { icons });
  for (const c of contracts) {
    for (const pair of c.guidelines?.doDont ?? []) {
      if (pair.dont.rule) assert.ok(validate(pair.dont.html).some((i) => i.rule === pair.dont.rule), `${c.block}: ${pair.dont.text}`);
    }
  }
});

test('the manifest lists exactly the generated booklet pages', () => {
  const manifest = JSON.parse(files.get('dist/mcss-lite.manifest.json'));
  assert.deepEqual([...manifest.pages].sort(), pages.map(([rel]) => rel).sort());
});

// Regression: a header specimen cut at a blank line left a <form> open and captured the page's controls.
test('generated pages close every element they open', () => {
  const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
  for (const [rel, html] of pages) {
    const stack = [];
    const body = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[\s\S]*?<\/\1>/g, '');
    for (const [, close, tag, self] of body.matchAll(/<(\/)?([a-z][a-z0-9-]*)\b[^>]*?(\/)?>/gi)) {
      const t = tag.toLowerCase();
      if (VOID.has(t) || self) continue;
      if (!close) stack.push(t);
      else assert.equal(stack.pop(), t, `${rel}: </${t}> closes the wrong element`);
    }
    assert.deepEqual(stack, [], `${rel}: left open: ${stack.join(' > ')}`);
  }
});

// Regression: the header specimen and the build example shared name="delivery", so they were one radio group.
test('each snippet on a page has its own radio and checkbox group names', () => {
  for (const [rel, html] of pages) {
    const groups = new Map();
    for (const m of html.matchAll(/<input\b[^>]*\btype="radio"[^>]*\bname="([^"]+)"[^>]*>/g)) {
      groups.set(m[1], (groups.get(m[1]) ?? 0) + (/\bchecked\b/.test(m[0]) ? 1 : 0));
    }
    for (const [name, checked] of groups) assert.ok(checked <= 1, `${rel}: radio group "${name}" has ${checked} checked options`);
  }
});

test('namespaceIds suffixes group names as well as ids', () => {
  assert.equal(namespaceIds('<input type="radio" name="size" id="s">', 'hd'), '<input type="radio" name="size-hd" id="s-hd">');
});
