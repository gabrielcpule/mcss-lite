---
target: demo/index.html
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 5
target_identity: "file:/home/user/mcss-lite/demo/index.html"
target_fingerprint: "sha256:23615a165adc1962c3988ce1571efed2bad679fb072408b63511f3eef4b40921"
target_path: /home/user/mcss-lite/demo/index.html
timestamp: 2026-09-26T00-20-35Z
slug: demo-index-html
---
Method: dual-agent (A: design review · B: detector + browser evidence), plus a parallel technical audit.

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Step-2 Light/Dark toggle looks live but does nothing |
| 2 | Match System / Real World | 3 | Wrong-piece fix maps Retry to c-button--danger |
| 3 | User Control and Freedom | 3 | Dead demo links (/docs, /projects/atlas, #all) |
| 4 | Consistency and Standards | 2 | "1:1" call-outs omit parts used in the stage; x means two things |
| 5 | Error Prevention | 3 | Static preview dialog buttons are live tab stops |
| 6 | Recognition Rather Than Recall | 3 | Nothing ties a call-out entry to its element in the stage |
| 7 | Flexibility and Efficiency | 2 | Step rail only >=1440px; no copyable snippets |
| 8 | Aesthetic and Minimalist Design | 3 | Seven identical step layouts; thin stages in steps 3 and 7 |
| 9 | Error Recovery | 3 | Validator names valid alternatives |
| 10 | Help and Documentation | 3 | Install and docs links in first viewport |
| **Total** | | **28/40** | **Good** |

Technical audit: 16/20 (Good), up from 14/20. P0 0 · P1 1 · P2 7 · P3 5.

## Design Specificity Verdict
Authored, not interchangeable: keylines, brick edge, Rubik numerals, parts bags, stud grid, arrows and misfit bricks all come from the Build Instructions world, and the contract is visible. Weakness: the same 5/7 step template seven times; layouts invisible on the baseplate.
Detector: with config 1 advisory (skip-link color, false positive); without config 21 hidden findings, all static-scan false positives. Overlay: nested-cards x4 (specimens in stages), repeating-stripes-gradient (dot grid), em-dash (token names) — false positives. Measured: no text contrast failures (disabled exempt), all 40 tab stops have >=5.8:1 rings, reduced motion stops every animation, rail aria-current tracks correctly.

## Priority Issues
1. [P1] Nested data-theme subtrees leave text inheriting body color: 1.17:1 inside a dark card on a light page. Fix: [data-theme] sets color/background; parts set color. /impeccable harden
2. [P1] l-stack regression: inline-flex components (buttons, badges) and form controls sit on one row. Fix: flex column with stretch, inline parts align-self start, l-center width 100%. /impeccable layout
3. [P1] Step 1 does not show layouts working: stage too narrow, sidebar collapses, switcher stacks. Fix: full-width stage + outlined l-* regions with tags. /impeccable layout
4. [P1] "1:1" call-outs are not 1:1 (step 1 uses c-card, u-text-center unlisted). Fix: derive call-outs from classes present in the stage. /impeccable clarify
5. [P1] Wrong-piece fix teaches misuse (warning -> danger on Retry). Fix: Retry -> plain c-button; bigger misfit drawing; stack spacing. /impeccable delight

## Persona Red Flags
Sam: ~45 tab stops incl. dead preview-dialog buttons; count tags rely on title. Jordan: 404 links; inert toggle; "1:1" and "x" unexplained. Morgan: call-out/stage mismatch and Retry=danger undercut contract-first; nested-theme contrast failure.

## Minor Observations
[hidden] overridden on c-modal/c-button/l-cluster; l-grid--responsive 280px floor overflows at 320px; hero overflows at 200% text; forced-colors hides error edge; docs say component tokens follow themes automatically; dark loading stripes 3.64:1; count tags need sr text; meta description stale; arrow dash "marches".

## Questions to Consider
If the stage is a baseplate, why can't I see it? Should the final step let the reader break a part themselves?
