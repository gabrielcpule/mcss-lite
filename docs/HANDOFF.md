# MCSS-Lite: handoff for the next agent

State of the project on 28 September 2026, after the 0.4.0 release. Read this with `_memory.md` (decisions and history), `PRODUCT.md` (who it's for) and `DESIGN.md` (the visual system). `AGENTS.md` is generated and describes the kit itself, not the project.

## 1. What this is

MCSS-Lite is a pure-CSS, contract-first design system. Every class, modifier, element, state and token is declared in JSON, and tooling checks that the CSS, the docs and consumers' markup agree with it. It is Gabriel Pule's portfolio showcase for design-system leads, so it has to look authored and actually work.

- **Positioning:** the verifiable UI layer for agent-written HTML, in any stack. Design systems give agents plenty of context, but almost none check what the agent writes. `mcss-lite validate` does that.
- **Readers:** AI coding agents (through `AGENTS.md`, `llms*.txt`, the manifest and `skills/mcss-lite/SKILL.md`), server-rendered apps (Rails, Django, Laravel, htmx, Astro) and Figma (through Variables).
- **Visual identity:** "The Build Instructions", a LEGO-style instruction booklet. It has 2px ink keylines, a 2px brick edge under raised parts and one brick blue for action. Yellow is used only for highlights and the focus halo, and Rubik is used only for numerals and titles. The named rules are in `DESIGN.md`.
- **Live:** https://www.gabrielpule.work/design-system (served from the portfolio repo, see section 6).
- **Figma:** the "MCSS-Lite Tokens" file in Gabriel's team (file key in `_memory.md`, never in shipped files).

## 2. Where things stand

| Release | What shipped | PR |
|---|---|---|
| 0.1–0.2 | Tokens (DTCG), contracts, validator, Figma files, dark mode, the booklet | #1, #2 |
| 0.3.0 | Part sheets for every block, parts inventory, content rules, usage guidance for every contract, clickable-card fix | #3 |
| 0.3.1 | Install from GitHub tags and jsDelivr instead of npm | #6 |
| 0.4.0 | `c-checkbox`, `c-radio`, `c-toggle`, `c-alert`, `c-icon` (all beta); 20-icon sprite; new validator rules; two new booklet steps | #8 |

The CI, CodeRabbit, PR template and GitLab pipeline arrived in commits `91f25fe`, `2e63e18` and `a88f396`, and the Release workflow in #7. The portfolio is synced at v0.4.0 (portfolio PR #4). The Figma file has the 0.4.0 component tokens (Primitives 126, Semantic 49, Component 58, 10 effect styles).

Quality scores for the 0.4.0 pages: Impeccable critique 29/40, audit 17/20.

## 3. Rules for working here

These rules come from the owner. Follow them without being asked.

1. **No AI attribution anywhere.** Don't add `Co-Authored-By`, a session link or a "Generated with" line to commit messages, PR descriptions or comments. Commits are authored and committed as **Gabriel Pule <gabrielc.pule@gmail.com>**: set `git config user.name` and `user.email` in the clone before the first commit. main was rewritten once to remove attribution; don't reintroduce it.
2. **Branches and PRs.** Work on a feature branch and open a PR against `main` using `.github/pull_request_template.md` (What changed, Linear, Why, Checklist). Never push to `main`. CodeRabbit skips automatic reviews (fewer than 10 stars), so Gabriel reviews.
3. **Releases are automatic.** Bump `version` in `package.json` in the PR. When it merges, `.github/workflows/release.yml` runs the checks and creates the `vX.Y.Z` tag and GitHub Release. Agent sessions can't push tags (HTTP 403), and don't need to. To tag an older commit, run Actions → Release by hand with the SHA.
4. **Not on npm, on purpose** (supply-chain risk). Install with `npm install github:gabrielcpule/mcss-lite#vX.Y.Z`; CSS comes from `https://cdn.jsdelivr.net/gh/gabrielcpule/mcss-lite@vX.Y.Z/dist/mcss-lite.min.css`. Never suggest `npm install @gabrielpule/mcss-lite`: that name is unclaimed on npm and anyone could publish it. URLs are generated from `package.json` by `scripts/lib/release.mjs`.
5. **Edit sources, never generated files.** Sources are `tokens/*.tokens.json`, `components/*.json` and `*.html`, `src/{global,layout,components,utilities}.css`, `icons/*.svg`, `guidelines/content.json`, `demo/steps.json`, `demo/demo.css` and `demo/demo.js`. Everything else (`src/tokens.css`, `dist/`, `AGENTS.md`, `llms*.txt`, `demo/index.html`, `demo/components/*.html`, `demo/status.html`, `demo/content.html`) comes from `npm run build`, and `npm run check` fails when it is stale.
6. **Never break consumers.** Keep every token and class name from 0.1.0; deprecate with a replacement instead of removing.
7. **Work the way Gabriel does.** Creative work starts with `/brainstorm`, then a grilling round (one question at a time, with a recommended answer). Quality passes use `/impeccable` critique **and** audit, run as two isolated sub-agents; fix P1–P3 in one batch, then re-check once. He approves designs section by section and asks for adjustments, not rewrites.
8. **Show the thinking.** Record decisions in `_memory.md` (newest first) and design decisions in `DESIGN.md`. Guidance cites its sources in each contract's `sources[]`.

## 4. How it fits together

```
tokens/*.tokens.json ─┐
components/*.json ────┼─ scripts/build.mjs (generate) ─► src/tokens.css, dist/*, AGENTS.md, llms*.txt,
components/*.html ────┤                                   demo/index.html, demo/components/*.html,
icons/*.svg ──────────┤                                   demo/status.html, demo/content.html
guidelines/content.json
demo/steps.json ──────┘
scripts/check.mjs (runChecks) ─► CSS ↔ contracts, tokens, examples validate, guidance, icons, freshness
bin/mcss-lite.mjs validate ────► scripts/lib/validate.mjs (createValidator)
```

| File | What it does |
|---|---|
| `scripts/lib/generate.mjs` | `generate(root)` returns a Map of every generated file. It builds the manifest (including `pages`, `contentRules`, `icons`) and the docs (setup, blocks table, icons, content rules, validator rules, block detail). |
| `scripts/lib/pages.mjs` | Part sheets, the inventory and the content page. `checkGuidance()` requires every "do" example to validate cleanly and every "don't" with a `rule` to trip that rule. |
| `scripts/lib/demo.mjs` | The booklet: steps, the call-out "parts bags", glyphs (`GLYPHS`), the install box, the wrong-piece step. |
| `scripts/lib/validate.mjs` | The validator. `RULES` is the single list of rule ids and levels (it feeds the CLI help, AGENTS.md and the content page). It captures text, tracks regions for `primary-count`, handles `--ignore` and `<!-- mcss-lite-ignore rule: reason -->` (warnings only). |
| `scripts/lib/contracts.mjs` | Loads contracts. Builds the class inventory, `stateInventory` (data-state only) and `nativeStateInventory`; `stateLabel()`. |
| `scripts/lib/icons.mjs` | `loadIcons`, `checkIcons` (24-unit grid, strokes only), `buildSprite` (adds `vector-effect="non-scaling-stroke"`), `inlineSprite`. |
| `scripts/lib/check.mjs` | Every repo check. Native states must have their selector in the CSS; component tokens must be written `var(--x, var(--semantic))`. |
| `schemas/component.schema.json` | The contract schema. States can be `native` with a `selector`. `scripts/lib/schema.mjs` is a small validator (type, required, enum, const, pattern, if/then). |
| `test/*.test.mjs` | Back-compat names, WCAG contrast pairs in both themes (plus the dark brick edge), check and validate fixtures (`test/fixtures/html/{good,bad}.html`), pages, icons. |

**Contracts:**
- Each block has `status` (beta, stable or deprecated), `since`, `guidelines` (`whenToUse`, `whenNotToUse`, `doDont`, `content`), `keyboard`, `a11y` and `sources`.
- Checkbox, radio and toggle use native states (`:checked`, `:disabled`, `[aria-invalid="true"]`), never `data-state`.
- A group error goes on `fieldset.c-form-field[data-state="error"]` with `aria-describedby`.

## 5. Commands

```sh
npm run build          # regenerate everything
npm run check          # repo checks (must say "ok")
npm test               # 71 tests at 0.4.0
node bin/mcss-lite.mjs validate components demo   # must be 0 errors, 0 warnings
npm run check:package  # the package ships what consumers need
```

**Visual checks:**
- Serve the repo (`python3 -m http.server`) and use Playwright's Chromium at `/opt/pw-browsers/chromium`. Load it with `require('playwright')` and `NODE_PATH=$(npm root -g)`, or with `createRequire` for ESM.
- Check 320/390/1440px in light, `?theme=dark`, forced colours, and reduced motion.
- Wait for transitions (150ms) before reading computed styles.
- The Impeccable detector (`.claude/skills/impeccable/scripts/impeccable detect`) reports mostly false positives on this repo because it doesn't resolve `var()` and `clamp()`, and it reads `--` in class names as dashes. Judge regressions by browser-verified findings, not by its raw count.

## 6. After a release

1. **Portfolio** (`gabrielcpule/New-new-new-portf`, Next.js on Vercel):
   - Branch from its `main`.
   - Run `node scripts/sync-design-system.mjs --ref vX.Y.Z` (add `NODE_USE_ENV_PROXY=1` behind a proxy).
   - Run `pnpm build`, and smoke-test `/design-system`, `/design-system/status`, `/design-system/content` and `/design-system/components/<name>` on `next start`.
   - Open a PR. The sync reads the page list from the manifest; rewrites in `next.config.mjs` and `app/sitemap.ts` pick up new sheets on their own. Vercel previews sit behind a login, so verify locally.
2. **Figma:**
   - `dist/figma/push-variables.js` creates or updates variables by name and is safe to re-run. At 0.4.0 it is about 52 KB, over the Figma connector's 50,000-character limit.
   - Push only the collections that changed (usually Component plus effect styles). Resolve aliases into untouched collections from the file's existing variables (`${collectionName}::${variableName}`).
   - Read back the variable counts.
   - A later fix: split the generated script per collection or minify it, so it always fits.

## 7. Decisions to respect

The full log is in `_memory.md`. These are the ones most likely to be questioned again:

- **Checked controls are ink, not blue.** Blue means "act".
- **The radio is the only round control** ("round means pick one").
- **Alerts are paper, not tinted.** Tone shows three ways: a 4px bottom edge in the tone colour, a shaped icon tile (circle, rounded square, triangle, octagon) and a hidden text prefix. The warning tint equals the call-out cream, which is reserved for highlights.
- **The toggle's off thumb is empty.** The bar mark means "mixed" only.
- **A saving toggle holds its thumb in the middle.**
- **Icons take `currentColor` only.** The sprite must be inlined, because `<use>` can't load across origins.
- **Validator:** errors can't be ignored; warnings can. `clickable-div` fires on click triggers only. `toggle-in-form` stays quiet for autosave forms and forms without a submit button. Title Case is judged per sentence and skips acronyms, months and camelCase brands. Content rules apply to English pages only.
- **Booklet stages are `<figure>` elements,** so each example is its own region for `primary-count`. Showcase galleries opt out with `<!-- mcss-lite-ignore primary-count: reason -->`.
- **Prefer a focusable inactive button** (`aria-disabled="true"` plus a linked reason) over `disabled`.
- **Forms:** mark optional fields, not required ones. Validate with "reward early, punish late" and show an error summary on submit.
- **Beta** means shipped and validated, but the API may change in a minor version. The beta sticker is solid, because dashed means disabled.

## 8. What's next

Nothing is in progress. Suggested order, each as its own PR with a brainstorm and grilling round first:

1. **Small fixes left from the 0.4.0 audit.**
   - Component tokens for toggle geometry (`--toggle-width`, `--toggle-height`) and the alert icon tile (`--alert-icon-size`), with the offsets derived from them.
   - Make `push-variables.js` fit the connector limit.
   - The parts inventory scrolls sideways at 195 CSS px (390px at 200% zoom). This is below the WCAG 320px reflow requirement, but tidy it.
2. **Agent tooling** (research: a CLI beats MCP for adoption).
   - `validate --json` with fix hints for each issue.
   - A pre-write hook recipe for Claude Code and Cursor.
   - A thin MCP server generated from the contracts (out of scope until now, so confirm with Gabriel first).
3. **Server-rendered adoption.** Nunjucks and Jinja partials generated from the contracts, validated in CI. A CI mode that validates the rendered HTML from a server's test suite.
4. **Evidence.** Run `evals/mcss-lite-skill.md` again (prompts 9 and 10 cover 0.4.0) from a working directory outside the repo, to get a true no-docs baseline. Then publish an invented-class-rate eval.
5. **New parts, native HTML first:** tabs, menu (`popover`), toast, each shipped as beta with a part sheet, sources and validator coverage.
6. **Figma:** components and Code Connect were deliberately out of scope. Revisit only if Gabriel asks.

**Research gaps:** Reddit and Stack Overflow were unreachable during the September research. Evidence came from HN, GitHub and GitLab issues, NN/g, GOV.UK, Pajamas, Primer, Roselli, Soueidan and O'Hara. Some items are unverified, for example Safari's support for `closedby`.

## 9. Gotchas

- **Rewritten main.** If a PR says the branch has "no history in common with main", main was rewritten. Check that the trees match (`git diff <old-base> origin/main` is empty), then `git rebase --onto origin/main <old-base>`.
- **Force-pushing.** Force-push only your own branch, with `--force-with-lease=<branch>:<expected-sha>`. A merged PR's remote branch may still exist; confirm its content is already on main before replacing it.
- **Stage links.** The booklet rewrites every stage `href` to a local anchor, except `#mcss-icon-*` references. Keep that exception when touching `localLinks` or the step builder.
- **Contract JSON formatting.** Contract files use two formats: some are `JSON.stringify(…, null, 2)`, others a compact layout at 110 columns. Keep each file's existing style; don't reformat a whole file for a small change.
- **Component tokens.** Component tokens are unset by default. Always write `var(--component-token, var(--semantic-token))`; `npm run check` enforces the exact fallback.
