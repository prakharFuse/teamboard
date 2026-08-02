export interface Department {
  code: string;
  name: string;
}

// Canonical BambooHR department codes confirmed by People Ops (TEAM-4).
export const DEPARTMENTS: Department[] = [
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

export const DEPARTMENT_CODES: string[] = DEPARTMENTS.map(d => d.code);

export function isValidDepartmentCode(code: string): boolean {
  return DEPARTMENT_CODES.includes(code);
}

export function departmentName(code: string): string {
  return DEPARTMENTS.find(d => d.code === code)?.name ?? code;
}
