export const VALID_DEPARTMENTS: readonly string[] = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Operations',
  'Finance',
  'HR',
  'Legal',
];

export function isValidDepartment(dept: string): boolean {
  return VALID_DEPARTMENTS.includes(dept);
}