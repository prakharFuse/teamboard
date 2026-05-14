import 'express-serve-static-core';

export interface WorkspaceContext {
  id: number;
  slug: string;
  name: string;
  bamboohr_dept_code_list: string;
  userEmail: string;
  accessibleWorkspaces: string[];
}

export interface OktaClaims {
  sub: string;
  email: string;
  groups: string[];
}

declare module 'express-serve-static-core' {
  interface Request {
    workspace?: WorkspaceContext;
    rawClaims?: OktaClaims;
  }
}
