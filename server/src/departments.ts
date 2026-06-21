// server/src/departments.ts
// Canonical BambooHR department registry.
// Codes confirmed by People Ops (see TEAM-4):
//   ENGR, PROD, DSGN, HRES, FINC, MKTG, SALE, OPER, LEGL

export const DEPARTMENTS: { code: string; name: string }[] = [
  { code: 'ENGR', name: 'Engineering' },
  { code: 'PROD', name: 'Product' },
  { code: 'DSGN', name: 'Design' },
  { code: 'HRES', name: 'Human Resources' },
  { code: 'FINC', name: 'Finance' },
  { code: 'MKTG', name: 'Marketing' },
  { code: 'SALE', name: 'Sales' },
  { code: 'OPER', name: 'Operations' },
  { code: 'LEGL', name: 'Legal' },
];

export type DeptCode = 'ENGR' | 'PROD' | 'DSGN' | 'HRES' | 'FINC' | 'MKTG' | 'SALE' | 'OPER' | 'LEGL';

export const DEPT_CODES = new Set<string>(DEPARTMENTS.map((d) => d.code));

export function isValidDeptCode(value: unknown): value is DeptCode {
  return typeof value === 'string' && DEPT_CODES.has(value);
}

export function getDeptName(code: string): string | undefined {
  return DEPARTMENTS.find((d) => d.code === code)?.name;
}

export const ALLOWED_CODES_MESSAGE =
  `Allowed department codes: ${DEPARTMENTS.map((d) => d.code).join(', ')}.`;
