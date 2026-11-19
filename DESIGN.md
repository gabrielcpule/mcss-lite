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
    fontSize: "clamp(2.5rem, 5.4vw, 4.25rem)"
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
- **Display** (800, clamp(2.5rem, 5.4vw, 4.25rem), 1.02, -0.025em): the title on the front of each of the three booklet pages (the overview's claim, "Parts inventory", "Read before you build"), always two lines, one per mask so each can rise on load. Rubik. 68px from about 1260px wide; nothing on the showcase sets type larger.
- **Numeral** (800, clamp(4rem, 11vw, 6rem), 0.9, -0.04em): step numerals; Rubik 800 also sets the wordmark (`--font-size-xl`) and part counts (tabular).
- **Headline** (700, `--font-size-4xl` down to `--font-size-base` for h1 to h6, `--line-height-tight`): default heading ramp from the global layer, balanced wrapping.
- **Title** (700, `--font-size-lg`, tight): card and modal titles.
- **Sheet title** (800, clamp(2rem, 6vw, 3.25rem), 1.05, -0.02em): the part name at the top of a part sheet. Rubik, one step below Display: a booklet page title, not a heading in the ramp.
- **Body** (400, `--font-size-base`, `--line-height-normal`): all running text; ledes step up to `--font-size-lg` at `--line-height-relaxed`, capped around 48 to 58ch.
- **Label** (600, `--font-size-sm`): form-field labels, help and error text (error is 600 in `--color-text-error`), button text is 600 at base size.

### Named Rules
**The Rubik Is for Numbers Rule.** The display face is for display moments only: numerals, counts, the wordmark and the hero claim. Headings, body, labels and controls stay in system sans.

## Layout

Space runs on a 0.25rem (4px) scale (`--space-1` to `--space-24`); the semantic set is `--space-component-padding` (1rem), `--space-element-gap` (0.75rem) and `--space-section-gap` (2rem). The demo's stud grid is a dot every `--space-4` (16px).

Layout primitives own all spacing between components (the Golden Rule): `l-stack` (1rem; `--sm` 0.5rem, `--lg` 2rem), `l-cluster` (0.75rem, wraps), `l-grid` (1.5rem gap; 2/3/4 columns collapse to one at 768px; `--responsive` auto-fills 280px tracks), `l-sidebar` (16rem sidebar, content never under 50%), `l-switcher` (all-at-once stacking at `--switcher-threshold`, default 30rem), `l-container` (72rem, narrow 48rem, 1rem gutters), `l-center`, and `l-section` (4rem vertical padding, `--sm` 2.5rem).

Showcase pages (demo) set each step in one of three layouts, named per step in `demo/steps.json`: **split** (the default; from 60rem the step and its call-out in 5fr beside a 7fr build stage, 4rem gutter, with the drawn arrow between), **wide** and **inset** (from 60rem the step beside its call-out, the stage under both at full width) and **sheet** (two steps side by side on an `l-grid--2-col`, each a column of step, call-out and stage). Any other layout value fails the build. Below 60rem split, wide and inset steps are one column that shows the build before its call-out; sheet pairs stay side by side down to `l-grid--2-col`'s own 768px breakpoint (the reorder uses the same `max-width: 768px` query), then stack and put the build first too. Everything works at 320px.

## Elevation & Depth

Hybrid: depth is a brick edge, not a floating card. Every raised part carries a 2px straight-down edge in ink plus a soft ambient blur; the edge is what makes a part read as a brick sitting on the plate. In dark the edge is the pale keyline at 45% (50% for elevated), so parts still read as seated bricks on navy; it is tested at 3:1 against every dark surface. Only straight-down offsets are used, never diagonal.

### Shadow Vocabulary
- **Raised** (`--shadow-raised`; light `0 2px 0 #1a1d20, 0 3px 8px rgb(26 29 32 / 0.12)`): resting buttons, cards, the install line, build stages, the packing-list chips.
- **Elevated** (`--shadow-elevated`; light `0 2px 0 #1a1d20, 0 10px 24px -4px rgb(26 29 32 / 0.22)`): modals, elevated cards, interactive-card hover, the parts inventory.
- **Focus halo** (`0 0 0 5px var(--color-focus-halo)`): paired with a 2px `--color-focus-ring` outline at 2px offset on every focusable element.

The legacy `--shadow-xs` to `--shadow-xl` primitives are kept for back-compat; no component uses them.

### Named Rules
**The Seated Brick Rule.** Pressing seats a part: it drops 2px (`translateY(2px)`) and loses its shadow. A toggled-on button (`aria-pressed="true"`) stays seated and ink-filled. Interactive cards lift 2px on hover and take the elevated shadow and a blue keyline.

## Shapes

Studded, gently squared forms. Parts (buttons, inputs, call-outs, panels, swatches) use the stud radius (`--border-radius-base`, 4px). Containers that hold parts (cards, modals) use `--border-radius-lg` (8px). Badges and round count markers are full pills (`--border-radius-full`). Inline code uses `--border-radius-sm`. The one round control is the radio (see below).

Borders carry the world: 2px (`--border-width-thick`) around every part, 1px (`--border-width-thin`) hairlines only for dividers inside a part (card footer, modal header and footer, step separators) and for badges, which outline in `currentColor`. Disabled parts switch their keyline to dashed. The demo's parts bags thicken the top edge to 4px (`--border-width-thicker`) like a sealed fold.

### Named Rules
**The Ink Keyline Rule.** Anything you can press, type into, or that holds content wears a 2px keyline. A 1px line divides; it never outlines a part.

**The Round Means Pick One Rule.** The radio is the only round control: a stud seen from above. Round tells people "only one of these"; every other control stays square-cornered, and pills stay reserved for badges.

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
- **Clickable cards:** the link lives on `c-card__title` and its `::after` covers the card, so screen readers announce only the title. Other links and buttons in the card sit above it. Focus draws the ring around the whole card. Never wrap a card in `<a>` (the validator reports `card-link`).
- **Internal Padding:** 1.5rem (`--card-padding`); header, body and footer separated by 1rem, footer divided by a hairline.

### Inputs / Fields
- **Style:** paper fill, 2px ink keyline, stud radius, 44px minimum height.
- **Focus:** border turns brick blue, plus the ink ring and halo as a real outline, so it survives forced colors.
- **Error:** `data-state="error"` + `aria-invalid`: red border plus a heavier 2px bottom edge, so it never relies on hue alone; the field's error text is semibold error red.
- **Success:** green border. **Disabled:** muted fill, dashed border, disabled text.
- **Form field:** label (small, semibold, graphite) above; help (small, slate) and error below, 0.5rem apart.

### Checkbox, Radio and Toggle (beta)
- **Structure:** a native input beside its label, GOV.UK style: `div.c-checkbox > input.c-checkbox__input + label.c-checkbox__label + .c-checkbox__hint`. The label is 44px tall and pads the hit area; groups sit in `fieldset.c-form-field` with a legend. Every state is native (`checked`, `:indeterminate`, `disabled`, `aria-invalid`), never `data-state`.
- **Checkbox:** a 24px keylined box on its brick edge. Checked is an ink fill with a paper tick, seated like a pressed button; blue stays for actions. The tick draws in over 150ms. Indeterminate is a flat bar. Pressing drops it 2px only while held, so a checked box stays level with its label.
- **Radio:** a round 2px ring; checked seats an ink stud in the middle.
- **Toggle:** a keylined channel with a square thumb brick. Off: muted track, an empty thumb at the start. On: ink track, thumb at the end with a tick, so the state never rests on position or color. The bar belongs to a mixed checkbox only. Saving: neutral track with the loading stripes and the thumb held in the middle.
- **Error:** red keyline plus the heavier bottom edge, on one box (`aria-invalid`) or on every control in a group (`data-state="error"` on the fieldset).
- **Disabled:** 45% opacity, dashed keyline, ghosted label. **Forced colors:** checkboxes and radios fall back to the native control; the toggle redraws in system colors.

### Alert (beta)
- A printed notice, not a brick: paper fill (`--alert-background`) for every tone, 2px ink keyline, stud radius, no shadow.
- **Severity shows three ways at once:** a shaped icon (circle info, rounded-square success, triangle warning, octagon error) in a 2rem keylined tile, a visually hidden prefix ("Error: "), and a 4px bottom edge in the tone's border color (`--alert-edge-*`). No side stripe and no tinted fill: the warning tint is the call-out cream, which belongs to the Yellow Is a Highlight Rule.
- **Close:** a 44px ghost button like the modal's. The error summary after a failed submit is a `c-alert--error` with a link to each field.

### Icons (beta)
- 20 line pictograms on a 24-unit grid: 2px round-capped strokes, no fills, corners at the stud radius. `vector-effect: non-scaling-stroke` keeps the stroke 2px at 16, 20 and 24px, so icons match the keyline. They take the text color only; arrows and chevrons mirror in right-to-left pages.

### Modal
- Centered container up to 36rem wide on an ink-tinted backdrop (`--color-background-overlay`), 2px keyline, 8px radius, elevated shadow. Header and footer divided by hairlines; a 44px close button with an inline SVG; footer actions right-aligned and wrapping. Works as native `<dialog>` or with `data-state="closed"`.

### Parts Call-out (signature, showcase pages)
- The booklet's 1:1 box: callout fill (`--color-background-callout`), 2px ink keyline, stud radius, 1.25rem padding, listing each part's exact class beside a keylined sample. It sits next to a build stage (paper with the stud grid, raised) that it points to with a drawn arrow. Built from framework tokens in `demo/demo.css`; it is demo chrome, not a shipped `c-` block.

### Part Sheets, Inventory and Content Pages (showcase)
- More pages of the same booklet, never a docs site. A part sheet opens with the part's name and class, a status sticker and "since", then numbered sections on the stud rail: Pick this part, Build it, Check your build, Spec sheet, Accessibility, Wording; "Fits with" and "Researched from" follow unnumbered.
- **Check your build:** ✓ panels are solid keyline cards with the live build and "validate: 0 issues"; ✗ panels are dashed error-red outlines showing the markup as code with the real validator output generated at build time, or "Guidance only" when the validator can't catch it.
- **The three booklet pages share one front:** Overview, Parts inventory and Read before you build each open with the same split box-cover head (the Display title in two lines and the lede on the left; an ink lid band and a live, always-exploded specimen on the right) and the same sticky bar with the Exploded view switch, so a page turn lands on a matching page. Every count on a lid is derived at build time: the overview's parts and tokens, the inventory's parts per status, the content page's rules and how many the validator checks. Part sheets keep their own header and section rail.
- **Status stickers:** monochrome filled pill tags in `--color-background-muted`, never status colors (One Blue Rule) and never a keyline or brick edge, so they can't read as buttons: stable carries a check, beta a wrench, deprecated a cross on a hairline outline with readable, unstruck text. No label sits above a sheet's title; layer and version sit beside the sticker. A deprecated sheet announces its replacement with the system's own `c-alert--warning`.
- **One meaning per line style:** dashed means disabled (library), "doesn't fit" (✗ panels, the misfit bricks) or a layout outline in the exploded view, nothing else. Yellow fills only the step call-outs and layout tags ("new part"), plus the focus halo.
- **Part sheet header:** the finished part first, like the picture on a booklet page: the glyph as a mark beside the name (never a tile you could press), the class under the name, and a live specimen beside them: the first complete block of the part's example, inert, with its ids and group names suffixed so it never joins the build below. The section rail follows the header.
- **Overview hero, the front of the box:** the claim, lede and install on the left; on the right an ink lid band with "Set" and the version, the piece count (every layout and live component) and the token count (semantic plus component), all derived from the contracts and tokens at build time. Under the lid, the picture on the box: a sign-up card built only from real parts, inert, validated at build time (the build fails if it stops passing, so its "validate: 0 issues" caption can't lie) and always shown pulled apart in the exploded view's tag language. A small note under the box names an agent's guess (`c-button--warning`) with the real validator message and links to the misfit. Phones read claim, box, install. "For your agent" is a disclosure whose list floats over the page in the popover layer (above the header and build bar), so opening it moves nothing; Escape anywhere, a click elsewhere or tabbing out of it closes it, and Escape returns focus to the summary. It grows out of its summary like a popover (opacity and `scale(0.97)` to 1 in 180ms, strong ease-out, from a transform origin at the summary) and leaves faster (120ms); opened or closed from the keyboard it just appears, and with reduced motion it only fades (150ms in, 100ms out). Once the box has settled, the art's tags arrive one by one at uneven gaps (40 to 70ms apart, from 480ms; each delay is written in at build time), as opacity and `scale(0.97)` in 150ms ease-out; the art is inert, so nothing waits for them, and with reduced motion they are simply there. The inventory and content heads use the same box and the same tag arrival.
- **Header:** the top bar (wordmark, the three booklet pages, the theme switch) is sticky on every page, above everything that sticks under it. On phones its wordmark and theme rows tuck up under the top edge and only the 44px row of page links stays, so it never takes more than a short strip of the screen. demo.js measures its real height into custom properties (`--demo-bar-height`, `--demo-bar-tuck`, `--demo-bar-stuck`) with CSS fallbacks; whatever sticks below it shares its bottom keyline instead of doubling it.
- **Build bar:** one bar holds the page's studs and the Exploded view switch (a real `c-toggle`), with an `l-`/`c-` key from 64rem: the overview's steps and the misfit, the inventory's four bags, the content page's eleven rules (one generator, `stickyBar()` in `scripts/lib/demo.mjs`). It sticks directly under the header at every width. On phones it slims to one 44px row with a stud-gap of padding: the studs scroll sideways beside the compact switch, whose label folds onto two lines, and the name under the studs gives way; with the header's row of page links the sticky chrome is 108px at 375×812. One ink marker, seated 2px down, glides between the studs to the current one (transform only, 200ms strong ease-out; the current stud turns clear so the marker shows through, red on the misfit's stud); it lands at once the first time, after a resize and when the jump came from the keyboard. Studs give a little (`scale(0.97)`) while pressed. The current stud follows a reading line just above the middle of the screen; two steps side by side (a sheet pair) share their row, the left one current for its first half and the right one for the second, in either direction, and a stud you jump to stays current until you scroll on.
- **Exploded view:** off by default. The build script writes each layout's and component's block and modifier classes into `data-part`; a `:has(#explode:checked)` rule then gives every layout on the page a dashed outline, a yellow class tag and a tag strip (plus a side inset, so nested outlines never share a line), and every component an ink tag on its top corner. Tags are generated content with empty alt text (`content: attr(data-part) / ""`), so they never reach the accessibility tree; there is no plain `content` fallback, so a browser without alt text for generated content shows the outlines and no tags rather than reading class names aloud. In the step builds a component's tag names only its block, so tags in a row of buttons or badges never meet, and the second of a pair of compact toggles hangs its tag underneath. Inputs and icons are replaced elements, so the build wraps each in a same-size span that carries its tag (an input's on its top edge at the end, an icon's under it); only the fixed modal goes untagged. The same rules run on the inventory (its bags are bordered `c-card`s with a cluster head inside an `l-stack`; the parts tables are plain HTML tables, since the kit ships no table part, so they carry no tag) and on the content page (each rule is a bordered `c-card` holding an `l-sidebar`: the rule in a stack, the ✓/✗ labels in a stack in the sidebar). The box art is always exploded by the very same rules (it is the picture on the box), so the switch never double-tags or resizes it. Step 1's baseplate, the build that teaches layouts, is built plainly and carries its own switch on its stage's top edge, a real `c-toggle` labelled "Exploded view of this build" (a setting that applies at once, so a toggle, named for the setting rather than the action). It pulls just that build apart with the same rules and motion; CSS reads it (`.demo-step:has(#plate-explode:checked)`), so it works without JS. The baseplate is exploded when either switch is on: turning the page's switch on pulls it apart with everything else and shows its own switch on and resting (disabled, since the page's switch is in charge); turning the page's switch off returns it to its own setting, which demo.js keeps separately. The baseplate takes the side inset only on phones and from 60rem, because in between its sidebar would stop stacking and crush the grid's cards. Exploded view is a reading mode, so an in-place page turn carries it to the next page.
- **Exploded view motion:** the page (or, with step 1's own switch, just the baseplate) visibly pulls apart: the layouts' padding grows over 350ms (`--duration-slow`, `--ease-out-expo`) and settles back the same way. Animating padding reflows the page every frame; that is a deliberate choice, because the growth is the point, and a page this size takes it in its stride. While it runs, demo.js scrolls along frame by frame (with native scroll anchoring paused) so the element under the middle of the screen stays where it was, within half a pixel (when the middle falls in a layout's padding or gap, it anchors the part nearest the middle, not the layout around it); toggled at the very top, the page stays at the top. Tags appear with opacity and `scale(0.97)` to 1 from the corner nearest their part in 150ms ease-out and leave in 100ms. Flipped from the keyboard, the change lands at once; with reduced motion the padding lands at once (one scroll correction) and the tags only fade.
- **Packing list:** "What's in the box" sits under the build bar as a keylined card: four numbered bags with dot leaders and Rubik counts (layouts, components with the deprecated count as a badge, utilities, tokens), every part a raised chip linking to its sheet, the intro and set number sticky beside it. Under a mouse a chip (like the inventory's part links) lifts 2px in 150ms ease-out; pressed, it loses its edge and gives a little (`scale(0.97)`). Hover motion only runs for a fine pointer that hovers.
- **Copy buttons:** pressing Copy crossfades the label with a 2px blur to a check and "Copied" (200ms ease-out); about 1.6s later it comes back faster (120ms). Both labels share one grid cell, so the button never changes width, and the page's status line still announces the copy. Copied from the keyboard, the label swaps at once; with reduced motion it only fades. The button gives a little (`scale(0.97)`) while pressed.
- **Motion:** two moments. The hero enters once: the claim's lines rise out of their masks, then the lede, the install and the box settle in, all in place by 0.8s and filled backwards only, so no transform lingers to trap the floating list under the bar. Each build stage's parts then settle from spread apart behind dashed outlines into their seats as the stage scrolls in (`animation-timeline: view()`, progressive): the resting state is settled, so browsers without scroll timelines and unscrolled screenshots show finished builds. The furthest part travels 1.5 units sized so it and its outline stay inside the stage's padding, and a settling stage clips vertically, so no scrollbar ever flashes. Steps 6 and 7 (the inset steps) seat on a clock instead: as soon as their stage peeks in, each part settles in 250ms, 150ms after the one before, so the last is seated by 700ms, and step 6's switch then flips (the thumb moves in 200ms ease-in-out, its tick fades in). The arrow draws once a step is in view, and the misfit brick drops the first time it scrolls in: 450ms, falling ease-out and rocking 2° past its tilt before it settles. Every one of these lives inside `prefers-reduced-motion: no-preference`, and demo.js listens for that setting changing. Under `prefers-reduced-motion: reduce` nothing moves, grows, slides or scales: state changes keep a short opacity fade (the agent list, tags, the Copy label, the stud marker), the misfit brick sits statically tilted, and page changes cross-fade. The demo also stops the switch's thumb from sliding there, which the kit's own reduced-motion list in `src/components.css` leaves out.
- **Page turns:** moving between the three booklet pages from the header (Overview, Parts inventory, Read before you build, in that order) turns the page in place, so it works in Firefox (144+) as well as Chromium: a same-document view transition, not a cross-document one. demo.js fetches the next page (prefetched when a pointer rests on a header link or it takes focus), and inside `document.startViewTransition()` swaps everything under the header (main with its build bar, the footer, the dialog, the status line), the title, the description, the body classes and the header's current link; it pushes a history entry, starts the new page at the top and moves focus to its `<h1>` (a ring only after keyboard use), so screen readers announce it. Back and Forward turn the same way and land where the reader left each entry (the browser's own scroll restoration is off, because it would scroll the old page before the turn captured it). Everything demo.js wires to a page lives in one `initPage()` with a matching teardown, so nothing doubles up across turns. Forward is towards the later page; demo.js sets `data-turn-dir` on `<html>` for the length of the turn (view-transition types are not used, since Firefox's support for them is uncertain). The header keeps its place (`view-transition-name`) and the current-page underline glides to its new link. If the fetch fails or anything throws, the link navigates normally; a browser without view transitions swaps without motion; without JS the links are links. Part sheets and anything else navigate normally, and Chromium cross-fades them (150ms, cross-document). Reduced motion gets only a 150ms cross-fade.
- **The turn itself, a manual's page turn** (700ms, `--demo-turn-flip`): forward, the page lifts at its right edge and turns over its left edge (the spine) in perspective, darkening as it nears edge-on (the visible half of the arc takes the first 72%, on `--demo-ease-turn`), and uncovers the next page, which starts in its shadow and brightens; back, the previous page swings back over from the left onto the current one, which falls into its shadow. Whatever shows behind the pages is the sky canvas and its studs. (Slide, push and wipe were tried and set aside in favour of the flip.)
- **Finale:** the misfit is the last step, on the canvas after the steps' paper band, with the red ✗ in the numeral's place. A whole agent-written form fails four ways (1 error, 3 warnings, each with its line and rule) in a `c-alert--error`, beside the rebuilt form at 0 issues in a `c-alert--success`; the build fails if either result changes.
- **Steps:** every step opens with its numeral beside its title and text; the steps print on a paper band between the packing list and the misfit, one row per step (two sheets share a row). **Phones:** each step shows its result before the parts list.
- **Booklet ending:** the wrong piece is the last step; the page closes on the canvas with an elevated `c-card` "Take the parts with you" (links, the checks every build runs, and the author line in its footer, with the case-study link once `author.caseStudy` is set) beside "Is this the right kit?". Utilities are introduced in the cards step, not a step of their own. The overview's list is "What's in the box", so "Parts inventory" means one page.
- **Rail:** studs are always 44px; when they don't fit, the row scrolls sideways and keeps the current stud in view. The name of the step in view (or the stud pointed at) sits under the studs, and "Jump to a step" when none is; on the overview the studs live in the build bar at every width, while part sheets turn their rail into a column in the left gutter from 100rem and from 64rem give each stud its section name. Every page reserves scroll padding under its sticky chrome (the header, plus the build bar at every width on the three booklet pages and the section rail on part sheets below 100rem, which now shares the build bar's top and bottom keylines), so it never covers the focused element, a skip-link target or a jumped-to step. From 100rem the sheets' column rail centres itself in the screen below the header.
- **Targets:** every link in the demo chrome (top bar, part chips, closing links, pager) is at least 44px tall, like the parts themselves.
- **Disclosures:** "Show markup" and "Show tokens" are link-colored summaries with a chevron that turns when open. Markup that doesn't fit has no Copy button.
- **Code:** blocks wrap between attributes, never inside a class name (`codeTokens()` keeps hyphenated names whole); inline code never breaks. Markup under a stage that already shows the result folds into a "Markup" disclosure with a Copy button; a ✗ panel's markup stays open, because it is the evidence. Validator messages take their level's color: errors in error red, warnings in warning amber.
- **Check your build:** each ✗ panel carries a small misfit brick and sizes to its own content. In the big misfit drawing the seated brick is ink, not blue: blue only means "act". Color tokens in the spec sheet show a live swatch that follows the theme.
- **Inset steps:** the booklet's newer steps put the call-out beside the step text above a full-width stage, with the same gap as every other step (never sunk into the stage: that read as two boxes colliding).
- **Parts inventory** sits at the back of the booklet. Its box shows the status stickers as a specimen, each beside the first real part that carries it and its meaning; under the bar, one bordered `c-card` bag per layer (and one for tokens), sealed with a 4px top fold, each a parts table with status and "since". **Read before you build** is the booklet's safety page. Its box shows rule 1 on two real buttons, "Create account" passing and "Create Account" with the validator's real warning (the build fails if either result changes); under the bar, numbered notices, each a bordered card with the rule beside its ✓/✗ labels, printed like the check-your-build panels (✓ on a solid keyline, ✗ on a dashed red one).

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
