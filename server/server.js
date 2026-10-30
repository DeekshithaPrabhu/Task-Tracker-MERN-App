// Entry point: connects to MongoDB, then starts the HTTP server.
import app from './src/app.js';
import { env } from './src/config/env.js';
import { connectDatabase } from './src/config/db.js';

await connectDatabase();
app.listen(env.port, () => console.log(`API listening on http://localhost:${env.port}`));
