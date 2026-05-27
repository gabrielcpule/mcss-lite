# MCSS-Lite

Lightweight CSS framework with semantic BEM components and design tokens. A production-ready subset of [MCSS](https://github.com/gabrielcpule/MCSS) principles.

## What it is

MCSS-Lite extracts the three most practical parts of the MCSS architecture:

1. **Design tokens** — CSS custom properties as the single source of truth for colors, typography, spacing, shadows, and motion
2. **Layout primitives** — `l-container`, `l-grid`, `l-stack`, `l-center`, `l-cluster`, `l-sidebar`, `l-switcher` that handle spacing so components never set their own margin
3. **Component classes** — BEM-style semantic components (`c-button`, `c-card`, `c-modal`, `c-input`, `c-badge`) with modifier and state support

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

All visual values come from CSS custom properties. Override them to theme.

```css
:root {
  --color-primary: #your-brand-color;
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

<input class="c-input" data-state="error" placeholder="Email">
```

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

## License

MIT
