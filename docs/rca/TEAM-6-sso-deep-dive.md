# Technical Deep-Dive — SSO Deprovisioning Gap (TEAM-6)

| Field           | Value                             |
|-----------------|-----------------------------------|
| **Parent RCA**  | [TEAM-6-rca.md](TEAM-6-rca.md)   |
| **Owner**       | `[TBC]`                           |
| **Status**      | Draft — evidence pending          |
| **Last updated**| 2026-06-10                        |

---

## Table of Contents

1. [Background](#1-background)
2. [Deprovisioning Architecture (Current State)](#2-deprovisioning-architecture-current-state)
3. [IdP × Offboarding-Mode Matrix](#3-idp--offboarding-mode-matrix)
4. [Failure-Point Hypotheses](#4-failure-point-hypotheses)
5. [3-Week Incident Timeline](#5-3-week-incident-timeline)
6. [Blast-Radius SQL Reference](#6-blast-radius-sql-reference)
7. [Evidence Required](#7-evidence-required)
8. [Open Questions](#8-open-questions)

---

## 1. Background

When a team member is offboarded, two things must happen:

1. The member record is marked inactive / deleted in TeamBoard (`DELETE /api/members/:id`).
2. The member's identity is deprovisioned in the organisation's Identity Provider (IdP), revoking their SSO access to all connected applications.

The confirmed security incident: a departed employee retained an active SSO session for approximately **3 weeks** after step (1) was completed. Step (2) either did not happen, happened with an unacceptable delay, or happened for the wrong account/session.

---

## 2. Deprovisioning Architecture (Current State)

```
Admin / HR system
    │
    ▼
DELETE /api/members/:id  (TeamBoard API)
    │
    ▼
members table row deleted (SQLite)
    │
    ╳  ← NO downstream hook exists here
    │
    ▼
[IdP deprovisioning — manual step, out-of-band]
    │
    ├─ Okta:   Admin Console → Users → Deactivate
    ├─ Azure:  Azure AD → Users → Block sign-in
    └─ Google: Admin Console → Users → Suspend
```

**The gap:** There is no event-driven or synchronous call from the TeamBoard `DELETE` handler to any IdP. The operator is expected to perform IdP deprovisioning manually, out-of-band, after the TeamBoard deletion. This process has no enforcement, no checklist, and no audit trail within TeamBoard.

---

## 3. IdP × Offboarding-Mode Matrix

This matrix maps each combination of **Identity Provider** and **offboarding trigger mode** to whether automated deprovisioning is currently possible, the failure risk, and the remediation path.

| IdP            | Offboarding Mode | Auto-deprovisioning possible today? | Failure risk (if manual step skipped) | Remediation path                                              |
|----------------|------------------|--------------------------------------|----------------------------------------|---------------------------------------------------------------|
| **Okta**       | Manual           | No — admin must deactivate in Okta console | **High** — no audit trail; easily missed | Implement POST-DELETE hook calling Okta `/api/v1/users/:id/lifecycle/deactivate` |
| **Okta**       | API              | Partial — if Okta API key configured; not wired | **Medium** — API key may exist but hook is not called | Wire DELETE handler to Okta SDK; add `idp_provider` column to track |
| **Okta**       | Bulk (SCIM)      | Partial — SCIM deprovisioning supported by Okta but not provisioned from TeamBoard | **Medium** | Set up SCIM endpoint in TeamBoard; Okta pushes deprovision events |
| **Azure AD**   | Manual           | No — admin must block sign-in in Azure portal | **High** — multi-step; easily skipped if offboarding is rushed | Implement POST-DELETE hook calling MS Graph `PATCH /users/:id` with `accountEnabled: false` |
| **Azure AD**   | API              | Partial — MS Graph API credentials may be configured elsewhere | **Medium** | Wire DELETE handler; add `idp_provider` column |
| **Azure AD**   | Bulk (SCIM)      | No — SCIM provisioning between Azure and TeamBoard not configured | **High** | Configure SCIM provisioning; Azure AD pushes delete events |
| **Google WS**  | Manual           | No — admin must suspend user in Google Admin Console | **High** — no audit trail | Implement POST-DELETE hook calling Admin SDK `users.update` with `suspended: true` |
| **Google WS**  | API              | Partial — service account credentials may exist | **Medium** | Wire DELETE handler to Admin SDK; add `idp_provider` column |
| **Google WS**  | Bulk (CSV)**     | No — bulk CSV offboarding in Google Admin is a separate manual workflow | **High** — TeamBoard deletion not linked to CSV process | Document dependency; add checklist step to runbook |

> **Key finding:** In **all manual modes** across all three IdPs, deprovisioning is entirely dependent on operator discipline with no technical safeguard. This is the direct cause of the 3-week gap. The fix is to implement an automated post-DELETE hook (see TEAM-9 in [TEAM-6-followup-tickets.md](TEAM-6-followup-tickets.md)).

---

## 4. Failure-Point Hypotheses

| ID   | Description                                                                                         | Confidence | Evidence needed                                              |
|------|-----------------------------------------------------------------------------------------------------|------------|--------------------------------------------------------------|
| S-1  | **No post-DELETE hook** — TeamBoard DELETE handler does not call any IdP API; deprovisioning is entirely manual | **Confirmed** | Code inspection of `server/src/routes/members.ts` DELETE handler — no IdP call present |
| S-2  | **Operator omission** — the manual step was known but not performed (human error in offboarding checklist) | High | Offboarding ticket / HR record for the departed employee; check whether any runbook existed |
| S-3  | **No runbook existed** — there was no documented offboarding procedure, so the operator did not know the step was required | High | Absence of `docs/runbooks/sso-revocation-runbook.md` prior to this RCA (confirmed — file did not exist) |
| S-4  | **Audit log gap** — `members` table has no `offboarding_trigger_type` or `idp_provider` column; even if deprovisioning was attempted, there is no record of it | **Confirmed** | Schema inspection (columns absent — see TEAM-8 in follow-on tickets) |
| S-5  | **Session token not invalidated** — even if IdP account was deactivated, an existing JWT/session token may have remained valid until natural expiry (up to 24h for some IdPs) | Low | IdP audit log for session events around departure date |
| S-6  | **Patchwork state** — deprovisioning attempted in some IdP systems but not others (e.g. password reset performed but account not suspended) | Low-Medium | IdP audit log; check all three IdP states for the affected account |

---

## 5. 3-Week Incident Timeline

> **Status:** Placeholder — exact timestamps to be filled from IdP audit logs, HR system records, and TeamBoard application logs.

| Date (UTC)             | Event                                                                                   | Source                        |
|------------------------|-----------------------------------------------------------------------------------------|-------------------------------|
| `[TBC]`                | Employee departure date (per HR system).                                                | HR system                     |
| `[TBC]`                | `DELETE /api/members/:id` called for the departed employee in TeamBoard.                | TeamBoard API access log      |
| `[TBC]`                | TeamBoard member record deleted (SQLite row removed).                                   | TeamBoard DB / audit log      |
| `[TBC]`                | *(Expected)* IdP deprovisioning step — **NOT performed** (hypothesis S-2).             | IdP audit log — absence       |
| `[TBC]` to `[TBC+21d]` | Departed employee continues to authenticate via SSO; access to connected apps retained.| IdP sign-in log               |
| `[TBC+21d]`            | Security team detects active session; incident opened.                                  | Security monitoring / alert   |
| `[TBC+21d]`            | Manual IdP deprovisioning performed (emergency).                                        | IdP audit log                 |
| 2026-06-10             | TEAM-6 opened; this RCA drafted.                                                        | Jira / GitHub                 |
| `[TBC]`                | Blast-radius SQL run; additional affected accounts identified.                          | `scripts/audit-backfill-query.sql` |
| `[TBC]`                | Manual SSO revocation runbook executed for all remaining accounts.                      | `docs/runbooks/sso-revocation-runbook.md` |

---

## 6. Blast-Radius SQL Reference

The parameterised SQL query that surfaces all members whose departure event precedes SSO revocation by more than a configurable threshold is located at:

```
scripts/audit-backfill-query.sql
```

**Key parameters:**

| Parameter               | Description                                                          | Default value |
|-------------------------|----------------------------------------------------------------------|---------------|
| `:threshold_hours`      | Minimum gap (in hours) between departure and SSO revocation to flag  | `0` (all gaps)|
| `:account_id`           | Restrict to a single account; `NULL` to scan all accounts            | `NULL`        |

**Expected query output columns:**

| Column                    | Description                                               |
|---------------------------|-----------------------------------------------------------|
| `member_id`               | TeamBoard member ID                                       |
| `account_id`              | Account the member belonged to                            |
| `email`                   | Member email (for IdP lookup)                             |
| `departure_event_at`      | Timestamp of `DELETE /api/members/:id` call               |
| `sso_revoked_at`          | Timestamp of IdP revocation (NULL if not yet revoked)     |
| `gap_hours`               | Computed gap; NULL if `sso_revoked_at` is NULL            |
| `idp_provider`            | IdP in use (NULL until TEAM-8 audit column is added)      |
| `offboarding_trigger_type`| How offboarding was initiated (NULL until TEAM-8)         |

> **COALESCE handling:** The query uses `COALESCE(idp_provider, 'UNKNOWN')` and `COALESCE(offboarding_trigger_type, 'UNKNOWN')` because these columns do not yet exist in the schema. Once TEAM-8 is shipped, the COALESCEs can be removed.

---

## 7. Evidence Required

| # | Evidence item                                                                           | Source                              | Assigned to | Status      |
|---|-----------------------------------------------------------------------------------------|-------------------------------------|-------------|-------------|
| 1 | IdP audit log for the affected account covering the 3-week gap window                  | Okta / Azure AD / Google Admin      | `[TBC]`     | Not started |
| 2 | TeamBoard API access log entry for `DELETE /api/members/:id` at departure time         | TeamBoard application logs          | `[TBC]`     | Not started |
| 3 | HR system record confirming departure date                                              | HR system                           | `[TBC]`     | Not started |
| 4 | Any existing offboarding checklist or runbook (pre-RCA)                                | Confluence / Notion / shared drive  | `[TBC]`     | Not started |
| 5 | List of all accounts with SSO enabled and the IdP they use                             | TeamBoard account config table      | `[TBC]`     | Not started |
| 6 | Blast-radius SQL results (all members with departure event and no SSO revocation record)| TeamBoard DB read replica           | `[TBC]`     | Not started |

---

## 8. Open Questions

| # | Question                                                                                        | Owner   | Status |
|---|-------------------------------------------------------------------------------------------------|---------|--------|
| 1 | Which IdP was in use for the affected account?                                                  | `[TBC]` | Open   |
| 2 | Was there any existing offboarding checklist that listed the IdP step?                         | `[TBC]` | Open   |
| 3 | Are there other accounts with SCIM provisioning where TeamBoard is the source of truth? If so, are DELETE events propagated? | `[TBC]` | Open |
| 4 | Does the IdP session token survive account deactivation, and if so for how long?               | `[TBC]` | Open   |
| 5 | Is SSO enabled for all accounts or only enterprise-tier accounts?                              | `[TBC]` | Open   |
| 6 | Is there a separate "suspend" vs "delete" concept in TeamBoard that should map to IdP deactivation vs IdP deletion? | `[TBC]` | Open |
