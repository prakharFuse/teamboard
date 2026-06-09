export type Department = {
  code: string;
  name: string;
};

export const DEPARTMENTS: readonly Department[] = Object.freeze([
  { code: 'ENGR', name: 'Engineering' },
  { code: 'PROD', name: 'Product' },
  { code: 'DSGN', name: 'Design' },
  { code: 'HRES', name: 'Human Resources' },
  { code: 'FINC', name: 'Finance' },
  { code: 'MKTG', name: 'Marketing' },
  { code: 'SALE', name: 'Sales' },
  { code: 'OPER', name: 'Operations' },
  { code: 'LEGL', name: 'Legal' },
]);

export const DEPARTMENT_CODES: readonly string[] = Object.freeze(
  DEPARTMENTS.map((d) => d.code)
);

export function isValidDepartmentCode(code: string): boolean {
  return DEPARTMENT_CODES.includes(code);
}

export function getDepartmentName(code: string): string | undefined {
  return DEPARTMENTS.find((d) => d.code === code)?.name;
}
