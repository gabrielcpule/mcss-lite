// Builds demo/index.html from demo/steps.json, the contracts and their canonical examples.
// The page is an instruction booklet: a parts inventory, then numbered steps that seat each block.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createValidator } from './validate.mjs';
import { classInventory } from './contracts.mjs';

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
};
const glyph = (block) => (GLYPHS[block]
  ? `<svg class="demo-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${GLYPHS[block]}</svg>`
  : '');

const tag = (n) => (n > 0
  ? `<span class="demo-count"><span aria-hidden="true">${n}×</span><span class="u-sr-only">, used ${n} time${n === 1 ? '' : 's'} in this build</span></span>`
  : '');

// The misfit: a brick whose studs miss the baseplate, next to one seated flush. Drawn in the keyline.
const MISFIT_SVG = `<svg class="demo-misfit" viewBox="0 22 320 90" role="img" aria-labelledby="misfit-title" focusable="false">
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

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const indent = (s, n) => s.split('\n').map((l) => (l ? ' '.repeat(n) + l : l)).join('\n');

// A wrong piece an agent might invent, checked by the real validator at build time.
const WRONG_PIECE = '<button class="c-button c-button--warning" data-state="error">Retry</button>';
const RIGHT_PIECE = '<button type="button" class="c-button">Retry</button>';

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

export function loadSteps(root) {
  return JSON.parse(readFileSync(join(root, 'demo', 'steps.json'), 'utf8')).steps;
}

// Blocks that must appear in the booklet: every stable contract.
export function uncoveredBlocks(contracts, steps) {
  const covered = new Set(steps.flatMap((s) => s.blocks));
  return contracts.filter((c) => c.status !== 'deprecated' && !covered.has(c.block)).map((c) => c.block);
}

export function buildDemo(root, pkg, contracts, tokenRows) {
  const steps = loadSteps(root);
  const byBlock = new Map(contracts.map((c) => [c.block, c]));
  const example = (file) => readFileSync(join(root, 'components', file), 'utf8').trim();
  const validate = createValidator(contracts);
  const wrongIssues = validate(WRONG_PIECE).filter((i) => i.level === 'error');

  const layouts = contracts.filter((c) => c.layer === 'layout');
  const components = contracts.filter((c) => c.layer === 'component' && c.status !== 'deprecated');
  const semantic = tokenRows.filter((t) => t.tier === 'semantic');
  const componentTokens = tokenRows.filter((t) => t.tier === 'component');
  const swatches = ['--color-action-primary', '--color-action-danger', '--color-focus-ring', '--color-focus-halo', '--color-background-callout', '--color-text-default'];
  const inventory = classInventory(contracts);

  const partList = (list) => list.map((c) => `<li class="demo-bag__part">${glyph(c.block)}<code>${esc(c.block)}</code></li>`).join('');

  // How many times a block is used in the step's canonical example: the booklet's "1x" count tag.
  const countIn = (html, block) => {
    if (block === 'u-*') return (html.match(/class="[^"]*\bu-[a-z0-9-]+/g) || []).length;
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
      return `<li class="demo-part"><span class="demo-part__head"><code class="demo-part__name">u-*</code>${tag(countIn(html, 'u-*'))}</span><span class="demo-part__meta"><span class="demo-part__row"><span class="demo-part__key">Used here</span> ${used.map((u) => `<code>${esc(u.name)}</code>`).join(' ')}</span><span class="demo-part__row">${c.classes.length - used.length} more in AGENTS.md</span></span></li>`;
    }
    const mods = (c.modifiers ?? []).flatMap((m) => m.values.map((v) => `<code>--${esc(v.name)}</code>`)).join(' ');
    const els = (c.elements ?? []).map((e) => `<code>__${esc(e.name)}</code>`).join(' ');
    const states = (c.states ?? []).map((s) => `<code>data-state="${esc(s.name)}"</code>`).join(' ');
    const meta = [
      mods && `<span class="demo-part__row"><span class="demo-part__key">Modifiers</span> ${mods}</span>`,
      els && `<span class="demo-part__row"><span class="demo-part__key">Elements</span> ${els}</span>`,
      states && `<span class="demo-part__row"><span class="demo-part__key">States</span> ${states}</span>`,
    ].filter(Boolean).join('');
    return `<li class="demo-part"><span class="demo-part__head">${glyph(c.block)}<code class="demo-part__name">${esc(c.block)}</code>${tag(countIn(html, c.block))}</span>${meta ? `<span class="demo-part__meta">${meta}</span>` : ''}</li>`;
  };

  const stepHtml = (s, n) => {
    const isModal = s.blocks.includes('c-modal');
    const stageClass = ['demo-stage', isModal && 'demo-stage--contain', s.wide && 'demo-stage--baseplate'].filter(Boolean).join(' ');
    // Stage links point back to this step so the demo never leads to a 404.
    const stage = (isModal ? inlinePreview(example(s.example)) : example(s.example)).replace(/href="[^"]*"/g, `href="#step-${n}"`);
    const present = partsIn(example(s.example));
    const declared = new Set(s.blocks.flatMap((b) => (b === 'u-*' ? byBlock.get('u-*').classes.map((u) => u.name) : [b])));
    const also = [...present].filter(([k]) => !declared.has(k));
    const alsoHtml = also.length
      ? `<p class="demo-callout__also"><span class="demo-part__key">Also in this build</span> ${also.map(([k, count]) => `<span class="demo-also">${glyph(k)}<code>${esc(k)}</code>${tag(count)}</span>`).join(' ')}</p>`
      : '';
    const extra = isModal
      ? `\n<div class="l-cluster demo-stage-actions">\n  <button type="button" class="c-button c-button--secondary" data-open-dialog="demo-dialog">Open as a real dialog</button>\n</div>`
      : '';
    return `<section class="demo-step${s.wide ? ' demo-step--wide' : ''}" id="step-${n}" aria-labelledby="step-${n}-title">
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
        <div class="${stageClass}"${isModal ? ' inert aria-hidden="true"' : ''}>
${indent(stage, 10)}
        </div>${indent(extra, 8)}
      </div>
    </div>
  </div>
</section>`;
  };

  const modalExample = example('modal.html');
  const dialog = mustRewrite(modalExample, (m) => m
    .replace(/^<div class="c-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">/, '<dialog class="c-modal" id="demo-dialog" aria-labelledby="demo-dialog-title">')
    .replace(/<\/div>\s*$/, '</dialog>')
    .replace('<div class="c-modal__backdrop"></div>', '')
    .replace('id="delete-title"', 'id="demo-dialog-title"')
    .replace(/<button type="button" class="c-modal__close"/, '<button type="button" class="c-modal__close" data-close-dialog')
    .replace(/<button type="button" class="c-button c-button--ghost">/, '<button type="button" class="c-button c-button--ghost" data-close-dialog>')
    .replace(/<button type="button" class="c-button c-button--danger">/, '<button type="button" class="c-button c-button--danger" data-close-dialog>'), ['<dialog class="c-modal"', '</dialog>', 'demo-dialog-title', 'data-close-dialog>']);

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
  <a class="demo-skip" href="#step-1">Skip to the build</a>
  <header class="demo-bar">
    <div class="l-container demo-bar__inner">
      <p class="demo-wordmark">MCSS-Lite <span class="demo-wordmark__version">${esc(pkg.version)}</span></p>
      <div class="l-cluster" role="group" aria-label="Theme">
        <button type="button" class="c-button c-button--sm" data-theme-choice="light" aria-pressed="true">Light</button>
        <button type="button" class="c-button c-button--sm" data-theme-choice="dark" aria-pressed="false">Dark</button>
        <button type="button" class="c-button c-button--sm" data-theme-choice="auto" aria-pressed="false">System</button>
      </div>
    </div>
  </header>

  <nav class="demo-rail" aria-label="Build steps">
    <ol class="demo-rail__list" role="list">
${steps.map((st, i) => `      <li><a class="demo-rail__stud" href="#step-${i + 1}" data-rail="step-${i + 1}" data-label="${esc(st.title)}"><span class="u-sr-only">Step ${i + 1}: ${esc(st.title)}</span><span aria-hidden="true">${i + 1}</span></a></li>`).join('\n')}
      <li><a class="demo-rail__stud demo-rail__stud--wrong" href="#wrong-piece" data-rail="wrong-piece" data-label="This piece doesn't fit"><span class="u-sr-only">The piece that doesn't fit</span><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg></a></li>
    </ol>
  </nav>

  <main>
    <section class="demo-hero" aria-labelledby="demo-title">
      <div class="l-container demo-hero__grid">
        <div class="demo-hero__claim">
          <h1 class="demo-hero__title" id="demo-title">Build UI from declared parts.</h1>
          <p class="demo-hero__lede">MCSS-Lite is a pure-CSS design system where every class, state and token is written down in a contract. People and AI agents read the same contract, and <code>mcss-lite validate</code> rejects any part that isn't in it.</p>
          <div class="demo-install">
            <code class="demo-install__cmd" id="install-cmd">npm install ${esc(pkg.name)}</code>
            <button type="button" class="c-button c-button--sm" data-copy="install-cmd">Copy</button>
            <span class="u-sr-only" role="status" data-copy-status></span>
          </div>
          <ul class="demo-links" role="list">
            <li><a href="../AGENTS.md">AGENTS.md: the rules for agents</a></li>
            <li><a href="../dist/mcss-lite.manifest.json">Manifest: every part as JSON</a></li>
            <li><a href="../dist/figma/">Figma variables</a></li>
            <li><a href="https://github.com/gabrielcpule/mcss-lite">Source on GitHub</a></li>
          </ul>
        </div>

        <aside class="demo-inventory" aria-labelledby="inventory-title">
          <h2 class="demo-inventory__title" id="inventory-title">Parts inventory</h2>
          <div class="demo-bag">
            <p class="demo-bag__head"><span class="demo-bag__num" aria-hidden="true">1</span> Layouts <span class="demo-bag__count">${layouts.length} parts</span></p>
            <ul class="demo-bag__list" role="list">${partList(layouts)}</ul>
          </div>
          <div class="demo-bag">
            <p class="demo-bag__head"><span class="demo-bag__num" aria-hidden="true">2</span> Components <span class="demo-bag__count">${components.length} parts</span></p>
            <ul class="demo-bag__list" role="list">${partList(components)}</ul>
          </div>
          <div class="demo-bag">
            <p class="demo-bag__head"><span class="demo-bag__num" aria-hidden="true">3</span> Tokens <span class="demo-bag__count">${semantic.length + componentTokens.length} to use</span></p>
            <p class="demo-bag__note">${semantic.length} semantic and ${componentTokens.length} component tokens, built on ${tokenRows.length - semantic.length - componentTokens.length} primitives you don't use directly.</p>
            <ul class="demo-swatches" role="list">${swatches.map((v) => `<li class="demo-swatch"><span class="demo-swatch__chip" style="background-color: var(${v})"></span><code>${v}</code></li>`).join('')}</ul>
          </div>
        </aside>
      </div>
    </section>

${steps.map((s, i) => stepHtml(s, i + 1)).join('\n\n')}

    <section class="demo-step demo-wrong" id="wrong-piece" aria-labelledby="wrong-title">
      <div class="l-container">
        <div class="demo-step__grid">
          <div class="demo-step__head">
            <p class="demo-step__numeral demo-step__numeral--wrong" aria-hidden="true"><svg viewBox="0 0 48 48" focusable="false"><path d="M12 12l24 24M36 12L12 36" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/></svg></p>
            <h2 class="demo-step__title" id="wrong-title">This piece doesn't fit</h2>
            <p class="demo-step__text">An agent guessed a class. <code>npx mcss-lite validate</code> rejects it and names the parts that do exist. This output was produced by the real validator when this page was built.</p>
          </div>
          <div class="demo-step__build">
            <div class="demo-check l-stack">
              ${MISFIT_SVG}
              <p class="demo-check__label">Invented markup</p>
              <pre class="demo-code"><code>${esc(WRONG_PIECE)}</code></pre>
              <p class="demo-check__label">validate</p>
              <ul class="demo-check__issues" role="list">${wrongIssues.map((i) => `<li><strong>error</strong> ${esc(i.message)} <code>[${esc(i.rule)}]</code></li>`).join('')}</ul>
              <p class="demo-check__label">The piece that fits</p>
              <p class="demo-check__why">Retry isn't destructive, so it is the default button. <code>--danger</code> is only for actions that destroy something.</p>
              <pre class="demo-code"><code>${esc(RIGHT_PIECE)}</code></pre>
              <div class="l-cluster">
                ${RIGHT_PIECE}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="demo-footer">
    <div class="l-container l-stack l-stack--sm">
      <p>Generated from <code>components/*.json</code> and <code>demo/steps.json</code> by <code>npm run build</code>, so this page can't drift from the contract.</p>
      <p>${esc(pkg.name)}@${esc(pkg.version)} · ${esc(pkg.license)} · by ${esc(pkg.author)}</p>
    </div>
  </footer>

  ${indent(dialog, 2).trim()}

  <script src="demo.js" defer></script>
</body>
</html>
`;
}
