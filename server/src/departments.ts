export interface DepartmentEntry {
  code: string;
  name: string;
}

export const DEPARTMENTS: DepartmentEntry[] = [
  { code: 'ENG', name: 'Engineering' },
  { code: 'PRD', name: 'Product' },
  { code: 'DSN', name: 'Design' },
  { code: 'MKT', name: 'Marketing' },
  { code: 'SLS', name: 'Sales' },
  { code: 'OPS', name: 'Operations' },
  { code: 'FIN', name: 'Finance' },
  { code: 'HR',  name: 'HR' },
  { code: 'LEG', name: 'Legal' },
];

export const VALID_DEPT_CODES: Set<string> = new Set(DEPARTMENTS.map(d => d.code));

export function isValidDeptCode(code: string): boolean {
  return VALID_DEPT_CODES.has(code);
}

export function getDeptName(code: string): string {
  const entry = DEPARTMENTS.find(d => d.code === code);
  return entry ? entry.name : code;
}
