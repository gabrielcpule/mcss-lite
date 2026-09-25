# MCSS-Lite

Lightweight CSS framework with semantic BEM components and design tokens. A production-ready subset of [MCSS](https://github.com/gabrielcpule/MCSS) principles.

## What it is

MCSS-Lite extracts the three most practical parts of the MCSS architecture:

1. **Design tokens** — CSS custom properties as the single source of truth for colors, typography, spacing, shadows, and motion
2. **Layout primitives** — `l-container`, `l-grid`, `l-stack`, `l-center`, `l-cluster`, `l-sidebar`, `l-switcher` that handle spacing so components never set their own margin
3. **Component classes** — BEM-style semantic components (`c-button`, `c-card`, `c-modal`, `c-input`, `c-badge`) with modifier and state support

## Built for AI agents and Figma

MCSS-Lite is **contract-first**: every class, modifier, element, `data-state` value and token is declared in machine-readable files, and tooling checks that the CSS, the docs and your markup agree with them.

| File | For | What it holds |
|------|-----|---------------|
| [`AGENTS.md`](AGENTS.md) | Coding agents | The rules, every block at a glance, semantic tokens |
| [`llms.txt`](llms.txt) → `llms-components.txt`, `llms-tokens.txt`, `llms-full.txt` | LLMs | Tiered docs with canonical examples ([llms.txt](https://llmstxt.org) format) |
| [`skills/mcss-lite/SKILL.md`](skills/mcss-lite/SKILL.md) | Claude Code and other skill-aware agents | Where to look and what never to invent |
| [`dist/mcss-lite.manifest.json`](dist/mcss-lite.manifest.json) | Tools | Tokens (light and dark values) and contracts as JSON |
| [`tokens/*.tokens.json`](tokens/) | Source of truth | [DTCG 2025.10](https://www.designtokens.org/tr/2025.10/) tokens: primitive, semantic (light, dark), component |
| [`components/*.json`](components/) | Source of truth | One contract per block ([schema](schemas/component.schema.json)) plus a canonical `.html` example |
| [`dist/figma/*.tokens.json`](dist/figma/) | Figma | Variables import files (px units, no composite tokens) |

### Using it with an agent

Point your agent at the docs, for example in your project's `AGENTS.md` or `CLAUDE.md`:

```md
UI uses MCSS-Lite. Before writing markup, read node_modules/@gabrielpule/mcss-lite/AGENTS.md.
After editing markup, run `npx mcss-lite validate <path>` and fix every error.
```

For Claude Code, copy the skill into your project: `cp -r node_modules/@gabrielpule/mcss-lite/skills/mcss-lite .claude/skills/`.

### Validating markup

```bash
npx mcss-lite validate src/            # .html, .jsx, .tsx, .vue, .svelte, .astro…
npx mcss-lite validate page.html --json
```

It reports unknown `c-`/`l-`/`u-` classes (listing the valid ones), modifiers without their block, conflicting modifiers, invalid `data-state` values, missing ARIA pairs (`disabled`, `aria-invalid`, `aria-busy`), deprecated classes and inline raw colors. It exits with code 1 on errors, so it can gate CI.

### Figma

Import the four files in `dist/figma/` as Variables (Figma → Local variables → Import): **Primitives**, **Semantic** (modes Light and Dark, aliasing Primitives) and **Component** (aliasing Semantic). Shadows, font stacks and easings stay code-only because Figma variables can't hold composite values. To bring changes back, export the collections as DTCG JSON, merge them into `tokens/`, and run `npm run build`.

## Dark mode

Themes are opt-in, so existing pages stay light:

```html
<html data-theme="auto">   <!-- light (default) | dark | auto (follows the OS) -->
```

`data-theme` also works on any subtree. Only semantic tokens change between themes; component tokens alias them, so components follow automatically. To rebrand, override semantic tokens such as `--color-action-primary` per theme.

## What it skips

The full MCSS spec includes RDFa semantic annotations, a strict 5-layer cascade enforcement, and machine-readable behavioral contracts. Those are powerful for enterprise design systems with 50+ engineers. For most projects, tokens + layouts + BEM components gets you 90% of the value with 20% of the ceremony.

## Install

```bash
npm install @gabrielpule/mcss-lite
```

```html
<link rel="stylesheet" href="node_modules/@gabrielpule/mcss-lite/index.css">
```

Or import in your CSS build:

```css
@import '@gabrielpule/mcss-lite';
```

## Usage

### Design tokens

All visual values come from CSS custom properties, in three tiers:

- **Primitive**: the raw palette and scales (`--color-gray-900`, `--space-4`). Don't use primitive colors in components; they ignore dark mode.
- **Semantic**: what a value is for (`--color-text-default`, `--color-background-raised`, `--color-action-primary`). These change per theme.
- **Component**: one component's knobs (`--button-primary-background`, `--card-padding`).

Override semantic or component tokens to theme:

```css
:root {
  --color-action-primary: #your-brand-color;
  --font-family-sans: 'Your Font', sans-serif;
}
```

### Layout primitives

Components never set their own margin. Layout classes handle all spacing.

```html
<div class="l-container">
  <div class="l-stack">
    <div class="c-card">...</div>
    <div class="c-card">...</div>
  </div>
</div>

<div class="l-grid l-grid--3-col">
  <div class="c-card">...</div>
  <div class="c-card">...</div>
  <div class="c-card">...</div>
</div>
```

### Components

BEM naming: `c-block__element--modifier`. States via `data-state` attributes.

```html
<button class="c-button c-button--primary">Save</button>
<button class="c-button c-button--ghost">Cancel</button>
<button class="c-button" data-state="disabled">Disabled</button>

<div class="c-card c-card--interactive">
  <header class="c-card__header">
    <h3 class="c-card__title">Title</h3>
  </header>
  <div class="c-card__body">Content</div>
  <footer class="c-card__footer">Footer</footer>
</div>

<input class="c-input" data-state="error" aria-invalid="true" placeholder="Email">
```

`c-label` is deprecated; use `c-form-field__label` inside `c-form-field`.

### The Golden Rule

Components (`c-*`) must never declare margin on their root element. Layout parents (`l-*`) control spacing. This keeps components composable in any context.

## Architecture

```
@layer global, layout, component, utility;
```

| Layer | Prefix | Purpose |
|-------|--------|---------|
| Global | none | Resets and HTML element defaults |
| Layout | `l-*` | Positioning and spacing between components |
| Component | `c-*` | Reusable UI building blocks |
| Utility | `u-*` | Single-purpose overrides |

## Contributing

`src/tokens.css`, `AGENTS.md`, `llms*.txt` and `dist/` are generated. Edit `tokens/*.tokens.json` or `components/*.json`, then:

```bash
npm run build   # regenerate
npm run check   # CSS, tokens, contracts and examples agree; no raw colors; outputs fresh
npm test        # back-compat, WCAG AA contrast in both themes, validator fixtures
```

Adding a class to `src/*.css` without adding it to a contract fails `npm run check`, which keeps the contract the single source of truth. See [`demo/index.html`](demo/index.html) for every block in every state, and [`docs/superpowers/specs/`](docs/superpowers/specs/) for the design rationale.

## License

MIT
