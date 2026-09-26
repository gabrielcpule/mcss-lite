# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primarily a portfolio showcase: hiring managers, design-system leads and peers evaluating Gabriel Pule's approach to AI-ready design systems (MCSS). They read the repo, the docs and the demo to judge the thinking and the craft. Real adoption by teams is secondary but must work end to end, because a showcase that does not actually work undermines the point.

Two readers of the system itself:

- **AI coding agents** (Claude Code, Cursor, Copilot and similar) generating UI in projects that install `@gabrielpule/mcss-lite`.
- **Figma**, which imports the tokens as Variables so design and code share one source.

## Product Purpose

A lightweight, pure-CSS design system whose entire contract (every class, modifier, element, `data-state` value and token) is declared in machine-readable files and enforced by tooling, so AI agents write correct UI instead of guessing. Success: an agent given the shipped skill and docs produces markup that passes `npx mcss-lite validate` with no invented classes or raw values, and the tokens round-trip into Figma Variables.

## Positioning

Contract-first for AI. Where Tailwind, Bootstrap or Pico leave agents to infer conventions from examples, MCSS-Lite ships the contract itself (DTCG tokens, per-block JSON contracts, generated AGENTS.md and llms.txt) plus a validator that checks the agent's output. It is the "lite" subset of the fuller MCSS architecture, which adds RDFa semantics and behavioral contracts.

## Operating Context

- Distributed on npm as `@gabrielpule/mcss-lite`; consumers link `index.css` or `@import` it.
- Agents read `AGENTS.md`, `llms*.txt`, `dist/mcss-lite.manifest.json` and `skills/mcss-lite/SKILL.md` from `node_modules`.
- Designers import `dist/figma/*.tokens.json` as Figma Variables (Primitives, Semantic with Light/Dark, Component).
- `demo/index.html` is the live showcase of every block and state.

## Capabilities and Constraints

- Pure CSS at runtime; tooling is zero-dependency Node (≥18).
- Cascade: `@layer global, layout, component, utility`. Prefixes `l-`, `c-`, `u-`; BEM naming; state via `data-state`.
- Golden Rule: components never set outer margin; layout primitives own spacing.
- JSON is the source of truth (`tokens/`, `components/`); CSS and docs are generated; `npm run check` fails on drift.
- Themes: light (default), dark and auto via `data-theme`, opt-in so existing sites do not change.
- Every custom property name from 0.1.0 is preserved.
- Out of scope for now: an MCP server, Figma components, Code Connect.

## Brand Commitments

Name "MCSS-Lite" and its relationship to MCSS. Author: Gabriel Pule. Existing brand color `#005a9c`. No logo or voice guide exists yet.

## Evidence on Hand

- The repo, its tests (back-compat, WCAG contrast in both themes, validator fixtures) and the skill eval in `evals/mcss-lite-skill.md`.
- No adopters, testimonials or usage numbers exist; none may be claimed.

## Product Principles

1. **The contract is the product.** If an agent cannot read it, it does not exist; every class and token lives in a machine-readable file.
2. **Enforce, don't advise.** Rules that matter are checked by `check` and `validate`, not only described.
3. **Lite means lite.** No runtime JavaScript, no dependencies; add a feature only when it serves agents or designers directly.
4. **Never break consumers.** Names are kept or deprecated with a replacement, never silently removed.
5. **Show the thinking.** As a portfolio piece, decisions are documented where a reviewer will find them.

## Accessibility & Inclusion

WCAG 2.2 AA in both light and dark themes: text contrast ≥ 4.5:1, control boundaries and focus indicators ≥ 3:1, visible focus, adequate target size, and states expressed with native attributes or ARIA alongside `data-state`.
