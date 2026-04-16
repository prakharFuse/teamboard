// Single source of truth for BambooHR department codes.
//
// TODO: Replace the keys below with the real BambooHR dept_codes once the
// authoritative CSV attachment has been obtained from People Ops (#people-ops).
// The {{dept_code}} placeholders in ticket TEAM-4 were never filled in, meaning
// the attachment is still missing.  Until then, the canonical display names
// (Knowledge Doc 3) are used as placeholder keys so the rest of the validation
// logic can be wired up without blocking downstream steps.
//
// Process: BambooHR updates its dept_code list quarterly.  When People Ops
// shares the new CSV, update the keys in DEPARTMENTS to match exactly, then
// update the seed/migration data in db.ts and redeploy.

export const DEPARTMENTS: Record<string, string> = {
  // TODO: replace each key with the real BambooHR dept_code from the CSV
  Engineering: 'Engineering',
  Product: 'Product',
  Design: 'Design',
  Marketing: 'Marketing',
  Sales: 'Sales',
  Operations: 'Operations',
  Finance: 'Finance',
  HR: 'HR',
  Legal: 'Legal',
};

export const VALID_DEPT_CODES: string[] = Object.keys(DEPARTMENTS);

export function isValidDeptCode(code: string): boolean {
  return Object.prototype.hasOwnProperty.call(DEPARTMENTS, code);
}

export function getDeptName(code: string): string | undefined {
  return DEPARTMENTS[code];
}