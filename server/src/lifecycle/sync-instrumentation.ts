/**
 * BambooHR sync debug-tracing helpers.
 *
 * Feature flag: set TEAMBOARD_BAMBOOHR_TRACE=1 to enable structured trace output.
 * Zero side effects at import — all behaviour is guarded inside traceStage() by
 * isTraceEnabled(), so requiring this module never produces output.
 *
 * Temporary instrumentation scaffold per the TEAM-6 RCA spec:
 *   "add temporary structured logging… revert or gate behind a flag"
 *
 * Do NOT wire this module into production routes or import it unconditionally
 * from server/src/index.ts — it is a pure investigative scaffold.
 */

// ── Enum ───────────────────────────────────────────────────────────────────

/**
 * Discrete stages in the BambooHR → TeamBoard member lifecycle pipeline.
 * Add stages as instrumentation needs evolve; remove when the RCA is closed.
 */
export enum SyncStage {
  /** HTTP fetch issued to BambooHR /employees/directory (or /v1/employees). */
  FetchRequest = 'fetch_request',
  /** HTTP response received; status code and Content-Type validated. */
  FetchResponse = 'fetch_response',
  /** Raw JSON payload parsed; basic schema checks applied. */
  PayloadParsed = 'payload_parsed',
  /** Individual employee record mapped to TeamBoard MemberRow shape. */
  RecordMapped = 'record_mapped',
  /** Database upsert attempted for a single mapped record. */
  UpsertAttempt = 'upsert_attempt',
  /** Database upsert completed successfully. */
  UpsertSuccess = 'upsert_success',
  /** Database upsert failed; error captured for RCA. */
  UpsertFailure = 'upsert_failure',
  /** Full sync pass completed (regardless of per-record errors). */
  SyncComplete = 'sync_complete',
  /** Sync pass aborted early due to a fatal, unrecoverable error. */
  SyncAborted = 'sync_aborted',
}

// ── Types ──────────────────────────────────────────────────────────────────

/** Shape of a single structured trace line emitted to stdout. */
export interface TraceEntry {
  /** ISO-8601 timestamp, e.g. "2026-06-10T12:34:56.789Z". */
  timestamp: string;
  /** Always "TRACE" — lets log shippers filter on level. */
  level: 'TRACE';
  /** Identifies the emitting subsystem in aggregated logs. */
  source: 'bamboohr-sync';
  /** Pipeline stage being traced. */
  stage: SyncStage;
  /** Human-readable one-liner describing the data in flight. Avoid raw PII. */
  payloadSummary: string;
  /** Present only when an error is captured at the stage. */
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// ── Feature-flag guard ─────────────────────────────────────────────────────

/**
 * Returns true only when TEAMBOARD_BAMBOOHR_TRACE is exactly '1'.
 * Evaluated lazily inside traceStage() so toggling the env var at runtime
 * (e.g. in tests) takes effect without restarting the process.
 */
export function isTraceEnabled(): boolean {
  return process.env.TEAMBOARD_BAMBOOHR_TRACE === '1';
}

// ── Core helper ────────────────────────────────────────────────────────────

/**
 * Emit one structured JSON trace line to stdout for the given sync stage.
 *
 * Silently no-ops when TEAMBOARD_BAMBOOHR_TRACE !== '1'.
 * Never throws — instrumentation must never affect production control flow.
 *
 * @param stage          - Pipeline stage being traced (SyncStage enum value).
 * @param payloadSummary - Short descriptor of the data being processed, e.g.
 *                         `"employeeId=42 email=alice@example.com"`.
 *                         Keep it concise; avoid unmasked PII in prod logs.
 * @param error          - Optional Error (or any thrown value) captured at the
 *                         stage. Stack trace is included in the output.
 *
 * @example
 *   import { traceStage, SyncStage } from '../lifecycle/sync-instrumentation.js';
 *
 *   traceStage(SyncStage.FetchRequest, 'GET /v1/employees/directory');
 *   traceStage(SyncStage.UpsertFailure, 'employeeId=7 email=bob@…', err);
 */
export function traceStage(
  stage: SyncStage,
  payloadSummary: string,
  error?: unknown,
): void {
  if (!isTraceEnabled()) {
    return;
  }

  try {
    const entry: TraceEntry = {
      timestamp: new Date().toISOString(),
      level: 'TRACE',
      source: 'bamboohr-sync',
      stage,
      payloadSummary,
    };

    if (error != null) {
      const err = error instanceof Error ? error : new Error(String(error));
      entry.error = {
        name: err.name,
        message: err.message,
        stack: err.stack,
      };
    }

    process.stdout.write(JSON.stringify(entry) + '\n');
  } catch {
    // Instrumentation must never crash the caller — swallow silently.
  }
}
