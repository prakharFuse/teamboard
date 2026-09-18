---
name: fixture-gotchas
description: Intentional imperfections in this repo that must NOT be "fixed" opportunistically — read before touching any file with a FIXTURE NOTE comment
type: knowledge
scope: global
updated: 2026-09-18 (IONE-959)
captured_sha: 88dd68751303506f969e7b6a8e78fe17799821e0
sources:
  - src/bamboohr-client.js
  - src/member-lifecycle.js
  - src/members.js
  - src/sso-client.js
sources_sha256:
  src/bamboohr-client.js: 928e8c22df39838d0daf4d5e06a660cddb14987c4e7c360907d9d695dcaca0f4
  src/member-lifecycle.js: f13689c0cc4fba10783791e36abc48a809da296581ba37baa4747b116a553b0f
  src/members.js: 432cb7d63c9a4bc6d5268c12acd304f9df0201f49297d6c9546b592f8c2fe8d8
  src/sso-client.js: e460e4576528e65d9e59b5e41794ad36e70bd7c338f0a374c2d4863c83330cdf
---

- `src/bamboohr-client.js`, `src/member-lifecycle.js`, `src/members.js`, and
  `src/sso-client.js` (added for ticket TEAM-6) do NOT carry a `FIXTURE NOTE`
  comment — they're a real feature completion (member lifecycle + BambooHR
  import + SSO deprovisioning), not a deliberately-flawed fixture subject.
  Don't assume every file has an intentional flaw to preserve; check whether
  its doc comment is actually labeled `FIXTURE NOTE` before treating it as
  off-limits.
