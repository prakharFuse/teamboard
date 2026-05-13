export interface AuthUser {
  email: string;
  workspaces: string[];
}

export interface WorkspaceRow {
  id: number;
  slug: string;
  name: string;
  bamboohr_dept_code_list: string;
  okta_group: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
    workspace?: WorkspaceRow;
  }
}
