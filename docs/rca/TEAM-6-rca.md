# RCA — TEAM-6: HR Data Pipeline Failures and SSO Security Gap in Member Lifecycle

| Field              | Value                                         |
|--------------------|-----------------------------------------------|
| **Ticket**         | TEAM-6                                        |
| **Severity**       | Medium (two concurrent escalations)           |
| **Status**         | Investigation — Draft                         |
| **Owner**          | prakhar.srivastav@appfire.com                 |
| **Date opened**    | 2026-06-10                                    |
| **Last updated**   | 2026-06-10                                    |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Timeline](#2-timeline)
3. [Technical Deep-Dive — BambooHR Pipeline](TEAM-6-bamboohr-deep-dive.md)
4. [Technical Deep-Dive — SSO Deprovisioning](TEAM-6-sso-deep-dive.md)
5. [Shared Root Cause Assessment](TEAM-6-shared-root-cause.md)
6. [Blast Radius](#6-blast-radius)
7. [Interim Mitigations](#7-interim-mitigations)
8. [Prioritised Follow-on Tickets](TEAM-6-followup-tickets.md)

---

## 1. Executive Summary

Two support escalations arrived within the same sprint, both traceable to weaknesses in TeamBoard's **member lifecycle** subsystem:

1. **BambooHR Import Failures** — At least four customer accounts experienced silent or noisy failures during HR data pipeline ingestion. Symptoms range from missing members after a scheduled import to stale role/department data persisting indefinitely. The root cause has not been confirmed but is hypothesised to involve unhandled payload schema variants, swallowed exceptions in the import worker, and an absence of per-record audit logging.

2. **SSO Security Gap** — A departed employee retained active SSO credentials for approximately **3 weeks** after their termination was recorded in TeamBoard. The gap is hypothesised to arise from the absence of an automated, event-driven hook on the `DELETE /api/members/:id` path that would trigger IdP deprovisioning. The offboarding was processed manually in TeamBoard but the corresponding IdP revocation step was either skipped or never scheduled.

Both issues share a common structural weakness: **the member lifecycle has no reliable, observable side-effect bus**. Creates, updates, and deletes succeed in SQLite but downstream systems (HR provider, IdP) are not notified synchronously or via a guaranteed-delivery queue.

This document is the umbrella RCA. Detailed technical analysis lives in the linked deep-dive documents above. No production code changes are included in this investigation package; all code artefacts are investigation aids (scripts, queries, tests, monitoring config).

---

## 2. Timeline

> **Note:** Exact timestamps are to be filled in once support tickets and access logs have been retrieved. Placeholder entries are marked `[TBC]`.

| Date (UTC)         | Event                                                                                        |
|--------------------|----------------------------------------------------------------------------------------------|
| `[TBC]`            | First BambooHR import failure reported by Customer A (account `[TBC]`).                     |
| `[TBC]`            | Three additional customers (B, C, D) report similar import anomalies.                        |
| `[TBC]`            | Departed employee (account `[TBC]`) offboarding recorded in TeamBoard via DELETE endpoint.   |
| `[TBC]` + 3 weeks  | Security team detects departed employee still holds valid SSO session; incident opened.      |
| 2026-06-10         | TEAM-6 opened; investigation kicked off; this RCA drafted.                                   |
| `[TBC]`            | BambooHR deep-dive complete; failure mode confirmed or revised.                              |
| `[TBC]`            | SSO deep-dive complete; blast-radius SQL run; affected accounts enumerated.                  |
| `[TBC]`            | Manual SSO revocation runbook executed for all affected accounts.                            |
| `[TBC]`            | Follow-on tickets opened and triaged into sprint.                                            |

---

## 3. Technical Deep-Dive — BambooHR Pipeline

See [TEAM-6-bamboohr-deep-dive.md](TEAM-6-bamboohr-deep-dive.md) for the full stage-by-stage analysis, failure-mode hypotheses, required evidence, payload reproduction protocol, and the customer-side vs TeamBoard-side classification table.

---

## 4. Technical Deep-Dive — SSO Deprovisioning

See [TEAM-6-sso-deep-dive.md](TEAM-6-sso-deep-dive.md) for the IdP × offboarding-mode matrix, failure-point hypotheses, the 3-week incident timeline, and the reference blast-radius SQL query.

---

## 5. Shared Root Cause Assessment

See [TEAM-6-shared-root-cause.md](TEAM-6-shared-root-cause.md) for the cross-reference assessment that answers whether the two incidents share the same lifecycle service, a common event bus, or a shared DB transaction path — and the final determination of root cause relationship.

---

## 6. Blast Radius

### 6.1 BambooHR — Affected Customers

The table below tracks all customers where BambooHR data-access consent has been granted and a pipeline failure may have occurred. Status values: `Confirmed affected` / `Under investigation` / `Cleared`.

| # | Account ID | Account Name      | Consent Granted | Last Successful Sync | Failure Symptom Reported             | Status                  | Notes                         |
|---|------------|-------------------|-----------------|----------------------|--------------------------------------|-------------------------|-------------------------------|
| 1 | `[TBC]`    | Customer A        | `[TBC]`         | `[TBC]`              | Missing members after scheduled sync | Under investigation     | First escalation received     |
| 2 | `[TBC]`    | Customer B        | `[TBC]`         | `[TBC]`              | Stale role/department data           | Under investigation     |                               |
| 3 | `[TBC]`    | Customer C        | `[TBC]`         | `[TBC]`              | Silent failure — no error surfaced   | Under investigation     |                               |
| 4 | `[TBC]`    | Customer D        | `[TBC]`         | `[TBC]`              | Partial import — some records missing| Under investigation     |                               |
| 5 | `[TBC]`    | *(additional)*    | `[TBC]`         | `[TBC]`              | `[TBC]`                              | `[TBC]`                 | Enumerate from `[TBC]` query  |

> **Action:** Run the blast-radius query in `scripts/audit-backfill-query.sql` against production (read replica) to complete this table.

### 6.2 SSO Security Gap — Affected Accounts

| # | Account ID | Member Name (anonymised) | Departure Date | SSO Revoked Date | Gap (days) | IdP      | Offboarding Trigger | Status              |
|---|------------|--------------------------|----------------|------------------|------------|----------|---------------------|---------------------|
| 1 | `[TBC]`    | Member-001               | `[TBC]`        | `[TBC]`          | ~21        | `[TBC]`  | Manual              | Revocation pending  |
| 2 | `[TBC]`    | *(additional)*           | `[TBC]`        | `[TBC]`          | `[TBC]`    | `[TBC]`  | `[TBC]`             | `[TBC]`             |

> **Action:** Execute blast-radius SQL (parameterised by `:threshold_hours = 0`) to enumerate all members where `departure_event_at < sso_revoked_at` or `sso_revoked_at IS NULL`. See `scripts/audit-backfill-query.sql`.

---

## 7. Interim Mitigations

These actions can be taken **immediately** without code changes to production handlers.

| # | Action                                                                                       | Owner        | Status      | Target Date |
|---|----------------------------------------------------------------------------------------------|--------------|-------------|-------------|
| 1 | Run `scripts/audit-backfill-query.sql` on read replica to enumerate all affected accounts.   | `[TBC]`      | Not started | `[TBC]`     |
| 2 | Execute manual SSO revocation runbook (`docs/runbooks/sso-revocation-runbook.md`) for each identified departed member with an active SSO session. | `[TBC]` | Not started | `[TBC]` |
| 3 | Communicate with affected BambooHR customers; provide manual data-correction steps.          | `[TBC]`      | Not started | `[TBC]`     |
| 4 | Enable canary monitor (`monitoring/stale-sso-session-monitor.yaml`) in staging to catch new gaps before they reach production. | `[TBC]` | Not started | `[TBC]` |
| 5 | Freeze new BambooHR integrations for accounts not yet onboarded until pipeline is instrumented and failure modes are confirmed. | `[TBC]` | Not started | `[TBC]` |

---

## 8. Prioritised Follow-on Tickets

See [TEAM-6-followup-tickets.md](TEAM-6-followup-tickets.md) for the full ranked list. Summary of the five seed tickets:

| Priority | Ticket (placeholder) | Summary                                                    |
|----------|-----------------------|------------------------------------------------------------|
| P1       | TEAM-7 *(TBC)*        | Add per-record instrumentation to BambooHR import pipeline |
| P1       | TEAM-8 *(TBC)*        | Add `idp_provider` and `offboarding_trigger_type` audit-log columns |
| P1       | TEAM-9 *(TBC)*        | Implement permanent SSO-revocation hook on DELETE handler  |
| P2       | TEAM-10 *(TBC)*       | Promote canary monitor from staging to production          |
| P2       | TEAM-11 *(TBC)*       | Add alerting on swallowed exceptions in import worker      |

---

## Sign-off

| Role                   | Name / Handle                     | Date        | Signature |
|------------------------|-----------------------------------|-------------|-----------|
| Investigation lead     | prakhar.srivastav@appfire.com     | 2026-06-10  | `[ ]`     |
| Engineering manager    | `[TBC]`                           | `[TBC]`     | `[ ]`     |
| Security reviewer      | `[TBC]`                           | `[TBC]`     | `[ ]`     |
| Support lead           | `[TBC]`                           | `[TBC]`     | `[ ]`     |

> **Policy:** All four sign-offs required before follow-on tickets are promoted to a production sprint. Mark each `[ ]` as `[x]` and record the date when approved.
