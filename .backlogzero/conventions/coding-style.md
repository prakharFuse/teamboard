---
name: coding-style
description: JS module/style conventions actually used in src/ — ESM, no build step, no dependencies
type: convention
scope: global
updated: 2026-09-18 (IONE-959)
captured_sha: 88dd68751303506f969e7b6a8e78fe17799821e0
sources:
  - src/bamboohr-client.js
  - src/sso-client.js
  - src/api-client.js
sources_sha256:
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/bamboohr-client.js: 928e8c22df39838d0daf4d5e06a660cddb14987c4e7c360907d9d695dcaca0f4
  src/sso-client.js: e460e4576528e65d9e59b5e41794ad36e70bd7c338f0a374c2d4863c83330cdf
---

- New HTTP clients (`BambooHrClient` in `src/bamboohr-client.js`,
  `SsoClient` in `src/sso-client.js`) accept an injectable `fetchImpl`
  (default: global `fetch`) and read their credential
  (`BAMBOOHR_API_KEY`, `SSO_API_TOKEN`) from `process.env` in the
  constructor — unlike `src/api-client.js`, which calls global `fetch`
  directly and hardcodes everything. Follow the injectable-`fetchImpl`
  pattern for new network clients; it's what makes them testable without
  mocking globals.
