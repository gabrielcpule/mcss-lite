---
target: demo/index.html
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 5
target_identity: "file:/home/user/mcss-lite/demo/index.html"
target_fingerprint: "sha256:b218ada45e88ee8e07c7698fcc563f56a50462c715d5e03ef7994d22dac7add6"
target_path: /home/user/mcss-lite/demo/index.html
timestamp: 2026-09-25T22-41-06Z
slug: demo-index-html
---
Method: dual-agent (A: design review · B: detector + browser evidence), plus a parallel technical audit.

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Theme toggle aria-pressed has no visual state; loading = opacity only (3.66:1) |
| 2 | Match System / Real World | 2 | "Delete account…" under a sign-up form; class names as card content |
| 3 | User Control and Freedom | 3 | Modal: Esc/backdrop/close + focus return; page behind not inert |
| 4 | Consistency and Standards | 2 | h1 smaller than h2; secondary hover = primary; inputs vs buttons focus differ |
| 5 | Error Prevention | 1 | Destructive actions use c-button--primary; no danger variant |
| 6 | Recognition Rather Than Recall | 2 | No class/modifier labels under examples |
| 7 | Flexibility and Efficiency | 2 | No jump links, copyable snippets |
| 8 | Aesthetic and Minimalist Design | 3 | Clean, but no point of view |
| 9 | Error Recovery | 2 | Error border 1.5:1; focused error input loses focus border |
| 10 | Help and Documentation | 1 | No intro, install, or links to AGENTS.md / manifest / Figma |
| **Total** | | **20/40** | **Acceptable** |

Technical audit: 14/20 (Good). A11y 2, Performance 3, Responsive 3, Theming 3, Integrity 3. P0 0 · P1 7 · P2 7 · P3 4.

## Design Specificity Verdict
Category-interchangeable: Bootstrap-derived palette and system stack; the page never shows the contract that is the product (classes, data-state, AGENTS.md, validate). Theme-scope section is the only authored idea.
Detector: 3 warnings in demo/index.html (cramped-padding ×2 on .demo-scope, flat-type-hierarchy), all false positives (24px padding exists; tokens unresolved by static scan). components/ clean. Live overlay: no anti-patterns in either theme. Measured text contrast: no failures (min 4.69:1).

## Priority Issues
1. [P1] Input states fail WCAG: error/success borders 1.35–1.96:1; [data-state] beats :focus so focus border vanishes (1.00:1); outline:none also kills focus in forced-colors. Fix: darker state border tokens, `.c-input[data-state]:focus`, 2px outline (transparent fallback). /impeccable harden
2. [P1] No destructive variant: Delete looks like Publish. Fix: c-button--danger + --color-action-danger tokens in both themes. /impeccable harden
3. [P1] Links by color alone (2.37:1 vs body) and loading button 3.66:1 + still keyboard-activatable. Fix: underline links by default; loading tokens ≥4.5:1 + aria-disabled pair. /impeccable colorize
4. [P1] Layout primitives: l-stack ignores inline children; l-cluster stretches mixed sizes; <dialog> recommended but CSS forces it visible. Fix: l-stack flex column gap; l-cluster align-items center; dialog.c-modal rules; modal gutter. /impeccable layout
5. [P1] Demo hides the contract. Fix: intro (what/install/links), class + data-state caption per example, validate panel. /impeccable clarify

## Persona Red Flags
Sam: invisible focus on error input; color-only success/links; toggle state only for AT. Jordan: nothing says what MCSS-Lite is or how to install. Morgan (DS lead): palette with no rationale, no danger variant, state borders fail the system's own AA claim.

## Minor Observations
Dark focus ring equals primary fill (1.00:1); dark elevation invisible; no print styles (dark prints white text); RTL physical properties; global p/h margins leak into components; nested auto theme stays dark; @import waterfall; sm button 36px / close 32px (<44px).

## Questions to Consider
If the contract is the product, why does the showcase hide every class name? Should the demo be generated from components/*.json so it can't drift?
