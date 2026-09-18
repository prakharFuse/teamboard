---
name: fixture-gotchas
description: Intentional rough edges in this fixture repo that must NOT be silently cleaned up — read before refactoring or auditing any src/ file
type: knowledge
scope: global
updated: 2026-09-18 (IONE-959)
captured_sha: 6ac1e4c52a61bbe095552098539117db4caeafc9
sources:
  - package.json
sources_sha256:
  package.json: a1abd75404d3b9b65e9a9717bed0c18f636479ab7cfa6663335dc0bb347a7310
---

- **`package.json` `pnpm.overrides.path-to-regexp`** — a recurring automated security fix for GHSA-37ch-88jc-xwx2 keeps pinning `path-to-regexp` via `pnpm.overrides`. This repo has zero real dependencies (no `dependencies`/`devDependencies` keys, no lockfile) and nothing in the tree references `path-to-regexp` outside this override. The pin is inert — don't treat it as evidence of a real dependency tree, and don't be surprised if similar overrides reappear across commits for other transitive-dep CVEs.
