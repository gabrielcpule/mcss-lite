// MCSS-Lite ships from GitHub release tags, not the npm registry: CSS from jsDelivr,
// installs and the validator from a git spec pinned to the same tag.
const repoSlug = (pkg) => pkg.repository.replace(/^github:/, '');
export const cdnUrl = (pkg) => `https://cdn.jsdelivr.net/gh/${repoSlug(pkg)}@v${pkg.version}/dist/mcss-lite.min.css`;
export const gitSpec = (pkg) => `github:${repoSlug(pkg)}#v${pkg.version}`;
