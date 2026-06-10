# TEAM-6 RCA Artefacts — Index

**Ticket:** [TEAM-6] Investigate: HR data pipeline failures and SSO security gap in member lifecycle  
**Priority:** Medium  
**Date Opened:** 2026-06-10  
**Canonical Sign-off Copy:** Confluence — see *TEAM-6 RCA* page (link maintained by the owning team lead)

> **Note:** The Confluence page is the authoritative, signed-off copy of these documents.  
> Markdown files in this directory are the working drafts kept in version control for diff/review purposes.  
> When Confluence and this directory diverge, Confluence wins.

---

## Sibling Documents

| File | Description | Approx. Size |
|------|-------------|--------------|
| [`TEAM-6-shared-root-cause.md`](./TEAM-6-shared-root-cause.md) | Unified RCA: executive summary, timeline, shared root cause, blast radius, mitigations, follow-on tickets | ~250 lines |
| [`TEAM-6-bamboohr-pipeline-failures.md`](./TEAM-6-bamboohr-pipeline-failures.md) | BambooHR-side deep-dive: flow map, failure isolation, code paths, contributing factors, data-access consent | ~200 lines |
| [`TEAM-6-sso-revocation-gap.md`](./TEAM-6-sso-revocation-gap.md) | SSO-side deep-dive: lifecycle state machine, failure modes, per-IdP audit, per-offboarding-mode audit, compliance | ~220 lines |
| [`TEAM-6-data-model-gap-recommendations.md`](./TEAM-6-data-model-gap-recommendations.md) | Follow-on data model recommendations (audit fields NOT implemented in this ticket) | ~100 lines |

---

## Status Table

| Document | Status | Peer Reviewer | Last Updated | Notes |
|----------|--------|---------------|--------------|-------|
| `TEAM-6-README.md` (this file) | **Draft** | — | 2026-06-10 | Index only |
| `TEAM-6-shared-root-cause.md` | **Draft** | — | 2026-06-10 | Awaiting L3 engineer sign-off |
| `TEAM-6-bamboohr-pipeline-failures.md` | **Draft** | — | 2026-06-10 | Awaiting BambooHR integration owner review |
| `TEAM-6-sso-revocation-gap.md` | **Draft** | — | 2026-06-10 | Awaiting Security team review |
| `TEAM-6-data-model-gap-recommendations.md` | **Draft** | — | 2026-06-10 | Blocked on shared-root-cause sign-off |

### Status Definitions

| Status | Meaning |
|--------|---------|
| **Draft** | Being actively written; not ready for review |
| **In-Review** | Shared with peer reviewer; awaiting comments |
| **Signed-off** | Peer reviewer approved; Confluence copy published and linked |

---

## Review Process

1. Author marks document status as **In-Review** and updates the *Peer Reviewer* field above.
2. Reviewer leaves comments on the PR or inline on the Confluence draft.
3. Author addresses comments, merges the PR, and publishes to Confluence.
4. Author marks status as **Signed-off** and adds the Confluence link to the table.
5. Ticket TEAM-6 is not closed until **all four sibling documents** reach **Signed-off**.

---

## Related Artefacts (outside this directory)

| Artefact | Path / Location |
|----------|-----------------|
| SSO revocation runbook | `docs/runbooks/sso-revocation-runbook.md` |
| Revocation script | `scripts/sso-revoke.ts` |
| Backfill audit query | `scripts/audit-backfill-query.sql` |
| Datadog canary alert | `ops/monitoring/stale-active-session-alert.yaml` |
| BambooHR trace helper | `server/src/lifecycle/sync-instrumentation.ts` |
| Lifecycle state-machine test (RED) | `server/src/lifecycle/lifecycle-state-machine.test.ts` |

---

## Confluence Link

> **TODO (owning team lead):** Replace this placeholder with the published Confluence URL once the  
> Confluence page is created and the first sign-off is complete.
>
> `https://your-org.atlassian.net/wiki/spaces/TEAM/pages/<page-id>/TEAM-6+RCA`

---

_This index was auto-generated as part of the TEAM-6 investigation plan. Keep it up to date as documents progress through review._
