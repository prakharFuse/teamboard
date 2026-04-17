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

export type Department = typeof VALID_DEPARTMENTS[number];

export function isValidDepartment(value: string): value is Department {
  return (VALID_DEPARTMENTS as readonly string[]).includes(value);
}
