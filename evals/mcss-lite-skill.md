# MCSS-Lite skill eval

Checks whether `skills/mcss-lite/SKILL.md` (plus the files it points to) makes a coding agent write correct
MCSS-Lite markup. Each prompt runs twice in a fresh agent: **without** the skill (the agent is only told
"this project uses the MCSS-Lite CSS framework, loaded from index.css") and **with** it (the agent is also
given SKILL.md and access to AGENTS.md, llms-components.txt and llms-tokens.txt). Output is a single HTML
fragment per prompt.

Score: `npx mcss-lite validate` errors and warnings per output (lower is better), plus a manual pass for
invented CSS (hex values, custom classes that duplicate a block).

## Prompts

1. A pricing section with three plan cards (Free, Pro, Team), each with a title, a price, a short feature list and a call-to-action button. Pro is highlighted as the recommended plan.
2. A sign-up form with name, work email and password fields. The password field is showing the error "Use at least 12 characters". The submit button is in a loading state.
3. A confirmation dialog for deleting a project, with Cancel and Delete actions.
4. A settings page layout: a left navigation with four links and a main area with two stacked cards ("Profile", "Notifications").
5. A toolbar with a search input, a "Filter" button, a disabled "Export" button and a primary "New item" button.
6. A list of five deployments, each showing a name, a status badge (success, failed, in progress, queued, canceled) and a "View logs" link.
7. An empty state for a projects page: heading, one sentence of help text and a large primary button, centered at reading width.
8. The same card as prompt 1's Pro plan, but in dark mode, with a brand color override to purple for this page only.

## Results

### Run 2026-09-25 (outputs in `runs/2026-09-25/`)

The planned "without" condition could not be isolated: agents started inside this repo auto-load the root `AGENTS.md` as project instructions. So the comparison is **AGENTS.md only** vs **skill + tiered docs + validate**. A true no-docs baseline needs a session whose working directory is outside the repo.

| Prompt | AGENTS.md only | Skill + docs + validate |
|---|---|---|
| 1 Pricing cards | 1 error: `l-grid--3-col` combined with `l-grid--responsive` (exclusive group) | clean |
| 2 Sign-up form | 1 warning: loading button without `aria-disabled` | clean |
| 3 Delete dialog | clean | clean (native `<dialog>`, `c-button--danger`) |
| 4 Settings layout | clean | clean |
| 5 Toolbar | 1 error: invented `u-visually-hidden` (real class: `u-sr-only`) | clean |
| 6 Deployments list | clean | clean |
| 7 Empty state | clean | clean |
| 8 Dark + purple override | 1 warning: inline raw color (allowed by the prompt) | 1 warning: inline raw color (allowed by the prompt) |
| **Total** | **2 errors, 2 warnings** | **0 errors, 1 warning** |

What the run changed in the system:

- `AGENTS.md` now lists every `u-*` utility (it previously listed none, which caused the invented class).
- `AGENTS.md` now states that modifiers within one group are exclusive (which caused the `l-grid` error).
- `validate` now lists the real utilities when it sees an unknown `u-*` class.
