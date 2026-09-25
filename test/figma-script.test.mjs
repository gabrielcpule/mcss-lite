import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './helpers.mjs';

const source = readFileSync(join(root, 'dist/figma/push-variables.js'), 'utf8');

// A minimal in-memory stand-in for the Figma Plugin API surface the script uses.
function fakeFigma({ maxModes = 4 } = {}) {
  let id = 0;
  const collections = [];
  const variables = [];
  const styles = [];
  const api = {
    variables: {
      getLocalVariableCollectionsAsync: async () => [...collections],
      getLocalVariablesAsync: async () => [...variables],
      createVariableCollection(name) {
        const c = { id: `c${++id}`, name, modes: [{ modeId: `m${++id}`, name: 'Mode 1' }] };
        c.renameMode = (modeId, n) => { c.modes.find((m) => m.modeId === modeId).name = n; };
        c.addMode = (n) => {
          if (c.modes.length >= maxModes) throw new Error('Limited to 1 mode on this plan');
          c.modes.push({ modeId: `m${++id}`, name: n });
        };
        collections.push(c);
        return c;
      },
      createVariable(name, col, type) {
        const v = { id: `v${++id}`, name, resolvedType: type, variableCollectionId: col.id, valuesByMode: {}, codeSyntax: {} };
        v.setValueForMode = (m, val) => { v.valuesByMode[m] = val; };
        v.setVariableCodeSyntax = (p, s) => { v.codeSyntax[p] = s; };
        v.remove = () => variables.splice(variables.indexOf(v), 1);
        variables.push(v);
        return v;
      },
      createVariableAlias: (v) => ({ type: 'VARIABLE_ALIAS', id: v.id }),
    },
    getLocalEffectStylesAsync: async () => [...styles],
    createEffectStyle() { const s = { id: `s${++id}` }; styles.push(s); return s; },
  };
  return { api, collections, variables, styles };
}

const run = (figma) => new Function('figma', `return (async () => {\n${source}\n})();`)(figma);

test('push script contains no account, team or file identifiers', () => {
  assert.doesNotMatch(source, /team::|organization::|figma\.com\/(design|file)\/|fileKey/i);
});

test('push script creates three collections with aliases, scopes and code syntax', async () => {
  const f = fakeFigma();
  const report = await run(f.api);
  assert.deepEqual(report.warnings, []);
  assert.deepEqual(f.collections.map((c) => [c.name, c.modes.map((m) => m.name)]), [
    ['MCSS-Lite / Primitives', ['Value']],
    ['MCSS-Lite / Semantic', ['Light', 'Dark']],
    ['MCSS-Lite / Component', ['Value']],
  ]);
  const text = f.variables.find((v) => v.name === 'color/text/default');
  assert.equal(text.codeSyntax.WEB, 'var(--color-text-default)');
  assert.deepEqual(text.scopes, ['TEXT_FILL']);
  assert.ok(Object.values(text.valuesByMode).every((v) => v.type === 'VARIABLE_ALIAS'));
  assert.ok(report.effectStyles > 0 && report.aliases > 0);
});

test('push script is idempotent: a second run updates, never duplicates', async () => {
  const f = fakeFigma();
  const first = await run(f.api);
  const count = f.variables.length;
  const second = await run(f.api);
  assert.equal(second.created, 0);
  assert.equal(second.updated, first.created);
  assert.equal(f.variables.length, count);
  assert.equal(f.collections.length, 3);
});

test('push script degrades on single-mode plans with a warning instead of failing', async () => {
  const f = fakeFigma({ maxModes: 1 });
  const report = await run(f.api);
  assert.ok(report.warnings.some((w) => /could not add mode "Dark"/.test(w)));
  assert.equal(f.collections.find((c) => c.name === 'MCSS-Lite / Semantic').modes.length, 1);
});
