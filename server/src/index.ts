import express from 'express';
import cors from 'cors';
import configRouter from './routes/config.js';
import authRouter from './routes/auth.js';
import { authMiddleware } from './middleware/auth.js';
import { workspaceContextMiddleware } from './middleware/workspaceContext.js';
import { auditLogMiddleware } from './middleware/auditLog.js';
import membersRouter from './routes/members.js';
import workspacesRouter from './routes/workspaces.js';

const app = express();
const PORT = process.env.PORT || 4060;

app.use(cors());
app.use(express.json());

// Public routes — no authentication required
app.use('/api/config', configRouter);
app.use('/api/auth', authRouter);

// Apply authentication, workspace context, and audit logging to all subsequent /api/ routes
app.use('/api/', authMiddleware);
app.use('/api/', workspaceContextMiddleware);
app.use('/api/', auditLogMiddleware);

// Protected routes
app.use('/api/members', membersRouter);
app.use('/api/workspaces', workspacesRouter);

app.listen(PORT, () => {
  console.log(`TeamBoard API running on http://localhost:${PORT}`);
});
