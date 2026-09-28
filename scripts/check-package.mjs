#!/usr/bin/env node
// Fails when the npm package would ship without the files consumers rely on.
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

const REQUIRED = ['index.css', 'dist/mcss-lite.min.css', 'dist/mcss-lite.manifest.json', 'dist/mcss-lite.icons.svg', 'bin/mcss-lite.mjs', 'AGENTS.md', 'llms.txt'];

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const [pack] = JSON.parse(execFileSync(npm, ['pack', '--dry-run', '--json', '--ignore-scripts'], { encoding: 'utf8' }));
const files = new Set(pack.files.map((f) => f.path));
const missing = REQUIRED.filter((f) => !files.has(f));

if (missing.length) {
  console.error(`${process.env.GITHUB_ACTIONS ? '::error::' : ''}npm package is missing ${missing.join(', ')}`);
  process.exit(1);
}
const line = `${pack.name}@${pack.version}: ${pack.entryCount} files, ${(pack.size / 1024).toFixed(1)} kB packed`;
console.log(line);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Package\n\n${line}\n`);
