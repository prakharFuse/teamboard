export interface Department {
  dept_code: string;
  dept_name: string;
}

export const DEPARTMENTS: Department[] = [
  { dept_code: 'Engineering', dept_name: 'Engineering' },
  { dept_code: 'Product',     dept_name: 'Product'     },
  { dept_code: 'Design',      dept_name: 'Design'      },
  { dept_code: 'Marketing',   dept_name: 'Marketing'   },
  { dept_code: 'Sales',       dept_name: 'Sales'       },
  { dept_code: 'Operations',  dept_name: 'Operations'  },
  { dept_code: 'Finance',     dept_name: 'Finance'     },
  { dept_code: 'HR',          dept_name: 'HR'          },
  { dept_code: 'Legal',       dept_name: 'Legal'       },
];

export const VALID_DEPT_CODES: Set<string> = new Set(
  DEPARTMENTS.map(d => d.dept_code)
);

export function isValidDeptCode(code: string): boolean {
  return VALID_DEPT_CODES.has(code);
}

export function getDeptName(code: string): string | undefined {
  return DEPARTMENTS.find(d => d.dept_code === code)?.dept_name;
}
