import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import feedRoutes from './routes/feed.js';
import browseRoutes from './routes/browse.js';
import { appConfig } from './config.js';

const app = express();

const requestBuckets = new Map();
app.use((req, res, next) => {
  const key = req.ip || 'local';
  const now = Date.now();
  const bucket = requestBuckets.get(key) || { tokens: appConfig.requestLimitPerMinute, resetAt: now + 60000 };

  if (now > bucket.resetAt) {
    bucket.tokens = appConfig.requestLimitPerMinute;
    bucket.resetAt = now + 60000;
  }

  if (bucket.tokens <= 0) {
    return res.status(429).json({ error: 'rate limited' });
  }

  bucket.tokens -= 1;
  requestBuckets.set(key, bucket);
  req.requestId = `req-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  res.setHeader('x-request-id', req.requestId);
  next();
});

app.use(cors());
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use('/api', feedRoutes);
app.use('/api', browseRoutes);

// Production: serve the built client with SPA fallback so deep links like /watch/42 work.
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  if ((err.status || 500) >= 500) console.error(err);
  else console.warn(`[${err.status}] ${err.message}`);
  res.status(err.status || 500).json({
    error: err.message || 'internal_error',
  });
});

const port = appConfig.port;
app.listen(port, () => {
  console.log(`Endless server running on http://localhost:${port}`);
});

export default app;
