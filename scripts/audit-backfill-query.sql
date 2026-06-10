-- ---------------------------------------------------------------------------
-- scripts/audit-backfill-query.sql
-- TEAM-6 RCA deliverable — SSO revocation backfill audit
-- ---------------------------------------------------------------------------
--
-- PURPOSE
-- -------
-- Identifies TeamBoard members who:
--   1. Are marked inactive (is_active = 0) — current proxy for "departed"
--   2. Have been in that state for longer than :threshold_hours
--   3. May not yet have an SSO revocation on record
--
-- Run this query as Step 1 of the SSO revocation runbook to build the list
-- of member IDs to pass into scripts/sso-revoke.ts.
-- See: docs/runbooks/sso-revocation-runbook.md §3 Step 1.
--
-- USAGE
-- -----
-- SQLite (development / runbook use):
--   sed 's/:threshold_hours/48/g' scripts/audit-backfill-query.sql \
--     | sqlite3 data/teamboard.db
--
-- PostgreSQL (after adapting per the ADAPTATION section below):
--   psql $DATABASE_URL \
--     -v threshold_hours=48 \
--     -f scripts/audit-backfill-query.sql
--
-- SCHEMA ASSUMPTIONS
-- ------------------
-- Targets the current TeamBoard members table (server/src/db.ts):
--
--   CREATE TABLE members (
--     id          INTEGER PRIMARY KEY AUTOINCREMENT,
--     name        TEXT    NOT NULL,
--     email       TEXT    NOT NULL UNIQUE,
--     role        TEXT    NOT NULL,
--     department  TEXT    NOT NULL,
--     start_date  TEXT    NOT NULL,
--     is_active   INTEGER NOT NULL DEFAULT 1,  -- 0 = inactive, proxy for departed
--     created_at  TEXT    NOT NULL,
--     updated_at  TEXT    NOT NULL             -- used as departed_at proxy
--   );
--
-- Two fields that SHOULD exist but are NOT YET in the schema:
--   idp_provider  TEXT  -- which IdP to revoke against (Okta / Azure / Google)
--   departed_at   TEXT  -- precise timestamp of the departure transition
--
-- Both are catalogued in docs/rca/TEAM-6-data-model-gap-recommendations.md.
-- Until they land, the queries below substitute NULL for idp_provider and
-- use updated_at as an imprecise proxy for departure time.  updated_at may
-- reflect any field edit — not only the is_active transition — so the
-- effective lookback window is conservative (it may include members whose
-- non-departure fields were edited after they departed).
--
-- NOTE ON SSO-REVOKE CACHE
-- ------------------------
-- The idempotency marker is stored in data/sso-revoke-cache.json (a flat
-- JSON file), not in the database.  These SQL variants cannot automatically
-- exclude already-revoked members.  Cross-check the cache file before
-- running --apply, or use the JOIN in ADAPTATION §3 once sso_revoke_log
-- is created.
--
-- ADAPTATION
-- ----------
-- §1  status enum column (recommended follow-on):
--       Replace:  WHERE m.is_active = 0
--       With:     WHERE m.status = 'departed'
--
-- §2  departed_at timestamp column (recommended follow-on):
--       Replace:  (unixepoch('now') - unixepoch(m.updated_at)) > ...
--       With:     (unixepoch('now') - unixepoch(m.departed_at)) > ...
--
-- §3  sso_revoke_log audit table (recommended follow-on schema):
--       CREATE TABLE sso_revoke_log (
--         id           INTEGER PRIMARY KEY AUTOINCREMENT,
--         member_id    INTEGER NOT NULL REFERENCES members(id),
--         idp_provider TEXT    NOT NULL,
--         revoked_at   TEXT    NOT NULL DEFAULT (datetime('now')),
--         applied_by   TEXT,
--         log_path     TEXT
--       );
--     Add to both WHERE clauses:
--       AND NOT EXISTS (
--         SELECT 1 FROM sso_revoke_log r WHERE r.member_id = m.id
--       )
--
-- §4  PostgreSQL datetime translation:
--       unixepoch('now')            → EXTRACT(EPOCH FROM now())::bigint
--       unixepoch(m.updated_at)     → EXTRACT(EPOCH FROM m.updated_at::timestamptz)::bigint
--       CAST(x AS INTEGER)          → x::integer
-- ---------------------------------------------------------------------------


-- ===========================================================================
-- VARIANT A — COUNT
-- How many members are pending revocation beyond the threshold window?
-- Returns a single summary row for quick sanity-checking before the row dump.
-- ===========================================================================

SELECT
    COUNT(*)                 AS pending_revocation_count,
    :threshold_hours         AS threshold_hours_param,
    datetime('now')          AS query_run_at
FROM  members AS m
WHERE m.is_active = 0
  AND (unixepoch('now') - unixepoch(m.updated_at))
          > (CAST(:threshold_hours AS INTEGER) * 3600)
  -- Placeholder: no sso_revoke_log table yet.
  -- Add NOT EXISTS subquery here once ADAPTATION §3 is implemented.
;


-- ===========================================================================
-- VARIANT B — ROW DUMP
-- Full details for every affected member, ordered oldest-first.
-- Pipe with -header -csv for a spreadsheet-ready file, or use -separator '|'
-- to feed the bulk-sweep loop in the runbook (§3 Step 5).
--
-- Example:
--   sed 's/:threshold_hours/48/g' scripts/audit-backfill-query.sql \
--     | sqlite3 -header -csv data/teamboard.db \
--     > /tmp/pending-revocations-$(date +%Y%m%d).csv
-- ===========================================================================

SELECT
    m.id                                                   AS member_id,
    m.name                                                 AS member_name,
    m.email                                                AS member_email,
    m.role                                                 AS member_role,
    m.department                                           AS department,
    m.is_active                                            AS is_active,
    m.updated_at                                           AS departed_at_proxy,
    ROUND(
        (unixepoch('now') - unixepoch(m.updated_at)) / 3600.0,
        1
    )                                                      AS hours_since_update,
    -- idp_provider does not exist yet; NULL until data-model follow-on lands.
    -- Operator must supply the correct value when invoking sso-revoke.ts.
    NULL                                                   AS idp_provider,
    'npx tsx scripts/sso-revoke.ts'
        || ' --member-id ' || m.id
        || ' --idp-provider <okta|azure|google>'           AS suggested_dry_run_cmd
FROM  members AS m
WHERE m.is_active = 0
  AND (unixepoch('now') - unixepoch(m.updated_at))
          > (CAST(:threshold_hours AS INTEGER) * 3600)
  -- Placeholder: no sso_revoke_log table yet.
  -- Add NOT EXISTS subquery here once ADAPTATION §3 is implemented.
ORDER BY m.updated_at ASC  -- oldest unrevoked departures first
;
