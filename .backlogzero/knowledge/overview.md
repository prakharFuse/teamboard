---
name: overview
description: What this repo is — a deliberately small fixture CLI, not a product; read before "improving" anything in it
type: knowledge
scope: global
updated: '2026-09-16'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - package.json
  - README.md
  - src/index.js
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
---

`teamboard` is a fixture repository for BacklogZero's journey test suite — per its own
`package.json:5` description ("Journey suite fixture: a small task-tracking service.")
and README.md:10-17. It exists to give planning/execution journeys a small, non-empty
codebase to clone, branch, and open pull requests against. It is not a product with
real users.

Several things that look like defects are intentional fixture subjects for specific
tickets — see [[fixture-conventions]] before "cleaning up" anything in `src/`.

## Runtime

Plain Node.js, ESM (`"type": "module"`, package.json:6). No TypeScript, no bundler, no
lint config, no CI config present in this checkout. `npm start` runs `src/index.js`
directly; `npm test` runs `node --test` (package.json:8-10).

## Entry point

`src/index.js` is the whole CLI. `main()` parses `argv` into a command (`status`,
`tasks`, `help`, default `status`) plus a `--verbose` flag via `parseArgs`
(src/index.js:13-21), then dispatches on the command (src/index.js:42-66). See
[[architecture]] for how it wires to the other modules.

## Divergence from README.md

README.md:32-33 states: "Environment variables are read in `src/config.ts`. See that
file for the current list." No `src/config.ts`, nor any config file, exists in this
checkout — the only settings mechanism present is the in-memory `Map` in
`src/store.js`. Treat `src/store.js` (see [[fixture-conventions]]) as the actual
current source of settings, not the README's claim.
