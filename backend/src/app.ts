import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './routes/auth.routes';
import { projectRouter } from './routes/project.routes';
import { boardRouter } from './routes/board.routes';
import { columnRouter } from './routes/column.routes';
import { cardRouter } from './routes/card.routes';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/projects', projectRouter);
  app.use('/api/boards', boardRouter);
  app.use('/api/columns', columnRouter);
  app.use('/api/cards', cardRouter);

  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(err.status || 500).json({ error: err.message || 'Internal error' });
  });

  return app;
};
