# MCSS-Lite: guide for AI coding agents

> How to build UI with MCSS-Lite: the rules, every class, every token. Read this before writing markup or CSS.
> Generated from tokens/*.tokens.json and components/*.json by scripts/build.mjs. Do not edit by hand.
> Package: @gabrielpule/mcss-lite@0.2.0

## Rules

1. **Components never set their own outer margin.** Never add margin to a c-* root element. Put components inside a layout primitive (l-stack, l-cluster, l-grid, l-sidebar, l-switcher) and let it provide the spacing.
2. **Layout, then component, then utility, then token.** Solve a need with an l-* layout primitive first, then a c-* component and its modifiers, then a u-* utility. Only write custom CSS as a last resort, and then use var(--token) values only.
3. **Never invent class or token names.** Use only the classes, modifiers, elements, data-state values and tokens listed in this file. If something is missing, write custom CSS with existing tokens instead of guessing a name such as c-button--danger.
4. **States use data-state plus the native or ARIA pair.** Express component state with data-state="…" (for example data-state="error"), and always add the paired native attribute or ARIA listed for that state (disabled, aria-invalid, aria-busy).
5. **Theme with semantic tokens, never raw values.** Never hard-code colors (#hex, rgb()) or pixel spacing. Use semantic tokens (--color-text-default, --color-action-primary…) or component tokens (--button-primary-background…). Primitive color tokens (--color-gray-*, --color-blue-*) do not adapt to dark mode.

## Setup

```html
<link rel="stylesheet" href="node_modules/@gabrielpule/mcss-lite/index.css">
<html data-theme="auto"> <!-- optional: light (default) | dark | auto -->
```

Cascade layers, lowest to highest: `@layer global, layout, component, utility;`. Prefixes: `l-` layout primitive, `c-` component, `u-` utility. Naming is BEM: `c-block`, `c-block__element`, `c-block--modifier`; state is `data-state="value"` on the block.

Before finishing, check your markup:

```sh
npx mcss-lite validate path/to/file.html   # or a directory; add --json for machine output
```

## Blocks at a glance

| Class | Layer | Modifiers | Elements | data-state | Use for |
|---|---|---|---|---|---|
| `l-center` | layout | — | — | — | Centers a block horizontally at reading width without side gutters. |
| `l-cluster` | layout | — | — | — | Horizontal group that wraps, with a gap: button groups, badge lists, tags. |
| `l-container` | layout | --narrow | — | — | Centers page content horizontally with a max width and side gutters. |
| `l-grid` | layout | --2-col --3-col --4-col --responsive | — | — | Two-dimensional grid with a fixed gap. |
| `l-section` | layout | --sm | — | — | Vertical padding for a full-width page section. |
| `l-sidebar` | layout | — | __sidebar __content | — | A sidebar next to main content that stacks when the content would get narrower than 50%. |
| `l-stack` | layout | --sm --lg | — | — | Vertical flow: adds space between consecutive children. |
| `l-switcher` | layout | — | — | — | Children sit side by side until the container is narrower than a threshold, then all stack at once. |
| `c-badge` | component | --primary --success --warning --error --info | — | — | A short, non-interactive label for status or category, such as "Beta" or "Paid". |
| `c-button` | component | --primary --secondary --ghost · --sm --lg | — | disabled loading | Triggers an action. |
| `c-card` | component | --elevated --bordered · --interactive | __header __title __body __footer | — | A raised surface that groups related content, such as a summary, a settings group or a list item. |
| `c-form-field` | component | — | __label __help __error | — | Wraps one form control with its label, help text and error message. |
| `c-input` | component | — | — | error success disabled | Single-line text entry. |
| `c-label` | component | — | — | — | Deprecated standalone label. **Deprecated → `c-form-field__label`.** |
| `c-modal` | component | — | __backdrop __container __header __title __close __body __footer | closed | A dialog over the page that blocks interaction until dismissed. |

## More detail

- `llms-components.txt`: every block with modifiers, elements, states, accessibility rules and a canonical example.
- `llms-tokens.txt`: every token with light and dark values.
- `dist/mcss-lite.manifest.json`: the same data as JSON.

## Themes

Set `data-theme` on `<html>` or any subtree: `light` (default when absent), `dark`, or `auto` (follows the OS). Only semantic tokens change between themes; component tokens alias semantic ones, so they follow automatically.

To theme for a brand, override semantic tokens, for example:

```css
:root, [data-theme="light"] { --color-action-primary: #7a2e8f; }
[data-theme="dark"] { --color-action-primary: #d9a6e8; }
```

## Semantic tokens (use these)

Values are shown as light / dark.

### Spacing (semantic)

| Token | Value | Use for |
|---|---|---|
| `--space-component-padding` | 1rem | Default inner padding for components. |
| `--space-element-gap` | 0.75rem | Gap between sibling elements inside a component. |
| `--space-section-gap` | 2rem | Gap between page sections. |

### Text

| Token | Value | Use for |
|---|---|---|
| `--color-text-default` | #1a1d20 / #f8f9fa | Default body and heading text. |
| `--color-text-muted` | #343a40 / #dee2e6 | Secondary text: labels, supporting copy. |
| `--color-text-subtle` | #6c757d / #adb5bd | Tertiary text: help text, placeholders, icons. |
| `--color-text-inverse` | #ffffff / #1a1d20 | Text on an inverted (dark in light mode) background. |
| `--color-text-on-action` | #ffffff / #1a1d20 | Text on --color-action-primary. |
| `--color-text-link` | #005a9c / #6cb4ee | Link text. |
| `--color-text-link-hover` | #004a80 / #9ccdf4 | Link text on hover. |
| `--color-text-disabled` | #adb5bd / #495057 | Text in disabled controls. |
| `--color-text-success` | #155724 / #a3d9b1 | Text on --color-background-success. |
| `--color-text-warning` | #856404 / #f5d77a | Text on --color-background-warning. |
| `--color-text-error` | #721c24 / #f4a9b0 | Text on --color-background-error. |
| `--color-text-info` | #0c5460 / #9ad4df | Text on --color-background-info. |

### Backgrounds

| Token | Value | Use for |
|---|---|---|
| `--color-background-default` | #ffffff / #1a1d20 | Page background. |
| `--color-background-subtle` | #f8f9fa / #212529 | Subtle section or hover background. |
| `--color-background-muted` | #e9ecef / #343a40 | Muted fill for neutral badges and chips. |
| `--color-background-raised` | #ffffff / #212529 | Cards, modals and other raised surfaces. |
| `--color-background-interactive` | #ffffff / #212529 | Resting background of controls (buttons, inputs). |
| `--color-background-interactive-hover` | #f8f9fa / #2b3035 | Hover background of controls. |
| `--color-background-disabled` | #dee2e6 / #2b3035 | Background of disabled controls. |
| `--color-background-overlay` | rgb(0 0 0 / 0.5) / rgb(0 0 0 / 0.7) | Modal backdrop. |
| `--color-background-success` | #d4edda / #0f2e1a | Background for success messages and badges. |
| `--color-background-warning` | #fff3cd / #3a2e05 | Background for warning messages and badges. |
| `--color-background-error` | #f8d7da / #3b1216 | Background for error messages and badges. |
| `--color-background-info` | #d1ecf1 / #0b2d33 | Background for info messages and badges. |

### Borders

| Token | Value | Use for |
|---|---|---|
| `--color-border-default` | #dee2e6 / #343a40 | Dividers and card borders. |
| `--color-border-strong` | #ced4da / #495057 | Emphasized borders. |
| `--color-border-interactive` | #868e96 / #868e96 | Borders of controls (inputs, default buttons). Meets 3:1 non-text contrast. |
| `--color-border-focus` | #4d90fe / #6cb4ee | Focus outline color. |
| `--color-border-success` | #c3e6cb / #1e5631 | Border for success states. |
| `--color-border-warning` | #ffeaa7 / #6b5310 | Border for warning states. |
| `--color-border-error` | #f5c6cb / #6e2129 | Border for error states. |
| `--color-border-info` | #bee5eb / #155a66 | Border for info states. |

### Actions

| Token | Value | Use for |
|---|---|---|
| `--color-action-primary` | #005a9c / #6cb4ee | Primary action background (primary buttons, selection). |
| `--color-action-primary-hover` | #004a80 / #9ccdf4 | Primary action on hover. |
| `--color-action-primary-active` | #003860 / #c7e2f8 | Primary action while pressed. |
| `--color-action-neutral-hover` | #e9ecef / #343a40 | Hover background for ghost and icon buttons. |

### Focus

| Token | Value | Use for |
|---|---|---|
| `--color-focus-ring` | rgb(0 90 156 / 0.15) / rgb(108 180 238 / 0.35) | Soft focus halo around focused inputs. |
| `--color-focus-ring-error` | rgb(114 28 36 / 0.15) / rgb(244 169 176 / 0.3) | Focus halo for inputs in the error state. |

## Scales (primitives safe to use anywhere)

- **font.family:** `--font-family-sans` (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif), `--font-family-mono` ('SFMono-Regular', Consolas, 'Liberation Mono', Menlo, 'Courier New', monospace)
- **font.size:** `--font-size-xs` (0.75rem), `--font-size-sm` (0.875rem), `--font-size-base` (1rem), `--font-size-lg` (1.125rem), `--font-size-xl` (1.25rem), `--font-size-2xl` (1.5rem), `--font-size-3xl` (1.875rem), `--font-size-4xl` (2.25rem), `--font-size-5xl` (3rem)
- **font.weight:** `--font-weight-normal` (400), `--font-weight-medium` (500), `--font-weight-semibold` (600), `--font-weight-bold` (700)
- **line-height:** `--line-height-tight` (1.25), `--line-height-normal` (1.5), `--line-height-relaxed` (1.75)
- **space:** `--space-0` (0), `--space-1` (0.25rem), `--space-2` (0.5rem), `--space-3` (0.75rem), `--space-4` (1rem), `--space-5` (1.25rem), `--space-6` (1.5rem), `--space-8` (2rem), `--space-10` (2.5rem), `--space-12` (3rem), `--space-16` (4rem), `--space-20` (5rem), `--space-24` (6rem)
- **border-radius:** `--border-radius-none` (0), `--border-radius-sm` (0.125rem), `--border-radius-base` (0.25rem), `--border-radius-md` (0.375rem), `--border-radius-lg` (0.5rem), `--border-radius-xl` (0.75rem), `--border-radius-2xl` (1rem), `--border-radius-full` (9999px)
- **border-width:** `--border-width-0` (0), `--border-width-thin` (1px), `--border-width-thick` (2px), `--border-width-thicker` (4px)
- **shadow:** `--shadow-xs` (0 1px 2px rgb(0 0 0 / 0.05)), `--shadow-sm` (0 1px 3px rgb(0 0 0 / 0.1)), `--shadow-base` (0 4px 6px rgb(0 0 0 / 0.1)), `--shadow-md` (0 8px 25px rgb(0 0 0 / 0.1)), `--shadow-lg` (0 25px 50px rgb(0 0 0 / 0.15)), `--shadow-xl` (0 25px 50px rgb(0 0 0 / 0.25))
- **ease:** `--ease-linear` (linear), `--ease-in` (ease-in), `--ease-out` (ease-out), `--ease-in-out` (ease-in-out)
- **duration:** `--duration-instant` (0ms), `--duration-fast` (150ms), `--duration-base` (250ms), `--duration-slow` (350ms), `--duration-slower` (500ms)
- **z-index:** `--z-index-hide` (-1), `--z-index-base` (0), `--z-index-docked` (10), `--z-index-dropdown` (1000), `--z-index-sticky` (1020), `--z-index-modal-backdrop` (1040), `--z-index-modal` (1050), `--z-index-popover` (1060), `--z-index-toast` (1070), `--z-index-tooltip` (1080)
- **container:** `--container-max-width` (72rem), `--container-narrow` (48rem)
