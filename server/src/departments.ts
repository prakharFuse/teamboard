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
 * Covers canonical names, common abbreviations, and the "common mistakes" listed
 * in KB Doc 3: 'Eng', 'Engg' → ENGR; 'Human Resources' → HRES; 'IT' → ENGR.
 * Returns undefined when the value cannot be recognised.
 */
export function legacyDeptToCode(dept: string): string | undefined {
  switch (dept.trim().toLowerCase()) {
    case 'engineering':
    case 'eng':
    case 'engg':
    case 'it':          // KB Doc 3: "IT is not a valid department — use Engineering"
      return 'ENGR';
    case 'product':
      return 'PROD';
    case 'design':
      return 'DSGN';
    case 'marketing':
      return 'MKTG';
    case 'sales':
      return 'SALE';
    case 'operations':
    case 'ops':
      return 'OPER';
    case 'finance':
    case 'fin':
      return 'FINC';
    case 'hr':
    case 'human resources':  // KB Doc 3 common mistake
      return 'HRES';
    case 'legal':
      return 'LEGL';
    default:
      return undefined;
  }
}
