// Repo lint: keeps src/*.css, tokens and contracts consistent. Returns a list of error strings.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadTokens, MODES, tokensForMode } from './tokens.mjs';
import { loadContracts, classInventory, localCustomProperties } from './contracts.mjs';
import { validateSchema } from './schema.mjs';
import { createValidator } from './validate.mjs';
import { generate } from './generate.mjs';

const HAND_WRITTEN_CSS = ['global.css', 'layout.css', 'components.css', 'utilities.css'];
const RAW_COLOR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/i;

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
const lineOf = (text, index) => text.slice(0, index).split('\n').length;

export function runChecks(root, { css: cssOverrides = {}, skipFreshness = false } = {}) {
  const errors = [];
  const { sets } = loadTokens(join(root, 'tokens'));
  const contracts = loadContracts(join(root, 'components'));
  const schema = JSON.parse(readFileSync(join(root, 'schemas/component.schema.json'), 'utf8'));

  // 1. Contracts match the schema.
  for (const c of contracts) {
    const { file, ...data } = c;
    for (const e of validateSchema(schema, data)) errors.push(`components/${file}: ${e}`);
    if (c.status === 'deprecated' && !c.replacement) errors.push(`components/${file}: deprecated contracts need "replacement"`);
  }

  // 2. Token universe.
  const allTokens = [...sets.primitive, ...sets.semantic, ...sets.light, ...sets.component];
  const tokenNames = new Set(allTokens.map((t) => t.name));
  const localProps = localCustomProperties(contracts);
  const primitiveColors = new Set(sets.primitive.filter((t) => t.type === 'color').map((t) => t.name));
  const deprecatedTokens = new Set(allTokens.filter((t) => t.deprecated).map((t) => t.name));
  for (const m of MODES) tokensForMode(sets, m); // throws on duplicate paths

  for (const c of contracts) {
    for (const t of c.tokens ?? []) {
      if (!tokenNames.has(t) && !localProps.has(t)) errors.push(`components/${c.file}: token ${t} does not exist`);
    }
    for (const ex of c.examples ?? []) {
      if (!existsSync(join(root, 'components', ex))) errors.push(`components/${c.file}: example ${ex} does not exist`);
    }
  }

  // 3. CSS <-> contracts, var() usage, raw values.
  const inventory = classInventory(contracts);
  const cssClasses = new Set();
  const cssStates = new Set();
  for (const file of HAND_WRITTEN_CSS) {
    const raw = cssOverrides[file] ?? readFileSync(join(root, 'src', file), 'utf8');
    const css = stripComments(raw);
    for (const m of css.matchAll(/\.([clu]-[a-z0-9_-]+)/g)) {
      cssClasses.add(m[1]);
      if (!inventory.has(m[1])) errors.push(`src/${file}:${lineOf(css, m.index)}: class .${m[1]} is not defined in any contract (components/*.json)`);
    }
    for (const m of css.matchAll(/\.([cl]-[a-z0-9-]+)\[data-state="([a-z-]+)"\]/g)) {
      cssStates.add(`${m[1]}:${m[2]}`);
      const contract = contracts.find((c) => c.block === m[1]);
      if (!contract?.states?.some((s) => s.name === m[2])) {
        errors.push(`src/${file}:${lineOf(css, m.index)}: state ${m[1]}[data-state="${m[2]}"] is not in the ${m[1]} contract`);
      }
    }
    for (const m of css.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) {
      const name = m[1];
      const where = `src/${file}:${lineOf(css, m.index)}`;
      if (!tokenNames.has(name) && !localProps.has(name)) errors.push(`${where}: var(${name}) is not a token`);
      if (primitiveColors.has(name)) errors.push(`${where}: var(${name}) is a primitive color; use a semantic or component token so dark mode works`);
      if (deprecatedTokens.has(name)) errors.push(`${where}: var(${name}) is deprecated`);
    }
    // Raw colors are only allowed in the generated tokens.css. @media queries may use px.
    css.split('\n').forEach((line, i) => {
      if (RAW_COLOR.test(line)) errors.push(`src/${file}:${i + 1}: raw color value; use a token`);
    });
  }
  for (const [name, info] of inventory) {
    if (!cssClasses.has(name)) errors.push(`components/${info.contract.file}: ${name} has no CSS in src/`);
  }
  for (const c of contracts) {
    for (const s of c.states ?? []) {
      if (!cssStates.has(`${c.block}:${s.name}`)) errors.push(`components/${c.file}: state ${s.name} has no ${c.block}[data-state="${s.name}"] rule`);
    }
  }

  // 4. Canonical examples validate cleanly.
  const validate = createValidator(contracts);
  for (const f of readdirSync(join(root, 'components')).filter((f) => f.endsWith('.html'))) {
    for (const i of validate(readFileSync(join(root, 'components', f), 'utf8'))) {
      errors.push(`components/${f}:${i.line}: ${i.level}: ${i.message}`);
    }
  }

  // 5. Generated files are up to date.
  if (!skipFreshness) {
    for (const [rel, content] of generate(root)) {
      const path = join(root, rel);
      if (!existsSync(path) || readFileSync(path, 'utf8') !== content) errors.push(`${rel} is stale; run npm run build`);
    }
  }
  return errors;
}
