#!/usr/bin/env node
// mcss-lite CLI. Usage: mcss-lite validate <file|dir>... [--json]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContracts } from '../scripts/lib/contracts.mjs';
import { createValidator } from '../scripts/lib/validate.mjs';

const EXTENSIONS = new Set(['.html', '.htm', '.jsx', '.tsx', '.vue', '.svelte', '.astro', '.njk', '.hbs', '.erb', '.php', '.liquid']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage']);
const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const [command, ...rest] = process.argv.slice(2);
const json = rest.includes('--json');
const targets = rest.filter((a) => !a.startsWith('--'));

if (command !== 'validate' || targets.length === 0) {
  console.log(`Usage: mcss-lite validate <file|dir>... [--json]

Checks markup against the MCSS-Lite contracts: unknown c-/l-/u- classes,
modifiers without their block, conflicting modifiers, invalid data-state
values, missing ARIA pairs, deprecated classes, inline raw colors.
Exits with code 1 when any error is found.`);
  const known = !command || command === 'validate' || command === 'help' || command === '--help';
  if (command && !known) console.error(`\nUnknown command "${command}".`);
  process.exit(command === 'help' || command === '--help' ? 0 : 2);
}

const files = [];
// Directories are walked for known markup extensions; files named explicitly are always checked.
const walk = (p, explicit) => {
  let s;
  try { s = statSync(p); } catch { console.error(`mcss-lite: ${p} does not exist`); process.exit(2); }
  if (s.isDirectory()) {
    for (const entry of readdirSync(p).sort()) if (!SKIP_DIRS.has(entry)) walk(join(p, entry), false);
  } else if (explicit || EXTENSIONS.has(extname(p))) files.push(p);
};
for (const t of targets) walk(t, true);
if (files.length === 0) {
  console.error(`mcss-lite: no markup files found in ${targets.join(', ')} (looked for ${[...EXTENSIONS].join(' ')}).`);
  process.exit(2);
}

const validate = createValidator(loadContracts(join(pkgRoot, 'components')));
const results = files.map((f) => ({ file: relative(process.cwd(), f) || f, issues: validate(readFileSync(f, 'utf8')) }));
const errors = results.reduce((n, r) => n + r.issues.filter((i) => i.level === 'error').length, 0);
const warnings = results.reduce((n, r) => n + r.issues.filter((i) => i.level === 'warning').length, 0);

if (json) {
  console.log(JSON.stringify({ files: results.length, errors, warnings, results: results.filter((r) => r.issues.length) }, null, 2));
} else {
  for (const r of results) for (const i of r.issues) console.log(`${r.file}:${i.line}  ${i.level.padEnd(7)}  ${i.message}  [${i.rule}]`);
  console.log(`\n${results.length} file(s) checked: ${errors} error(s), ${warnings} warning(s).`);
}
process.exit(errors ? 1 : 0);
