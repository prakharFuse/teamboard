// ⚠️  BLOCKER — PLACEHOLDER DEPT CODES IN USE
// The BambooHR CSV attachment referenced in TEAM-4 was not available at
// implementation time.  These keys ('ENG', 'PROD', …) are placeholders only.
// Before deploying to production, obtain the current quarter's official
// dept_code list from People Ops in #people-ops and replace the keys below
// with the exact values from that file.  Mismatched codes will cause
// BambooHR to reject every row in the weekly import.

/**
 * Maps each BambooHR dept_code to its canonical display dept_name.
 * Keys must match the official BambooHR dept_code values exactly.
 * Source of truth for display names: Knowledge Doc 3 (Canonical Department Names).
 *
 * ⚠️  Keys are placeholders — see file-level comment above.
 */
export const DEPARTMENTS: Record<string, string> = {
  ENG:   'Engineering',
  PROD:  'Product',
  DES:   'Design',
  MKT:   'Marketing',
  SALES: 'Sales',
  OPS:   'Operations',
  FIN:   'Finance',
  HR:    'HR',
  LGL:   'Legal',
};

/**
 * Returns true when `code` is a recognised BambooHR dept_code.
 * Uses hasOwnProperty to avoid prototype-chain false positives.
 */
export function isValidDeptCode(code: string): boolean {
  return Object.prototype.hasOwnProperty.call(DEPARTMENTS, code);
}

/**
 * Returns the full list of allowed BambooHR dept_codes.
 */
export function getAllowedCodes(): string[] {
  return Object.keys(DEPARTMENTS);
}

/**
 * Returns the display dept_name for a given dept_code.
 * Falls back to the raw code if no mapping exists (e.g. unknown legacy values).
 */
export function getDeptName(code: string): string {
  return DEPARTMENTS[code] ?? code;
}