# TEAM-6 — Prioritised Follow-on Tickets

| Field           | Value                                                   |
|-----------------|---------------------------------------------------------|
| **Parent RCA**  | [TEAM-6-rca.md](TEAM-6-rca.md)                         |
| **Owner**       | prakhar.srivastav@appfire.com                           |
| **Status**      | Draft — awaiting RCA sign-off before sprint commitment  |
| **Last updated**| 2026-06-10                                              |

---

## Purpose

This document tracks all follow-on engineering work that has been identified during the TEAM-6 investigation. Tickets are listed in priority order. The five **seed tickets** (TEAM-7 through TEAM-11) were identified during the investigation phase and represent the minimum set of work required to eliminate recurrence of both the BambooHR import failures and the SSO security gap.

**Policy:** No ticket in this list should be promoted to a production sprint until all four sign-offs on [TEAM-6-rca.md § Sign-off](TEAM-6-rca.md#sign-off) are recorded.

---

## Prioritised Ticket Table

| Priority | Placeholder ID  | Summary                                                                        | Type          | Effort est. | Depends on    | Status      |
|----------|-----------------|--------------------------------------------------------------------------------|---------------|-------------|---------------|-------------|
| **P1**   | TEAM-7 *(TBC)*  | Add per-record instrumentation to BambooHR import pipeline                     | Enhancement   | M           | —             | Not started |
| **P1**   | TEAM-8 *(TBC)*  | Add `idp_provider` and `offboarding_trigger_type` audit-log columns            | Schema change | S           | —             | Not started |
| **P1**   | TEAM-9 *(TBC)*  | Implement permanent SSO-revocation hook on `DELETE /api/members/:id` handler   | Feature       | L           | TEAM-8        | Not started |
| **P2**   | TEAM-10 *(TBC)* | Promote stale-SSO-session canary monitor from staging to production            | Ops / Infra   | S           | TEAM-9        | Not started |
| **P2**   | TEAM-11 *(TBC)* | Add alerting on swallowed exceptions in BambooHR import worker                 | Observability | M           | TEAM-7        | Not started |

**Effort key:** S = ≤ 0.5 day · M = 1–2 days · L = 3–5 days

---

## Ticket Detail Sheets

---

### TEAM-7 — Add per-record instrumentation to BambooHR import pipeline

| Field          | Value                                                                  |
|----------------|------------------------------------------------------------------------|
| **Priority**   | P1                                                                     |
| **Type**       | Enhancement                                                            |
| **Effort**     | M (1–2 days)                                                           |
| **Depends on** | —                                                                      |
| **Blocks**     | TEAM-11                                                                |

**Problem**

The BambooHR import pipeline (stages 1–6 described in [TEAM-6-bamboohr-deep-dive.md](TEAM-6-bamboohr-deep-dive.md)) produces no structured per-record audit log. When an import run fails or produces incorrect data, there is no signal to indicate which record failed, at which pipeline stage, or why. This is the primary reason four customers experienced import anomalies that went undetected for an extended period (failure hypothesis F-3: `catch` blocks suppress the error without emitting a structured log).

**Acceptance criteria**

- [ ] Every BambooHR record processed by the import pipeline emits a structured JSON log line containing at minimum: `{ account_id, bamboo_employee_id, stage, outcome: "success"|"failure"|"skipped", error_code?, error_message?, timestamp_utc }`.
- [ ] Import runs emit a summary log line at completion: total records, success count, failure count, skip count.
- [ ] Any `catch` block in the import worker that previously swallowed an exception now re-emits it as a structured `level: "error"` log entry.
- [ ] A unit test verifies the structured log is emitted on a simulated per-record failure.
- [ ] No change to the external BambooHR API contract or the `members` table schema is required by this ticket (schema changes are TEAM-8's scope).

**References**

- [TEAM-6-bamboohr-deep-dive.md § 3 — Stage-by-Stage Analysis](TEAM-6-bamboohr-deep-dive.md#3-stage-by-stage-analysis)
- [TEAM-6-bamboohr-deep-dive.md § 5 — Failure-Mode Hypotheses](TEAM-6-bamboohr-deep-dive.md#5-failure-mode-hypotheses) (F-1, F-3)
- [TEAM-6-shared-root-cause.md § 5 — Final Determination](TEAM-6-shared-root-cause.md#5-final-determination)

---

### TEAM-8 — Add `idp_provider` and `offboarding_trigger_type` audit-log columns

| Field          | Value                                                                  |
|----------------|------------------------------------------------------------------------|
| **Priority**   | P1                                                                     |
| **Type**       | Schema change                                                          |
| **Effort**     | S (≤ 0.5 day)                                                          |
| **Depends on** | —                                                                      |
| **Blocks**     | TEAM-9                                                                 |

**Problem**

The current `members` table (SQLite, managed by `server/src/db.ts`) stores no information about the Identity Provider associated with a member or about how an offboarding event was triggered. This means:

1. The blast-radius SQL query (`scripts/audit-backfill-query.sql`) must use `COALESCE` to handle the missing columns — a clear signal the schema is incomplete.
2. When a member is deleted, there is no persistent record of *which* IdP should be deprovisioned, making the TEAM-9 revocation hook unable to determine the correct IdP client to call.
3. Post-incident forensics cannot determine whether the offboarding was triggered manually, via the API, or via a bulk import.

**Acceptance criteria**

- [ ] A migration (or schema initialisation update in `server/src/db.ts`) adds the following nullable columns to the `members` table:
  - `idp_provider TEXT` — values: `okta` | `azure_ad` | `google_workspace` | `none` | `NULL` (unknown).
  - `offboarding_trigger_type TEXT` — values: `manual` | `api` | `bulk_import` | `NULL` (unknown).
- [ ] Existing rows are unaffected (columns default to `NULL`).
- [ ] The `DELETE /api/members/:id` handler is updated to accept and persist `idp_provider` and `offboarding_trigger_type` when provided in the request payload.
- [ ] `scripts/audit-backfill-query.sql` is updated to remove the `COALESCE` workarounds once the columns exist.
- [ ] A migration script or note is provided for the production SQLite database.

**References**

- [TEAM-6-sso-deep-dive.md § 5 — Failure-Point Hypotheses](TEAM-6-sso-deep-dive.md#5-failure-point-hypotheses) (S-3, S-4)
- `scripts/audit-backfill-query.sql` (`:threshold_hours` parameterised query)
- `server/src/db.ts` (schema initialisation)

---

### TEAM-9 — Implement permanent SSO-revocation hook on `DELETE /api/members/:id`

| Field          | Value                                                                  |
|----------------|------------------------------------------------------------------------|
| **Priority**   | P1                                                                     |
| **Type**       | Feature                                                                |
| **Effort**     | L (3–5 days)                                                           |
| **Depends on** | TEAM-8 (requires `idp_provider` column to determine correct IdP)       |
| **Blocks**     | TEAM-10                                                                |

**Problem**

The confirmed root cause of the 3-week SSO security gap (hypothesis S-1 — confirmed) is that `DELETE /api/members/:id` in `server/src/routes/members.ts` performs only a SQLite delete and returns `204 No Content`. It does not trigger any IdP deprovisioning call. The gap between offboarding in TeamBoard and SSO revocation is therefore entirely dependent on a manual checklist step that was missed.

This is the highest-risk open item from the TEAM-6 investigation. Failure to implement this fix means every future offboarding carries the same 3-week (or longer) SSO gap risk.

**Acceptance criteria**

- [ ] A post-DELETE lifecycle hook (or synchronous call within the DELETE handler, with a clear TODO for async graduation) calls the appropriate IdP deprovisioning client based on the member's `idp_provider` value.
- [ ] Supported IdPs at launch: Okta, Azure AD, Google Workspace. Members with `idp_provider = 'none'` or `NULL` are skipped with a structured warning log.
- [ ] The hook is **idempotent**: calling it multiple times for the same member ID does not produce an error or inconsistent state.
- [ ] If the IdP call fails, the failure is logged as a structured error and a compensating alert is raised; the HTTP response to the DELETE caller is still `204` (the member record is deleted from TeamBoard regardless — partial rollback is not in scope).
- [ ] The implementation is guarded by a feature flag or config toggle so it can be disabled without a code deploy if the IdP integration is misconfigured.
- [ ] A regression test covers: (a) successful delete + hook called; (b) IdP call failure → member deleted, error logged; (c) member already deleted (idempotent re-call) → no error.
- [ ] The manual runbook (`docs/runbooks/sso-revocation-runbook.md`) is updated to note that manual steps are now only required for historical gap remediation, not for new offboardings.

**References**

- [TEAM-6-sso-deep-dive.md § 5 — Failure-Point Hypotheses](TEAM-6-sso-deep-dive.md#5-failure-point-hypotheses) (S-1)
- [TEAM-6-shared-root-cause.md § 5 — Recommended architectural direction](TEAM-6-shared-root-cause.md#5-final-determination)
- `docs/runbooks/sso-revocation-runbook.md`
- `scripts/sso-revoke.ts` (reference implementation for IdP client skeleton)

---

### TEAM-10 — Promote stale-SSO-session canary monitor from staging to production

| Field          | Value                                                                  |
|----------------|------------------------------------------------------------------------|
| **Priority**   | P2                                                                     |
| **Type**       | Ops / Infra                                                            |
| **Effort**     | S (≤ 0.5 day)                                                          |
| **Depends on** | TEAM-9 (revocation hook must be live before production monitor is meaningful) |
| **Blocks**     | —                                                                      |

**Problem**

The canary monitor defined in `monitoring/stale-sso-session-monitor.yaml` is explicitly tagged as `env:staging` and carries a `retire-or-promote` comment with an expiry date. It is not deployed to production and therefore does not alert on real stale SSO sessions for live customers. Even after TEAM-9 ships the revocation hook, a monitor is necessary to catch edge cases (IdP client misconfiguration, bulk-import members with `idp_provider = NULL`, etc.).

**Acceptance criteria**

- [ ] The monitor configuration is updated to target `env:production` (or an equivalent production Datadog workspace).
- [ ] The `expires:` tag and `retire-or-promote` comment are removed (or updated to reflect the permanent nature of the monitor post-TEAM-9).
- [ ] Alert thresholds are reviewed and confirmed appropriate for production traffic volume (staging thresholds may be too sensitive).
- [ ] On-call routing is configured so that monitor alerts page the on-call engineer rather than a staging-only notification channel.
- [ ] A runbook link in the monitor description points to `docs/runbooks/sso-revocation-runbook.md`.
- [ ] The monitor is confirmed firing correctly against a synthetic test event in production before the story is closed.

**References**

- `monitoring/stale-sso-session-monitor.yaml`
- [TEAM-6-rca.md § 7 — Interim Mitigations](TEAM-6-rca.md#7-interim-mitigations) (mitigation #4)

---

### TEAM-11 — Add alerting on swallowed exceptions in BambooHR import worker

| Field          | Value                                                                  |
|----------------|------------------------------------------------------------------------|
| **Priority**   | P2                                                                     |
| **Type**       | Observability                                                          |
| **Effort**     | M (1–2 days)                                                           |
| **Depends on** | TEAM-7 (structured per-record logging must exist before alert rules can reference log fields) |
| **Blocks**     | —                                                                      |

**Problem**

BambooHR import failures affected four customers before being escalated to support. The delayed detection is attributable to `catch` blocks that swallow exceptions without emitting a structured error signal (failure hypothesis F-3). TEAM-7 fixes the logging, but logging alone does not guarantee a human is notified in time to prevent customer impact. This ticket adds the alerting layer on top of the structured log output.

**Acceptance criteria**

- [ ] A Datadog (or equivalent) log-based alert rule is created that fires when the import worker emits ≥ 1 log line with `level: "error"` and `stage` set to any import pipeline stage within a 15-minute window.
- [ ] A separate alert fires if an import run's summary log line shows `failure_count > 0` for any account.
- [ ] Alert notifications route to the same on-call channel as TEAM-10's SSO monitor.
- [ ] Alert descriptions include a link to `docs/rca/TEAM-6-bamboohr-deep-dive.md` for first-responder context.
- [ ] Alert rules are stored as code (YAML or Terraform) in the repository under `monitoring/` so they are version-controlled and reviewable.
- [ ] A synthetic failure test is run in staging to confirm the alert fires end-to-end before the story is closed.

**References**

- [TEAM-6-bamboohr-deep-dive.md § 5 — Failure-Mode Hypotheses](TEAM-6-bamboohr-deep-dive.md#5-failure-mode-hypotheses) (F-3)
- TEAM-7 (per-record structured logging — prerequisite)
- `monitoring/stale-sso-session-monitor.yaml` (follow the same YAML structure)

---

## Incremental Additions

> **Instructions for maintainers:** As the investigation progresses and additional findings are confirmed, append new rows to the [Prioritised Ticket Table](#prioritised-ticket-table) above and add a corresponding detail sheet in this section. Follow the existing format: one table row per ticket, one detail sheet per ticket.
>
> When a ticket has been formally created in the issue tracker and assigned a real ID, update the placeholder ID (e.g., `TEAM-7 *(TBC)*`) to the real one.

| Priority | Placeholder ID  | Summary                                                                | Type  | Effort est. | Depends on | Status      |
|----------|-----------------|------------------------------------------------------------------------|-------|-------------|------------|-------------|
| `[TBC]`  | `[TBC]`         | *(Add new tickets here as investigation findings are confirmed)*       | `[TBC]` | `[TBC]`   | `[TBC]`    | Not started |

### Potential future tickets (not yet scoped)

The following items have been noted during the investigation as likely future work but are **not yet formally scoped** and should not be committed to a sprint without a separate investigation:

| Item                                                                                         | Source                                                                      |
|----------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| Introduce a member lifecycle event outbox (DB outbox table or in-process `EventEmitter` with guaranteed delivery) to replace point-to-point hooks with a fan-out model | [TEAM-6-shared-root-cause.md § 5 — Recommended architectural direction](TEAM-6-shared-root-cause.md#5-final-determination) |
| Add `deleted_at` / soft-delete semantics to `members` table to prevent BambooHR re-import of offboarded members | [TEAM-6-shared-root-cause.md § 3 — Shared DB Transaction](TEAM-6-shared-root-cause.md#3-question-3--shared-db-transaction) |
| Extend blast-radius SQL and audit-backfill pipeline to cover non-SSO downstream systems (e.g. calendar, Slack) | [TEAM-6-sso-deep-dive.md § 4 — IdP × Offboarding-Mode Matrix](TEAM-6-sso-deep-dive.md#4-idp--offboarding-mode-matrix) |
| Formalise BambooHR payload schema validation (JSON Schema or Zod) to reject unexpected field shapes at ingestion | [TEAM-6-bamboohr-deep-dive.md § 5 — Failure-Mode Hypotheses](TEAM-6-bamboohr-deep-dive.md#5-failure-mode-hypotheses) (F-1, F-2) |

---

*Last updated: 2026-06-10 · Owner: prakhar.srivastav@appfire.com*
