# TEAM-6 Shared Root Cause Assessment

**Ticket:** TEAM-6 — Investigate: HR data pipeline failures and SSO security gap in member lifecycle  
**Document type:** Unified / Shared Root Cause  
**Status:** Draft  
**Author:** _(assign)_  
**Peer Reviewer:** _(assign)_  
**Last Updated:** 2026-06-10  
**Canonical copy:** Confluence — TEAM-6 RCA (link in [`TEAM-6-README.md`](./TEAM-6-README.md))

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Timeline of Events](#2-timeline-of-events)
3. [Technical Deep-Dive — BambooHR Pipeline](#3-technical-deep-dive--bamboohr-pipeline)
4. [Technical Deep-Dive — SSO Revocation Gap](#4-technical-deep-dive--sso-revocation-gap)
5. [Shared Root Cause Assessment](#5-shared-root-cause-assessment)
6. [Blast Radius](#6-blast-radius)
7. [Interim Mitigations](#7-interim-mitigations)
8. [Prioritised Follow-on Tickets](#8-prioritised-follow-on-tickets)

---

## 1. Executive Summary

Two independent support escalations surfaced in the same sprint and, on investigation, share a common structural weakness in TeamBoard's **member lifecycle management**.

**Escalation A — BambooHR pipeline failures (4+ customers):**  
Customers using the BambooHR integration reported that HR-initiated member changes (new hires, departures, role changes) were silently failing to propagate into TeamBoard. Affected customers observed stale rosters, phantom active members, and occasionally duplicate member entries. No structured error was surfaced to the customer admin console.

**Escalation B — SSO security gap (1 confirmed customer, potential others):**  
A departed employee retained valid SSO access to a TeamBoard workspace for approximately three weeks after their HR departure record was created in BambooHR. The access window exceeded the organisation's 24-hour revocation SLA. The employee did not exploit the access; however, the gap represents a material security and compliance risk.

**Shared structural weakness:**  
Both escalations trace back to the absence of a reliable, auditable member lifecycle state machine. Specifically:

- There is no durable record of lifecycle state transitions (e.g. `active → departed → revoked`).
- Errors in the BambooHR sync pipeline are swallowed or logged at a level that does not trigger alerts.
- SSO revocation is not an atomic consequence of a lifecycle transition; it is a side effect triggered by fragile conditional logic that can be bypassed.
- No idempotency guard exists to re-apply a missed lifecycle transition.

**Scope of this document:**  
This document covers the shared analysis. Deep-dives for each escalation are in the sibling documents linked in §3 and §4.

---

## 2. Timeline of Events

_Times are approximate. Exact timestamps to be confirmed from Datadog logs and support tickets._

| Date (approx.) | Event |
|----------------|-------|
| T − 28 d | Earliest known BambooHR sync error (inferred from customer roster divergence) |
| T − 21 d | Departed employee's HR record set to `terminated` in BambooHR |
| T − 21 d | BambooHR webhook delivered to TeamBoard ingestion endpoint |
| T − 21 d | **TeamBoard SSO revocation NOT triggered** (gap begins) |
| T − 14 d | First customer support ticket filed re: BambooHR sync failures |
| T − 10 d | Second customer escalates; L1 support unable to reproduce |
| T − 7 d  | Security team alerted to active SSO session for departed user |
| T − 7 d  | Manual SSO revocation performed; session terminated |
| T − 5 d  | Two additional customers report BambooHR sync issues |
| T − 3 d  | Escalated to L3; TEAM-6 opened |
| T − 0    | TEAM-6 investigation begins |

> **TODO:** Populate exact timestamps from:
> - Datadog ingestion logs (BambooHR webhook receiver)
> - IdP audit logs (Okta / Azure AD / Google Workspace session records)
> - Support ticket metadata

---

## 3. Technical Deep-Dive — BambooHR Pipeline

> **Full analysis in:** [`TEAM-6-bamboohr-pipeline-failures.md`](./TEAM-6-bamboohr-pipeline-failures.md)

**Pointer summary:**  
The BambooHR deep-dive covers:
- End-to-end flow map from BambooHR webhook → TeamBoard ingestion → member state update
- Failure isolation plan identifying where in the pipeline each failure category originates
- Implicated code paths with file/function references
- Contributing factors distinguishing TeamBoard-side defects from customer-side configuration issues
- Data-access consent status per affected customer

Key findings cross-referenced here:
- § "Failure Isolation Plan" → contributes to §5.1 (Missing Lifecycle Transitions) below
- § "Contributing Factors (TeamBoard side)" → contributes to §5.2 (Error Swallowing) below
- § "Data-Access Consent Status" → contributes to §6 (Blast Radius) below

---

## 4. Technical Deep-Dive — SSO Revocation Gap

> **Full analysis in:** [`TEAM-6-sso-revocation-gap.md`](./TEAM-6-sso-revocation-gap.md)

**Pointer summary:**  
The SSO deep-dive covers:
- Lifecycle state machine trace showing the missing `departed → revoked` transition
- All failure modes considered (missing transitions, swallowed exceptions, async gaps, conditional branches)
- Per-IdP code-path audit (Okta, Azure AD, Google Workspace)
- Per-offboarding-mode audit (manual UI, API, bulk import)
- Compliance implications checklist (SOC 2, ISO 27001, customer DPA obligations)

Key findings cross-referenced here:
- § "Lifecycle State Machine Trace" → contributes to §5.1 (Missing Lifecycle Transitions) below
- § "Failure Modes — Swallowed Exceptions" → contributes to §5.2 (Error Swallowing) below
- § "Compliance Implications" → contributes to §6 (Blast Radius) below

---

## 5. Shared Root Cause Assessment

The following four cross-reference checks establish the causal link between the two escalations.

### 5.1 Missing Lifecycle State Transitions

**Finding:**  
TeamBoard does not maintain a persisted, auditable lifecycle state machine for members. The current implementation treats member state (active / departed / revoked) as a derived value rather than a first-class entity with recorded transitions.

**Cross-reference:**  
- BambooHR deep-dive § "Failure Isolation Plan": sync jobs update member rows directly without writing a transition record.  
- SSO deep-dive § "Lifecycle State Machine Trace": the `departed → revoked` transition has no corresponding state record; SSO revocation is triggered as a side effect of the sync path, not as an explicit lifecycle action.

**Causal link:**  
Because there is no transition record, a missed revocation cannot be detected by a monitoring query, cannot be retried idempotently, and cannot be audited post-hoc.

---

### 5.2 Error Swallowing in the Sync Pipeline

**Finding:**  
Errors occurring during BambooHR payload processing and during SSO revocation calls are caught at a level that prevents them from propagating to alerting infrastructure. The sync job completes with a success status even when individual member updates fail.

**Cross-reference:**  
- BambooHR deep-dive § "Contributing Factors (TeamBoard side)": `try/catch` blocks inside the sync loop log errors at `debug` level rather than `error`; the loop continues rather than halting or re-queuing.  
- SSO deep-dive § "Failure Modes — Swallowed Exceptions": the IdP API call is wrapped in a broad `catch` that logs and returns `null`; the calling code treats `null` as a success signal.

**Causal link:**  
Silent failures mean the system appears healthy while member state diverges from the source of truth. Neither Datadog nor on-call alerts are triggered.

---

### 5.3 Absence of Idempotency and Retry Logic

**Finding:**  
There is no mechanism to detect that a lifecycle transition was attempted but not completed, and no way to safely re-run a missed transition without risking duplicate side effects.

**Cross-reference:**  
- BambooHR deep-dive § "Implicated Code Paths": no idempotency key is stored with sync operations.  
- SSO deep-dive § "Per-Offboarding-Mode Audit — Bulk Import": bulk import re-processes all records on retry, potentially re-creating already-revoked members as active.

**Causal link:**  
Operations teams cannot safely patch affected members without a purpose-built idempotent script. The revocation script introduced in `scripts/sso-revoke.ts` (TEAM-6 deliverable) is a temporary mitigation; a structural fix requires persisted transition records.

---

### 5.4 Lack of Observability at the Lifecycle Layer

**Finding:**  
There are no structured metrics, no lifecycle-specific log fields, and no Datadog monitors scoped to member lifecycle transitions. The only signal available post-incident is raw HTTP request logs.

**Cross-reference:**  
- BambooHR deep-dive § "Contributing Factors": no per-sync-job structured log with `bamboohr_sync_status` field.  
- SSO deep-dive § "Compliance Implications": the absence of a revocation audit trail complicates SOC 2 CC6.2 and ISO 27001 A.9.2.6 evidence collection.

**Causal link:**  
Without observability, the blast radius (§6) cannot be precisely quantified, and the effectiveness of interim mitigations (§7) cannot be confirmed.

---

## 6. Blast Radius

> **Status: Placeholder — to be completed after deep-dives are signed off**

| Dimension | Current Best Estimate | Confidence | Source |
|-----------|-----------------------|------------|--------|
| BambooHR customers affected | 4+ confirmed, unknown upper bound | Low | Support tickets |
| Members with stale active state | Unknown; backfill query needed | Low | See `scripts/audit-backfill-query.sql` |
| Members with active SSO post-departure | 1 confirmed; potentially more | Low | IdP audit logs (manual pull required) |
| Maximum active-SSO window (days) | 21 d (confirmed case) | Medium | IdP audit log + BambooHR HR record |
| Data potentially accessible during gap | TeamBoard workspace (boards, members, reports) | Medium | Product scope analysis |
| Compliance frameworks at risk | SOC 2 CC6.2, ISO 27001 A.9.2.6, customer DPAs | Medium | SSO deep-dive § Compliance |
| Customers requiring breach notification | Unknown; legal assessment pending | Low | Legal / DPO review required |

> **Action required:** Run `scripts/audit-backfill-query.sql` against production read replica to populate  
> the "Members with stale active state" row. See runbook `docs/runbooks/sso-revocation-runbook.md`.

---

## 7. Interim Mitigations

The following mitigations have been implemented or scheduled as part of TEAM-6 to contain risk while structural fixes are planned.

| Mitigation | Status | Reference |
|------------|--------|-----------|
| Manual SSO revocation for confirmed affected user | **Done** | Support ticket; performed T − 7 d |
| Idempotent revocation script with dry-run default | **Implemented** | `scripts/sso-revoke.ts` |
| SSO revocation runbook for ops team | **Implemented** | `docs/runbooks/sso-revocation-runbook.md` |
| Datadog canary alert for stale active sessions | **Implemented** | `ops/monitoring/stale-active-session-alert.yaml` |
| BambooHR trace helper (feature-flag gated) | **Implemented** | `server/src/lifecycle/sync-instrumentation.ts` |
| Audit backfill query | **Implemented** | `scripts/audit-backfill-query.sql` |
| Lifecycle state-machine RED test (confirms defect) | **Implemented** | `server/src/lifecycle/lifecycle-state-machine.test.ts` |

**Not in scope for TEAM-6 (structural fixes):**  
- Persistent lifecycle transition table  
- Automated retry / idempotency infrastructure  
- Production schema changes  
- New API routes  

See §8 for follow-on ticket recommendations.

---

## 8. Prioritised Follow-on Tickets

The table below lists recommended follow-on work ordered by risk reduction value. None of these are in scope for TEAM-6.

| Priority | Recommended Ticket | Rationale | Estimated Effort |
|----------|--------------------|-----------|-----------------|
| P1 | **Implement persistent lifecycle transition log** | Directly addresses §5.1 and §5.4; prerequisite for all other structural fixes | L (multi-sprint) |
| P1 | **Fix error-swallowing in BambooHR sync loop** | Directly addresses §5.2; low code-change risk; high observability gain | S |
| P1 | **Fix error-swallowing in SSO revocation path** | Directly addresses §5.2 for SSO; required for SOC 2 evidence | S |
| P2 | **Add idempotency key to sync operations** | Addresses §5.3; prerequisite for safe retries | M |
| P2 | **Promote Datadog canary alert to permanent monitor** | Addresses §5.4; remove canary tag after blast radius confirmed clean | S |
| P2 | **Per-IdP revocation integration testing** | Confirms SSO deep-dive findings; prevents regression | M |
| P3 | **Data model audit table fields** | Addresses §5.4 long-term; see `TEAM-6-data-model-gap-recommendations.md` | M |
| P3 | **Customer-facing sync status in admin console** | Reduces future escalation volume | M |
| P3 | **BambooHR consent re-validation for affected customers** | Closes data-access consent gaps identified in BambooHR deep-dive | S |

> **Effort key:** S = ≤ 1 sprint, M = 1–2 sprints, L = 3+ sprints

---

_End of TEAM-6 Shared Root Cause Assessment_
