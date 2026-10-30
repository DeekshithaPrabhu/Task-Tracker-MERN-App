import express from 'express';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/health.routes.js';
import apiRoutes from './routes/index.js';

const app = express();

app.use(corsMiddleware);
app.use(express.json({ limit: '100kb' }));

app.get('/', (_req, res) => res.status(200).json({ success: true, message: 'API is running' }));

// Health check
app.use('/api/health', healthRoutes);

app.use('/api', apiRoutes);

app.use(errorHandler);

export default app;
