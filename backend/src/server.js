import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import questRoutes from './routes/questRoutes.js';

dotenv.config();

const app = express();

const allowedOrigins = (process.env.CLIENT_URLS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('CORS origin is not allowed'));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/quests', questRoutes);

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default app;
