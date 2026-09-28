// Builds the booklet's reference pages from the contracts: one part sheet per block, the parts
// inventory (status) and "Read before you build" (content rules). Every page is a page of the same
// instruction booklet: stud rail, numbered sections, 1:1 call-outs, check-your-build panels.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createValidator } from './validate.mjs';
import { stateLabel } from './contracts.mjs';
import { loadIcons, inlineSprite, ICON_PREFIX } from './icons.mjs';
import { glyph, esc, indent, demoBar, demoHead, codeTokens, realDialog, partCount, tokenNote } from './demo.mjs';

// Markup and token tables shorter than this stay open: folding them costs more than it saves.
const FOLD_MIN = 4;

// Where a sheet's section rail goes: after the page header, so the keyboard reaches the page first.
const RAIL_SLOT = '<!-- rail -->';

export const sheetFile = (c) => c.file.replace(/\.json$/, '.html');

const STATUS_TEXT = {
  stable: 'Stable',
  beta: 'Beta',
  deprecated: 'Deprecated',
};
const STATUS_ICON = {
  stable: '<path d="M3 8.5l3 3 7-7"/>',
  beta: '<path d="M10.5 2.5a3 3 0 0 0-3.9 3.9L2.5 10.5l3 3 4.1-4.1a3 3 0 0 0 3.9-3.9l-2 2-2-2z"/>',
  deprecated: '<path d="M4 4l8 8M12 4l-8 8"/>',
};
// A small tilted brick that misses its studs, drawn in the keyline: the booklet's "wrong piece" mark on every ✗ panel.
const MISFIT_MINI = '<svg class="demo-misfit-mini" viewBox="0 0 48 32" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 28h40"/><g transform="rotate(-14 24 16)"><rect x="10" y="10" width="28" height="12" rx="2" stroke-dasharray="4 3"/><path d="M15 10V7h5v3M28 10V7h5v3"/></g></g></svg>';

export const sticker = (status) => `<span class="demo-sticker demo-sticker--${status}"><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">${STATUS_ICON[status]}</svg>${STATUS_TEXT[status]}</span>`;

const LEGEND = {
  stable: 'Changes only in a major version.',
  beta: 'Shipped and validated; the API may change in a minor version.',
  deprecated: 'Still works; move to the replacement.',
};

const CHECK_ICON = '<svg class="demo-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12.5l5 5L20 6.5"/></svg>';
const CROSS_ICON = '<svg class="demo-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>';

// Give every id in a snippet (and every reference to it) a suffix, so several snippets can share a page.
export function namespaceIds(html, suffix) {
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const named = html.replace(/(\sname=")([^"]+)"/g, (_, a, v) => `${a}${v}-${suffix}"`);
  if (!ids.size) return named;
  const map = (v) => v.split(/\s+/).map((x) => (ids.has(x) ? `${x}-${suffix}` : x)).join(' ');
  return named
    .replace(/(\s(?:id|for|aria-labelledby|aria-describedby|aria-controls)=")([^"]*)"/g, (_, a, v) => `${a}${map(v)}"`)
    .replace(/(\shref="#)([^"]*)"/g, (_, a, v) => `${a}${map(v)}"`);
}

// Stage links never lead off the page. Icon references (<use href="#mcss-icon-…">) stay as they are.
const localLinks = (html, anchor) => html.replace(new RegExp(`href="(?!#${ICON_PREFIX})[^"]*"`, 'g'), `href="#${anchor}"`);

// A <dialog> is invisible until opened. On a sheet the preview is a contained, inert copy.
const dialogPreview = (html) => html
  .replace(/<dialog class="c-modal"/g, '<div class="c-modal" role="dialog"')
  .replace(/<\/dialog>/g, '</div>');

export function buildPages({ root, pkg, contracts, tokenRows }) {
  const validate = createValidator(contracts, { icons: loadIcons(root).map((i) => i.name) });
  const byBlock = new Map(contracts.map((c) => [c.block, c]));
  const tokens = new Map(tokenRows.map((t) => [t.name, t]));
  const sheets = contracts;
  const exampleUse = new Map();
  for (const c of contracts) for (const e of c.examples ?? []) exampleUse.set(e, (exampleUse.get(e) ?? 0) + 1);
  const content = JSON.parse(readFileSync(join(root, 'guidelines', 'content.json'), 'utf8'));

  // Inline `code` in guidance text; known blocks link to their sheet.
  const rich = (text, rel = '') => esc(autoCode(text).replace(/(^|[^`])(<[a-z]+>)(?!`)/g, '$1`$2`')).replace(/`([^`]+)`/g, (_, raw) => {
    const name = raw.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const c = byBlock.get(name);
    return c ? `<a href="${rel}${sheetFile(c)}"><code>${esc(name)}</code></a>` : `<code>${esc(name)}</code>`;
  });

  let codeId = 0; // ids for copyable code blocks
  const files = new Map();
  sheets.forEach((c, i) => files.set(`demo/components/${sheetFile(c)}`, partSheet(c, i)));
  files.set('demo/status.html', inventoryPage());
  files.set('demo/content.html', contentPage());
  return files;

  // ---------- shell ----------

  function shell({ title, description, rel, rail, main, current = null, source = '<code>components/*.json</code>', extra = '' }) {
    const railHtml = rail.length
      ? `\n    <nav class="demo-rail demo-rail--labelled" aria-label="Sections">
    <ol class="demo-rail__list" role="list" style="--demo-studs: ${rail.length}">
${rail.map(([id, label], n) => `      <li><a class="demo-rail__stud" href="#${id}" data-rail="${id}" data-label="${esc(label)}"><span class="u-sr-only">${n + 1}: ${esc(label)}</span><span aria-hidden="true">${n + 1}</span><span class="demo-rail__text" aria-hidden="true">${esc(label)}</span></a></li>`).join('\n')}
    </ol>
    <p class="demo-rail__now" aria-hidden="true" data-rail-now="Jump to a section"></p>
  </nav>\n`
      : '';
    return `<!doctype html>
<!-- GENERATED by scripts/build.mjs from components/*.json and guidelines/content.json. Do not edit. -->
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} · MCSS-Lite</title>
  <meta name="description" content="${esc(description)}">
  ${demoHead(rel)}
</head>
<body class="demo">
${inlineSprite(loadIcons(root), pkg)}
  <a class="demo-skip" href="#main">Skip to the page</a>
  ${demoBar(pkg, rel, current)}
  <main id="main">
${main.replace(`${RAIL_SLOT}\n`, railHtml)}
  </main>

  <footer class="demo-footer">
    <div class="l-container l-stack l-stack--sm">
      <p>Generated from ${source} by <code>npm run build</code>, so this page can't drift from the contract.</p>
      <p>${esc(pkg.name)}@${esc(pkg.version)} · ${esc(pkg.license)} · <a href="#main">Back to the top</a></p>
    </div>
  </footer>

  <p class="u-sr-only" role="status" data-copy-status></p>${extra ? `\n\n  ${indent(extra, 2).trim()}\n` : ''}
  <script src="${rel}demo.js" defer></script>
</body>
</html>
`;
  }

  function section(id, n, title, body, extraClass = '') {
    return `    <section class="demo-step demo-sheet__section${extraClass}" id="${id}" aria-labelledby="${id}-title">
      <div class="l-container">
        <div class="demo-sheet__row">
          <p class="demo-step__numeral" aria-hidden="true">${n}</p>
          <div class="l-stack demo-sheet__body">
            <h2 class="demo-step__title" id="${id}-title">${title}</h2>
${body}
          </div>
        </div>
      </div>
    </section>`;
  }

  // ---------- part sheet ----------

  function buildSteps(c) {
    if (c.status === 'deprecated') {
      return [
        `Build ${rich(`\`${c.replacement}\``)} instead: this part only exists so older pages keep working.`,
        `Replace <code>class="${esc(c.block)}"</code> in existing markup when you next touch it. <code>mcss-lite validate</code> flags every use with <code>[deprecated]</code>.`,
      ];
    }
    if (c.layer === 'utility') return ['Pick the one utility that does the job.', 'Add it next to the part it adjusts. Utilities win over layouts and components, so use them sparingly.'];
    const steps = [`Start with ${c.tags ? `<code>&lt;${esc(c.tags[0])}&gt;</code>` : 'an element'} and add <code>class="${esc(c.block)}"</code>.`];
    const req = (c.elements ?? []).filter((e) => e.required);
    const opt = (c.elements ?? []).filter((e) => !e.required);
    if (req.length) steps.push(`Add the required parts: ${req.map((e) => `<code>${esc(c.block)}__${esc(e.name)}</code>`).join(', ')}.`);
    if (opt.length) steps.push(`Add the parts you need: ${opt.map((e) => `<code>${esc(c.block)}__${esc(e.name)}</code>`).join(', ')}.`);
    for (const m of c.modifiers ?? []) {
      steps.push(`${m.exclusive ? 'Pick at most one' : 'Add any'} ${esc(m.group)} modifier: ${m.values.map((v) => `<code>--${esc(v.name)}</code>`).join(', ')}.`);
    }
    for (const p of c.customProperties ?? []) steps.push(`Tune <code>${esc(p.name)}</code> inline if the default (<code>${esc(p.default)}</code>) doesn't fit.`);
    const dataStates = (c.states ?? []).filter((s) => !s.native);
    const nativeStates = (c.states ?? []).filter((s) => s.native);
    if (nativeStates.length) steps.push(`Set state on the native control, never with data-state: ${nativeStates.map((s) => `<code>${esc(s.selector)}</code>`).join(', ')}.`);
    for (const st of dataStates) steps.push(`Add <code>data-state="${esc(st.name)}"</code> when ${esc(firstSentence(st.description).replace(/^./, (ch) => ch.toLowerCase()))}${st.pair ? ` ${pairText(st.pair)}` : ''}`);
    if (c.layer === 'layout') steps.push('Put the parts inside. The layout sets the space between them, so they need no margins.');
    return steps;
  }

  // The finished build: the canonical example, or the first "do" when the example file is shared.
  function buildExample(c) {
    const own = (c.examples ?? []).find((e) => exampleUse.get(e) === 1);
    if (own) return readFileSync(join(root, 'components', own), 'utf8').trim();
    return c.guidelines?.doDont?.[0]?.do.html ?? null;
  }

  function stage(html, anchor, suffix, { preview = false } = {}) {
    const isModal = html.includes('c-modal');
    const body = localLinks(namespaceIds(isModal ? dialogPreview(html) : html, suffix), anchor)
      .replace(' aria-modal="true"', '');
    return `<figure class="demo-stage${isModal ? ' demo-stage--contain' : ''}"${isModal || preview ? ' inert aria-hidden="true"' : ''}>
${indent(body, 2)}
</figure>`;
  }

  // Code blocks wrap at spaces only (class names stay whole) and carry a Copy button.
  // fold: the stage above already shows the result, so the markup opens on request.
  // copy: false for markup that doesn't fit, so nobody copies the wrong piece.
  function code(html, { fold = false, copy = true } = {}) {
    const id = `code-${++codeId}`;
    const block = copy ? `<div class="demo-code-block">
  <pre class="demo-code"><code id="${id}">${codeTokens(html)}</code></pre>
  <button type="button" class="c-button c-button--sm demo-code-block__copy" data-copy="${id}" data-copied="Code copied.">Copy<span class="u-sr-only"> code</span></button>
</div>` : `<pre class="demo-code"><code>${codeTokens(html)}</code></pre>`;
    const lines = html.split('\n').length;
    return fold && lines >= FOLD_MIN ? disclosure(`Show markup <span class="demo-details__count">${lines} lines</span>`, block) : block;
  }

  function disclosure(summary, body) {
    return `<details class="demo-details">\n<summary><svg class="c-icon c-icon--sm demo-details__chevron" aria-hidden="true" focusable="false"><use href="#${ICON_PREFIX}chevron-down"></use></svg>${summary}</summary>\n${body}\n</details>`;
  }

  function checkPanels(c) {
    return (c.guidelines?.doDont ?? []).map((pair, i) => {
      const doHtml = pair.do.html
        ? `${stage(pair.do.html, 'check', `do${i + 1}`)}\n${code(pair.do.html, { fold: true })}\n<p class="demo-checks__verdict">${CHECK_ICON}<span><code>validate</code>: 0 issues</span></p>`
        : '';
      let dontHtml = '';
      if (pair.dont.html) {
        const issues = validate(pair.dont.html);
        const list = issues.length
          ? `<ul class="demo-check__issues" role="list">${issues.map((x) => `<li class="demo-check__issue--${esc(x.level)}"><strong>${esc(x.level)}</strong> ${codeTokens(x.message)} <code>[${esc(x.rule)}]</code></li>`).join('')}</ul>`
          : '';
        const verdict = pair.dont.rule
          ? `<p class="demo-check__label">validate</p>\n${list}`
          : '<p class="demo-checks__guidance">Guidance only: the validator can\'t catch this one yet, so review for it.</p>';
        dontHtml = `${code(pair.dont.html, { copy: false })}\n${verdict}`;
      }
      return `<div class="demo-checks__pair">
  <div class="demo-checks__card demo-checks__card--do">
    <p class="demo-checks__head">${CHECK_ICON}Fits</p>
    <p>${rich(pair.do.text)}</p>
${doHtml}
  </div>
  <div class="demo-checks__card demo-checks__card--dont">
    <p class="demo-checks__head">${CROSS_ICON}Doesn't fit${MISFIT_MINI}</p>
    <p>${rich(pair.dont.text)}</p>
${dontHtml}
  </div>
</div>`;
    }).join('\n');
  }

  function tokenValue(name) {
    const t = tokens.get(name);
    if (!t) return '<span class="demo-spec__muted">local</span>';
    const v = t.value;
    // A color token shows a live chip: it follows the page's theme. Component tokens are unset, so fall back to their alias.
    const live = t.tier === 'component' && typeof t.alias === 'string' ? `var(${t.name}, var(${t.alias}))` : `var(${t.name})`;
    const chip = t.type === 'color' ? `<span class="demo-spec__swatch" style="background-color: ${live}" aria-hidden="true"></span>` : '';
    return `${chip}${typeof v === 'object' ? `<code>${esc(v.light)}</code> / <code>${esc(v.dark)}</code>` : `<code>${esc(v)}</code>`}`;
  }

  function specTables(c) {
    const out = [];
    const table = (caption, head, rows) => rows.length ? `<div class="demo-spec" role="region" aria-label="${esc(caption)}" tabindex="0">
  <table>
    <caption>${caption}</caption>
    <thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead>
    <tbody>
${rows.map((r) => `      <tr>${r.map((cell, j) => (j === 0 ? `<th scope="row">${cell}</th>` : `<td data-label="${esc(head[j])}">${cell}</td>`)).join('')}</tr>`).join('\n')}
    </tbody>
  </table>
</div>` : '';
    if (c.layer === 'utility') {
      out.push(table('Utilities', ['Class', 'What it does'], (c.classes ?? []).map((u) => [`<code>${esc(u.name)}</code>`, esc(u.description)])));
      return out.filter(Boolean).join('\n');
    }
    if (c.tags) out.push(`<p><span class="demo-part__key">Apply to</span> ${c.tags.map((t) => `<code>&lt;${esc(t)}&gt;</code>`).join(' ')}</p>`);
    out.push(table('Modifiers', ['Class', 'Group', 'What it does'], (c.modifiers ?? []).flatMap((m) => m.values.map((v) => [`<code>${esc(c.block)}--${esc(v.name)}</code>`, `${esc(m.group)}${m.exclusive ? ' (pick one)' : ''}`, esc(v.description)]))));
    out.push(table('Elements', ['Class', 'On', 'What it does'], (c.elements ?? []).map((e) => [`<code>${esc(c.block)}__${esc(e.name)}</code>${e.required ? ' <span class="demo-spec__muted">required</span>' : ''}`, (e.tags ?? []).map((t) => `<code>&lt;${esc(t)}&gt;</code>`).join(' ') || '–', esc(e.description)])));
    out.push(table('Custom properties', ['Property', 'Default', 'What it does'], (c.customProperties ?? []).map((p) => [`<code>${esc(p.name)}</code>`, `<code>${esc(p.default)}</code>`, esc(p.description)])));
    if (c.layer !== 'layout') {
      out.push(table('States', ['State', 'Meaning', 'Pair it with'], (c.states ?? []).map((s) => [`<code>${esc(stateLabel(s))}</code>`, esc(s.description), s.pair ? pairText(s.pair) : '–'])));
      const tokenTable = table('Tokens', ['Token', 'Value (light / dark)'], (c.tokens ?? []).map((t) => [`<code>${esc(t)}</code>`, tokenValue(t)]));
      if (tokenTable) out.push(c.tokens.length >= FOLD_MIN ? disclosure(`Show tokens <span class="demo-details__count">${c.tokens.length}</span>`, tokenTable) : tokenTable);
    }
    return out.filter(Boolean).join('\n');
  }

  function partSheet(c, index) {
    const g = c.guidelines ?? {};
    const rel = '../';
    const example = buildExample(c);
    const layerName = { layout: 'Layout', component: 'Component', utility: 'Utilities' }[c.layer];
    const parts = [];
    const rail = [];
    const add = (id, title, body, cls) => { rail.push([id, title]); parts.push(section(id, rail.length, title, body, cls)); };

    if (g.whenToUse?.length || g.whenNotToUse?.length) {
      add('pick', 'Pick this part', `<div class="demo-pick">
  <div class="demo-pick__col">
    <p class="demo-check__label">${c.status === 'deprecated' ? 'Existing markup only' : `Pick ${esc(c.block === 'u-*' ? 'a utility' : c.block)} for`}</p>
    <ul class="demo-pick__list">${(g.whenToUse ?? []).map((x) => `<li>${rich(x)}</li>`).join('')}</ul>
  </div>
  <div class="demo-pick__col demo-pick__col--other">
    <p class="demo-check__label">Pick another part for</p>
    <ul class="demo-pick__list">${(g.whenNotToUse ?? []).map((x) => `<li>${rich(x)}</li>`).join('')}</ul>
  </div>
</div>`);
    }

    const steps = buildSteps(c);
    const openReal = c.block === 'c-modal'
      ? '\n<div class="l-cluster demo-stage-actions">\n  <button type="button" class="c-button c-button--secondary" data-open-dialog="demo-dialog">Open as a real dialog</button>\n</div>'
      : '';
    add('build', 'Build it', `<ol class="demo-build-steps">${steps.map((s) => `<li><span>${s}</span></li>`).join('')}</ol>${example ? `\n<div class="demo-sheet__stage">\n  <svg class="demo-arrow" viewBox="0 0 120 40" aria-hidden="true" focusable="false"><path d="M4 8 C 40 8, 70 30, 108 30" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="6 5"/><path d="M100 22 L110 30 L100 38" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>\n${indent(stage(example, 'build', 'ex'), 2)}\n</div>${openReal}\n${code(example, { fold: true })}` : ''}`);

    // The icon sheet shows the whole set, each with the id to reference.
    if (c.block === 'c-icon') {
      add('set', 'The set', `<p class="demo-step__text">Every icon in <code>dist/mcss-lite.icons.svg</code>, at the large size (<code>c-icon--lg</code>). Reference one with <code>&lt;use href="#${ICON_PREFIX}name"&gt;</code>.</p>
<ul class="demo-icon-set" role="list">
${loadIcons(root).map((i) => `  <li class="demo-icon-set__item"><svg class="c-icon c-icon--lg" aria-hidden="true" focusable="false"><use href="#${ICON_PREFIX}${i.name}"></use></svg><code>${esc(i.name)}</code></li>`).join('\n')}
</ul>`);
    }

    if (g.doDont?.length) {
      add('check', 'Check your build', `<p class="demo-step__text">Each piece that doesn't fit was run through <code>mcss-lite validate</code> when this page was built. The output below is real.</p>
<div class="demo-checks">
${checkPanels(c)}
</div>`);
    }

    add('spec', 'Spec sheet', specTables(c) || '<p>This part has no modifiers, elements or states.</p>');

    const safe = [];
    if (c.a11y?.length) safe.push(`<ul class="demo-safe__list">${c.a11y.map((x) => `<li>${rich(x)}</li>`).join('')}</ul>`);
    if (c.keyboard?.length) {
      safe.push(`<div class="demo-spec" role="region" aria-label="Keyboard" tabindex="0">
  <table>
    <caption>Keyboard</caption>
    <thead><tr><th scope="col">Key</th><th scope="col">What it does</th></tr></thead>
    <tbody>
${c.keyboard.map((k) => `      <tr><th scope="row"><kbd>${esc(k.key)}</kbd></th><td data-label="What it does">${esc(k.action)}</td></tr>`).join('\n')}
    </tbody>
  </table>
</div>`);
    }
    if (safe.length) add('safe', 'Accessibility', safe.join('\n'));

    if (g.content?.length) add('words', 'Wording', `<ol class="demo-notices demo-notices--compact">${g.content.map((x) => `<li>${rich(x)}</li>`).join('')}</ol>\n<p><a href="${rel}content.html">All content rules</a></p>`);

    const related = (c.related ?? []).map((b) => byBlock.get(b)).filter(Boolean);
    const fits = related.length
      ? `\n    <section class="demo-sheet__sources l-container" aria-labelledby="fits-title">
      <h2 class="demo-sheet__sources-title" id="fits-title">Fits with</h2>
      <ul class="demo-bag__list demo-fits" role="list">${related.map((r) => `<li class="demo-bag__part"><a class="demo-bag__link" href="${sheetFile(r)}">${glyph(r.block)}<code>${esc(r.block)}</code></a></li>`).join('')}</ul>
    </section>`
      : '';

    const prev = sheets[index - 1];
    const next = sheets[index + 1];
    const deprecated = c.status === 'deprecated'
      ? `\n          <div class="c-alert c-alert--warning">
            <span class="c-alert__icon"><svg class="c-icon" aria-hidden="true" focusable="false"><use href="#${ICON_PREFIX}warning"></use></svg></span>
            <div class="c-alert__body">
              <p class="c-alert__title"><span class="u-sr-only">Warning: </span>This part was replaced</p>
              <p>Use ${rich(`\`${c.replacement}\``)} in new code. <code>${esc(c.block)}</code> keeps working until 1.0.</p>
            </div>
          </div>`
      : '';
    const sources = c.sources?.length
      ? `\n    <section class="demo-sheet__sources l-container" aria-labelledby="sources-title">
      <h2 class="demo-sheet__sources-title" id="sources-title">Researched from</h2>
      <ul class="demo-sheet__sources-list">${c.sources.map((s) => `<li><a href="${esc(s.url)}">${esc(s.title)}</a></li>`).join('')}</ul>
    </section>`
      : '';

    const specimen = example ? firstBlock(example) : null;
    const main = `    <header class="demo-sheet__head">
      <div class="l-container demo-sheet__head-grid">
        <div class="l-stack l-stack--sm">
          <div class="demo-sheet__titlebar">
            <span class="demo-sheet__mark">${glyph(c.block)}</span>
            <h1 class="demo-sheet__title">${esc(c.name)} <span class="demo-sheet__id">${esc(c.block)}</span></h1>
          </div>
          <div class="l-cluster">${sticker(c.status)}<span class="demo-sheet__since">${layerName}${c.since ? ` · since ${esc(c.since)}` : ''}</span></div>
          ${c.status === 'deprecated' ? deprecated.trim() : `<p class="demo-hero__lede">${rich(c.description)}</p>`}
        </div>${specimen ? `\n        <div class="demo-sheet__specimen">\n${indent(stage(specimen, 'build', 'hd', { preview: true }), 10)}\n        </div>` : ''}
      </div>
    </header>
${RAIL_SLOT}

${parts.join('\n\n')}
${fits}${sources}
    <nav class="demo-sheet__pager l-container" aria-label="Part sheets">
      ${prev ? `<a class="demo-sheet__prev" href="${sheetFile(prev)}"><span aria-hidden="true">←</span> <code>${esc(prev.block)}</code></a>` : '<span></span>'}
      <a href="${rel}status.html">All parts</a>
      ${next ? `<a class="demo-sheet__next" href="${sheetFile(next)}"><code>${esc(next.block)}</code> <span aria-hidden="true">→</span></a>` : `<a class="demo-sheet__next" href="${rel}content.html">Read before you build <span aria-hidden="true">→</span></a>`}
    </nav>`;

    return shell({
      title: `${c.name} (${c.block})`,
      description: `${c.name}: ${c.description}`,
      rel,
      rail,
      main,
      extra: c.block === 'c-modal' ? realDialog(readFileSync(join(root, 'components', 'modal.html'), 'utf8').trim()) : '',
    });
  }

  // ---------- parts inventory ----------

  function inventoryPage() {
    const bag = (n, title, list) => `<div class="demo-bag demo-bag--wide">
  <h2 class="demo-bag__head"><span class="demo-bag__num" aria-hidden="true">${n}</span> ${title} <span class="demo-bag__count">${partCount(list)}</span></h2>
  <div class="demo-spec demo-inventory-table">
    <table>
      <caption class="u-sr-only">${title}</caption>
      <thead><tr><th scope="col">Part</th><th scope="col">Status</th><th scope="col">Since</th><th scope="col">Notes</th></tr></thead>
      <tbody>
${list.map((c) => `        <tr><th scope="row"><a class="demo-bag__link demo-inventory-table__part" href="components/${sheetFile(c)}">${glyph(c.block)}<code>${esc(c.block)}</code></a></th><td data-label="Status">${sticker(c.status)}</td><td data-label="Since">${esc(c.since ?? '–')}</td><td data-label="Notes">${c.status === 'deprecated' ? `Use ${rich(`\`${c.replacement}\``, 'components/')}` : esc(firstSentence(c.description))}</td></tr>`).join('\n')}
      </tbody>
    </table>
  </div>
</div>`;
    const layouts = contracts.filter((c) => c.layer === 'layout');
    const components = contracts.filter((c) => c.layer === 'component');
    const utilities = contracts.filter((c) => c.layer === 'utility');
    const tokensBag = `<div class="demo-bag demo-bag--wide">
  <h2 class="demo-bag__head"><span class="demo-bag__num" aria-hidden="true">4</span> Tokens <span class="demo-bag__count">${tokenRows.filter((t) => t.tier !== 'primitive').length} to use</span></h2>
  <p class="demo-bag__note">${tokenNote(tokenRows)} Every token with its light and dark value is in <a href="../llms-tokens.txt"><code>llms-tokens.txt</code></a>; each part sheet lists the tokens it reads.</p>
</div>`;
    const main = `    <header class="demo-sheet__head">
      <div class="l-container l-stack l-stack--sm">
        <h1 class="demo-sheet__title">Parts inventory</h1>
        <p class="demo-hero__lede">The back of the booklet: every part MCSS-Lite ships, with its status. Anything not listed here doesn't exist, and <code>mcss-lite validate</code> rejects it.</p>
        <ul class="l-cluster demo-legend" role="list">
${Object.entries(LEGEND).filter(([st]) => contracts.some((c) => c.status === st)).map(([st, text]) => `          <li>${sticker(st)} ${text}</li>`).join('\n')}
        </ul>
      </div>
    </header>
    <section class="demo-step demo-sheet__section" aria-label="All parts">
      <div class="l-container l-stack">
${indent([bag(1, 'Layouts', layouts), bag(2, 'Components', components), bag(3, 'Utilities', utilities), tokensBag].join('\n'), 8)}
      </div>
    </section>`;
    return shell({ title: 'Parts inventory', description: 'Every MCSS-Lite part with its status.', rel: '', rail: [], main, current: 'status.html' });
  }

  // ---------- read before you build ----------

  function contentPage() {
    const main = `    <header class="demo-sheet__head">
      <div class="l-container l-stack l-stack--sm">
        <h1 class="demo-sheet__title">${esc(content.title)}</h1>
        <p class="demo-hero__lede">${rich(content.intro, 'components/')}</p>
      </div>
    </header>
    <section class="demo-step demo-sheet__section" aria-labelledby="rules-title">
      <div class="l-container l-stack">
        <h2 class="u-sr-only" id="rules-title">Content rules</h2>
        <ol class="demo-notices" role="list">
${content.rules.map((r, i) => `          <li class="demo-notice" id="${esc(r.id)}">
            <p class="demo-notice__num" aria-hidden="true">${i + 1}</p>
            <div class="l-stack l-stack--sm">
              <h3 class="demo-notice__title">${esc(r.title)}</h3>
              <p>${rich(r.text)}</p>
              <div class="demo-notice__pair">
                <p class="demo-notice__do">${CHECK_ICON}<span class="u-sr-only">Do: </span>${esc(r.do)}</p>
                <p class="demo-notice__dont">${CROSS_ICON}<span class="u-sr-only">Don't: </span>${esc(r.dont)}</p>
              </div>${r.enforcedBy ? `\n              <p class="demo-notice__checked">Checked by <code>mcss-lite validate</code> <code>[${esc(r.enforcedBy)}]</code></p>` : ''}
            </div>
          </li>`).join('\n')}
        </ol>
      </div>
    </section>`;
    return shell({ title: content.title, description: content.intro, rel: '', rail: [], main, current: 'content.html', source: '<code>guidelines/content.json</code>' });
  }
}

// Bare class names in prose (c-button, l-stack__x, u-sr-only) render as code.
const autoCode = (s) => s.replace(/(^|[\s(])([clu]-[a-z0-9]+(?:(?:--|__|-)[a-z0-9]+)*)(?=[\s.,;:)]|$)/g, '$1`$2`');

// The first complete block of an example: blank-line chunks joined until every tag they open is closed,
// so a header specimen never leaves a <form> or a grid open.
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const firstBlock = (html) => {
  let depth = 0;
  const out = [];
  for (const chunk of html.split(/\n\s*\n/)) {
    out.push(chunk);
    for (const [, close, tag, self] of chunk.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<(\/)?([a-z][a-z0-9-]*)\b[^>]*?(\/)?>/gi)) {
      if (VOID.has(tag.toLowerCase()) || self) continue;
      depth += close ? -1 : 1;
    }
    if (depth <= 0) break;
  }
  return out.join('\n\n');
};

const firstSentence = (s) => s.split(/(?<=\.)\s/)[0];


// A state's pair, with attribute and class names set as code.
const pairText = (s) => esc(s).replace(/(aria-[a-z]+(?:=&quot;[^&]*&quot;)?|\bdisabled(?= attribute)|&lt;[a-z]+&gt;|\bhref\b|[clu]-[a-z0-9]+(?:(?:--|__|-)[a-z0-9]+)*)/g, '<code>$1</code>');

// Checks the guidance examples: every "do" validates cleanly, every "don't" that names a rule triggers it.
export function checkGuidance(contracts, root) {
  const validate = createValidator(contracts, { icons: loadIcons(root).map((i) => i.name) });
  const errors = [];
  for (const c of contracts) {
    (c.guidelines?.doDont ?? []).forEach((pair, i) => {
      if (pair.do.html) {
        for (const x of validate(pair.do.html)) errors.push(`components/${c.file}: doDont[${i}].do.html: ${x.level}: ${x.message}`);
      }
      if (pair.dont.rule) {
        if (!pair.dont.html) errors.push(`components/${c.file}: doDont[${i}].dont names rule "${pair.dont.rule}" but has no html`);
        else if (!validate(pair.dont.html).some((x) => x.rule === pair.dont.rule)) {
          errors.push(`components/${c.file}: doDont[${i}].dont.html does not trigger [${pair.dont.rule}]`);
        }
      }
    });
  }
  return errors;
}

export const pageExists = (root, rel) => existsSync(join(root, rel));
