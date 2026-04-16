export const VALID_DEPARTMENTS = [
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

export type DepartmentCode = typeof VALID_DEPARTMENTS[number];

export function isValidDepartment(value: string): value is DepartmentCode {
  return (VALID_DEPARTMENTS as readonly string[]).includes(value);
}
