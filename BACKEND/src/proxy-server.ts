import express from 'express';
import cors from 'cors';
import downloadProxyRouter from './simple-proxy';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mount proxy routes
app.use('/api/v1', downloadProxyRouter);

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, () => {
  console.log(`Proxy server listening on port ${port}`);
});
