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
3. **No invention.** Only classes, modifiers, elements, `data-state` values and tokens that appear in the files above exist. `c-button--warning`, `c-card__image`, `--color-brand` do not.
4. **States.** Checkbox, radio and toggle are native: set `checked`, `disabled` or `aria-invalid="true"` on the input, never `data-state`. Everything else uses `data-state="…"` on the block and its pair: `disabled` → prefer `aria-disabled="true"` with the reason linked by `aria-describedby` (the `disabled` attribute also works on `<button>` but hides it from keyboard users); `error` → `aria-invalid="true"` + `aria-describedby`; `loading` → `aria-busy="true"`.
5. **Tokens.** Never write hex, `rgb()` or pixel spacing. Use semantic tokens (`--color-text-default`, `--color-background-raised`, `--color-action-primary`, `--space-4`…). Primitive colors (`--color-gray-*`, `--color-blue-*`) ignore dark mode.
6. **Themes.** `data-theme="light" | "dark" | "auto"` on `<html>` or a subtree. Default is light.
7. **Pick the right part.** Each block in `llms-components.txt` lists "When to use" and "When not to use"; follow them (for example, a link that goes somewhere is not a `c-button`).
8. **Clickable cards.** Put the link on `c-card__title` and add `c-card--interactive`. Never wrap a card in `<a>`.
9. **Words.** Follow the content rules in `AGENTS.md`: sentence case, buttons start with a verb ("Save changes", never "OK" or "Submit"), errors say what went wrong and how to fix it, mark optional fields "(optional)".
10. **Choices.** Checkboxes pick any number, radios exactly one (always in `fieldset.c-form-field` with a legend), a toggle (`<input type="checkbox" role="switch">`) only for settings that apply straight away, never in a form with a submit button.
11. **Icons and alerts.** Inline `dist/mcss-lite.icons.svg` once per page and use only the icon names listed in `AGENTS.md` (`<svg class="c-icon" aria-hidden="true"><use href="#mcss-icon-check"></use></svg>`). A toned `c-alert` has a `c-alert__icon` and a hidden prefix (`<span class="u-sr-only">Error: </span>`) so severity never rests on color. Never make a `div` clickable; use `<button>` or `<a href>`.

MCSS-Lite is not on the npm registry: install it with `npm install github:gabrielcpule/mcss-lite#<tag>` or link the CSS from jsDelivr. Never run `npm install @gabrielpule/mcss-lite`; that name does not exist on npm and could be claimed by someone else.

## Before you finish

Run the validator on every file you touched and fix all errors:

```sh
npx mcss-lite validate <file-or-dir>          # human output (once installed)
npx mcss-lite validate <file-or-dir> --json   # machine output
npx github:gabrielcpule/mcss-lite#v0.4.0 validate <file-or-dir>   # without installing
```

It reports unknown classes and icons (with the valid alternatives), modifiers without their block, conflicting modifiers, invalid `data-state` values, missing ARIA pairs, deprecated classes and inline raw colors as errors or warnings, plus warnings for missing labels, Title Case and vague labels, more than one primary button per region, cards in cards, clickable divs, toggles in submit forms and alerts that rest on color. The full list is under "Validator rules" in `AGENTS.md`.

Fix warnings too. Only when a warning is deliberate, silence it for one element with `<!-- mcss-lite-ignore rule: reason -->` right before it. Errors can't be ignored.
