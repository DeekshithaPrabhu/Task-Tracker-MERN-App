import 'dotenv/config';

const required = (name) => {
  if (!process.env[name]) throw new Error(`${name} is required (see server/.env.example)`);
  return process.env[name];
};

// CLIENT_URL may list several frontends, comma separated
const clientUrls = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

export const env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: required('MONGO_URI'),
  clientUrls: clientUrls.length ? clientUrls : ['http://localhost:5173'],
};
