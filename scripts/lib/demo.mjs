// Builds demo/index.html from demo/steps.json, the contracts and their canonical examples.
// The page is an instruction booklet: a parts inventory, then numbered steps that seat each block.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createValidator } from './validate.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const indent = (s, n) => s.split('\n').map((l) => (l ? ' '.repeat(n) + l : l)).join('\n');

// A wrong piece an agent might invent, checked by the real validator at build time.
const WRONG_PIECE = '<button class="c-button c-button--warning" data-state="error">Retry</button>';
const RIGHT_PIECE = '<button type="button" class="c-button c-button--danger">Retry</button>';

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
  const swatches = ['--color-action-primary', '--color-action-danger', '--color-focus-halo', '--color-background-canvas', '--color-text-default', '--color-background-success'];

  const partList = (list) => list.map((c) => `<li><code>${esc(c.block)}</code></li>`).join('');

  const callout = (block) => {
    const c = byBlock.get(block);
    if (!c) throw new Error(`demo/steps.json names unknown block ${block}`);
    if (c.layer === 'utility') {
      return `<li class="demo-part"><code class="demo-part__name">u-*</code><span class="demo-part__meta"><span class="demo-part__row">${c.classes.map((u) => `<code>${esc(u.name)}</code>`).join(' ')}</span></span></li>`;
    }
    const mods = (c.modifiers ?? []).flatMap((m) => m.values.map((v) => `<code>--${esc(v.name)}</code>`)).join(' ');
    const els = (c.elements ?? []).map((e) => `<code>__${esc(e.name)}</code>`).join(' ');
    const states = (c.states ?? []).map((s) => `<code>data-state="${esc(s.name)}"</code>`).join(' ');
    const meta = [
      mods && `<span class="demo-part__row"><span class="demo-part__key">Modifiers</span> ${mods}</span>`,
      els && `<span class="demo-part__row"><span class="demo-part__key">Elements</span> ${els}</span>`,
      states && `<span class="demo-part__row"><span class="demo-part__key">States</span> ${states}</span>`,
    ].filter(Boolean).join('');
    return `<li class="demo-part"><code class="demo-part__name">${esc(c.block)}</code>${meta ? `<span class="demo-part__meta">${meta}</span>` : ''}</li>`;
  };

  const stepHtml = (s, n) => {
    const isModal = s.blocks.includes('c-modal');
    const stageClass = isModal ? 'demo-stage demo-stage--contain' : 'demo-stage';
    const extra = isModal
      ? `\n<div class="l-cluster demo-stage-actions">\n  <button type="button" class="c-button c-button--secondary" data-open-dialog="demo-dialog">Open as a real dialog</button>\n</div>`
      : '';
    return `<section class="demo-step" id="step-${n}" aria-labelledby="step-${n}-title">
  <div class="l-container">
    <div class="demo-step__grid">
      <div class="demo-step__head">
        <p class="demo-step__numeral" aria-hidden="true">${n}</p>
        <h2 class="demo-step__title" id="step-${n}-title"><span class="u-sr-only">Step ${n}: </span>${esc(s.title)}</h2>
        <p class="demo-step__text">${esc(s.text)}</p>
        <div class="demo-callout">
          <p class="demo-callout__label">New parts, 1:1</p>
          <ul class="demo-parts" role="list">${s.blocks.map(callout).join('')}</ul>
        </div>
      </div>
      <div class="demo-step__build">
        <svg class="demo-arrow" viewBox="0 0 120 40" aria-hidden="true" focusable="false"><path d="M4 8 C 40 8, 70 30, 108 30" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="6 5"/><path d="M100 22 L110 30 L100 38" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="${stageClass}">
${indent(example(s.example), 10)}
        </div>${indent(extra, 8)}
      </div>
    </div>
  </div>
</section>`;
  };

  const modalExample = example('modal.html');
  const dialog = modalExample
    .replace(/^<div class="c-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">/, '<dialog class="c-modal" id="demo-dialog" aria-labelledby="demo-dialog-title">')
    .replace(/<\/div>\s*$/, '</dialog>')
    .replace('<div class="c-modal__backdrop"></div>', '')
    .replace('id="delete-title"', 'id="demo-dialog-title"')
    .replace(/<button type="button" class="c-modal__close"/, '<button type="button" class="c-modal__close" data-close-dialog')
    .replace(/<button type="button" class="c-button c-button--ghost">/, '<button type="button" class="c-button c-button--ghost" data-close-dialog>')
    .replace(/<button type="button" class="c-button c-button--danger">/, '<button type="button" class="c-button c-button--danger" data-close-dialog>');

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
            <p class="demo-bag__head"><span class="demo-bag__num" aria-hidden="true">1</span> Layouts <span class="demo-bag__count">${layouts.length}×</span></p>
            <ul class="demo-bag__list" role="list">${partList(layouts)}</ul>
          </div>
          <div class="demo-bag">
            <p class="demo-bag__head"><span class="demo-bag__num" aria-hidden="true">2</span> Components <span class="demo-bag__count">${components.length}×</span></p>
            <ul class="demo-bag__list" role="list">${partList(components)}</ul>
          </div>
          <div class="demo-bag">
            <p class="demo-bag__head"><span class="demo-bag__num" aria-hidden="true">3</span> Tokens <span class="demo-bag__count">${semantic.length + componentTokens.length}×</span></p>
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
            <div class="demo-check">
              <p class="demo-check__label">Invented markup</p>
              <pre class="demo-code"><code>${esc(WRONG_PIECE)}</code></pre>
              <p class="demo-check__label">validate</p>
              <ul class="demo-check__issues" role="list">${wrongIssues.map((i) => `<li><strong>error</strong> ${esc(i.message)} <code>[${esc(i.rule)}]</code></li>`).join('')}</ul>
              <p class="demo-check__label">The piece that fits</p>
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
