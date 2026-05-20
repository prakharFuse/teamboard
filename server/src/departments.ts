// Single source of truth for valid department codes, synced with BambooHR.
// See Knowledge Doc 3 (Canonical Department Names) for the authoritative list.

export const VALID_DEPARTMENT_CODES = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Operations',
  'Finance',
  'HR',
  'Legal',
] as const;

export interface DepartmentEntry {
  dept_code: string;
  dept_name: string;
}

// Currently code === name, but structured to allow divergence in the future
// (e.g. if BambooHR assigns short codes while we keep display names).
export const DEPARTMENTS: DepartmentEntry[] = VALID_DEPARTMENT_CODES.map(code => ({
  dept_code: code,
  dept_name: code,
}));

export function isValidDepartmentCode(code: string): boolean {
  return (VALID_DEPARTMENT_CODES as readonly string[]).includes(code);
}

export function getInvalidDepartmentError(code: string): string {
  return (
    `Invalid department code: "${code}". ` +
    `Allowed values are: ${VALID_DEPARTMENT_CODES.join(', ')}.`
  );
}
