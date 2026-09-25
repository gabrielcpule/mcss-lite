# Vendored Claude Code skills

These skills live in the repo so every Claude Code session on MCSS-Lite has them,
with no plugin install needed.

| Path | Source | Commit | License |
|------|--------|--------|---------|
| `skills/impeccable/`, `agents/impeccable-*.md`, `settings.json` (hooks) | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) v4.4.0 | `9d715cc` | Apache-2.0 (`vendor-licenses/impeccable-*`) |
| `skills/brainstorming/`, `skills/writing-plans/`, `skills/executing-plans/` | [obra/superpowers](https://github.com/obra/superpowers) | `8ca22db` | MIT (`vendor-licenses/superpowers-LICENSE`) |

`commands/brainstorm.md` is a local alias so `/brainstorm` runs the `brainstorming` skill.

The Impeccable hooks in `settings.json` run `skills/impeccable/scripts/impeccable hook`
on session start, after Edit/Write, and on Stop. On first run the launcher downloads the
engine binary from Impeccable's GitHub releases and verifies it against its `.sha256`
checksum before running it.

To update, re-copy these paths from a fresh clone of each upstream repo.
