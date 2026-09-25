---
version: 1
slug: "demo-index-html"
primary_target: "demo/index.html"
related_targets: []
---

# Surface brief: demo/index.html

Scope: the MCSS-Lite showcase page, generated from components/*.json by scripts/build.mjs. Mode: Read.
Audience: design-system leads and hiring managers evaluating a contract-first, AI-ready design system; secondary: developers adopting it.
Job: understand what MCSS-Lite is, see every block and state, see the contract behind each part, see validation reject a wrong part, install it.
Constraints: tokens only (no raw values), passes `npx mcss-lite validate`, WCAG 2.2 AA in light and dark, works at 320px, no runtime dependencies beyond one display webfont.
Memorable moment: the "wrong piece" panel where validate rejects an invented class like a brick that does not fit.
Unresolved: none.

## Direction contract

THESIS: Layouts seat components the way an instruction booklet seats bricks. The page is a build you follow step by step, refusing the kitchen-sink docs page of same-size preview cards.

OWN-WORLD: 2px ink keylines around every part; brick blue #005a9c as the primary action; brick red for danger and error; brick yellow only for the "new part" call-out and the focus halo, always inside an ink ring; instruction sky blue as the demo canvas, never the product default; 4px stud radius; brick edge depth (short offset plus soft blur); 8px stud module; system sans for UI, Rubik for oversized step numerals. Dark: night build on navy ink with light keylines and saturated blue.

STORY: The visitor reads the claim and install line, scans the parts inventory, follows numbered steps that seat each block with its exact classes in a 1:1 call-out, watches validate reject a wrong piece, and leaves with links to AGENTS.md, the manifest and the Figma files.

FIRST VIEWPORT: Left column: MCSS-Lite wordmark, one-line claim, install command, links to AGENTS.md, manifest and Figma files, theme switch. Right column: the parts inventory as three bags (layouts, components, tokens) with part counts and keylined swatches. Step numeral 1 begins at the fold.

FORM: Build Instructions (catalog challenger games-toys-physics-play-brick-build-instructions, chosen by the user over the assigned direction, position 4 of 7 on the ordered list); seed key a4f52e2b.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
