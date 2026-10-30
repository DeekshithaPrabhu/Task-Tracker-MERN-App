import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Deployed: frontend and API are on different domains, so the cookie must be SameSite=None (and Secure)
const cookieOptions = { httpOnly: true, sameSite: env.isProd ? 'none' : 'lax', secure: env.isProd };

export const startSession = (res, user) => {
  const token = jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: '7d' });
  res.cookie('token', token, { ...cookieOptions, maxAge: 7 * 864e5 });
};

// Must use the same attributes the cookie was set with
export const clearSession = (res) => res.clearCookie('token', cookieOptions);

export const verifyToken = (token) => jwt.verify(token, env.jwtSecret).sub;
