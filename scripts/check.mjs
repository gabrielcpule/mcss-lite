#!/usr/bin/env node
// Fails when CSS, tokens, contracts, examples or generated files disagree.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runChecks } from './lib/check.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = runChecks(root);
for (const e of errors) console.error(e);
console.log(errors.length ? `\nmcss-lite check: ${errors.length} problem(s)` : 'mcss-lite check: ok');
process.exit(errors.length ? 1 : 0);
