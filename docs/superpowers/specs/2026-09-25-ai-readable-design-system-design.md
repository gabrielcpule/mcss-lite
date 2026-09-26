# MCSS-Lite: AI-readable design system + Figma Variables + dark mode

## Context
MCSS-Lite (pure CSS: tokens in `src/tokens.css`, `l-*` layouts, `c-*` BEM components with `data-state`,
`@layer global, layout, component, utility`) has no machine-readable contract. Coding agents in apps that
install `@gabrielpule/mcss-lite` must guess class names, modifiers, states and tokens, so they invent classes,
hard-code hex values and break the Golden Rule. Figma has no way to receive the tokens.

Goal: one source of truth that (1) coding agents (Claude Code, Cursor, Copilot…) read to write correct markup,
and (2) Figma imports as Variables — plus opt-in dark mode — while the runtime stays pure CSS and the tooling
stays zero-dependency (Node ≥18 built-ins only).

Approved through /brainstorm (sections 1–3) and informed by research on GitLab Pajamas (DTCG tiers,
`$extensions.com.figma.scopes`, `$deprecated`, AGENTS.md + skill + eval, token linting), Primer (find tokens /
lint_css MCP), Atlassian (tiered llms.txt, ESLint token rules), Shopify (validate agent output),
shadcn/Mantine (llms.txt, skills), DTCG 2025.10 stable spec, and Figma native DTCG import (one file per mode,
no composite tokens).

Decisions: JSON is source of truth (Approach A) · readers = app coding agents + Figma (tokens as Variables;
components stay code-side) · semantic-token cleanup included · dark mode included, opt-in · Impeccable
`init`, `critique`, `audit`, `document` pass · MCP server, Figma components, Code Connect: out of scope.

## Target layout
```
tokens/primitive.tokens.json        gray scale, white, brand (--color-primary…), space, radius, font sizes,
                                    weights, line-heights, border widths, durations, easings, z-index,
                                    container widths, shadows, font families
tokens/semantic.light.tokens.json   existing semantic names kept (--color-text-link, --color-background-success,
tokens/semantic.dark.tokens.json    --color-border-focus…) + new: color.text.{default,muted,subtle,inverse,on-action},
                                    color.surface.{default,subtle,raised,disabled}, color.overlay,
                                    color.border.{default,strong}, color.action.{primary,primary-hover,
                                    primary-active,neutral-hover}, color.focus.ring (alpha)
tokens/component.tokens.json        button/input/card/modal/badge tokens aliasing semantic
components/<name>.json + <name>.html   contracts + canonical examples (7 components + 9 layouts + utilities)
schemas/component.schema.json       JSON Schema for contracts
scripts/lib/tokens.mjs              load/merge/resolve aliases, DTCG → CSS value, name = path.join('-')
scripts/lib/contracts.mjs           load contracts, class inventory
scripts/build.mjs                   → src/tokens.css, dist/figma/*.tokens.json, dist/mcss-lite.manifest.json,
                                      AGENTS.md, llms.txt, llms-tokens.txt, llms-components.txt, llms-full.txt
scripts/check.mjs                   repo lint (below)
bin/mcss-lite.mjs                   `npx mcss-lite validate <file|dir>`
skills/mcss-lite/SKILL.md           shipped agent skill
evals/mcss-lite-skill.md            8 prompts, scored by validate, with vs without skill
demo/index.html                     every component/state; theme switcher (light/dark/auto)
test/*.test.mjs + test/fixtures/    node --test
.github/workflows/ci.yml            npm test && npm run check
PRODUCT.md, DESIGN.md               via Impeccable init/document
docs/superpowers/specs/2026-09-25-ai-readable-design-system-design.md   (this spec, committed first)
```

## Implementation steps

1. **Commit spec** to `docs/superpowers/specs/…-design.md` (content = this plan's Context + design).

2. **Tokens → DTCG JSON.** Port every variable in `src/tokens.css` into `tokens/*.json` using DTCG 2025.10
   (`$type`, `$value`, `$description`; color as `{colorSpace:"srgb", components, alpha, hex}`; dimension as
   `{value, unit:"rem"}`; aliases `{color.gray.900}`). Add `$extensions["com.figma.scopes"]` on semantic colors
   and spacing. Mark `$extensions["mcss.figma"]: false` on shadows / font families / cubic-bezier (Figma can't
   import composites). Design dark values for the semantic tier (surfaces from gray-900/800, text from
   gray-50/300, brand lightened for contrast) — may add a few primitives (e.g. `color.blue.300`).

3. **`scripts/lib/tokens.mjs` + `build.mjs` → `src/tokens.css`.** Output shape:
   - `:root { primitives }`
   - `:root, [data-theme="light"] { semantic light; component tokens }`
   - `[data-theme="dark"] { semantic dark; component tokens }`
   - `@media (prefers-color-scheme: dark) { [data-theme="auto"] { semantic dark; component tokens } }`
   Component tokens are re-emitted in every theme block because custom properties resolve `var()` where
   declared — otherwise they'd stay light inside a dark subtree. Header: "GENERATED — edit tokens/*.json".
   Default (no attribute) stays light → no change for existing sites.

4. **Component migration** (`src/components.css`, `src/global.css`, `src/layout.css`): replace primitive usage
   (`--color-gray-900`, `--color-white`, `--color-gray-100/200`…) with semantic/component tokens; replace
   hard-coded `rgba(0,90,156,.15)`, `rgba(114,28,36,.15)`, `rgba(0,0,0,.5)` with `--color-focus-ring`,
   `--color-focus-ring-error`, `--color-overlay`. Merge `.c-label` into `.c-form-field__label` (grouped
   selector; `.c-label` kept, contract `status: "deprecated"`). Media-query px (768px) exempted.

5. **Contracts** `components/*.json` + `schemas/component.schema.json` (fields: name, block, layer, status,
   description, element, modifiers{group:{values,exclusive}}, elements, states{value:{attr,pair}}, children,
   tokens, guidelines{use,avoid}, a11y, related, examples). One canonical `.html` example each. Utilities in a
   single `components/utilities.json`.

6. **`scripts/check.mjs`** (regex-based, no deps) fails on: CSS class `.c-/.l-/.u-*` not in a contract;
   contract class/modifier/element/state missing from CSS; `var(--x)` not defined in tokens; primitive token
   used in `components.css`; raw hex/`rgb(`/`rgba(` outside generated `tokens.css`; `$deprecated` token used;
   contract fails schema; generated files stale (rebuild in memory, diff).

7. **`bin/mcss-lite.mjs validate`**: scan `class="…"` / `data-state="…"` per element tag; report unknown
   prefixed classes, modifier/element without its block on same element (modifiers) , invalid `data-state`
   for the block, mutually exclusive modifiers together, deprecated classes (warning), inline hex in
   `style=""` (warning). Exit 1 on errors; `--json` output for agents.

8. **Generated agent docs** from manifest: `AGENTS.md` (5 rules: Golden Rule; layout → component → utility →
   `var()`; never invent class/token names; states via `data-state` + ARIA pair; theme by overriding semantic
   tokens only — then block/modifier/state table, semantic tokens by intent, "run `npx mcss-lite validate`"),
   tiered `llms.txt` → `llms-tokens.txt`, `llms-components.txt`, `llms-full.txt`.
   `skills/mcss-lite/SKILL.md` (hand-written, short; points at AGENTS.md/manifest/examples in node_modules).

9. **Figma output + push.** `dist/figma/{primitive,semantic.light,semantic.dark,component}.tokens.json`
   (Figma-importable subset, aliases preserved, scopes set). Push via Figma MCP (load `figma-use` skill
   first) into a new file "MCSS-Lite Tokens": collections Primitives (1 mode), Semantic (Light, Dark; aliases
   → Primitives), Component (aliases → Semantic). Verify with `get_variable_defs`. Document native
   import/export round-trip in README.

10. **Package + docs.** `package.json` 0.2.0: scripts `build`, `check`, `test`; `bin`; `files` += tokens/,
    components/, schemas/, dist/, skills/, AGENTS.md, llms*.txt, bin/; `exports` { ".": "./index.css",
    "./manifest": "./dist/mcss-lite.manifest.json", "./tokens/*": …, "./*": "./*" } (keep deep paths).
    README: "Using with AI agents", "Figma", "Dark mode", "Contributing (edit JSON, run build)".

11. **Tests** (`node --test`): back-compat (every var name in the original `tokens.css` — snapshot captured
    before step 2 into `test/fixtures/legacy-token-names.txt` — still emitted); alias resolution; WCAG AA
    contrast for text/surface, on-action/action, feedback text/background pairs in light AND dark; check.mjs
    passes on repo and fails on seeded bad fixtures; validate good/bad HTML fixtures; build is deterministic.
    CI workflow.

12. **Demo + Impeccable pass.** `demo/index.html` (all components/states, light/dark/auto switch).
    `/impeccable init` → PRODUCT.md (draft, ask user only for gaps). Then `/impeccable critique` and
    `/impeccable audit` on the demo in both themes (desktop + mobile, Playwright screenshots), fix all
    findings in one batch, one confirm round. `/impeccable document` → DESIGN.md.

13. **Skill eval.** Run 8 prompts from `evals/mcss-lite-skill.md` via subagents with and without the skill;
    score outputs with `validate`; record results in the eval file.

14. Commit in logical chunks; push to `claude/design-system-ai-mcss-lite-4mhmop`. No PR unless asked.

## Verification
- `npm run build && git diff --exit-code` (deterministic, committed outputs fresh)
- `npm run check` passes; `npm test` passes (back-compat, contrast both modes, fixtures)
- `npx mcss-lite validate components/*.html demo/` → 0 errors
- Playwright screenshots of `demo/` in light / dark / auto(dark) at desktop + mobile; visual check
- Figma MCP `get_variable_defs` on the new file shows 3 collections, Light/Dark modes, aliases intact
- Impeccable critique + audit findings resolved; DESIGN.md + PRODUCT.md present
- Skill eval shows fewer validate errors with the skill than without
