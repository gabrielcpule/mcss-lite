// Icons: one 24-unit SVG per file in icons/, drawn as 2px strokes. Built into one sprite of <symbol>s.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const ICON_PREFIX = 'mcss-icon-';
const ALLOWED = new Set(['path', 'circle', 'rect', 'line', 'polyline', 'polygon']);
const SHAPE_ATTRS = new Set(['d', 'cx', 'cy', 'r', 'x', 'y', 'width', 'height', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2', 'points']);

export function loadIcons(root) {
  const dir = join(root, 'icons');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.svg'))
    .sort()
    .map((f) => {
      const svg = readFileSync(join(dir, f), 'utf8');
      const body = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();
      return { name: f.replace(/\.svg$/, ''), file: `icons/${f}`, svg, body };
    });
}

// Problems that would break the sprite: a different grid, fills, inline styles, or elements we don't draw with.
export function checkIcons(icons) {
  const errors = [];
  for (const i of icons) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(i.name)) errors.push(`${i.file}: file names are kebab-case`);
    if (!/viewBox="0 0 24 24"/.test(i.svg)) errors.push(`${i.file}: draw on the 24-unit grid (viewBox="0 0 24 24")`);
    for (const m of i.body.matchAll(/<([a-zA-Z]+)([^>]*)\/?>/g)) {
      if (!ALLOWED.has(m[1])) errors.push(`${i.file}: <${m[1]}> is not allowed; use ${[...ALLOWED].join(', ')}`);
      for (const a of m[2].matchAll(/([a-zA-Z-]+)=/g)) {
        if (!SHAPE_ATTRS.has(a[1])) errors.push(`${i.file}: attribute ${a[1]} is not allowed; stroke and fill come from .c-icon`);
      }
    }
  }
  return errors;
}

// Every shape keeps a 2px stroke at any size (vector-effect), so small and large icons match the keyline.
export function buildSprite(icons, pkg) {
  const symbols = icons.map((i) => {
    const body = i.body.replace(/<(path|circle|rect|line|polyline|polygon)\b/g, '<$1 vector-effect="non-scaling-stroke"');
    return `  <symbol id="${ICON_PREFIX}${i.name}" viewBox="0 0 24 24">${body}</symbol>`;
  });
  return [
    `<!-- MCSS-Lite ${pkg.version} icons. Inline this file once in <body>, then: <svg class="c-icon" aria-hidden="true"><use href="#${ICON_PREFIX}check"/></svg> -->`,
    '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" width="0" height="0" style="position: absolute">',
    ...symbols,
    '</svg>',
    '',
  ].join('\n');
}

// The sprite as it sits at the top of <body> on the booklet's own pages.
export const inlineSprite = (icons, pkg) => buildSprite(icons, pkg).split('\n').slice(1).filter(Boolean).map((l) => `  ${l}`).join('\n');
