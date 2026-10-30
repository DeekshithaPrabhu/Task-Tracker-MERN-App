// Entry point.
// - Vercel: the platform imports the exported Express app (VERCEL is set there).
// - Local:  starts a normal HTTP server.
import app from './src/app.js';
import { env } from './src/config/env.js';

if (!process.env.VERCEL) {
  app.listen(env.port, () => console.log(`API listening on http://localhost:${env.port}`));
}

export default app;
