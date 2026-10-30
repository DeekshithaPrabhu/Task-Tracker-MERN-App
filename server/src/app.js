import express from 'express';
import cookieParser from 'cookie-parser';
import { corsMiddleware } from './middleware/cors.js';
import { requireDatabase } from './middleware/requireDatabase.js';
import { apiNotFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/health.routes.js';
import apiRoutes from './routes/index.js';

const app = express();
app.set('trust proxy', 1); // behind Vercel's proxy

app.use(corsMiddleware);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/', (_req, res) => res.status(200).json({ success: true, message: 'API is running' }));

// Health check works without the database unless ?db=1 is passed
app.use('/api/health', healthRoutes);

// Everything else under /api needs MongoDB
app.use('/api', requireDatabase, apiRoutes);
app.use('/api', apiNotFound);

app.use(errorHandler);

export default app;
