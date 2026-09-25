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
  process.exit(command === 'validate' || !command ? 2 : 0);
}

const files = [];
const walk = (p) => {
  const s = statSync(p);
  if (s.isDirectory()) {
    for (const entry of readdirSync(p).sort()) if (!SKIP_DIRS.has(entry)) walk(join(p, entry));
  } else if (EXTENSIONS.has(extname(p))) files.push(p);
};
for (const t of targets) walk(t);

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
