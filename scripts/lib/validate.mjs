// Validates HTML/JSX markup against the MCSS-Lite contracts. Regex-based tokenizer, no dependencies.
import { classInventory, stateInventory } from './contracts.mjs';

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const PREFIXED = /^[clu]-[a-z0-9]/;
const RAW_COLOR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/i;

const attr = (attrs, name) => {
  const m = attrs.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{\\s*["'\`]([^"'\`]*)["'\`]\\s*\\})`, 'i'));
  return m ? (m[1] ?? m[2] ?? m[3]) : null;
};
const hasAttr = (attrs, name) => new RegExp(`(?:^|\\s)${name}(?=[\\s=/>]|$)`, 'i').test(attrs);

function levenshtein(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

export function createValidator(contracts) {
  const inventory = classInventory(contracts);
  const states = stateInventory(contracts);
  const names = [...inventory.keys()];
  const suggest = (cls) => {
    const best = names.map((n) => [n, levenshtein(cls, n)]).sort((a, b) => a[1] - b[1])[0];
    if (best && best[1] <= 2) return ` Did you mean "${best[0]}"?`;
    const block = cls.split(/__|--/)[0];
    const info = inventory.get(block);
    if (info?.kind !== 'block') return '';
    const kind = cls.includes('--') ? 'modifier' : 'element';
    const valid = names.filter((n) => inventory.get(n).kind === kind && inventory.get(n).block === block);
    return valid.length
      ? ` Valid ${kind}s of ${block}: ${valid.map((n) => n.slice(block.length)).join(', ')}.`
      : ` ${block} has no ${kind}s.`;
  };

  return function validate(source) {
    const issues = [];
    // Blank out comments, <script> and <style> bodies while keeping offsets (for line numbers).
    const text = source.replace(/<!--[\s\S]*?-->|\{\/\*[\s\S]*?\*\/\}|(<(script|style)\b[^>]*>)[\s\S]*?(<\/\2>)/gi, (m) => m.replace(/[^\n]/g, ' '));
    const lineAt = (i) => text.slice(0, i).split('\n').length;
    const stack = [];
    const report = (level, rule, index, message) => issues.push({ level, rule, line: lineAt(index), message });

    for (const m of text.matchAll(/<(\/?)([a-zA-Z][\w.-]*)((?:[^>"'{]|"[^"]*"|'[^']*'|\{[^}]*\})*)>/g)) {
      const [, closing, rawTag, attrs] = m;
      const tag = rawTag.toLowerCase();
      if (closing) {
        const idx = stack.map((e) => e.tag).lastIndexOf(tag);
        if (idx !== -1) stack.length = idx;
        continue;
      }
      const classAttr = attr(attrs, 'class') ?? attr(attrs, 'className') ?? '';
      const classes = classAttr.split(/\s+/).filter(Boolean);
      const own = new Set(classes);
      const dataState = attr(attrs, 'data-state');
      const style = attr(attrs, 'style');
      const at = m.index;
      const exclusiveSeen = new Map();

      for (const cls of classes) {
        if (!PREFIXED.test(cls)) continue;
        const info = inventory.get(cls);
        if (!info) {
          report('error', 'unknown-class', at, `Unknown class "${cls}".${suggest(cls)} Only classes from the MCSS-Lite contracts exist.`);
          continue;
        }
        if (info.deprecated) {
          report('warning', 'deprecated', at, `"${cls}" is deprecated.${info.contract.replacement ? ` Use "${info.contract.replacement}".` : ''}`);
        }
        if (info.kind === 'modifier') {
          if (!own.has(info.block)) report('error', 'modifier-without-block', at, `"${cls}" needs its block class "${info.block}" on the same element.`);
          if (info.exclusive) {
            const key = `${info.block}:${info.group}`;
            if (exclusiveSeen.has(key)) report('error', 'exclusive-modifiers', at, `"${exclusiveSeen.get(key)}" and "${cls}" are both ${info.group} modifiers; use only one.`);
            else exclusiveSeen.set(key, cls);
          }
        }
        if (info.kind === 'element' && !stack.some((e) => e.classes.has(info.block)) && !own.has(info.block)) {
          report('warning', 'element-outside-block', at, `"${cls}" should be inside an element with class "${info.block}".`);
        }
      }

      if (dataState !== null) {
        const blocks = classes.filter((c) => inventory.get(c)?.kind === 'block');
        if (blocks.length) {
          const allowed = blocks.some((b) => states.get(b)?.has(dataState));
          if (!allowed) {
            const list = blocks.map((b) => `${b}: ${[...(states.get(b) ?? [])].join(', ') || 'none'}`).join('; ');
            report('error', 'invalid-state', at, `data-state="${dataState}" is not a state of ${blocks.join(', ')} (allowed: ${list}).`);
          } else {
            checkStatePair(tag, attrs, dataState, (msg) => report('warning', 'state-pair', at, msg));
          }
        }
      }

      if (style) {
        if (RAW_COLOR.test(style)) report('warning', 'raw-color', at, 'Inline style uses a raw color. Use a token, e.g. var(--color-text-default).');
        if (/(^|;)\s*margin[\w-]*\s*:/i.test(style) && classes.some((c) => inventory.get(c)?.kind === 'block' && c.startsWith('c-'))) {
          report('warning', 'golden-rule', at, 'Components must not set their own margin. Wrap them in a layout primitive (l-stack, l-cluster…) instead.');
        }
      }

      if (own.has('c-modal') && tag !== 'dialog' && attr(attrs, 'role') !== 'dialog') {
        report('warning', 'a11y', at, 'c-modal needs role="dialog" (or use <dialog>), aria-modal="true" and aria-labelledby.');
      }
      if (own.has('c-modal__close') && !attr(attrs, 'aria-label')) {
        report('warning', 'a11y', at, 'c-modal__close needs aria-label="Close".');
      }

      const selfClosing = /\/\s*$/.test(attrs);
      if (!VOID.has(tag) && !selfClosing) stack.push({ tag, classes: own });
    }
    return issues;
  };
}

function checkStatePair(tag, attrs, state, warn) {
  const formControl = ['button', 'input', 'select', 'textarea'].includes(tag);
  if (state === 'disabled') {
    if (formControl && !hasAttr(attrs, 'disabled')) warn(`data-state="disabled" on <${tag}> also needs the disabled attribute.`);
    if (tag === 'a' && attr(attrs, 'aria-disabled') !== 'true') warn('data-state="disabled" on <a> also needs aria-disabled="true".');
  }
  if (state === 'error' && attr(attrs, 'aria-invalid') !== 'true') warn('data-state="error" also needs aria-invalid="true" and aria-describedby pointing at the error message.');
  if (state === 'loading' && attr(attrs, 'aria-busy') !== 'true') warn('data-state="loading" also needs aria-busy="true".');
}
