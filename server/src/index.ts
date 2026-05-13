import express from 'express';
import cors from 'cors';
import { getDb } from './db.js';
import membersRouter from './routes/members.js';
import authRouter from './routes/auth.js';
import featureFlagsRouter from './routes/featureFlags.js';
import requireAuth from './middleware/auth.js';
import resolveWorkspace from './middleware/workspace.js';

const app = express();
const PORT = process.env.PORT || 4060;

app.use(cors());
app.use(express.json());

// Run migrations eagerly at startup
getDb();

app.use('/api/auth', authRouter);
app.use('/api/feature-flags', featureFlagsRouter);
app.use('/api/members', requireAuth, resolveWorkspace, membersRouter);

app.listen(PORT, () => {
  console.log(`TeamBoard API running on http://localhost:${PORT}`);
});
