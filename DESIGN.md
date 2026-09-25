---
name: MCSS-Lite
description: A contract-first, pure-CSS design system that seats components in layouts the way an instruction booklet seats bricks.
colors:
  brick-blue: "#005a9c"
  brick-blue-deep: "#004a80"
  brick-blue-pressed: "#003860"
  brick-red: "#c91a09"
  brick-red-deep: "#a01408"
  error-text: "#721c24"
  brick-yellow: "#f2cd37"
  callout-cream: "#fff3cd"
  ink: "#1a1d20"
  graphite: "#343a40"
  slate: "#495057"
  paper: "#ffffff"
  paper-subtle: "#f8f9fa"
  paper-muted: "#e9ecef"
  blue-wash: "#eef6fc"
  hairline: "#ced4da"
  sky-canvas: "#dcedf9"
  night-navy: "#0f2140"
  night-raised: "#14294d"
  night-canvas: "#0b1a33"
  night-keyline: "#cfdae5"
  night-text: "#e6edf4"
  night-blue: "#2576cc"
typography:
  display:
    fontFamily: "Rubik, ui-rounded, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 6.5vw, 4.75rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  numeral:
    fontFamily: "Rubik, ui-rounded, system-ui, sans-serif"
    fontSize: "clamp(4rem, 11vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.5
  mono:
    fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, 'Courier New', monospace"
    fontSize: "0.9em"
rounded:
  sm: "0.125rem"
  stud: "0.25rem"
  container: "0.5rem"
  pill: "9999px"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "1.5rem"
  "8": "2rem"
  "10": "2.5rem"
  "16": "4rem"
components:
  button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.stud}"
    padding: "0.5rem 1.25rem"
    height: "2.75rem"
  button-hover:
    backgroundColor: "{colors.blue-wash}"
  button-primary:
    backgroundColor: "{colors.brick-blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.stud}"
    padding: "0.5rem 1.25rem"
    height: "2.75rem"
  button-primary-hover:
    backgroundColor: "{colors.brick-blue-deep}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.brick-blue}"
    rounded: "{rounded.stud}"
  button-ghost-hover:
    backgroundColor: "{colors.paper-muted}"
  button-danger:
    backgroundColor: "{colors.brick-red}"
    textColor: "{colors.paper}"
    rounded: "{rounded.stud}"
  button-danger-hover:
    backgroundColor: "{colors.brick-red-deep}"
  button-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-sm:
    padding: "0.25rem 0.75rem"
    height: "2rem"
  button-lg:
    padding: "0.75rem 2rem"
    height: "3.5rem"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.stud}"
    padding: "0.5rem 0.75rem"
    height: "2.75rem"
  input-disabled:
    backgroundColor: "{colors.paper-muted}"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.container}"
    padding: "1.5rem"
  badge:
    backgroundColor: "{colors.paper-muted}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.75rem"
  badge-primary:
    backgroundColor: "{colors.brick-blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
  modal:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.container}"
    width: "36rem"
  parts-callout:
    backgroundColor: "{colors.callout-cream}"
    rounded: "{rounded.stud}"
    padding: "1.25rem"
---

# Design System: MCSS-Lite

> This file is the human-readable summary. The machine-readable source of truth is `tokens/*.tokens.json` (DTCG) and `components/*.json` (per-block contracts); `src/tokens.css`, `AGENTS.md`, `llms*.txt` and `dist/mcss-lite.manifest.json` are generated from them. When a value here and the JSON disagree, the JSON wins and this file is stale. Token names below are the real CSS custom properties.

## Overview

**Creative North Star: "The Build Instructions"**

Every part is a brick with an ink outline, and every layout is the baseplate that seats it. Controls, cards, modals and panels wear the same 2px ink keyline and sit on a short, hard brick edge with a soft blur under it; pressing a part seats it, dropping it 2px onto that edge. Color is used the way a booklet uses it: one brick blue for action, brick red for danger and error, and brick yellow reserved for the "new part" highlight. The framework ships this world in both themes; the demo adds the instruction-page canvas, the stud grid and oversized Rubik step numerals.

Density is comfortable and control-sized: every interactive target is at least 2.75rem (44px) tall, including compact buttons, whose visual 2rem is padded out by an invisible hit area. Light is the default. Dark is a night build on navy ink: keylines turn pale, blue gets more saturated, and the yellow moves from the halo into the focus ring itself. Theming is opt-in through `data-theme` (`light`, `dark`, `auto`), and print always renders light.

The system is contract-bound: consumer CSS uses tokens only, components never set their own outer margin, and state is `data-state` plus the paired native or ARIA attribute. Those are enforced by `npm run check` and `npx mcss-lite validate`, not merely described.

**Key Characteristics:**
- 2px ink keyline around every part (`--color-border-keyline`, `--color-border-interactive`, `--border-width-thick`).
- Brick-edge depth: a 2px vertical ink edge plus a soft blur (`--shadow-raised`, `--shadow-elevated`).
- One action blue (`--color-action-primary`), one danger red (`--color-action-danger`), yellow only for highlight.
- Stud radius (4px) on parts, 8px on containers, pills only for badges.
- System sans for everything readable; Rubik 800 only for display moments.
- Focus is an ink ring plus a halo, never removed.

## Colors

A white-paper and ink palette with three saturated brick accents, each bound to one job; dark mode swaps paper for navy ink.

### Primary
- **Brick Blue** (`--color-action-primary`, light): the brand color from PRODUCT.md. Primary buttons, primary badges, text selection, `accent-color` and `caret-color`, secondary-button outline and link text (`--color-text-link`). Hover deepens to **Brick Blue Deep** (`--color-action-primary-hover`), press to **Brick Blue Pressed** (`--color-action-primary-active`). In dark it becomes **Night Blue**, chosen to keep white text and 3:1 against navy.

### Secondary
- **Brick Red** (`--color-action-danger`, `--color-border-error`): destructive buttons, the error border on inputs, the wrong-piece panel's outline and numeral. Hover is **Brick Red Deep**. Error *text* uses the darker **Error Text** (`--color-text-error`) so it reaches 4.5:1.

### Tertiary
- **Brick Yellow** (`--color-focus-halo`, light): the halo outside the ink focus ring. In dark it becomes the ring itself (`--color-focus-ring`, `--color-border-focus`) and the halo turns to night canvas.
- **Callout Cream** (`--color-background-callout`, light): the fill of the "new parts, 1:1" call-out. In dark the call-out fill is navy (`--color-navy-700`), not yellow.

### Neutral
- **Ink** (`--color-text-default`, `--color-border-keyline`, `--color-border-interactive`, `--color-focus-ring`): body and heading text, every keyline, the focus ring, the pressed-toggle fill, and the hard edge in the brick shadow.
- **Graphite** (`--color-text-muted`): labels, ledes, supporting copy.
- **Slate** (`--color-text-subtle`): help text, placeholders, metadata; holds 4.5:1 on every background including the canvas.
- **Paper** (`--color-background-default`, `--color-background-raised`, `--color-background-interactive`): page, cards, controls.
- **Paper Subtle / Paper Muted** (`--color-background-subtle`, `--color-background-muted`): quiet fills, neutral badges, disabled fields, ghost-button hover.
- **Blue Wash** (`--color-background-interactive-hover`): hover fill on default and secondary buttons.
- **Hairline** (`--color-border-default`): 1px dividers inside a part only.
- **Sky Canvas** (`--color-background-canvas`): the instruction-page backdrop for showcase and marketing pages. **Night Canvas** is its dark twin.
- **Night Navy / Night Raised / Night Keyline / Night Text**: the dark theme's page, raised surfaces, keylines and text.

Status pairs (`--color-{text,background,border}-{success,warning,error,info}`) and every light/dark value are listed in `AGENTS.md` and `llms-tokens.txt`.

### Named Rules
**The One Blue Rule.** Brick blue means "act" (and links). It never decorates, fills a section, or tints a heading.

**The Yellow Is a Highlight Rule.** Brick yellow appears only as the focus halo and the call-out fill, always bounded by ink. It is never text, never a button, never a status.

**The Canvas Is Not the Product Rule.** Sky canvas and its stud grid belong to showcase and marketing pages. Product surfaces sit on `--color-background-default`.

**The Semantic Only Rule.** Components and consumer CSS reference semantic or component tokens, never primitives (`--color-gray-*`, `--color-blue-*`, `--color-navy-*`) and never raw hex, because primitives do not follow the theme.

## Typography

**Display Font:** Rubik, `--font-family-display` (falls back to the system face; the framework never loads it, the demo self-hosts it from `demo/fonts`)
**Body Font:** system sans, `--font-family-sans`
**Label/Mono Font:** `--font-family-mono` for code, class names and tokens

**Character:** A plain, fast system sans does all the reading; a heavy, rounded Rubik appears only where an instruction booklet would print a big number, like a step count, the wordmark or the one-line claim.

### Hierarchy
- **Display** (800, clamp(2.5rem, 6.5vw, 4.75rem), 1.02, -0.025em): the hero claim on showcase pages. Rubik.
- **Numeral** (800, clamp(4rem, 11vw, 6rem), 0.9, -0.04em): step numerals; Rubik 800 also sets the wordmark (`--font-size-xl`) and part counts (tabular).
- **Headline** (700, `--font-size-4xl` down to `--font-size-base` for h1 to h6, `--line-height-tight`): default heading ramp from the global layer, balanced wrapping.
- **Title** (700, `--font-size-lg`, tight): card and modal titles.
- **Body** (400, `--font-size-base`, `--line-height-normal`): all running text; ledes step up to `--font-size-lg` at `--line-height-relaxed`, capped around 48 to 58ch.
- **Label** (600, `--font-size-sm`): form-field labels, help and error text (error is 600 in `--color-text-error`), button text is 600 at base size.

### Named Rules
**The Rubik Is for Numbers Rule.** The display face is for display moments only: numerals, counts, the wordmark and the hero claim. Headings, body, labels and controls stay in system sans.

## Layout

Space runs on a 0.25rem (4px) scale (`--space-1` to `--space-24`); the semantic set is `--space-component-padding` (1rem), `--space-element-gap` (0.75rem) and `--space-section-gap` (2rem). The demo's stud grid is a dot every `--space-4` (16px).

Layout primitives own all spacing between components (the Golden Rule): `l-stack` (1rem; `--sm` 0.5rem, `--lg` 2rem), `l-cluster` (0.75rem, wraps), `l-grid` (1.5rem gap; 2/3/4 columns collapse to one at 768px; `--responsive` auto-fills 280px tracks), `l-sidebar` (16rem sidebar, content never under 50%), `l-switcher` (all-at-once stacking at `--switcher-threshold`, default 30rem), `l-container` (72rem, narrow 48rem, 1rem gutters), `l-center`, and `l-section` (4rem vertical padding, `--sm` 2.5rem).

Showcase pages (demo) use a two-column step layout from 60rem up (5fr call-out beside 7fr build stage, 4rem gutter) and a single column below; everything works at 320px.

## Elevation & Depth

Hybrid: depth is a brick edge, not a floating card. Every raised part carries a 2px straight-down edge in ink plus a soft ambient blur; the edge is what makes a part read as a brick sitting on the plate. In dark the edge becomes translucent black. Only straight-down offsets are used, never diagonal.

### Shadow Vocabulary
- **Raised** (`--shadow-raised`; light `0 2px 0 #1a1d20, 0 3px 8px rgb(26 29 32 / 0.12)`): resting buttons, cards, the install line, build stages, the wrong-piece panel.
- **Elevated** (`--shadow-elevated`; light `0 2px 0 #1a1d20, 0 10px 24px -4px rgb(26 29 32 / 0.22)`): modals, elevated cards, interactive-card hover, the parts inventory.
- **Focus halo** (`0 0 0 5px var(--color-focus-halo)`): paired with a 2px `--color-focus-ring` outline at 2px offset on every focusable element.

The legacy `--shadow-xs` to `--shadow-xl` primitives are kept for back-compat; no component uses them.

### Named Rules
**The Seated Brick Rule.** Pressing seats a part: it drops 2px (`translateY(2px)`) and loses its shadow. A toggled-on button (`aria-pressed="true"`) stays seated and ink-filled. Interactive cards lift 2px on hover and take the elevated shadow and a blue keyline.

## Shapes

Studded, gently squared forms. Parts (buttons, inputs, call-outs, panels, swatches) use the stud radius (`--border-radius-base`, 4px). Containers that hold parts (cards, modals) use `--border-radius-lg` (8px). Badges and round count markers are full pills (`--border-radius-full`). Inline code uses `--border-radius-sm`.

Borders carry the world: 2px (`--border-width-thick`) around every part, 1px (`--border-width-thin`) hairlines only for dividers inside a part (card footer, modal header and footer, step separators) and for badges, which outline in `currentColor`. Disabled parts switch their keyline to dashed. The demo's parts bags thicken the top edge to 4px (`--border-width-thicker`) like a sealed fold.

### Named Rules
**The Ink Keyline Rule.** Anything you can press, type into, or that holds content wears a 2px keyline. A 1px line divides; it never outlines a part.

## Components

Tactile and literal: every part looks like it could be picked up. Contracts (modifiers, elements, states, accessibility) live in `components/*.json`.

### Buttons
- **Shape:** stud radius (4px), 2px border, 44px minimum height, semibold text, brick-edge shadow.
- **Default:** paper fill, ink keyline, ink text; hover to blue wash.
- **Primary:** brick-blue fill and border, white text; hover deepens.
- **Secondary:** paper fill, brick-blue keyline and blue text.
- **Ghost:** no fill, no border, no shadow; neutral fill on hover.
- **Danger:** brick-red fill, white text; the confirming action of anything destructive.
- **Sizes:** `--sm` is 2rem visually with a 44px hit area; `--lg` is 3.5rem.
- **Hover / Focus / Active:** 150ms ease-out color transitions; focus replaces the edge with the 5px halo around the ink ring; active seats the button.
- **Pressed toggle:** ink fill, inverse text, seated.
- **Disabled:** 45% opacity, dashed keyline, no shadow (`disabled` or `data-state="disabled"`).
- **Loading:** `data-state="loading"` + `aria-busy`: diagonal stripes in `currentColor` at 14% sliding at 1.2s linear, stopped under reduced motion.

### Chips (Badges)
- **Style:** pill, 1px `currentColor` outline, 0.75rem semibold text. Neutral is muted fill with graphite text; primary is brick blue with white text; success, warning, error and info use their status background and text pairs.
- **State:** non-interactive; never a button.

### Cards / Containers
- **Corner Style:** 8px (`--card-radius`).
- **Background:** `--card-background` (paper / night raised).
- **Shadow Strategy:** raised by default, `--elevated` for emphasis, `--bordered` removes the shadow and keeps the keyline.
- **Border:** 2px ink keyline (`--card-border`); `--interactive` turns it blue on hover and lifts.
- **Internal Padding:** 1.5rem (`--card-padding`); header, body and footer separated by 1rem, footer divided by a hairline.

### Inputs / Fields
- **Style:** paper fill, 2px ink keyline, stud radius, 44px minimum height.
- **Focus:** border turns brick blue, plus the ink ring and halo as a real outline, so it survives forced colors.
- **Error:** `data-state="error"` + `aria-invalid`: red border plus a heavier 2px bottom edge, so it never relies on hue alone; the field's error text is semibold error red.
- **Success:** green border. **Disabled:** muted fill, dashed border, disabled text.
- **Form field:** label (small, semibold, graphite) above; help (small, slate) and error below, 0.5rem apart.

### Modal
- Centered container up to 36rem wide on an ink-tinted backdrop (`--color-background-overlay`), 2px keyline, 8px radius, elevated shadow. Header and footer divided by hairlines; a 44px close button with an inline SVG; footer actions right-aligned and wrapping. Works as native `<dialog>` or with `data-state="closed"`.

### Parts Call-out (signature, showcase pages)
- The booklet's 1:1 box: callout fill (`--color-background-callout`), 2px ink keyline, stud radius, 1.25rem padding, listing each part's exact class beside a keylined sample. It sits next to a build stage (paper with the stud grid, raised) that it points to with a drawn arrow. Built from framework tokens in `demo/demo.css`; it is demo chrome, not a shipped `c-` block.

## Do's and Don'ts

### Do:
- **Do** give every part a 2px keyline (`--border-width-thick`) in `--color-border-keyline` or `--color-border-interactive`.
- **Do** use `--shadow-raised` at rest and `--shadow-elevated` for modals and lifted cards; seat parts 2px on press.
- **Do** keep every interactive target at least 2.75rem (44px), padding compact controls out with a hit area.
- **Do** keep focus visible: 2px `--color-focus-ring` outline, 2px offset, 5px `--color-focus-halo`.
- **Do** mark disabled with dashed keylines and error with a heavier bottom edge, alongside color.
- **Do** theme by overriding semantic tokens per `data-theme`, and check `npx mcss-lite validate` before shipping markup.

### Don't:
- **Don't** hard-code colors or pixel spacing, or reach for primitive color tokens in components; they do not follow dark mode.
- **Don't** add outer margin to a `c-` block; let an `l-` primitive space it.
- **Don't** use brick yellow for text, buttons or status, or brick blue for decoration.
- **Don't** put the sky canvas or stud grid behind dense product UI.
- **Don't** use diagonal or large offset shadows; the brick edge is 2px straight down.
- **Don't** set headings, body or controls in Rubik.
- **Don't** invent class, modifier or token names; if it is not in `AGENTS.md`, write custom CSS with existing tokens.
