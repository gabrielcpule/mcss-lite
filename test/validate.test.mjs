import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { loadContracts } from '../scripts/lib/contracts.mjs';
import { createValidator, isTitleCase } from '../scripts/lib/validate.mjs';
import { loadIcons } from '../scripts/lib/icons.mjs';
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
    'warning:element-outside-block', 'warning:a11y', 'warning:card-link', 'warning:nested-interactive',
  ]) assert.ok(rules.includes(expected), `expected ${expected} in ${rules.join(', ')}`);
});

test('disabled buttons may use aria-disabled instead of the disabled attribute', () => {
  assert.deepEqual(validate('<button class="c-button" data-state="disabled" aria-disabled="true">Publish</button>'), []);
  assert.equal(validate('<button class="c-button" data-state="disabled">Publish</button>')[0].rule, 'state-pair');
});

test('a card with its link on the title is clean; a card inside a link is not', () => {
  assert.deepEqual(validate('<article class="c-card c-card--interactive"><h3 class="c-card__title"><a href="/a">A</a></h3></article>'), []);
  assert.equal(validate('<a href="/a"><div class="c-card">A</div></a>')[0].rule, 'card-link');
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

test('the disabled pair check ignores the word inside other attribute values', () => {
  const issues = validate('<button class="c-button" data-state="disabled" title="is disabled now">x</button>');
  assert.ok(issues.some((i) => i.rule === 'state-pair'), JSON.stringify(issues));
});

test('unknown utilities list the real ones', () => {
  assert.match(validate('<span class="u-visually-hidden">x</span>')[0].message, /u-sr-only/);
});

test('CLI: unknown command exits 2; explicitly named files are checked whatever the extension', async () => {
  const { mkdtempSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const cli = join(root, 'bin/mcss-lite.mjs');
  const run = (...args) => {
    try { execFileSync(process.execPath, [cli, ...args], { encoding: 'utf8', stdio: 'pipe' }); return 0; } catch (e) { return e.status; }
  };
  assert.equal(run('valdate', 'x'), 2);
  const dir = mkdtempSync(join(tmpdir(), 'mcss-'));
  const md = join(dir, 'page.md');
  writeFileSync(md, '<button class="c-buton">x</button>');
  assert.equal(run('validate', md), 1);
  assert.equal(run('validate', dir), 2, 'a directory with no markup files is a usage error');
});

test('native states (checked, indeterminate…) are refused as data-state, with a hint', () => {
  const [issue] = validate('<div class="c-checkbox" data-state="checked"><input class="c-checkbox__input" type="checkbox" id="a"><label class="c-checkbox__label" for="a">Agree</label></div>');
  assert.equal(issue.rule, 'invalid-state');
  assert.match(issue.message, /native state of c-checkbox/);
  assert.deepEqual(validate('<div class="c-toggle" data-state="loading" aria-busy="true"><input class="c-toggle__input" type="checkbox" role="switch" id="t" disabled><label class="c-toggle__label" for="t">Beta</label></div>'), []);
});

test('a group error on a fieldset pairs with aria-describedby, not aria-invalid', () => {
  const group = (extra) => `<fieldset class="c-form-field" data-state="error"${extra}><legend class="c-form-field__label">Plan</legend><p class="c-form-field__error" id="e">Choose a plan.</p></fieldset>`;
  assert.deepEqual(validate(group(' aria-describedby="e"')), []);
  const [issue] = validate(group(''));
  assert.equal(issue.rule, 'state-pair');
  assert.match(issue.message, /aria-describedby/);
});

const withIcons = createValidator(loadContracts(join(root, 'components')), { icons: loadIcons(root).map((i) => i.name) });

test('0.4.0 rules: bad markup trips each one, good markup trips none', () => {
  const rules = withIcons(read('bad.html')).map((i) => `${i.level}:${i.rule}`);
  for (const expected of [
    'warning:card-nesting', 'warning:label-missing', 'warning:primary-count', 'warning:content-case', 'warning:content-vague',
    'warning:toggle-in-form', 'warning:clickable-div', 'error:unknown-icon', 'warning:alert-severity', 'warning:content-missing',
  ]) assert.ok(rules.includes(expected), `expected ${expected} in ${rules.join(', ')}`);
  const a11y = withIcons(read('bad.html')).filter((i) => i.rule === 'a11y').map((i) => i.message).join('\n');
  assert.match(a11y, /c-icon needs aria-hidden/);
  assert.match(a11y, /role="switch"/);
  assert.match(a11y, /Radio buttons need a group/);
  assert.deepEqual(withIcons(read('good.html')), []);
});

test('Title Case: judged per sentence, ignoring small words, acronyms, months and proper nouns in mixed labels', () => {
  for (const t of ['Create Account', 'Terms of Service', 'Error: Payment Failed']) assert.ok(isTitleCase(t), t);
  for (const t of ['Create account', 'Sign in with GitHub', 'Download PDF', 'Due on 3 October', 'Error: Payment failed', 'Pajamas docs', 'Save']) assert.ok(!isTitleCase(t), t);
});

test('text capture: template output is never judged, hidden prefixes count, svg text does not', () => {
  assert.deepEqual(withIcons('<button type="button" class="c-button"><%= label %></button>'), []);
  assert.deepEqual(withIcons('<a href="/x">{label}</a>'), []);
  assert.deepEqual(withIcons('<button type="button" class="c-button"><span class="u-sr-only">Close the panel</span></button>'), []);
  assert.equal(withIcons('<button type="button" class="c-button"><svg class="c-icon" aria-hidden="true"><title>Close</title><use href="#mcss-icon-close"></use></svg></button>')[0].rule, 'content-missing');
});

test('issues found when an element closes still point at its opening line', () => {
  const [issue] = withIcons('<div>\n\n  <button type="button" class="c-button">\n    Click here\n  </button>\n</div>');
  assert.equal(issue.rule, 'content-vague');
  assert.equal(issue.line, 3);
});

test('regions: one primary per form, dialog, card or figure; the page counts as one region', () => {
  const two = '<button type="button" class="c-button c-button--primary">Save draft</button><button type="button" class="c-button c-button--primary">Publish post</button>';
  assert.equal(withIcons(two).filter((i) => i.rule === 'primary-count').length, 1);
  assert.deepEqual(withIcons(`<form>${two.split('</button>')[0]}</button></form><form>${two.split('</button>')[1]}</button></form>`), []);
});

test('clickable-div only fires on click triggers', () => {
  assert.equal(withIcons('<div onclick="go()">Open</div>')[0].rule, 'clickable-div');
  assert.equal(withIcons('<span @click="open = true">Open</span>')[0].rule, 'clickable-div');
  assert.equal(withIcons('<div hx-post="/x" hx-trigger="click">Save</div>')[0].rule, 'clickable-div');
  assert.deepEqual(withIcons('<div hx-get="/x" hx-trigger="revealed">More</div>'), []);
});

test('toggle-in-form stays quiet for autosave forms and forms without a submit button', () => {
  const toggle = '<div class="c-toggle"><input class="c-toggle__input" type="checkbox" role="switch" id="a"><label class="c-toggle__label" for="a">Dark mode</label></div>';
  assert.equal(withIcons(`<form>${toggle}<button class="c-button">Save changes</button></form>`)[0].rule, 'toggle-in-form');
  assert.deepEqual(withIcons(`<form>${toggle}</form>`), []);
  assert.deepEqual(withIcons(`<form hx-post="/s" hx-trigger="change">${toggle}<button class="c-button">Save changes</button></form>`), []);
});

test('unknown icons are errors with a suggestion; icons outside the mcss-icon- prefix are not checked', () => {
  const [issue] = withIcons('<svg class="c-icon" aria-hidden="true"><use href="#mcss-icon-chevron-rigth"></use></svg>');
  assert.equal(issue.rule, 'unknown-icon');
  assert.match(issue.message, /Did you mean "chevron-right"/);
  assert.deepEqual(withIcons('<svg class="c-icon" aria-hidden="true"><use href="#app-logo"></use></svg>'), []);
});

test('opt-outs silence warnings only: --ignore and the inline comment', () => {
  const vague = '<button type="button" class="c-button">OK</button>';
  assert.deepEqual(createValidator(loadContracts(join(root, 'components')), { ignore: ['content-vague'] })(vague), []);
  assert.deepEqual(withIcons(`<!-- mcss-lite-ignore content-vague: a legacy dialog -->\n${vague}`), []);
  assert.equal(withIcons(`<!-- mcss-lite-ignore content-vague -->\n<p>Other</p>\n${vague}`)[0].rule, 'content-vague', 'applies to the next element only');
  const error = withIcons('<!-- mcss-lite-ignore unknown-class -->\n<p class="c-paragraph">x</p>');
  assert.equal(error[0].rule, 'unknown-class');
  assert.match(error[0].message, /only silences warnings/);
  assert.equal(createValidator(loadContracts(join(root, 'components')), { ignore: ['unknown-class'] })('<p class="c-paragraph">x</p>')[0].level, 'error');
});

test('CLI: --ignore silences a warning rule and refuses an error rule', () => {
  const run = (...args) => {
    try { return { code: 0, out: execFileSync('node', [join(root, 'bin/mcss-lite.mjs'), 'validate', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; }
    catch (e) { return { code: e.status, out: e.stdout + e.stderr }; }
  };
  const bad = fixture('html', 'bad.html');
  assert.doesNotMatch(run(bad, '--ignore', 'content-vague,card-nesting').out, /\[content-vague\]|\[card-nesting\]/);
  const refused = run(bad, '--ignore=unknown-class');
  assert.match(refused.out, /refused: unknown-class is an error rule/);
  assert.equal(refused.code, 1);
  assert.equal(run(bad, '--ignore', 'no-such-rule').code, 2);
});
