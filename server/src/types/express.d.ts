import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    workspace: {
      id: number;
      slug: string;
      name: string;
      bamboohr_dept_code_list: string | null;
      bamboohr_api_key: string | null;
      okta_group: string | null;
    };
    userWorkspaces: string[];
    user?: {
      email: string;
    };
  }
}

export {};
