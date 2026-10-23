import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import 'dotenv/config';
import auth from './routes/auth.js';
import tasks from './routes/tasks.js';
import categories from './routes/categories.js';
import notifications from './routes/notifications.js';
import { requireAuth } from './middleware/auth.js';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required (see server/.env.example)');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.use('/api/auth', auth);
app.use('/api/tasks', requireAuth, tasks);
app.use('/api/categories', requireAuth, categories);
app.use('/api/notifications', requireAuth, notifications);

// Unknown API URLs get JSON, not an HTML page
app.use('/api', (_req, res) => res.status(404).json({ message: 'Not found' }));

app.use((err, _req, res, _next) => {
  if (err.code === 11000) return res.status(409).json({ message: 'That already exists' });
  if (err.name === 'CastError') return res.status(404).json({ message: 'Not found' });
  const status = err.name === 'ValidationError' ? 400 : 500;
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Something went wrong' : err.message });
});

await mongoose.connect(process.env.MONGO_URI);
app.listen(process.env.PORT || 5000, () => console.log('API ready'));
