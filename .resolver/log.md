2026-08-14 · first-run · created .resolver
425cfb16-d4b2-4b1d-8353-2f8b070f62cb: added gotcha to knowledge/gotchas.md — pnpm.overrides pin for path-to-regexp@0.1.13 (GHSA-37ch-88jc-xwx2) isn't reflected in pnpm-lock.yaml, which still resolves 0.1.12; fix is not actually applied until `pnpm install` is rerun
