## What changed

<!-- One or two sentences. Link the issue if there is one. -->

## Why

## Checklist

- [ ] Edited the source (`tokens/*.tokens.json`, `components/*.json`, `src/*.css`), not generated files, then ran `npm run build`
- [ ] `npm test` and `npm run check` pass
- [ ] `npx mcss-lite validate components demo` passes
- [ ] No 0.1.0 token or class names removed (deprecate instead), or the version is bumped for a breaking change
- [ ] Checked light, dark and `auto` themes; contrast still meets WCAG 2.2 AA
- [ ] No account-specific IDs (Figma file keys, team IDs) in shipped files
