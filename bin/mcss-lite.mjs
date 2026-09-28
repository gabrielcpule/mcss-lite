#!/usr/bin/env node
// mcss-lite CLI. Usage: mcss-lite validate <file|dir>... [--json] [--ignore rule,rule]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContracts } from '../scripts/lib/contracts.mjs';
import { createValidator, RULES } from '../scripts/lib/validate.mjs';
import { loadIcons } from '../scripts/lib/icons.mjs';

const EXTENSIONS = new Set(['.html', '.htm', '.jsx', '.tsx', '.vue', '.svelte', '.astro', '.njk', '.hbs', '.erb', '.php', '.liquid']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage']);
const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const [command, ...rest] = process.argv.slice(2);
const json = rest.includes('--json');
// --ignore a,b or --ignore=a,b: silence warning rules for the whole run.
const ignoreArgs = [];
const targets = [];
for (let i = 0; i < rest.length; i++) {
  const a = rest[i];
  if (a === '--ignore') ignoreArgs.push(rest[++i] ?? '');
  else if (a.startsWith('--ignore=')) ignoreArgs.push(a.slice(9));
  else if (!a.startsWith('--')) targets.push(a);
}
const ignore = ignoreArgs.flatMap((v) => v.split(',')).map((r) => r.trim()).filter(Boolean);

if (command !== 'validate' || targets.length === 0) {
  console.log(`Usage: mcss-lite validate <file|dir>... [--json] [--ignore rule,rule]

Checks markup against the MCSS-Lite contracts. Exits with code 1 when any
error is found. Warnings can be silenced with --ignore, or for one element
with <!-- mcss-lite-ignore rule --> right before it; errors can't.

Rules:
${RULES.map((r) => `  ${r.id.padEnd(22)} ${r.level.padEnd(8)} ${r.description}`).join('\n')}`);
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

const levels = new Map(RULES.map((r) => [r.id, r.level]));
for (const r of ignore) {
  if (!levels.has(r)) { console.error(`mcss-lite: --ignore ${r}: there is no rule "${r}". Run mcss-lite help for the list.`); process.exit(2); }
  if (levels.get(r) === 'error') console.error(`mcss-lite: --ignore ${r} refused: ${r} is an error rule, and errors must be fixed. Only warnings can be ignored.`);
}
const icons = loadIcons(pkgRoot).map((i) => i.name);
const validate = createValidator(loadContracts(join(pkgRoot, 'components')), { icons, ignore });
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
