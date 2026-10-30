import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter, loginLimiter } from '../middleware/rateLimit.js';

const r = Router();

r.post('/register', authLimiter, auth.register);
r.post('/login', loginLimiter, auth.login);
r.post('/logout', auth.logout);
r.get('/me', requireAuth, auth.me);
r.post('/forgot-password', authLimiter, auth.forgotPassword);
r.post('/reset-password', authLimiter, auth.resetPassword);
r.patch('/profile', requireAuth, auth.updateProfile);
r.patch('/password', requireAuth, authLimiter, auth.changePassword);

export default r;
