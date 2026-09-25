import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { loadContracts } from '../scripts/lib/contracts.mjs';
import { createValidator } from '../scripts/lib/validate.mjs';
import { root, fixture } from './helpers.mjs';

const validate = createValidator(loadContracts(join(root, 'components')));
const read = (f) => readFileSync(fixture('html', f), 'utf8');

test('valid markup (including JSX className) has no issues', () => {
  assert.deepEqual(validate(read('good.html')), []);
});

test('bad markup reports every rule', () => {
  const rules = validate(read('bad.html')).map((i) => `${i.level}:${i.rule}`);
  for (const expected of [
    'error:exclusive-modifiers', 'warning:raw-color', 'warning:golden-rule', 'error:unknown-class',
    'error:invalid-state', 'error:modifier-without-block', 'warning:state-pair', 'warning:deprecated',
    'warning:element-outside-block', 'warning:a11y',
  ]) assert.ok(rules.includes(expected), `expected ${expected} in ${rules.join(', ')}`);
});

test('unknown modifiers list the valid ones', () => {
  const issue = validate('<button class="c-button c-button--warning">x</button>')[0];
  assert.match(issue.message, /Valid modifiers of c-button: --primary, --secondary, --ghost, --danger, --sm, --lg/);
});

test('typos get a suggestion', () => {
  assert.match(validate('<h3 class="c-card__titel">x</h3>')[0].message, /Did you mean "c-card__title"/);
});

test('non-MCSS classes and data-state on other elements are ignored', () => {
  assert.deepEqual(validate('<div class="card btn-primary" data-state="open"><span class="hero">x</span></div>'), []);
});

test('CLI exits 1 on errors and prints JSON', () => {
  let out;
  try {
    execFileSync(process.execPath, [join(root, 'bin/mcss-lite.mjs'), 'validate', fixture('html', 'bad.html'), '--json'], { encoding: 'utf8' });
    assert.fail('expected exit code 1');
  } catch (e) {
    assert.equal(e.status, 1);
    out = JSON.parse(e.stdout);
  }
  assert.ok(out.errors > 0);
  const ok = execFileSync(process.execPath, [join(root, 'bin/mcss-lite.mjs'), 'validate', fixture('html', 'good.html')], { encoding: 'utf8' });
  assert.match(ok, /0 error\(s\), 0 warning\(s\)/);
});
