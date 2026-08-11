---
name: gotchas
description: Non-obvious behaviors in the members API and seed data verified against the code
type: knowledge
scope: global
updated: 2026-08-11 (IONE-959)
captured_sha: 901b35e75356224e3b0ab6eb370a18278522ff88
sources:
  - package.json
---

## `path-to-regexp` is pinned via `pnpm.overrides`, not a direct dependency

`package.json`'s `pnpm.overrides` pins `path-to-regexp` to `0.1.13` even though it never appears
in `dependencies` — it's a transitive dependency pulled in by `express`. The pin patches
GHSA-37ch-88jc-xwx2, a high-severity ReDoS. If `express` is upgraded and pnpm's lockfile
resolves a newer `path-to-regexp` on its own (i.e. the CVE is fixed upstream in the version
express now requires), this override can be removed; otherwise keep it or a task may silently
reintroduce the vulnerability by bumping express without checking the transitive resolution.
