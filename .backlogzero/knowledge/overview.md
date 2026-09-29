---
name: overview
description: What teamboard is (a BacklogZero journey-suite fixture repo) and where the real docs live
type: knowledge
scope: global
updated: '2026-09-29'
captured_sha: 18ba83de44f5251f500db381b15a7b931b7a0c52
sources:
  - README.md
  - package.json
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
---

See ../../README.md for the full explanation of purpose, re-seeding (`pnpm test:journey provision-repo`), and usage. In short: this is not a product, it's fixture content for BacklogZero's journey suite — a small task-tracking CLI kept deliberately small-but-not-empty so journey fixtures have real audit/extend targets.

Runtime: plain Node.js ESM (`"type": "module"` in package.json), no build step, no external dependencies (package.json declares none). Entry point is `src/index.js` (`npm start`); tests run via Node's built-in runner (`npm test` → `node --test`).

## Divergence from README

README's Configuration section states: "Environment variables are read in `src/config.ts`. See that file for the current list." No `src/config.ts` exists in this repo, there is no `.ts` file anywhere, and no source file reads `process.env` (verified by grep across `src/`). Treat the README's Configuration section as stale/aspirational, not current behavior — see [[fixture-invariants]] for why the hardcoded values it would describe are intentionally *not* centralized into such a module.
