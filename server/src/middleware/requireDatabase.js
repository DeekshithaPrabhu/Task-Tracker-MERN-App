import { ensureDatabase } from '../config/db.js';

export async function requireDatabase(_req, res, next) {
  try {
    await ensureDatabase();
    next();
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.name}: ${error.message}`);
    res.status(503).json({ message: 'Database temporarily unavailable' });
  }
}
