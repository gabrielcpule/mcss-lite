// Token loading, alias resolution and DTCG -> CSS conversion. Node built-ins only.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const TOKEN_FILES = {
  primitive: 'primitive.tokens.json',
  semantic: 'semantic.tokens.json',
  light: 'semantic.light.tokens.json',
  dark: 'semantic.dark.tokens.json',
  component: 'component.tokens.json',
};

export const MODES = ['light', 'dark'];

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

// Walk a DTCG tree and return a flat list of tokens in document order.
// `$root` is a DTCG 2025.10 reserved name: it is part of the path but not of the CSS name.
export function flatten(tree, tier, mode = null) {
  const out = [];
  const walk = (node, path, inheritedType) => {
    const type = node.$type ?? inheritedType;
    if ('$value' in node) {
      out.push({
        path: path.join('.'),
        name: '--' + path.filter((p) => p !== '$root').join('-'),
        tier,
        mode,
        type,
        value: node.$value,
        description: node.$description,
        deprecated: node.$deprecated ?? false,
        extensions: node.$extensions ?? {},
      });
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$') && key !== '$root') continue;
      if (child && typeof child === 'object') walk(child, [...path, key], type);
    }
  };
  walk(tree, [], undefined);
  return out;
}

export function loadTokens(dir) {
  const trees = Object.fromEntries(
    Object.entries(TOKEN_FILES).map(([k, f]) => [k, readJson(join(dir, f))]),
  );
  const sets = {
    primitive: flatten(trees.primitive, 'primitive'),
    semantic: flatten(trees.semantic, 'semantic'),
    light: flatten(trees.light, 'semantic', 'light'),
    dark: flatten(trees.dark, 'semantic', 'dark'),
    component: flatten(trees.component, 'component'),
  };
  assertModesMatch(sets.light, sets.dark);
  return { trees, sets };
}

function assertModesMatch(light, dark) {
  const a = light.map((t) => t.path).join('\n');
  const b = dark.map((t) => t.path).join('\n');
  if (a !== b) throw new Error('semantic.light and semantic.dark must define the same token paths in the same order');
}

export const isAlias = (v) => typeof v === 'string' && /^\{[^}]+\}$/.test(v);
export const aliasPath = (v) => v.slice(1, -1);

// All tokens visible in one mode, keyed by DTCG path.
export function tokensForMode(sets, mode) {
  const list = [...sets.primitive, ...sets.semantic, ...sets[mode], ...sets.component];
  const byPath = new Map();
  for (const t of list) {
    if (byPath.has(t.path)) throw new Error(`Duplicate token path: ${t.path}`);
    byPath.set(t.path, t);
  }
  return byPath;
}

// Follow an alias chain to the literal token. Returns { token, value, type }.
export function resolve(token, byPath, seen = new Set()) {
  if (!isAlias(token.value)) return { token, value: token.value, type: token.type };
  const target = byPath.get(aliasPath(token.value));
  if (!target) throw new Error(`${token.path}: alias ${token.value} does not exist`);
  if (seen.has(target.path)) throw new Error(`Alias cycle at ${target.path}`);
  seen.add(target.path);
  const r = resolve(target, byPath, seen);
  return { ...r, type: token.type ?? r.type };
}

const CUBIC_KEYWORDS = {
  '0,0,1,1': 'linear',
  '0.42,0,1,1': 'ease-in',
  '0,0,0.58,1': 'ease-out',
  '0.42,0,0.58,1': 'ease-in-out',
};

const round = (n, d = 4) => +n.toFixed(d);

export function colorToCss(v) {
  if (v.alpha !== undefined && v.alpha < 1) {
    const [r, g, b] = v.components.map((c) => Math.round(c * 255));
    return `rgb(${r} ${g} ${b} / ${round(v.alpha, 3)})`;
  }
  return v.hex;
}

export const dimensionToCss = (d) => (d.value === 0 ? '0' : `${round(d.value)}${d.unit}`);

// Convert a literal DTCG value to CSS.
export function valueToCss(type, v) {
  switch (type) {
    case 'color': return colorToCss(v);
    case 'dimension': return dimensionToCss(v);
    case 'duration': return `${v.value}${v.unit}`;
    case 'number':
    case 'fontWeight': return String(v);
    case 'cubicBezier': return CUBIC_KEYWORDS[v.join(',')] ?? `cubic-bezier(${v.join(', ')})`;
    case 'fontFamily':
      return (Array.isArray(v) ? v : [v]).map((f) => (/[\s-]/.test(f) && !/^-/.test(f) && f !== 'sans-serif' ? `'${f}'` : f)).join(', ');
    case 'shadow': {
      const layers = Array.isArray(v) ? v : [v];
      return layers.map((s) => [
        dimensionToCss(s.offsetX), dimensionToCss(s.offsetY), dimensionToCss(s.blur),
        ...(s.spread && s.spread.value !== 0 ? [dimensionToCss(s.spread)] : []),
        colorToCss(s.color),
      ].join(' ')).join(', ');
    }
    default: throw new Error(`Unsupported token type: ${type}`);
  }
}

// CSS for one token: aliases stay as var() so overrides cascade.
export function tokenToCss(token, byPath) {
  if (isAlias(token.value)) {
    const target = byPath.get(aliasPath(token.value));
    if (!target) throw new Error(`${token.path}: alias ${token.value} does not exist`);
    return `var(${target.name})`;
  }
  const { type } = resolve(token, byPath);
  return valueToCss(type, token.value);
}

// Resolved literal CSS value (used by manifest, docs and tests).
export function resolvedCss(token, byPath) {
  const r = resolve(token, byPath);
  return valueToCss(r.type, r.value);
}

export const isFigmaExcluded = (t) => t.extensions['mcss.figma'] === false;
