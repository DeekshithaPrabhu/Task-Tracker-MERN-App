import mongoose from 'mongoose';
import { env } from './env.js';

// Reuse one MongoDB connection across serverless invocations
let connectionPromise = null;

export async function ensureDatabase() {
  if (mongoose.connection.readyState === 1) return;

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(env.mongoUri, {
        serverSelectionTimeoutMS: 8000, // fail fast with a real error instead of hanging until Vercel times out
        maxPoolSize: 5, // small pool suits serverless
      })
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  await connectionPromise;
}

export const isDatabaseConnected = () => mongoose.connection.readyState === 1;

const DB_HINTS = {
  MongooseServerSelectionError:
    'Cannot reach the cluster. In MongoDB Atlas > Network Access allow 0.0.0.0/0, check the host in MONGO_URI, and make sure the cluster is not paused.',
  MongoServerError: 'Connected but rejected. Check the database user and password in MONGO_URI.',
  MongoParseError: 'MONGO_URI is malformed. URL-encode special characters in the password and remove quotes or <>.',
  // Plain Node DNS errors (name is just "Error"), told apart by code
  ENOTFOUND:
    'The host name in MONGO_URI does not exist. Copy a fresh connection string from Atlas (Connect > Drivers) and check for typos, quotes or extra characters.',
  ENODATA: 'The host name in MONGO_URI has no DNS record. Copy a fresh connection string from Atlas (Connect > Drivers).',
  ECONNREFUSED:
    "DNS lookup for the cluster was refused. Try again, or use Atlas's standard (non-SRV) connection string that starts with mongodb://.",
  ETIMEOUT:
    "DNS lookup for the cluster timed out. Try again, or use Atlas's standard (non-SRV) connection string that starts with mongodb://.",
};

// Safe to send to a client: never contains credentials
export const describeDbError = (error) => ({
  reason: error.name,
  code: error.code,
  hint: DB_HINTS[error.code] || DB_HINTS[error.name],
});
