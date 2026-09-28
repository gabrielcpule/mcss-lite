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
  /^\s*Claude-Session:.*$/i,
  /^\s*Co-Authored-By:\s*Claude\b.*$/i,
];

const isAttribution = (line) => ATTRIBUTION.some((re) => re.test(line));

export function hasAttribution(text) {
  return text.split('\n').some(isAttribution);
}

export function stripAttribution(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter((l) => !isAttribution(l));
  // Drop what the removed footer leaves behind: trailing blank lines and a dangling --- rule.
  while (lines.length && /^\s*(---+)?\s*$/.test(lines.at(-1))) lines.pop();
  return lines.join('\n').replace(/\n{3,}/g, '\n\n') + (lines.length ? '\n' : '');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const check = args[0] === '--check';
  const file = check ? args[1] : args[0];
  if (!file) {
    console.error('Usage: strip-attribution.mjs [--check] <file>');
    process.exit(2);
  }
  const text = readFileSync(file, 'utf8');
  if (check) process.exit(hasAttribution(text) ? 1 : 0);
  process.stdout.write(stripAttribution(text));
}
