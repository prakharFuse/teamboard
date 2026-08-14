---
name: gotchas
description: Non-obvious behavior in TeamBoard that looks like a bug but is either intentional or a known gap — read before "fixing" any of it
type: knowledge
scope: global
updated: 2026-08-14 (IONE-959)
captured_sha: 355106dab2d7eddb60f06a41639a880723b168df
sources:
  - package.json
  - pnpm-lock.yaml
---

## The path-to-regexp security override was never actually applied

`package.json`'s `pnpm.overrides` pins `path-to-regexp` to `0.1.13` (meant to fix GHSA-37ch-88jc-xwx2, a ReDoS in the version `express` depends on), but `pnpm-lock.yaml` was never regenerated: it still resolves `path-to-regexp` to `0.1.12` under `express`'s own dependency block, and the lockfile has no `overrides` section at all. The two "fix" commits (`300283a`, `355106d`) only edited `package.json`. Until someone runs `pnpm install` to regenerate `pnpm-lock.yaml`, the installed tree is unaffected — the override exists on paper only, and the CVE is not actually mitigated.
