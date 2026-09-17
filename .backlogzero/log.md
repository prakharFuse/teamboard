2026-09-17 · first-run · created .backlogzero

- Indexed the actual working tree (small `src/*.js` CLI fixture) after finding that the
  pre-built repository map available at session start (React client, Express server,
  node:sqlite) does not match the repo on disk. Recorded that divergence in
  knowledge/overview.md so future runs don't trust the stale map.
- Captured the `FIXTURE NOTE:` bait scattered through src/*.js and README.md in
  knowledge/fixture-notes.md — these mark code that must survive unrelated edits.
- Added knowledge/architecture.md (module-level Mermaid flowchart) and two convention
  pages (testing.md, coding-style.md) covering the Node test runner and ESM style.
- No database in the repo, so knowledge/data-model.md was skipped per instructions.
