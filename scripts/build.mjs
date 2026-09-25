#!/usr/bin/env node
// Builds src/tokens.css, dist/, AGENTS.md and llms*.txt from tokens/*.json and components/*.json.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from './lib/generate.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = generate(root);
for (const [rel, content] of files) {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}
console.log(`mcss-lite: wrote ${files.size} files`);
