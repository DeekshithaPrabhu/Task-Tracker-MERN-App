import { ensureDatabase, isDatabaseConnected, describeDbError } from '../config/db.js';

// Health check. Add ?db=1 to also test the MongoDB connection and see why it fails.
export const health = async (req, res) => {
  if (req.query.db === '1') {
    try {
      await ensureDatabase();
    } catch (error) {
      return res.status(503).json({ ok: false, database: 'unreachable', ...describeDbError(error) });
    }
  }
  res.status(200).json({ ok: true, database: isDatabaseConnected() ? 'connected' : 'disconnected' });
};
