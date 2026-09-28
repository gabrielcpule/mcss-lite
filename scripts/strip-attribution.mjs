#!/usr/bin/env node
// Removes Claude Code attribution from text: the "Generated with Claude Code"
// line, claude.ai session links, and Co-Authored-By: Claude / Claude-Session
// trailers. Usage: strip-attribution.mjs <file>   (prints the cleaned text)
//                  strip-attribution.mjs --check <file>   (exit 1 if any found)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const ATTRIBUTION = [
  /^\s*🤖\s*Generated with \[Claude Code\]\([^)]*\).*$/i,
  /^\s*_?Generated (?:with|by) \[Claude Code\]\([^)]*\)_?\s*$/i,
  /^\s*<?https:\/\/claude\.ai\/code\/session_[A-Za-z0-9]+>?\s*$/,
  /^\s*Claude-Session:\s*https:\/\/claude\.ai\/code\/\S*\s*$/i,
  // Only Claude's own identity; a human co-author named Claude keeps their credit.
  /^\s*Co-Authored-By:\s*Claude\b[^<]*<noreply@anthropic\.com>\s*$/i,
];

const isAttribution = (line) => ATTRIBUTION.some((re) => re.test(line));
const isBlank = (line) => /^\s*$/.test(line);
const isRule = (line) => /^\s*---+\s*$/.test(line);

export function hasAttribution(text) {
  return text.split('\n').some(isAttribution);
}

export function stripAttribution(text) {
  if (!hasAttribution(text)) return text;
  const out = [];
  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    if (isAttribution(line)) {
      // A removed footer takes the blank lines and the --- rule directly above it.
      while (out.length && isBlank(out.at(-1))) out.pop();
      if (out.length && isRule(out.at(-1))) {
        out.pop();
        while (out.length && isBlank(out.at(-1))) out.pop();
      }
      continue;
    }
    // Don't let a removed line leave two blank lines in a row.
    if (isBlank(line) && out.length && isBlank(out.at(-1))) continue;
    out.push(line);
  }
  while (out.length && isBlank(out.at(-1))) out.pop();
  return out.length ? `${out.join('\n')}\n` : '';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const check = args[0] === '--check';
  const files = check ? args.slice(1) : args;
  if (files.length !== 1 || files[0].startsWith('-')) {
    console.error('Usage: strip-attribution.mjs [--check] <file>');
    process.exit(2);
  }
  const text = readFileSync(files[0], 'utf8');
  if (check) process.exit(hasAttribution(text) ? 1 : 0);
  process.stdout.write(stripAttribution(text));
}
