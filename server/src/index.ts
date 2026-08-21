import express from 'express';
import cors from 'cors';
import membersRouter from './routes/members.js';
import { config } from './config.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/members', membersRouter);

app.listen(config.port, () => {
  console.log(`TeamBoard API running on http://${config.host}:${config.port}`);
});
