// server/src/departments.ts — single source of truth for BambooHR department codes (TeamBoard)
// TODO (TEAM-4): These codes are placeholders pending the official list from the TEAM-4 BambooHR
// attachment. Once People Ops provides the CSV, replace this mapping with the exact values from
// that file and verify with the BambooHR sandbox import before merging.

// Mapping from dept_code → canonical department name (synced with BambooHR).
// Canonical names from KB Doc 3: Engineering, Product, Design, Marketing, Sales,
// Operations, Finance, HR, Legal.
export const DEPT_CODE_TO_NAME: Record<string, string> = {
  ENG:   'Engineering',
  PROD:  'Product',
  DES:   'Design',
  MKT:   'Marketing',
  SALES: 'Sales',
  OPS:   'Operations',
  FIN:   'Finance',
  HR:    'HR',
  LEGAL: 'Legal',
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
 * in KB Doc 3: 'Eng', 'Engg' → ENG; 'Human Resources' → HR; 'IT' → ENG.
 * Returns undefined when the value cannot be recognised.
 */
export function legacyDeptToCode(dept: string): string | undefined {
  switch (dept.trim().toLowerCase()) {
    case 'engineering':
    case 'eng':
    case 'engg':
    case 'it':          // KB Doc 3: "IT is not a valid department — use Engineering"
      return 'ENG';
    case 'product':
      return 'PROD';
    case 'design':
      return 'DES';
    case 'marketing':
      return 'MKT';
    case 'sales':
      return 'SALES';
    case 'operations':
    case 'ops':
      return 'OPS';
    case 'finance':
    case 'fin':
      return 'FIN';
    case 'hr':
    case 'human resources':  // KB Doc 3 common mistake
      return 'HR';
    case 'legal':
      return 'LEGAL';
    default:
      return undefined;
  }
}
