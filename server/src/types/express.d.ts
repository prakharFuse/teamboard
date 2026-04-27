import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    workspaceId: number;
    workspaceSlug: string;
    allowedWorkspaceSlugs: string[];
    actorEmail: string;
  }
}
