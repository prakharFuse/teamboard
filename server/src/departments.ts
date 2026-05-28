// server/src/departments.ts — single source of truth for BambooHR department codes (TeamBoard)
// Codes confirmed by People Ops (TEAM-4) and cross-checked against the BambooHR attachment.
// If BambooHR updates the allowed codes, update this file and re-run the BambooHR sandbox
// import before merging (see KB Doc 4 — ask People Ops for sandbox credentials in #people-ops).

// Mapping from dept_code → canonical department name (synced with BambooHR).
// Canonical names from KB Doc 3: Engineering, Product, Design, Marketing, Sales,
// Operations, Finance, HR, Legal.
export const DEPT_CODE_TO_NAME: Record<string, string> = {
  ENGR: 'Engineering',
  PROD: 'Product',
  DSGN: 'Design',
  MKTG: 'Marketing',
  SALE: 'Sales',
  OPER: 'Operations',
  FINC: 'Finance',
  HRES: 'HR',
  LEGL: 'Legal',
};

/** All valid BambooHR department codes. */
export const ALLOWED_DEPT_CODES: string[] = Object.keys(DEPT_CODE_TO_NAME);

/** Returns true if code is a recognised BambooHR dept_code. */
export function isValidDeptCode(code: string): boolean {
  return Object.prototype.hasOwnProperty.call(DEPT_CODE_TO_NAME, code);
}

/** Returns the canonical department name for a code, or undefined if unknown. */
export function getDeptName(code: string): string | undefined {
  return DEPT_CODE_TO_NAME[code];
}

/**
 * Maps legacy free-text department strings (case-insensitive) to a dept_code.
 *
 * Strategy:
 *   1. Try to match canonical names directly via DEPT_CODE_TO_NAME — this way
 *      a rename in the mapping table is automatically reflected here without
 *      needing a second edit.
 *   2. Fall through to an explicit switch for abbreviations and the "common
 *      mistakes" listed in KB Doc 3 that are not canonical names.
 *
 * Returns undefined when the value cannot be recognised (caller should warn,
 * not throw — see backfill in db.ts).
 */
export function legacyDeptToCode(dept: string): string | undefined {
  const normalized = dept.trim().toLowerCase();

  // Step 1 — match against canonical display names (derived from the mapping
  // to avoid duplicating them here).
  for (const [code, name] of Object.entries(DEPT_CODE_TO_NAME)) {
    if (name.toLowerCase() === normalized) return code;
  }

  // Step 2 — abbreviations and KB Doc 3 "common mistakes" that don't match
  // any canonical name.
  switch (normalized) {
    case 'eng':
    case 'engg':
    case 'it':          // KB Doc 3: "IT is not a valid department — use Engineering"
      return 'ENGR';
    case 'ops':
      return 'OPER';
    case 'fin':
      return 'FINC';
    case 'human resources':  // KB Doc 3 common mistake ("HR" is the canonical name)
      return 'HRES';
    default:
      return undefined;
  }
}
