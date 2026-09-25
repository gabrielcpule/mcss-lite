---
name: mcss-lite
description: Use when writing or reviewing HTML, JSX or CSS in a project that uses MCSS-Lite (@gabrielpule/mcss-lite) — l-* layout primitives, c-* BEM components, u-* utilities, design tokens, light/dark themes. Gives the exact class, state and token names and the rules for combining them.
---

# MCSS-Lite

MCSS-Lite is a pure-CSS design system. Everything it defines is listed in files shipped with the package, so never guess a name.

## Where the truth lives

Resolve paths from `node_modules/@gabrielpule/mcss-lite/` (or the repo root when working on MCSS-Lite itself):

| Need | Read |
|---|---|
| Rules, all blocks at a glance, semantic tokens | `AGENTS.md` |
| One block's modifiers, elements, states, a11y and example | `llms-components.txt` (or `components/<name>.json` + `components/<name>.html`) |
| Every token with light and dark values | `llms-tokens.txt` |
| Everything as JSON | `dist/mcss-lite.manifest.json` |

Read `AGENTS.md` before writing markup. Copy structure from the canonical example of the block you use.

## Rules

1. **Golden Rule.** Never put margin on a `c-*` root. Space components with a layout parent: `l-stack` (vertical), `l-cluster` (inline, wraps), `l-grid`, `l-sidebar`, `l-switcher`.
2. **Lookup order.** Layout primitive → component + modifiers → utility → custom CSS with `var(--token)` only.
3. **No invention.** Only classes, modifiers, elements, `data-state` values and tokens that appear in the files above exist. `c-button--danger`, `c-card__image`, `--color-brand` do not.
4. **States.** Use `data-state="…"` on the block and its pair: `disabled` → `disabled` attribute (or `aria-disabled="true"` on `<a>`); `error` → `aria-invalid="true"` + `aria-describedby`; `loading` → `aria-busy="true"`.
5. **Tokens.** Never write hex, `rgb()` or pixel spacing. Use semantic tokens (`--color-text-default`, `--color-background-raised`, `--color-action-primary`, `--space-4`…). Primitive colors (`--color-gray-*`, `--color-blue-*`) ignore dark mode.
6. **Themes.** `data-theme="light" | "dark" | "auto"` on `<html>` or a subtree. Default is light.

## Before you finish

Run the validator on every file you touched and fix all errors:

```sh
npx mcss-lite validate <file-or-dir>          # human output
npx mcss-lite validate <file-or-dir> --json   # machine output
```

It reports unknown classes (with the valid alternatives), modifiers without their block, conflicting modifiers, invalid `data-state` values, missing ARIA pairs, deprecated classes and inline raw colors.
