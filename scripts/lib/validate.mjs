// Validates HTML/JSX markup against the MCSS-Lite contracts. Regex-based tokenizer, no dependencies.
import { classInventory, stateInventory, nativeStateInventory } from './contracts.mjs';

// Every rule the validator reports. Errors can't be ignored ("enforce, don't advise"); warnings can,
// with --ignore <rule> or <!-- mcss-lite-ignore <rule> --> before an element.
export const RULES = [
  { id: 'unknown-class', level: 'error', description: 'A c-, l- or u- class that no contract defines.' },
  { id: 'modifier-without-block', level: 'error', description: 'A modifier class without its block class on the same element.' },
  { id: 'exclusive-modifiers', level: 'error', description: 'Two modifiers from the same exclusive group, such as two sizes.' },
  { id: 'invalid-state', level: 'error', description: 'A data-state value the block does not define, or a native state (checked) written as data-state.' },
  { id: 'unknown-icon', level: 'error', description: 'A <use href="#mcss-icon-…"> that names no icon in the sprite.' },
  { id: 'state-pair', level: 'warning', description: 'A data-state without its native or ARIA pair (disabled, aria-invalid, aria-busy).' },
  { id: 'deprecated', level: 'warning', description: 'A deprecated class; the message names the replacement.' },
  { id: 'element-outside-block', level: 'warning', description: 'A block__element used outside its block.' },
  { id: 'raw-color', level: 'warning', description: 'A raw color in an inline style instead of a token.' },
  { id: 'golden-rule', level: 'warning', description: 'A component that sets its own outer margin.' },
  { id: 'a11y', level: 'warning', description: 'A missing accessibility requirement from a contract: dialog roles, named close buttons, hidden or labelled icons, switch roles, radio groups.' },
  { id: 'card-link', level: 'warning', description: 'A card wrapped in a link instead of a stretched title link.' },
  { id: 'nested-interactive', level: 'warning', description: 'A link or control inside a link.' },
  { id: 'card-nesting', level: 'warning', description: 'A card inside another card.' },
  { id: 'label-missing', level: 'warning', description: 'A form control with no label; a placeholder is not a label.' },
  { id: 'primary-count', level: 'warning', description: 'More than one primary button in one region (form, dialog, card, alert, figure, landmark or group).' },
  { id: 'clickable-div', level: 'warning', description: 'A div or span that reacts to clicks (onclick, @click, hx-post…) instead of a button or link.' },
  { id: 'toggle-in-form', level: 'warning', description: 'A toggle in a form that is saved with a submit button; use a checkbox there.' },
  { id: 'alert-severity', level: 'warning', description: 'A toned alert with neither a severity icon nor a text prefix, so its severity rests on color.' },
  { id: 'content-case', level: 'warning', description: 'Title Case on a button, label, title or badge; write in sentence case.' },
  { id: 'content-vague', level: 'warning', description: 'A vague button or link label such as "Submit", "Click here" or "OK".' },
  { id: 'content-missing', level: 'warning', description: 'A button or link with no text and no accessible name.' },
];
const LEVEL = new Map(RULES.map((r) => [r.id, r.level]));

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const PREFIXED = /^[clu]-[a-z0-9]/;
const INTERACTIVE = new Set(['a', 'button', 'input', 'select', 'textarea', 'details', 'summary']);
const LANDMARKS = new Set(['form', 'dialog', 'main', 'header', 'footer', 'nav', 'aside', 'section', 'article', 'figure']);
const REGION_BLOCKS = ['c-card', 'c-alert', 'c-modal'];
const UNLABELLED_INPUTS = new Set(['hidden', 'submit', 'button', 'reset', 'image']);
const VAGUE = new Set(['submit', 'click here', 'here', 'click', 'ok', 'okay', 'yes', 'no', 'more', 'read more', 'learn more', 'go', 'link', 'button']);
// Small words stay lowercase in Title Case too, so they don't count either way.
const SMALL_WORDS = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for', 'with', 'by', 'at', 'as', 'from', 'into', 'per', 'via']);
export const RAW_COLOR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/i;

const attr = (attrs, name) => {
  const m = attrs.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{\\s*["'\`]([^"'\`]*)["'\`]\\s*\\})`, 'i'));
  return m ? (m[1] ?? m[2] ?? m[3]) : null;
};
// Test for a bare or valued attribute, ignoring text inside other attributes' quoted values.
const hasAttr = (attrs, name) => new RegExp(`(?:^|\\s)${name}(?=[\\s=/>]|$)`, 'i').test(attrs.replace(/"[^"]*"|'[^']*'/g, '""'));
const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
// Text that comes from a template ({{ }}, {% %}, <%= %>, JSX {…}) can't be judged, so content rules skip it.
const DYNAMIC = /\{|<%|@\w+\(/;

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

// "Create Account" and "Terms of Service" are Title Case; "Sign in with GitHub" and "Pajamas docs" are not.
// Acronyms (PDF, API) and a single word never count.
// Months and days are proper nouns, and a new sentence (after "Error:" or a full stop) starts with a capital.
// Brand names with an inner capital (GitHub, JavaScript) are skipped too; other brands can trip the rule, which is
// why it is a warning and can be ignored for one element.
const PROPER = new Set([
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'Google', 'Apple', 'Microsoft', 'Slack', 'Figma', 'Linear', 'Stripe', 'Vercel', 'Android', 'Windows', 'English',
]);
export function isTitleCase(text) {
  return text.split(/[:.!?]\s+/).some((sentence) => {
    const words = sentence.replace(/[^\p{L}\p{N}\s'’-]/gu, ' ').split(/\s+/).filter(Boolean);
    const rest = words.slice(1).filter((w) => !SMALL_WORDS.has(w) && !PROPER.has(w) && /^\p{L}/u.test(w) && !/^\p{Lu}+$/u.test(w) && !/^.\p{Ll}+\p{Lu}/u.test(w));
    return rest.length > 0 && rest.every((w) => /^\p{Lu}/u.test(w));
  });
}

export function createValidator(contracts, { icons = null, ignore = [] } = {}) {
  const inventory = classInventory(contracts);
  const states = stateInventory(contracts);
  const nativeStates = nativeStateInventory(contracts);
  const iconNames = icons ? new Set(icons) : null;
  const names = [...inventory.keys()];
  const ignored = new Set(ignore.filter((r) => LEVEL.get(r) === 'warning'));
  const suggest = (cls) => {
    const best = names.map((n) => [n, levenshtein(cls, n)]).sort((a, b) => a[1] - b[1])[0];
    if (best && best[1] <= 2) return ` Did you mean "${best[0]}"?`;
    if (cls.startsWith('u-')) {
      return ` Utilities that exist: ${names.filter((n) => inventory.get(n).kind === 'utility').join(', ')}.`;
    }
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
    // Inline opt-outs: <!-- mcss-lite-ignore rule-a rule-b: optional reason --> applies to the next element.
    const optOuts = [...source.matchAll(/<!--\s*mcss-lite-ignore\s+([a-z-]+(?:[\s,]+[a-z-]+)*)\s*(?::[\s\S]*?)?-->/g)]
      .map((m) => ({ end: m.index + m[0].length, rules: m[1].split(/[\s,]+/).filter(Boolean) }));
    // Blank out comments, <script> and <style> bodies while keeping offsets (for line numbers).
    const text = source.replace(/<!--[\s\S]*?-->|\{\/\*[\s\S]*?\*\/\}|(<(script|style)\b[^>]*>)[\s\S]*?(<\/\2>)/gi, (m) => m.replace(/[^\n]/g, ' '));
    const lineStarts = [0];
    for (let i = text.indexOf('\n'); i !== -1; i = text.indexOf('\n', i + 1)) lineStarts.push(i + 1);
    const lineAt = (i) => {
      let lo = 0, hi = lineStarts.length - 1;
      while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= i) lo = mid; else hi = mid - 1; }
      return lo + 1;
    };
    const htmlLang = attr(text.match(/<html\b([^>]*)>/i)?.[1] ?? '', 'lang');
    const english = !htmlLang || /^en\b/i.test(htmlLang);

    const report = (level, rule, index, message, el) => {
      if (level === 'warning' && (ignored.has(rule) || el?.ignore.has(rule))) return;
      const note = level === 'error' && el?.ignore.has(rule) ? ' (mcss-lite-ignore only silences warnings; errors must be fixed.)' : '';
      issues.push({ level, rule, line: lineAt(index), message: message + note });
    };

    const stack = [];
    const doc = { tag: '#document', classes: new Set(), attrs: '', at: 0, text: '', dynamic: false, primaries: [], ignore: new Set() };
    const labelFor = new Set();
    const controls = [];
    let pendingOptOut = 0;
    let last = 0;

    const regionOf = () => [...stack].reverse().find((e) => e.region) ?? doc;
    const addText = (chunk) => {
      if (!chunk || stack.some((e) => e.tag === 'svg')) return;
      const t = decode(chunk);
      const dynamic = DYNAMIC.test(t);
      for (const e of stack) { e.text += t; if (dynamic) e.dynamic = true; }
    };

    const close = (e) => {
      const name = (attr(e.attrs, 'aria-label') ?? '').trim() || e.text.replace(/\s+/g, ' ').trim();
      const labelled = name || attr(e.attrs, 'aria-labelledby') || attr(e.attrs, 'title');
      const isButton = e.tag === 'button' || e.classes.has('c-button');
      const isLink = e.tag === 'a' && attr(e.attrs, 'href') !== null;

      // Content: buttons and links need a name, and it should say what happens.
      if ((isButton || isLink) && !e.dynamic && !labelled && !e.hasImgAlt) {
        report('warning', 'content-missing', e.at, `This ${isButton ? 'button' : 'link'} has no text or accessible name. Add visible text, or aria-label for an icon-only control.`, e);
      }
      if ((isButton || isLink) && !e.dynamic && VAGUE.has(name.toLowerCase().replace(/[.!…:]+$/, ''))) {
        report('warning', 'content-vague', e.at, `"${name}" says nothing out of context. Name the action and its object, e.g. "Save changes" or "Download the invoice".`, e);
      }
      const titled = isButton || e.tag === 'legend' || [...e.classes].some((c) => /^c-[a-z-]+__(title|label)$/.test(c) || c === 'c-badge');
      if (titled && english && !e.dynamic && isTitleCase(e.text.replace(/\s+/g, ' ').trim())) {
        report('warning', 'content-case', e.at, `"${e.text.replace(/\s+/g, ' ').trim()}" is in Title Case. Write in sentence case: capitalize only the first word and proper nouns.`, e);
      }

      // A toned alert must carry its severity in more than color.
      const tone = [...e.classes].find((c) => /^c-alert--(info|success|warning|error)$/.test(c));
      if (tone && !e.hasAlertIcon && !e.hasSrPrefix) {
        report('warning', 'alert-severity', e.at, `${tone} shows its severity by color alone. Add a c-alert__icon and start the title with <span class="u-sr-only">${{ info: 'Information', success: 'Success', warning: 'Warning', error: 'Error' }[tone.slice(9)]}: </span>.`, e);
      }

      // More than one primary action per region.
      if (e.region) checkPrimaries(e);

      // A toggle applies straight away; in a form saved by a submit button, it misleads.
      if (e.tag === 'form' && e.toggles?.length && e.hasSubmit && !/change/.test(attr(e.attrs, 'hx-trigger') ?? '')) {
        for (const t of e.toggles) report('warning', 'toggle-in-form', t.at, 'This c-toggle is in a form saved with a submit button, so it doesn\'t apply straight away. Use a c-checkbox, or save the toggle on change.', t);
      }
    };
    const checkPrimaries = (region) => {
      for (const p of region.primaries.slice(1)) {
        report('warning', 'primary-count', p.at, `A second primary button in the same ${region === doc ? 'page' : `<${region.tag}>`} (the first is on line ${lineAt(region.primaries[0].at)}). Keep one primary action per region; make the others secondary or default.`, p);
      }
    };

    for (const m of text.matchAll(/<(\/?)([a-zA-Z][\w.:-]*)((?:[^>"'{]|"[^"]*"|'[^']*'|\{[^}]*\})*)>/g)) {
      addText(text.slice(last, m.index));
      last = m.index + m[0].length;
      const [, closing, rawTag, attrs] = m;
      const tag = rawTag.toLowerCase();
      if (closing) {
        const idx = stack.map((e) => e.tag).lastIndexOf(tag);
        if (idx !== -1) {
          for (const e of stack.splice(idx).reverse()) close(e);
        }
        continue;
      }
      const classAttr = attr(attrs, 'class') ?? attr(attrs, 'className') ?? '';
      const classes = classAttr.split(/\s+/).filter(Boolean);
      const own = new Set(classes);
      const dataState = attr(attrs, 'data-state');
      const style = attr(attrs, 'style');
      const at = m.index;
      const exclusiveSeen = new Map();
      const ignore = new Set();
      while (pendingOptOut < optOuts.length && optOuts[pendingOptOut].end <= at) {
        const o = optOuts[pendingOptOut++];
        if (!text.slice(o.end, at).includes('<')) for (const r of o.rules) ignore.add(r);
      }
      const el = { tag, classes: own, attrs, at, text: '', dynamic: false, ignore, primaries: [] };
      const inside = (cls) => stack.some((e) => e.classes.has(cls));
      const nearest = (pred) => [...stack].reverse().find(pred);

      for (const cls of classes) {
        if (!PREFIXED.test(cls)) continue;
        const info = inventory.get(cls);
        if (!info) {
          report('error', 'unknown-class', at, `Unknown class "${cls}".${suggest(cls)} Only classes from the MCSS-Lite contracts exist.`, el);
          continue;
        }
        if (info.deprecated) {
          report('warning', 'deprecated', at, `"${cls}" is deprecated.${info.contract.replacement ? ` Use "${info.contract.replacement}".` : ''}`, el);
        }
        if (info.kind === 'modifier') {
          if (!own.has(info.block)) report('error', 'modifier-without-block', at, `"${cls}" needs its block class "${info.block}" on the same element.`, el);
          if (info.exclusive) {
            const key = `${info.block}:${info.group}`;
            if (exclusiveSeen.has(key)) report('error', 'exclusive-modifiers', at, `"${exclusiveSeen.get(key)}" and "${cls}" are both ${info.group} modifiers; use only one.`, el);
            else exclusiveSeen.set(key, cls);
          }
        }
        if (info.kind === 'element' && !inside(info.block) && !own.has(info.block)) {
          report('warning', 'element-outside-block', at, `"${cls}" should be inside an element with class "${info.block}".`, el);
        }
      }

      if (dataState !== null) {
        const blocks = classes.filter((c) => inventory.get(c)?.kind === 'block');
        if (blocks.length) {
          const allowed = blocks.some((b) => states.get(b)?.has(dataState));
          const native = blocks.map((b) => nativeStates.get(b)?.get(dataState)).find(Boolean);
          if (!allowed && native) {
            report('error', 'invalid-state', at, `"${dataState}" is a native state of ${blocks.join(', ')}: don't use data-state. ${native.pair ?? `Style comes from ${native.selector}.`}`, el);
          } else if (!allowed) {
            const list = blocks.map((b) => `${b}: ${[...(states.get(b) ?? [])].join(', ') || 'none'}`).join('; ');
            report('error', 'invalid-state', at, `data-state="${dataState}" is not a state of ${blocks.join(', ')} (allowed: ${list}).`, el);
          } else {
            checkStatePair(tag, attrs, dataState, (msg) => report('warning', 'state-pair', at, msg, el));
          }
        }
      }

      if (style) {
        if (RAW_COLOR.test(style)) report('warning', 'raw-color', at, 'Inline style uses a raw color. Use a token, e.g. var(--color-text-default).', el);
        if (/(^|;)\s*margin[\w-]*\s*:/i.test(style) && classes.some((c) => inventory.get(c)?.kind === 'block' && c.startsWith('c-'))) {
          report('warning', 'golden-rule', at, 'Components must not set their own margin. Wrap them in a layout primitive (l-stack, l-cluster…) instead.', el);
        }
      }

      // ---- Accessibility requirements from the contracts ----
      if (own.has('c-modal') && tag !== 'dialog' && attr(attrs, 'role') !== 'dialog') {
        report('warning', 'a11y', at, 'c-modal needs role="dialog" (or use <dialog>), aria-modal="true" and aria-labelledby.', el);
      }
      const closeClass = classes.find((c) => /^c-[a-z-]+__close$/.test(c));
      if (closeClass && !attr(attrs, 'aria-label') && !attr(attrs, 'aria-labelledby')) {
        report('warning', 'a11y', at, `${closeClass} needs an accessible name, e.g. aria-label="Close" or "Dismiss".`, el);
      }
      if (own.has('c-icon')) {
        const hidden = attr(attrs, 'aria-hidden') === 'true';
        const named = attr(attrs, 'role') === 'img' && (attr(attrs, 'aria-label') || attr(attrs, 'aria-labelledby'));
        if (!hidden && !named) report('warning', 'a11y', at, 'c-icon needs aria-hidden="true" when it is decorative, or role="img" and aria-label when it carries meaning on its own.', el);
      }
      const type = (attr(attrs, 'type') ?? '').toLowerCase();
      if (own.has('c-checkbox__input') && type !== 'checkbox') report('warning', 'a11y', at, 'c-checkbox__input must be <input type="checkbox">.', el);
      if (own.has('c-radio__input') && type !== 'radio') report('warning', 'a11y', at, 'c-radio__input must be <input type="radio">.', el);
      if (own.has('c-toggle__input') && (type !== 'checkbox' || attr(attrs, 'role') !== 'switch')) {
        report('warning', 'a11y', at, 'c-toggle__input must be <input type="checkbox" role="switch">, so screen readers say on and off.', el);
      }
      if (tag === 'input' && type === 'radio' && !stack.some((e) => e.tag === 'fieldset' || attr(e.attrs, 'role') === 'radiogroup')) {
        report('warning', 'a11y', at, 'Radio buttons need a group: wrap them in fieldset.c-form-field with a legend (or role="radiogroup" with a label).', el);
      }

      // ---- Icons ----
      if (tag === 'use' && iconNames) {
        const href = attr(attrs, 'href') ?? attr(attrs, 'xlink:href') ?? '';
        const m2 = href.match(/#mcss-icon-([\w-]+)$/);
        if (m2 && !iconNames.has(m2[1])) {
          const best = [...iconNames].map((n) => [n, levenshtein(m2[1], n)]).sort((a, b) => a[1] - b[1])[0];
          report('error', 'unknown-icon', at, `There is no icon "${m2[1]}".${best && best[1] <= 3 ? ` Did you mean "${best[0]}"?` : ''} Icons: ${[...iconNames].join(', ')}.`, el);
        }
      }

      // ---- Structure ----
      const inLink = stack.some((e) => e.tag === 'a');
      if (own.has('c-card') && (tag === 'a' || inLink)) {
        report('warning', 'card-link', at, 'Don\'t wrap a card in a link. Add c-card--interactive and put the link on the c-card__title; its hit area covers the card.', el);
      }
      if (inLink && INTERACTIVE.has(tag)) {
        report('warning', 'nested-interactive', at, `<${tag}> is inside a link. Interactive elements can't be nested; move it outside the <a>.`, el);
      }
      if (own.has('c-card') && inside('c-card')) {
        report('warning', 'card-nesting', at, 'A card inside a card. Group the inner content with a heading and l-stack, or use a list; nested keylines read as clutter.', el);
      }
      if ((tag === 'div' || tag === 'span') && reactsToClick(attrs)) {
        report('warning', 'clickable-div', at, `A <${tag}> that reacts to clicks has no role, no keyboard access and no focus. Use <button type="button"> for actions or <a href> for navigation.`, el);
      }

      // Labels: collect, then check once the whole document is read.
      if (tag === 'label') {
        const f = attr(attrs, 'for') ?? attr(attrs, 'htmlFor');
        if (f) labelFor.add(f);
      }
      if ((tag === 'input' && !UNLABELLED_INPUTS.has(type)) || tag === 'select' || tag === 'textarea') {
        controls.push({ el, id: attr(attrs, 'id'), inLabel: stack.some((e) => e.tag === 'label'), named: attr(attrs, 'aria-label') || attr(attrs, 'aria-labelledby') || attr(attrs, 'title'), placeholder: attr(attrs, 'placeholder'), dynamic: /\{/.test(attrs) });
      }

      // Facts ancestors need when they close.
      if (tag === 'img' && attr(attrs, 'alt')) for (const e of stack) e.hasImgAlt = true;
      if (own.has('c-alert__icon') || own.has('c-icon')) { const a = nearest((e) => e.classes.has('c-alert')); if (a) a.hasAlertIcon = true; }
      if (own.has('u-sr-only')) for (const e of stack) e.hasSrPrefix = true;
      if (own.has('c-button--primary')) regionOf().primaries.push(el);
      const form = nearest((e) => e.tag === 'form');
      if (form) {
        if (own.has('c-toggle')) (form.toggles ??= []).push(el);
        if ((tag === 'button' && (type === '' || type === 'submit')) || (tag === 'input' && (type === 'submit' || type === 'image'))) form.hasSubmit = true;
      }

      el.region = LANDMARKS.has(tag) || ['dialog', 'group', 'region', 'radiogroup', 'toolbar'].includes(attr(attrs, 'role')) || REGION_BLOCKS.some((b) => own.has(b));
      const selfClosing = /\/\s*$/.test(attrs);
      if (!VOID.has(tag) && !selfClosing) stack.push(el);
      else close(el);
    }
    addText(text.slice(last));
    for (const e of stack.splice(0).reverse()) close(e);
    checkPrimaries(doc);

    for (const c of controls) {
      if (c.inLabel || c.named || c.dynamic || (c.id && labelFor.has(c.id))) continue;
      const hint = c.placeholder ? ` The placeholder "${c.placeholder}" disappears as soon as someone types, so it can't be the label.` : '';
      report('warning', 'label-missing', c.el.at, `This <${c.el.tag}> has no label. Add <label for="${c.id ?? 'its-id'}"> (c-form-field__label).${hint}`, c.el);
    }
    return issues.sort((a, b) => a.line - b.line);
  };
}

// onclick, @click, x-on:click, v-on:click, onClick, and htmx requests that fire on click.
function reactsToClick(attrs) {
  if (/(?:^|\s)(?:onclick|@click(?:\.[\w.]+)?|x-on:click(?:\.[\w.]+)?|v-on:click(?:\.[\w.]+)?)\s*=/i.test(attrs)) return true;
  if (!/(?:^|\s)(?:data-)?hx-(?:get|post|put|patch|delete)\s*=/i.test(attrs)) return false;
  const trigger = attr(attrs, 'hx-trigger') ?? attr(attrs, 'data-hx-trigger');
  return trigger === null || /\bclick\b/.test(trigger);
}

function checkStatePair(tag, attrs, state, warn) {
  const formControl = ['button', 'input', 'select', 'textarea'].includes(tag);
  if (state === 'disabled') {
    if (formControl && !hasAttr(attrs, 'disabled') && attr(attrs, 'aria-disabled') !== 'true') {
      warn(`data-state="disabled" on <${tag}> also needs aria-disabled="true" (keeps it focusable; link the reason with aria-describedby) or the disabled attribute.`);
    }
    if (tag === 'a' && attr(attrs, 'aria-disabled') !== 'true') warn('data-state="disabled" on <a> also needs aria-disabled="true".');
  }
  // ARIA 1.2 doesn't allow aria-invalid on a fieldset: a group error is linked with aria-describedby instead.
  if (state === 'error' && tag === 'fieldset') {
    if (!attr(attrs, 'aria-describedby')) warn('data-state="error" on a <fieldset> also needs aria-describedby pointing at the c-form-field__error message.');
  } else if (state === 'error' && attr(attrs, 'aria-invalid') !== 'true') {
    warn('data-state="error" also needs aria-invalid="true" and aria-describedby pointing at the error message.');
  }
  if (state === 'loading') {
    if (formControl && (attr(attrs, 'aria-busy') !== 'true' || attr(attrs, 'aria-disabled') !== 'true')) {
      warn('data-state="loading" also needs aria-busy="true" and aria-disabled="true".');
    } else if (!formControl && attr(attrs, 'aria-busy') !== 'true') {
      warn('data-state="loading" also needs aria-busy="true".');
    }
  }
}
