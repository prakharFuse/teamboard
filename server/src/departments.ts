/**
 * Authoritative source for BambooHR department code ↔ department name mapping.
 *
 * NOTE: All dept_codes here must be verified against the BambooHR-provided CSV
 * once obtained from People Ops before deploying to production. The codes below
 * reflect the canonical list from the knowledge base (Engineering, Product,
 * Design, Marketing, Sales, Operations, Finance, HR, Legal).
 */

export interface Department {
  code: string;
  name: string;
}

/**
 * The single authoritative list of valid BambooHR departments.
 * Order matches the knowledge-base canonical list.
 */
export const DEPARTMENTS: Department[] = [
  { code: 'ENG',  name: 'Engineering' },
  { code: 'PROD', name: 'Product' },
  { code: 'DES',  name: 'Design' },
  { code: 'MKT',  name: 'Marketing' },
  { code: 'SAL',  name: 'Sales' },
  { code: 'OPS',  name: 'Operations' },
  { code: 'FIN',  name: 'Finance' },
  { code: 'HR',   name: 'HR' },
  { code: 'LEG',  name: 'Legal' },
];

/**
 * Array of all valid dept_code strings, derived from DEPARTMENTS.
 * Use this for O(1) validation via Set or Array.includes().
 */
export const VALID_DEPT_CODES: string[] = DEPARTMENTS.map(d => d.code);

/**
 * Lookup from dept_code → dept_name.
 * Use this to enrich API responses with a human-readable department name.
 */
export const DEPT_CODE_TO_NAME: Record<string, string> = Object.fromEntries(
  DEPARTMENTS.map(d => [d.code, d.name])
);

/**
 * Maps all known legacy / variant department strings to their canonical
 * dept_code. Used by the DB migration to normalise pre-existing rows.
 *
 * Covers every variant documented in the knowledge base:
 *   - "Eng" / "Engg"         → 'ENG'  (common abbreviations for Engineering)
 *   - "Engineering"          → 'ENG'  (canonical display name stored as text)
 *   - "Human Resources"      → 'HR'   (verbose form seen in legacy seed data)
 *   - "Product & Design"     → not split here; must be resolved manually
 *
 * All canonical dept_names are also mapped so that any row storing a display
 * name instead of a code is corrected on first migration run.
 */
export const LEGACY_NAME_TO_CODE: Record<string, string> = {
  // Engineering variants
  'Eng':             'ENG',
  'Engg':            'ENG',
  'Engineering':     'ENG',

  // Product variants
  'Product':         'PROD',

  // Design variants
  'Design':          'DES',

  // Marketing variants
  'Marketing':       'MKT',

  // Sales variants
  'Sales':           'SAL',

  // Operations variants
  'Operations':      'OPS',
  'Ops':             'OPS',

  // Finance variants
  'Finance':         'FIN',

  // HR variants
  'HR':              'HR',
  'Human Resources': 'HR',
  'Human Resource':  'HR',

  // Legal variants
  'Legal':           'LEG',
};
