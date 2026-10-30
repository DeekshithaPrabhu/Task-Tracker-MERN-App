import rateLimit from 'express-rate-limit';

const base = { windowMs: 15 * 60 * 1000, standardHeaders: true, legacyHeaders: false };

export const authLimiter = rateLimit({ ...base, limit: 30 });
// Wrong-password attempts only; successful logins never count against the user
export const loginLimiter = rateLimit({ ...base, limit: 20, skipSuccessfulRequests: true });
