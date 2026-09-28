/**
 * Export-time department normalisation for the BambooHR HR export.
 *
 * The stored department value is what the team sees and edits; normalising
 * happens only here, on the way out, so the stored value is never rewritten.
 */
export const CANONICAL_DEPARTMENTS = Object.freeze([
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Operations',
  'Finance',
  'HR',
  'Legal',
]);

const CANONICAL_BY_KEY = Object.fromEntries(
  CANONICAL_DEPARTMENTS.map((name) => [name.toLowerCase(), name]),
);

// Agreed with HR in March 2026: IT -> Operations (IT reports into Operations,
// not Engineering) and Product & Design -> Product (the design half is
// tracked separately in BambooHR).
const DEPARTMENT_ALIASES = Object.freeze({
  eng: 'Engineering',
  engg: 'Engineering',
  'human resources': 'HR',
  it: 'Operations',
  'product & design': 'Product',
});

export function normalizeDepartment(value) {
  if (typeof value !== 'string') {
    if (value === null || value === undefined) throw new Error('Missing department');
    throw new Error(`Unmappable department: ${JSON.stringify(value)}`);
  }
  const trimmed = value.trim();
  if (trimmed === '') throw new Error('Missing department');
  const key = trimmed.toLowerCase();
  if (key in CANONICAL_BY_KEY) return CANONICAL_BY_KEY[key];
  if (key in DEPARTMENT_ALIASES) return DEPARTMENT_ALIASES[key];
  throw new Error(`Unmappable department: ${JSON.stringify(value)}`);
}

export function buildExportRows(members) {
  const rows = [];
  const rejections = [];
  for (const member of members ?? []) {
    try {
      rows.push({ ...member, department: normalizeDepartment(member?.department) });
    } catch (error) {
      rejections.push({ member, reason: error.message });
    }
  }
  return { rows, rejections };
}
