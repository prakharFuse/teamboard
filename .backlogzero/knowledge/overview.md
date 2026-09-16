---
name: overview
description: What TeamBoard is, its stack, and how to run it — read first for orientation
type: knowledge
scope: global
updated: 2026-09-16 (IONE-959)
captured_sha: c823beaf827d9abc800035022c0a9ab480816336
sources:
  - package.json
sources_sha256:
  package.json: dd53d53f5acc0423865e1b55ed8b8220bb907eea8b845daa870a7dcd09e2c866
---

- `package.json` pins a `pnpm.overrides` entry: `path-to-regexp: "0.1.13"`. This forces the version used transitively by express (which normally resolves to a vulnerable range) to patch GHSA-37ch-88jc-xwx2, a high-severity ReDoS. If express is ever upgraded or this override removed, re-check that the resolved `path-to-regexp` version isn't vulnerable again.
