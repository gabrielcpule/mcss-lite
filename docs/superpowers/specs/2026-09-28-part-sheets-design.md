# MCSS-Lite "Part sheets": Pajamas-depth docs + new parts, still a LEGO-style instruction booklet

## Context
MCSS-Lite (contract-first, pure CSS, agent-readable; live at gabrielpule.work/design-system) has 6 components, 8 layouts and one booklet page. Compared with GitLab Pajamas it lacks depth (usage guidance per part, status, content rules) and breadth (choice controls, alerts, icons).

Research (2026-09-28, full notes below) found one gap shared by the two use cases that suit it best, **agent-built UIs** and **server-rendered apps**: nobody deterministically checks the HTML that gets written. Positioning: **"the verifiable UI layer for agent-written HTML, in any stack."** It's a portfolio showcase for DS leads, so docs depth comes first, inside the existing Build Instructions (LEGO booklet) identity.

Process: /brainstorm (architectural path) → /impeccable shape → five grilling rounds (method of Matt Pocock's /grilling, run by hand; the plugin wasn't loadable this session). The Q-numbers below are Gabriel's answers.

## Decisions
- **Two PRs, docs first (Q1).**
  - PR A = 0.3.0: pages + docs depth for existing parts.
  - PR B = 0.4.0: new parts + lint.
- **New parts ship as `beta` (Q2).**
- **Round radio**, recorded in DESIGN.md as an exception (Q3).
- **Clean URLs:** `/design-system/components/<name>` (Q4).
- **Usage copy:** I draft it from the research; Gabriel reviews in the PR (Q5).
- **Layouts get lighter sheets** (Q6).
- **Content page ships in PR A;** its "Checked by validate" tags come in PR B (Q7).
- **Keep `content-case`** as a warning (Q8).
- **Guidance is written for the positioning above (Q9):** real agent and template mistakes, with examples in plain HTML that drops into Rails, Django or htmx templates.
- **"Good fit / Pick something else" panel** in the booklet's opening spread and the README, naming Pajamas, Primer and shadcn for the bad fits (Q10).
- **Every sheet's ✗ panel shows real validator output** generated at build time, or "guidance only" when the validator can't catch it (Q11).
- **Form guidance:**
  - Validation: "reward early, punish late", plus an error summary on submit (Q12).
  - Mark optional fields "(optional)"; no asterisks (Q13).
- **PR A fixes clickable cards in CSS and the validator (Q14).**
- **PR B lint rules:** label/placeholder, one primary per region, no card in card, clickable div, toggle in form (Q15).
- **Disabled buttons: prefer a focusable "inactive" button** (`aria-disabled="true"` + visible reason via `aria-describedby`). Don't disable submit. The `disabled` attribute is for rare cases (Q16).

## Booklet mapping (design direction for all new pages)
| Pajamas | Booklet page |
|---|---|
| Component page | **Part sheet** `demo/components/<block>.html`: large keyline pictogram, element ID = class name, status sticker, "since" |
| Anatomy | **Parts needed** 1:1 call-out (reuse `callout()`) |
| Code example | **Build it**: numbered steps derived from the contract, finished build on a stud-grid stage |
| When to use / not | **Pick this part / Pick another part** (links to sibling sheets) |
| Do / Don't | **Check your build** ✓/✗ panels. ✗ = live preview + real `validate` output + misfit brick. ✓ = "validate: 0 issues" |
| Code reference | **Spec sheet**: modifiers, elements, states, tokens (light/dark values) |
| Accessibility | **Safe building**: keyboard table + a11y list |
| Related | **Fits with**: linked mini bag of parts |
| Status table | **Parts inventory** `demo/status.html`, at the back of the booklet |
| Content guide | **Read before you build** `demo/content.html`: numbered notices with ✓/✗ label pairs |

Status stickers are monochrome ink-keyline tags (One Blue Rule):
- stable: solid keyline + check
- beta: dashed keyline + wrench
- deprecated: ghosted, struck through, "use x"

Page chrome is the booklet bar + theme switch + "Back to the booklet". The section rail is studs, and the footer reads "Part sheet n of N". Layout sheets skip States and Tokens.

## PR A: 0.3.0 "Part sheets" (branch `claude/design-system-access-yybz83`, restarted from `main`)
1. **Spec:** `docs/superpowers/specs/2026-09-28-part-sheets-design.md`, from this plan, in the existing format; commit.
2. **Schema** `schemas/component.schema.json`, additive:
   - `status` enum gains `beta`; optional `since` (semver).
   - `guidelines` gains `whenToUse[]`, `whenNotToUse[]`, `doDont[{do:{text,html?},dont:{text,html?}}]` and `content[]`. `use` and `avoid` stay.
   - Also add `keyboard[{key,action}]` and `sources[]` (the research citations behind the guidance).
3. **Backfill all 14 contracts** with the drafted guidance (research below) plus `since` from git history. The core authoring is here. Contract changes:
   - **button:** the disabled pair text prefers `aria-disabled` + a reason; loading = `aria-busy` + `aria-disabled` + live announcement; one primary per region; verb labels for danger.
   - **form-field/input:**
     - "(optional)" convention.
     - Error text says what went wrong and how to fix it.
     - Help and error text linked via `aria-describedby`.
     - Validation timing: reward early, punish late.
     - An error-summary example.
   - **modal:**
     - `showModal()` + `aria-labelledby`.
     - Verb buttons.
     - No backdrop dismiss on forms.
     - At most 2 stacked.
     - Scroll lock via `:has(dialog:modal)` (iOS caveat).
   - **card:** the interactive pattern (item 4); a list or table for comparison.
   - **badge:** status-first (like Pajamas; Atlassian's equivalent is the lozenge), text carries the meaning, never clickable, one fixed meaning per tone.
   - **layouts:** the stack/cluster/grid/sidebar/switcher/center rules from the research.
4. **Card fix** in `src/components.css` + `components/card.json`/`card.html`:
   - `c-card--interactive` → `position: relative`.
   - `.c-card__title a::after { inset: 0 }`.
   - Secondary links and buttons lifted with `position: relative; z-index`.
   - Hover and shadow only on interactive cards.
   - New validator warning `card-link` in `scripts/lib/validate.mjs`: a `c-card` inside an `<a>`, or an interactive element nested in a link.
5. **Generator:**
   - New `scripts/lib/pages.mjs` `buildPages()` → `demo/components/<block>.html`, `demo/status.html`, `demo/content.html`, merged in `generate()` (`scripts/lib/generate.mjs`).
   - Refactor `scripts/lib/demo.mjs` to export `glyph`, `callout`, `partList(…,{link})`, `esc`, `inlinePreview`, and a shared `pageShell()` that the booklet also uses.
   - The ✗ panels run `createValidator` on each don't snippet.
   - Paths are relative per depth, and ids are namespaced per snippet.
   - `generate.mjs` `blockDetail` adds status/since/when/doDont/content/keyboard to AGENTS.md and llms; manifest gets `contentRules`.
6. **Content guide:** `guidelines/content.json` (+ `schemas/content.schema.json`).
   - Sections: voice, sentence case, button labels (verb + noun), errors (what went wrong + how to fix it, no blame), optional fields, alerts, punctuation, numbers/dates, inclusive language.
   - Each rule has a ✓/✗ pair and an optional `enforcedBy`.
7. **Booklet:**
   - "Good fit / Pick something else" panel.
   - Hero links to the Parts inventory and Read before you build.
   - Inventory and call-out names link to their sheets.
   - `demo/demo.css` adds `.demo-sheet*`, `.demo-sticker`, `.demo-checks`, `.demo-spec`, `.demo-inventory-table` (tokens only, stacked at 320px).
8. **Check** `scripts/lib/check.mjs`:
   - `doDont[].do.html` validates with 0 issues.
   - `dont.html` produces the issue it claims, or is marked `guidanceOnly`.
   - No orphan pages; `build.mjs` removes orphans.
   - `content.json` passes its schema.
9. **Tests:**
   - Schema accepts beta/since.
   - A sheet exists for every contract; the inventory lists all blocks.
   - No duplicate ids per page; pages pass validation with 0 errors.
   - Relative links resolve.
   - The `card-link` rule is in `bad.html` / `good.html`.
   - CSS test for the stretched card link.
   - The build is deterministic.
10. **Docs:**
    - README: positioning, fit panel, sheet links, status policy ("beta = shipped and validated; the API may change in a minor version").
    - DESIGN.md: stickers, sheet chrome, card pattern.
    - PRODUCT.md: positioning update.
    - Also `skills/mcss-lite/SKILL.md` and `_memory.md`.
    - Version bumps to 0.3.0.
11. **Impeccable:**
    - Surface briefs `.impeccable/surfaces/demo-part-sheet.md`, `demo-inventory.md`, `demo-read-before.md` (thesis: "a part sheet, not a docs page").
    - Critique + audit on the button sheet, a layout sheet, the inventory, the content page and the booklet.
    - Fix P1–P3 in one batch and re-check once.
    - Record scores in `_memory.md`.
12. **Ship:** build + check + test green; commit, push, open PR A, watch CI.
13. **Portfolio follow-up PR** (`gabrielcpule/New-new-new-portf`, `scripts/sync-design-system.mjs`):
    - Copy `demo/components/*.html`, `status.html` and `content.html`.
    - Rewrite their relative asset paths and the booklet's relative links to `/design-system/…`.
    - Add a Next rewrite `/design-system/components/:name` → `/design-system/components/:name.html`, plus sitemap entries.

## PR B: 0.4.0 "New parts" (after PR A merges)
1. **Schema:** `states[]` gains `native` + `selector`, so checked/indeterminate/disabled use native attributes, not `data-state`. Check requires the selector in CSS and keeps native states out of `stateInventory`.
2. **Contracts (all `beta`, `since: 0.4.0`)**, one per part:
   - `checkbox`, `radio`, `toggle` (`input[type=checkbox][role=switch]`, fixed label).
   - `alert`: tones info/success/warning/error; `__title __body __actions __close`; default no role or a labelled region; `role=alert` only for urgent just-happened outcomes; icon + text prefix for severity; destructive warnings not dismissible.
   - `icon`: `svg.c-icon > use`; sizes `--sm/--lg`; tones.
   - Plus a shared `choices.html`.
   - Guidance comes from the research (NN/g switch rule, 2–6 radios, fieldset/legend, indeterminate ≠ value).
3. **Tokens** `tokens/component.tokens.json`: `alert.*`, `checkbox.*`, `radio.*`, `toggle.*`, `icon.size-*`, all aliasing semantic tokens. New contrast pairs in `test/tokens.test.mjs`, both themes.
4. **CSS:**
   - Checkbox/radio: `appearance:none`; keyline + brick edge + press drop; the check mark is drawn in CSS; 44px target.
   - Toggle: brick slider; thumb position as the non-color cue; reduced motion respected.
   - Alert: keyline card + tone edge + icon, with no shadow.
   - Icon: stroke compensated per size so it always renders at 2px.
   - Forced-colors rules for all of them.
5. **Icons:**
   - `icons/<name>.svg`, 20 pictograms: check, close, plus, minus, chevrons ×4, arrow-right, external-link, info, success, warning, error, search, menu, copy, trash, edit, download.
   - Generated sprite `dist/mcss-lite.icons.svg` (`#mcss-icon-*`), exported as `./icons.svg`. Names go in the manifest and AGENTS.md.
   - Inline-sprite delivery is documented. New booklet `GLYPHS`.
6. **Validator:**
   - Captures text content (ignoring svg; template syntax counts as dynamic). `createValidator(contracts,{icons})`.
   - Rules:
     - `content-case`, `content-vague`, `content-missing` (warnings).
     - `unknown-icon` (error).
     - `label-missing`, `primary-count`, `card-nesting`, `clickable-div`, `toggle-in-form` (warnings).
     - Extended `a11y`: icon-only button name, c-icon hidden or labelled, any `*__close` named, toggle `role=switch`, radio type and grouping.
     - `invalid-state` on native states.
   - Export `CONTENT_RULES` so the content page adds "Checked by validate [rule]" tags.
7. **Booklet:** new steps "Fit the checks and switches" and "Raise the signals"; sheets and inventory rows for the new parts; `demo.js` alert-dismiss snippet (the app sets `hidden`).
8. **Tests:**
   - `bad.html` / `good.html` for every new rule.
   - Text-capture unit tests (templates, sr-only, line numbers).
   - Native-state check; sprite of 20 clean symbols.
   - Forced-colors and reduced-motion CSS tests.
9. **Docs + Impeccable:**
   - DESIGN.md: round radio, icon grid rule.
   - README: icons and delivery.
   - Evals: alert/toggle prompts.
   - Critique + audit on the new sheets, then fix.
   - Sync the portfolio; push new tokens to the Figma file.

## Critical files
`schemas/component.schema.json`, `components/*.json|html`, `src/components.css`, `tokens/component.tokens.json`, `scripts/lib/{validate,check,generate,demo}.mjs`, `scripts/lib/pages.mjs` (new), `guidelines/content.json` (new), `icons/` (new, PR B), `demo/{steps.json,demo.css,demo.js}`, `test/*`, and the portfolio's `scripts/sync-design-system.mjs`.

## Risks
- **Title-Case lint false positives:** warning only; skipped for dynamic content; existing examples must stay at 0 warnings.
- **More generated pages** mean token changes touch every sheet; handled by the freshness and orphan checks.
- **Beta semantics** must be stated clearly, or agents will avoid beta parts.
- **The stretched card link costs text selection,** documented on the card sheet.
- **Forced colors and `:has()` support for the native controls:** verify with emulation.
- **Research gap:** Reddit and Stack Overflow were unreachable. Evidence comes from HN, GitHub/GitLab issues, NN/g, GOV.UK, Pajamas, Primer, Roselli, Soueidan and O'Hara. Several items are flagged unverified (e.g. Safari `closedby`).

## Verification (each PR)
- `npm run build && npm run check && npm test` green.
- `npx mcss-lite validate demo components` gives 0 errors and 0 warnings.
- Playwright at 320 / 390 / 1440px in light, dark and auto, on the booklet, a component sheet, a layout sheet, the inventory and the content page:
  - no overflow, including at 200% text;
  - visible focus on every tab stop;
  - forced colors, print and reduced motion all work;
  - every relative link resolves;
  - the card's stretched link works, and its secondary actions stay clickable.
- PR B extras:
  - Space toggles checkbox/radio/toggle;
  - alert dismiss hides it and focus moves to a sensible target;
  - icons render at 2px stroke at every size.
- Impeccable critique/audit, with no regression against the booklet's 28/40 and 16/20.
- After the portfolio sync: `/design-system/components/button` returns 200 on the preview and in production.

## Research appendix (2026-09-28)
- **Agent-built UIs:**
  - 20 of 21 design systems ship MCP servers, and most ship skills, AGENTS.md and llms.txt. That is context, not output checks.
  - Output checks are rare and tied to React or Tailwind (Atlassian ESLint, Deslint).
  - Atlassian: a CLI beats MCP (8% fewer tokens, 60% more adoption; vendor numbers).
  - Agent failures, ranked: div soup, custom controls with no ARIA, unnamed icons, generic "slop" look, ignoring the design system, cards in cards, happy-path only, placeholder-as-label, low contrast, fragile with real content, too many primaries.
- **Server-rendered apps:**
  - The norm is native HTML interactivity, custom-property theming, tiny `data-*` JS and CDN delivery.
  - GOV.UK and Basecoat ship template macros (GOV.UK's Jinja port is maintained by hand); Primer ViewComponents is in maintenance mode.
  - No kit validates markup against its own rules.
- **Later roadmap (not in these PRs):**
  - `validate --json` with fix hints, a pre-write hook recipe, a skill, and a thin MCP server generated from contracts.
  - Nunjucks/Jinja partials generated from contracts.
  - A published eval of invented-class rate.
  - Native-HTML tabs, menu and toast.
  - A CI mode for rendered HTML from server test suites.
- **Per-part findings:** listed in the PR A and PR B contract bullets above. Sources are recorded in each contract's `sources[]`.
