// Contract loading and the class inventory derived from it. Node built-ins only.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const LAYER_ORDER = { layout: 0, component: 1, utility: 2 };

export function loadContracts(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({ file: f, ...JSON.parse(readFileSync(join(dir, f), 'utf8')) }))
    .sort((a, b) => LAYER_ORDER[a.layer] - LAYER_ORDER[b.layer] || a.block.localeCompare(b.block));
}

export function loadExamples(dir, contract) {
  return (contract.examples ?? []).map((file) => {
    const path = join(dir, file);
    return { file, html: existsSync(path) ? readFileSync(path, 'utf8').trim() : null };
  });
}

// Every class the system defines, keyed by class name.
// kind: block | modifier | element | utility
export function classInventory(contracts) {
  const map = new Map();
  const add = (name, info) => {
    if (map.has(name)) throw new Error(`Class ${name} is defined by two contracts`);
    map.set(name, info);
  };
  for (const c of contracts) {
    const deprecated = c.status === 'deprecated';
    if (c.layer === 'utility') {
      for (const u of c.classes ?? []) add(u.name, { kind: 'utility', contract: c, deprecated });
      continue;
    }
    add(c.block, { kind: 'block', block: c.block, contract: c, deprecated });
    for (const m of c.modifiers ?? []) {
      for (const v of m.values) {
        add(`${c.block}--${v.name}`, { kind: 'modifier', block: c.block, group: m.group, exclusive: m.exclusive, contract: c, deprecated });
      }
    }
    for (const e of c.elements ?? []) {
      add(`${c.block}__${e.name}`, { kind: 'element', block: c.block, contract: c, deprecated });
    }
  }
  return map;
}

// block -> Set of allowed data-state values
export function stateInventory(contracts) {
  return new Map(contracts.filter((c) => c.layer !== 'utility').map((c) => [c.block, new Set((c.states ?? []).map((s) => s.name))]));
}

export const localCustomProperties = (contracts) =>
  new Set(contracts.flatMap((c) => (c.customProperties ?? []).map((p) => p.name)));
