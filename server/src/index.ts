import express from 'express';
import cors from 'cors';
import membersRouter from './routes/members.js';
import departmentsRouter from './routes/departments.js';

const app = express();
const PORT = process.env.PORT || 4060;

app.use(cors());
app.use(express.json());

app.use('/api/members', membersRouter);
app.use('/api/departments', departmentsRouter);

app.listen(PORT, () => {
  console.log(`TeamBoard API running on http://localhost:${PORT}`);
});
