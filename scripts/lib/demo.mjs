// Builds demo/index.html from demo/steps.json, the contracts and their canonical examples.
// The page is an instruction booklet: a parts inventory, then numbered steps that seat each block.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createValidator } from './validate.mjs';
import { classInventory, stateLabel } from './contracts.mjs';
import { cdnUrl, gitSpec } from './release.mjs';
import { loadIcons, inlineSprite, ICON_PREFIX } from './icons.mjs';

// Authored part glyphs: one per block, drawn in the 2px ink keyline (24px grid).
const GLYPHS = {
  'l-center': '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M8 12h8"/>',
  'l-cluster': '<rect x="3" y="7" width="5" height="4" rx="1"/><rect x="10" y="7" width="5" height="4" rx="1"/><rect x="17" y="7" width="4" height="4" rx="1"/><rect x="3" y="14" width="6" height="4" rx="1"/>',
  'l-container': '<rect x="2" y="4" width="20" height="16" rx="1"/><path d="M6 4v16M18 4v16"/>',
  'l-grid': '<rect x="3" y="4" width="5" height="7" rx="1"/><rect x="9.5" y="4" width="5" height="7" rx="1"/><rect x="16" y="4" width="5" height="7" rx="1"/><rect x="3" y="13" width="5" height="7" rx="1"/><rect x="9.5" y="13" width="5" height="7" rx="1"/>',
  'l-section': '<path d="M2 6h20M2 18h20"/><rect x="6" y="9" width="12" height="6" rx="1"/>',
  'l-sidebar': '<rect x="3" y="4" width="6" height="16" rx="1"/><rect x="11" y="4" width="10" height="16" rx="1"/>',
  'l-stack': '<rect x="4" y="3" width="16" height="4" rx="1"/><rect x="4" y="10" width="16" height="4" rx="1"/><rect x="4" y="17" width="16" height="4" rx="1"/>',
  'l-switcher': '<rect x="3" y="4" width="7" height="7" rx="1"/><rect x="14" y="4" width="7" height="7" rx="1"/><path d="M7 15v4h10v-4"/><path d="M15 17l2 2 2-2"/>',
  'c-badge': '<rect x="3" y="8" width="18" height="8" rx="4"/><path d="M8 12h8"/>',
  'c-button': '<rect x="3" y="6" width="18" height="10" rx="2"/><path d="M5 19h14"/><path d="M8 11h8"/>',
  'c-card': '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h7M3 16h18"/>',
  'c-form-field': '<path d="M4 5h7"/><rect x="3" y="8" width="18" height="7" rx="1"/><path d="M4 19h10"/>',
  'c-input': '<rect x="3" y="7" width="18" height="10" rx="1"/><path d="M7 10v4"/>',
  'c-modal': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M16 6l2 2M18 6l-2 2"/>',
  'c-label': '<path d="M4 8h10"/><path d="M4 15h16" stroke-dasharray="3 3"/>',
  'c-checkbox': '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12.5l3 3 5-6"/>',
  'c-radio': '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  'c-toggle': '<rect x="2" y="7" width="20" height="10" rx="2"/><rect x="13" y="9.5" width="6" height="5" rx="1"/>',
  'c-alert': '<rect x="2" y="5" width="20" height="14" rx="1"/><rect x="5" y="8" width="5" height="5" rx="1"/><path d="M13 9h6M13 13h4M2 19h20"/>',
  'c-icon': '<rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="2 3"/><path d="M8 12.5l3 3 5-6"/>',
  'u-*': '<rect x="4" y="10" width="16" height="6" rx="1"/><path d="M7 10V7h3v3M14 10V7h3v3"/>',
};
export const glyph = (block) => (GLYPHS[block]
  ? `<svg class="demo-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${GLYPHS[block]}</svg>`
  : '');

export const tag = (n) => (n > 0
  ? `<span class="demo-count"><span aria-hidden="true">${n}×</span><span class="u-sr-only">, used ${n} time${n === 1 ? '' : 's'} in this build</span></span>`
  : '');

const CHECK_MARK = '<svg class="demo-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12.5l5 5L20 6.5"/></svg>';
const CROSS_MARK = '<svg class="demo-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>';

// The misfit: a brick whose studs miss the baseplate, next to one seated flush. Drawn in the keyline.
export const MISFIT_SVG = `<svg class="demo-misfit" viewBox="0 22 320 90" role="img" aria-labelledby="misfit-title" focusable="false">
  <title id="misfit-title">A brick tilted off its baseplate next to a brick seated flush</title>
  <g fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round">
    <rect x="8" y="92" width="136" height="16" rx="3"/>
    <path d="M24 92v-6h12v6M52 92v-6h12v6M80 92v-6h12v6M108 92v-6h12v6"/>
    <g class="demo-misfit__bad" transform="rotate(-13 76 58)">
      <g class="demo-misfit__wobble">
        <rect x="34" y="44" width="84" height="30" rx="3" stroke-dasharray="7 5"/>
        <path d="M44 44v-7h12v7M68 44v-7h12v7M92 44v-7h12v7"/>
      </g>
    </g>
    <rect x="176" y="92" width="136" height="16" rx="3"/>
    <path d="M192 92v-6h12v6M220 92v-6h12v6M248 92v-6h12v6M276 92v-6h12v6"/>
    <g class="demo-misfit__good">
      <rect x="186" y="56" width="112" height="30" rx="3"/>
      <path d="M196 56v-7h12v7M224 56v-7h12v7M252 56v-7h12v7M280 56v-7h12v7"/>
    </g>
  </g>
</svg>`;

// The top bar on every booklet page: wordmark, the three pages (the current one marked) and the theme switch.
const PAGES = [['index.html', 'Booklet'], ['status.html', 'Parts inventory'], ['content.html', 'Read before you build']];
export function demoBar(pkg, rel, current) {
  return `<header class="demo-bar">
    <div class="l-container demo-bar__inner">
      <p class="demo-wordmark"><a class="demo-wordmark__link" href="${rel}index.html">MCSS-Lite</a> <span class="demo-wordmark__version">${esc(pkg.version)}</span></p>
      <nav class="demo-bar__nav" aria-label="Booklet">
        <ul class="l-cluster demo-bar__links" role="list">
${PAGES.map(([href, label]) => `          <li><a href="${rel}${href}"${href === current ? ' aria-current="page"' : ''}>${label}</a></li>`).join('\n')}
        </ul>
      </nav>
      <div class="l-cluster" role="group" aria-label="Theme">
        <button type="button" class="c-button c-button--sm" data-theme-choice="light" aria-pressed="true">Light</button>
        <button type="button" class="c-button c-button--sm" data-theme-choice="dark" aria-pressed="false">Dark</button>
        <button type="button" class="c-button c-button--sm" data-theme-choice="auto" aria-pressed="false">System</button>
      </div>
    </div>
  </header>`;
}

// Files that read best on GitHub (rendered Markdown, a browsable folder), pinned to this release's tag.
const repoUrl = (pkg, kind, path) => `https://github.com/gabrielcpule/mcss-lite/${kind}/v${pkg.version}/${path}`;

// Bag counts shared by the booklet and the parts inventory: deprecated parts aren't parts to build with,
// and the utilities block counts its classes.
export const partCount = (list) => {
  if (list.length === 1 && list[0].layer === 'utility') return `${list[0].classes.length} classes`;
  const live = list.filter((c) => c.status !== 'deprecated').length;
  const old = list.length - live;
  return `${live} part${live === 1 ? '' : 's'}${old ? ` + ${old} deprecated` : ''}`;
};

export const tokenNote = (tokenRows) => {
  const semantic = tokenRows.filter((t) => t.tier === 'semantic').length;
  const component = tokenRows.filter((t) => t.tier === 'component').length;
  return `${semantic} semantic and ${component} component tokens, built on ${tokenRows.length - semantic - component} primitives you don't use directly.`;
};

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Escaped text with every hyphenated name (class, modifier, attribute) kept on one line,
// so code and validator messages wrap between names, never inside one.
export const codeTokens = (text) => esc(text).replace(/[A-Za-z0-9_:.#]*(?:-{1,2}[A-Za-z0-9_:.#]+)+/g, '<span class="demo-code__token">$&</span>');

export const indent = (s, n) => s.split('\n').map((l) => (l ? ' '.repeat(n) + l : l)).join('\n');

// A wrong piece an agent might invent, checked by the real validator at build time.
const WRONG_PIECE = '<button class="c-button c-button--warning" data-state="error">Retry</button>';

// The finale: a whole form an agent might write from memory, and the rebuilt one. Both are
// validated at build time; the build fails if the wrong one stops failing or the right one does.
const FINALE_WRONG = `<form class="c-form">
  <input class="c-input" type="email" placeholder="Work email">
  <p style="color: #d93025">We never share your email.</p>
  <button class="c-button c-button--primary">Submit</button>
</form>`;
const FINALE_RIGHT = `<form class="l-stack">
  <div class="c-form-field">
    <label class="c-form-field__label" for="signup-email">Work email</label>
    <input class="c-input" type="email" id="signup-email" aria-describedby="signup-email-help">
    <p class="c-form-field__help" id="signup-email-help">We never share your email.</p>
  </div>
  <div class="l-cluster">
    <button type="submit" class="c-button c-button--primary">Create account</button>
  </div>
</form>`;

const tally = (issues) => ['error', 'warning'].map((level) => {
  const n = issues.filter((i) => i.level === level).length;
  return n ? `${n} ${level}${n === 1 ? '' : 's'}` : '';
}).filter(Boolean).join(', ');

// The step preview is always visible in page flow, so it must not claim aria-modal.
const inlinePreview = (html) => {
  if (!html.includes(' aria-modal="true"')) throw new Error('modal.html changed: cannot build the inline preview');
  return html.replace(' aria-modal="true"', '');
};

// Apply string rewrites and fail the build if any expected marker is missing afterwards.
function mustRewrite(source, rewrite, markers) {
  const out = rewrite(source);
  const missing = markers.filter((m) => !out.includes(m));
  if (missing.length) throw new Error(`components/modal.html changed; demo dialog rewrite lost: ${missing.join(', ')}`);
  return out;
}

// The canonical modal example as a native <dialog> the page can open for real.
export function realDialog(modalExample) {
  return mustRewrite(modalExample, (m) => m
    .replace(/^<div class="c-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">/, '<dialog class="c-modal" id="demo-dialog" aria-labelledby="demo-dialog-title">')
    .replace(/<\/div>\s*$/, '</dialog>')
    .replace('<div class="c-modal__backdrop"></div>', '')
    .replace('id="delete-title"', 'id="demo-dialog-title"')
    .replace('Atlas and its 42 files', 'Borealis and its 7 files')
    .replace(/<button type="button" class="c-modal__close"/, '<button type="button" class="c-modal__close" data-close-dialog')
    .replace(/<button type="button" class="c-button c-button--ghost">/, '<button type="button" class="c-button c-button--ghost" data-close-dialog>')
    .replace(/<button type="button" class="c-button c-button--danger">/, '<button type="button" class="c-button c-button--danger" data-close-dialog>'), ['<dialog class="c-modal"', '</dialog>', 'demo-dialog-title', 'data-close-dialog>', 'Borealis']);
}

export function loadBooklet(root) {
  return JSON.parse(readFileSync(join(root, 'demo', 'steps.json'), 'utf8'));
}

export function loadSteps(root) {
  return loadBooklet(root).steps;
}

// Blocks that must appear in the booklet: every stable contract.
export function uncoveredBlocks(contracts, steps) {
  const covered = new Set(steps.flatMap((s) => s.blocks));
  return contracts.filter((c) => c.status !== 'deprecated' && !covered.has(c.block)).map((c) => c.block);
}

export function buildDemo(root, pkg, contracts, tokenRows) {
  const { steps, author } = loadBooklet(root);
  const byBlock = new Map(contracts.map((c) => [c.block, c]));
  const example = (file) => readFileSync(join(root, 'components', file), 'utf8').trim();
  const validate = createValidator(contracts, { icons: loadIcons(root).map((i) => i.name) });
  const wrongIssues = validate(WRONG_PIECE).filter((i) => i.level === 'error');
  const finaleIssues = validate(FINALE_WRONG);
  if (finaleIssues.length < 4) throw new Error('demo finale: the wrong form should fail four ways');
  if (validate(FINALE_RIGHT).length) throw new Error('demo finale: the rebuilt form must validate cleanly');

  const layouts = contracts.filter((c) => c.layer === 'layout');
  const allComponents = contracts.filter((c) => c.layer === 'component');
  const components = allComponents.filter((c) => c.status !== 'deprecated');
  const utilities = contracts.filter((c) => c.layer === 'utility');
  const semantic = tokenRows.filter((t) => t.tier === 'semantic');
  const componentTokens = tokenRows.filter((t) => t.tier === 'component');
  const swatches = ['--color-action-primary', '--color-action-danger', '--color-focus-halo', '--color-background-callout', '--color-background-canvas', '--color-text-default'];
  const inventory = classInventory(contracts);

  const sheet = (c) => `components/${c.file.replace(/\.json$/, '.html')}`;
  const partList = (list) => list.map((c) => `<li class="demo-bag__part"><a class="demo-bag__link" href="${sheet(c)}">${glyph(c.block)}<code>${esc(c.block)}</code></a></li>`).join('');

  // How many times a block is used in the step's canonical example: the booklet's "1x" count tag.
  const countIn = (html, block) => {
    if (block === 'u-*') return [...html.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)).filter((cls) => cls.startsWith('u-')).length;
    const re = new RegExp(`class="[^"]*(?<![\\w-])${block.replace(/[-]/g, '\\-')}(?![\\w-])`, 'g');
    return (html.match(re) || []).length;
  };

  // Every MCSS-Lite part present in a stage, with how often it appears.
  const partsIn = (html) => {
    const counts = new Map();
    for (const m of html.matchAll(/class="([^"]*)"/g)) {
      for (const cls of m[1].split(/\s+/)) {
        const info = inventory.get(cls);
        if (!info) continue;
        const key = info.kind === 'utility' ? cls : info.block;
        if (info.kind === 'block' || info.kind === 'utility') counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return counts;
  };

  const callout = (block, html) => {
    const c = byBlock.get(block);
    if (!c) throw new Error(`demo/steps.json names unknown block ${block}`);
    if (c.layer === 'utility') {
      const used = c.classes.filter((u) => countIn(html, u.name) > 0);
      return `<li class="demo-part"><span class="demo-part__head"><a class="demo-part__link" href="${sheet(c)}"><code class="demo-part__name">u-*</code></a>${tag(countIn(html, 'u-*'))}</span><span class="demo-part__meta"><span class="demo-part__row"><span class="demo-part__key">Used here</span> ${used.map((u) => `<code>${esc(u.name)}</code>`).join(' ')}</span><span class="demo-part__row"><a href="${sheet(c)}">${c.classes.length - used.length} more on the utilities sheet</a></span></span></li>`;
    }
    const mods = (c.modifiers ?? []).flatMap((m) => m.values.map((v) => `<code>--${esc(v.name)}</code>`)).join(' ');
    const els = (c.elements ?? []).map((e) => `<code>__${esc(e.name)}</code>`).join(' ');
    const states = (c.states ?? []).map((s) => `<code>${esc(stateLabel(s))}</code>`).join(' ');
    const meta = [
      mods && `<span class="demo-part__row"><span class="demo-part__key">Modifiers</span> ${mods}</span>`,
      els && `<span class="demo-part__row"><span class="demo-part__key">Elements</span> ${els}</span>`,
      states && `<span class="demo-part__row"><span class="demo-part__key">States</span> ${states}</span>`,
    ].filter(Boolean).join('');
    return `<li class="demo-part"><span class="demo-part__head"><a class="demo-part__link" href="${sheet(c)}">${glyph(c.block)}<code class="demo-part__name">${esc(c.block)}</code></a>${tag(countIn(html, c.block))}</span>${meta ? `<span class="demo-part__meta">${meta}</span>` : ''}</li>`;
  };

  const stepHtml = (s, n) => {
    const isModal = s.blocks.includes('c-modal');
    const stageClass = ['demo-stage', isModal && 'demo-stage--contain', s.wide && 'demo-stage--baseplate'].filter(Boolean).join(' ');
    // Stage links point back to this step so the demo never leads to a 404.
    const stage = (isModal ? inlinePreview(example(s.example)) : example(s.example)).replace(new RegExp(`href="(?!#${ICON_PREFIX})[^"]*"`, 'g'), `href="#step-${n}"`);
    const present = partsIn(example(s.example));
    const declared = new Set(s.blocks.flatMap((b) => (b === 'u-*' ? byBlock.get('u-*').classes.map((u) => u.name) : [b])));
    const also = [...present].filter(([k]) => !declared.has(k));
    const alsoHtml = also.length
      ? `<p class="demo-callout__also"><span class="demo-part__key">Also in this build</span> ${also.map(([k, count]) => `<span class="demo-also">${glyph(k)}<code>${esc(k)}</code>${tag(count)}</span>`).join(' ')}</p>`
      : '';
    const extra = isModal
      ? `\n<div class="l-cluster demo-stage-actions">\n  <button type="button" class="c-button c-button--secondary" data-open-dialog="demo-dialog">Open as a real dialog</button>\n</div>`
      : '';
    // wide: the stage spans the page with the call-out beside the text. inset: the same, with the call-out set onto the stage.
    const stepClass = ['demo-step', (s.wide || s.layout === 'inset') && 'demo-step--wide', s.layout === 'inset' && 'demo-step--inset'].filter(Boolean).join(' ');
    return `<section class="${stepClass}" id="step-${n}" aria-labelledby="step-${n}-title">
  <div class="l-container">
    <div class="demo-step__grid">
      <div class="demo-step__head">
        <p class="demo-step__numeral" aria-hidden="true">${n}</p>
        <h2 class="demo-step__title" id="step-${n}-title"><span class="u-sr-only">Step ${n}: </span>${esc(s.title)}</h2>
        <p class="demo-step__text">${esc(s.text)}</p>
        <div class="demo-callout">
          <p class="demo-callout__label">New parts${n === 1 ? ' <span class="demo-callout__hint">(× is how many times a part is used in this build)</span>' : ''}</p>
          <ul class="demo-parts" role="list">${s.blocks.map((b) => callout(b, example(s.example))).join('')}</ul>
          ${alsoHtml}
        </div>
      </div>
      <div class="demo-step__build">
        <svg class="demo-arrow" viewBox="0 0 120 40" aria-hidden="true" focusable="false"><path d="M4 8 C 40 8, 70 30, 108 30" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="6 5"/><path d="M100 22 L110 30 L100 38" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <figure class="${stageClass}"${isModal ? ' inert aria-hidden="true"' : ''}>
${indent(stage, 10)}
        </figure>${indent(extra, 8)}
      </div>
    </div>
  </div>
</section>`;
  };

  const dialog = realDialog(example('modal.html'));

  return `<!doctype html>
<!-- GENERATED by scripts/build.mjs from demo/steps.json and components/*.json. Do not edit. -->
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MCSS-Lite: build UI from declared parts</title>
  <meta name="description" content="${esc(pkg.description)}">
  <link rel="preload" href="fonts/rubik-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="../index.css">
  <link rel="stylesheet" href="demo.css">
</head>
<body class="demo">
${inlineSprite(loadIcons(root), pkg)}
  <a class="demo-skip" href="#main">Skip to the page</a>
  ${demoBar(pkg, '', 'index.html')}

  <main id="main">
    <section class="demo-hero" aria-labelledby="demo-title">
      <div class="l-container demo-hero__grid">
        <div class="demo-hero__claim">
          <h1 class="demo-hero__title" id="demo-title">Build UI from declared parts.</h1>
          <p class="demo-hero__lede">MCSS-Lite is a pure-CSS design system where every class, state and token is written down in a contract. People and AI agents read the same contract, and <code>mcss-lite validate</code> rejects any part that isn't in it.</p>
          <div class="demo-proof">
            <p class="demo-proof__guess"><span class="demo-proof__key">An agent guesses</span> <code>c-button--warning</code></p>
            <p class="demo-proof__verdict">${CROSS_MARK}<span><strong>error</strong> ${codeTokens(wrongIssues[0].message)}</span></p>
            <p><a href="#wrong-piece">See the piece that doesn't fit</a></p>
          </div>
          <div class="demo-install">
            <code class="demo-install__cmd" id="install-cmd">&lt;link rel="stylesheet" href="${cdnUrl(pkg).split('/').map(codeTokens).join('/<wbr>')}"&gt;</code>
            <button type="button" class="c-button c-button--sm" data-copy="install-cmd" data-copied="Stylesheet link copied.">Copy</button>
          </div>
          <p class="demo-install__alt">Or install it from GitHub: <code>npm install ${esc(gitSpec(pkg))}</code>. MCSS-Lite is not on the npm registry.</p>
          <ul class="demo-links" role="list">
            <li><a href="${repoUrl(pkg, 'blob', 'AGENTS.md')}">AGENTS.md: the rules for agents</a></li>
            <li><a href="../dist/mcss-lite.manifest.json">Manifest: every part as JSON</a></li>
            <li><a href="${repoUrl(pkg, 'tree', 'dist/figma')}">Figma variables: token import files</a></li>
          </ul>
        </div>

        <aside class="demo-inventory" aria-labelledby="inventory-title">
          <h2 class="demo-inventory__title" id="inventory-title">What's in the box</h2>
          <div class="demo-bag">
            <h3 class="demo-bag__head"><span class="demo-bag__num" aria-hidden="true">1</span> Layouts <span class="demo-bag__count">${layouts.length} parts</span></h3>
            <ul class="demo-bag__list" role="list">${partList(layouts)}</ul>
          </div>
          <div class="demo-bag">
            <h3 class="demo-bag__head"><span class="demo-bag__num" aria-hidden="true">2</span> Components <span class="demo-bag__count">${partCount(allComponents)}</span></h3>
            <ul class="demo-bag__list" role="list">${partList(components)}</ul>
          </div>
          <div class="demo-bag">
            <h3 class="demo-bag__head"><span class="demo-bag__num" aria-hidden="true">3</span> Utilities <span class="demo-bag__count">${partCount(utilities)}</span></h3>
            <ul class="demo-bag__list" role="list">${partList(utilities)}</ul>
          </div>
          <div class="demo-bag">
            <h3 class="demo-bag__head"><span class="demo-bag__num" aria-hidden="true">4</span> Tokens <span class="demo-bag__count">${semantic.length + componentTokens.length} to use</span></h3>
            <p class="demo-bag__note">${tokenNote(tokenRows)}</p>
            <ul class="demo-swatches" role="list">${swatches.map((v) => `<li class="demo-swatch"><span class="demo-swatch__chip" style="background-color: var(${v})"></span><code>${v}</code></li>`).join('')}</ul>
          </div>
        </aside>
      </div>
    </section>

    <nav class="demo-rail" aria-label="Build steps">
      <ol class="demo-rail__list" role="list" style="--demo-studs: ${steps.length + 1}">
${steps.map((st, i) => `        <li><a class="demo-rail__stud" href="#step-${i + 1}" data-rail="step-${i + 1}" data-label="${esc(st.title)}"><span class="u-sr-only">Step ${i + 1}: ${esc(st.title)}</span><span aria-hidden="true">${i + 1}</span></a></li>`).join('\n')}
        <li><a class="demo-rail__stud demo-rail__stud--wrong" href="#wrong-piece" data-rail="wrong-piece" data-label="This piece doesn't fit"><span class="u-sr-only">The piece that doesn't fit</span><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg></a></li>
      </ol>
      <p class="demo-rail__now" aria-hidden="true" data-rail-now></p>
    </nav>

${steps.map((s, i) => stepHtml(s, i + 1)).join('\n\n')}

    <section class="demo-step demo-wrong" id="wrong-piece" aria-labelledby="wrong-title">
      <div class="l-container l-stack l-stack--lg">
        <div class="demo-wrong__head">
          <div>
            <p class="demo-step__numeral demo-step__numeral--wrong" aria-hidden="true"><svg viewBox="0 0 48 48" focusable="false"><path d="M12 12l24 24M36 12L12 36" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/></svg></p>
            <h2 class="demo-wrong__title" id="wrong-title">This piece doesn't fit</h2>
            <p class="demo-step__text">An agent wrote this sign-up form from memory. <code>npx mcss-lite validate</code> found ${finaleIssues.length} problems, and the rebuilt form passes with 0 issues. Both results come from the real validator, run when this page was built.</p>
          </div>
          ${MISFIT_SVG}
        </div>
        <div class="demo-wrong__pair">
          <div class="demo-check l-stack">
            <p class="demo-check__label">What the agent wrote</p>
            <pre class="demo-code"><code>${codeTokens(FINALE_WRONG)}</code></pre>
            <p class="demo-check__label">validate: ${tally(finaleIssues)}</p>
            <ol class="demo-check__issues demo-wrong__issues" role="list">${finaleIssues.map((i) => `<li class="demo-check__issue--${esc(i.level)}"><span class="demo-wrong__line">Line ${i.line}</span> <strong>${esc(i.level)}</strong> ${codeTokens(i.message)} <code>[${esc(i.rule)}]</code></li>`).join('')}</ol>
          </div>
          <div class="demo-wrong__fit l-stack">
            <p class="demo-check__label">The piece that fits</p>
            <figure class="demo-stage">
${indent(FINALE_RIGHT, 14)}
            </figure>
            <pre class="demo-code"><code>${codeTokens(FINALE_RIGHT)}</code></pre>
            <p class="demo-checks__verdict">${CHECK_MARK}<span><code>validate</code>: 0 issues</span></p>
          </div>
        </div>
      </div>
    </section>

    <section class="demo-end" id="take-it" aria-labelledby="end-title">
      <div class="l-container demo-end__grid">
        <div class="demo-end__plate l-stack">
          <h2 class="demo-step__title" id="end-title">Take the parts with you</h2>
          <p class="demo-step__text">Point your agent at <code>AGENTS.md</code> before it writes markup, and run <code>npx mcss-lite validate</code> after every edit.</p>
          <ul class="demo-end__links" role="list">
            <li><a href="${repoUrl(pkg, 'blob', 'AGENTS.md')}">AGENTS.md</a> <span>The rules, every block and every token, for coding agents</span></li>
            <li><a href="../dist/mcss-lite.manifest.json">Manifest</a> <span>Every part and token as JSON, for tools</span></li>
            <li><a href="${repoUrl(pkg, 'tree', 'dist/figma')}">Figma variables</a> <span>Import files for the Primitives, Semantic and Component collections</span></li>
            <li><a href="https://github.com/gabrielcpule/mcss-lite">Source on GitHub</a> <span>Contracts, validator, tests and releases</span></li>
          </ul>
          <p class="demo-end__proof">Every build is checked: text and controls meet WCAG AA contrast in light and dark, every token name from 0.1.0 still exists, and every example on these pages passes the validator.</p>
          <p class="demo-end__author">Designed and built by <a href="${esc(author.url)}">${esc(author.name)}</a>.${author.caseStudy ? ` <a href="${esc(author.caseStudy)}">Read the case study</a> for the research and decisions behind it.` : ''}</p>
        </div>
        <div class="demo-end__fit l-stack">
          <h2 class="demo-end__fit-title" id="fit-title">Is this the right kit?</h2>
          <div class="demo-pick">
            <div class="demo-pick__col">
              <p class="demo-check__label">Good fit</p>
              <ul class="demo-pick__list">
                <li>UI written by coding agents: the contracts tell them what exists, and <code>mcss-lite validate</code> checks what they wrote.</li>
                <li>Server-rendered apps (Rails, Django, Laravel, htmx, Astro): plain classes work in any template, with no runtime JavaScript.</li>
                <li>Forms, settings and CRUD screens, internal tools and prototypes.</li>
              </ul>
            </div>
            <div class="demo-pick__col demo-pick__col--other">
              <p class="demo-check__label">Pick something else</p>
              <ul class="demo-pick__list">
                <li>Complex widgets such as comboboxes, date pickers and data grids: GitLab Pajamas, Primer or shadcn/ui ship them.</li>
                <li>A React component API with typed props: shadcn/ui or Primer React.</li>
                <li>Dense data products, or a brand that must not look like building bricks.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="demo-footer">
    <div class="l-container l-stack l-stack--sm">
      <p>Generated from <code>components/*.json</code> and <code>demo/steps.json</code> by <code>npm run build</code>, so this page can't drift from the contract.</p>
      <p>${esc(pkg.name)}@${esc(pkg.version)} · ${esc(pkg.license)}</p>
    </div>
  </footer>

  ${indent(dialog, 2).trim()}

  <p class="u-sr-only" role="status" data-copy-status></p>
  <script src="demo.js" defer></script>
</body>
</html>
`;
}
