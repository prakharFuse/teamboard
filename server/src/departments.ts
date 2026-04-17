// Canonical BambooHR department codes — sourced from Knowledge Doc 2 (synced with BambooHR).
// These values must be confirmed against the TEAM-4 attachment before merging.
// If the attachment's codes differ from this list, update this file and coordinate with People Ops.

export const DEPARTMENT_CODES = [
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

export type DepartmentCode = (typeof DEPARTMENT_CODES)[number];

export function isValidDepartmentCode(value: string): boolean {
  return (DEPARTMENT_CODES as readonly string[]).includes(value);
}
