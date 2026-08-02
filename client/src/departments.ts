// Mirrors server/src/departments.ts, which is the authoritative source for
// BambooHR department codes. Keep this mapping in sync with that file.
export const DEPARTMENTS: Record<string, string> = {
  ENGR: 'Engineering',
  PROD: 'Product',
  DSGN: 'Design',
  HRES: 'Human Resources',
  FINC: 'Finance',
  MKTG: 'Marketing',
  SALE: 'Sales',
  OPER: 'Operations',
  LEGL: 'Legal',
};

export const DEPARTMENT_CODES: string[] = Object.keys(DEPARTMENTS);
