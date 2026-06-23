// Provenance: ticket TEAM-4 — People Ops confirmation (2026-05-26) supersedes attached CSV.
// Canonical BambooHR department codes; see TEAM-4 for confirmation history.

export const DEPARTMENTS = [
  { code: 'ENGR', name: 'Engineering' },
  { code: 'PROD', name: 'Product' },
  { code: 'DSGN', name: 'Design' },
  { code: 'HRES', name: 'Human Resources' },
  { code: 'FINC', name: 'Finance' },
  { code: 'MKTG', name: 'Marketing' },
  { code: 'SALE', name: 'Sales' },
  { code: 'OPER', name: 'Operations' },
  { code: 'LEGL', name: 'Legal' },
] as const;

export const DEPARTMENT_CODES: ReadonlySet<string> = new Set(DEPARTMENTS.map((d) => d.code));

export const ALLOWED_CODES: readonly string[] = DEPARTMENTS.map((d) => d.code);

export function isValidDepartmentCode(value: unknown): boolean {
  return typeof value === 'string' && DEPARTMENT_CODES.has(value);
}

export function getDepartmentName(code: string): string | undefined {
  return DEPARTMENTS.find((d) => d.code === code)?.name;
}
