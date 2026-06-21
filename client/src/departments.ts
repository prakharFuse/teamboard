// client/src/departments.ts
// Client-side mirror of server/src/departments.ts.
// IMPORTANT: This file must stay in sync with server/src/departments.ts.
// It exists as a separate file because the Vite client cannot import from server/.

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

export function getDeptName(code: string): string | undefined {
  return DEPARTMENTS.find((d) => d.code === code)?.name;
}
