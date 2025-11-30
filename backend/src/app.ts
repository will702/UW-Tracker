import express from 'express';
import cors from 'cors';
import { COLLECTION_NAME } from './config';
import { getDb } from './db';
import recordsRouter from './routes/records';
import groupedRecordsRouter from './routes/grouped-records';
import statsRouter from './routes/stats';
import underwritersRouter from './routes/underwriters';
import recordRouter from './routes/record';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    const db = await getDb();
    await db.collection(COLLECTION_NAME).estimatedDocumentCount();
    return res.json({ status: 'ok', database: 'connected' });
  } catch (error: any) {
    console.error('Health check failed', error);
    return res.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: error.message,
    });
  }
});

app.use('/api/records', recordsRouter);
app.use('/api/grouped-records', groupedRecordsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/underwriters', underwritersRouter);
app.use('/api/record', recordRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;

