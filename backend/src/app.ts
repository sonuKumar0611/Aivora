import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './utils/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import botsRoutes from './routes/bots';
import knowledgeRoutes from './routes/knowledge';
import chatRoutes from './routes/chat';
import analyticsRoutes from './routes/analytics';
import newsletterRoutes from './routes/newsletter';

const app = express();

// Allow frontend (dashboard) and any origin (embed widget on customer sites)
app.use(
  cors({
    origin: (orig: string | undefined, cb: (err: Error | null, allow?: boolean) => void) =>
      cb(null, orig === env.FRONTEND_URL || !orig || true),
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts', message: 'Try again later' },
});
app.use('/api/auth', authLimiter);

const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: 'Too many requests', message: 'Slow down and try again' },
});
app.use('/api/chat', chatLimiter);

const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many signup attempts', message: 'Try again later' },
});
app.use('/api/newsletter', newsletterLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/bots', botsRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/newsletter', newsletterRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
