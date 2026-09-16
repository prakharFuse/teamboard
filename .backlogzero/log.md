2026-09-16 · first-run · created .backlogzero
e685ec1c-0808-4e37-a7f5-968b1c554393: regenerate knowledge/gotchas.md — TM-105 department allowlist now enforced (POST+PATCH), DELETE is now a soft-delete with synchronous SSO deprovision dispatch (TM-106), old CI-red/hard-delete facts replaced
e685ec1c-0808-4e37-a7f5-968b1c554393: regenerate knowledge/data-model.md — department now allowlist-validated at app layer, seed data no longer inconsistent, is_active/DELETE now documented as soft-delete
e685ec1c-0808-4e37-a7f5-968b1c554393: add-fact conventions/testing.md — note mutable-object+mock.method spy seam pattern used for ssoDeprovision
e685ec1c-0808-4e37-a7f5-968b1c554393: flagged divergence — .github/workflows/ci.yml comment claims test is intentionally red, but department validation now makes it pass
2026-09-16 · e685ec1c-0808-4e37-a7f5-968b1c554393 · corrected knowledge/gotchas.md — .github/workflows/ci.yml:3-7 is stale (members.ts now validates department against a CANONICAL_DEPARTMENTS allowlist on both POST and PATCH, so the 'rejects an invalid department' test now passes — CI is green for that check, not intentionally red.)
