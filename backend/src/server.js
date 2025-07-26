import express from 'express';
import cookieParser from 'cookie-parser';
// import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/authRoutes.js';
import questRoutes from './routes/questRoutes.js';

const app = express();
app.use(express.json());
app.use(cookieParser());

// Роуты
app.use('/api/auth', authRoutes);
app.use('/api/quests', questRoutes);

export default app;