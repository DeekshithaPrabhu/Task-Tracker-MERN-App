import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import Category from '../models/Category.js';
import { requireAuth } from '../middleware/auth.js';
import { sendResetEmail } from '../mailer.js';

const r = Router();
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const bad = (res, message, code = 400) => res.status(code).json({ message });
const pwOk = (p) => typeof p === 'string' && p.length >= 8 && p.length <= 72; // bcrypt ignores bytes past 72
const emailOk = (e) => /^\S+@\S+\.\S+$/.test(e || '');
const norm = (e) => String(e || '').trim().toLowerCase();
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, theme: u.theme });

const startSession = (res, user) => {
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 864e5 });
};

r.post('/register', limiter, wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim()) return bad(res, 'Name is required');
  if (!emailOk(email)) return bad(res, 'Enter a valid email address');
  if (!pwOk(password)) return bad(res, 'Password must be 8 to 72 characters');
  if (await User.exists({ email: norm(email) })) return bad(res, 'That email is already registered', 409);

  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
  await Category.insertMany(['Work', 'Personal', 'Study'].map((n) => ({ user: user._id, name: n })));
  startSession(res, user);
  res.status(201).json(pub(user));
}));

r.post('/login', limiter, wrap(async (req, res) => {
  const user = await User.findOne({ email: norm(req.body.email) }).select('+passwordHash');
  const ok = user && (await bcrypt.compare(String(req.body.password || ''), user.passwordHash));
  if (!ok) return bad(res, 'Invalid email or password', 401);
  startSession(res, user);
  res.json(pub(user));
}));

r.post('/logout', (_req, res) => { res.clearCookie('token'); res.status(204).end(); });

r.get('/me', requireAuth, wrap(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return bad(res, 'Please log in', 401);
  res.json(pub(user));
}));

// Always answers the same way so it can't be used to discover registered emails
r.post('/forgot-password', limiter, wrap(async (req, res) => {
  const user = await User.findOne({ email: norm(req.body.email) });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = sha(token);
    user.resetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    await sendResetEmail(user.email, `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${token}`);
  }
  res.json({ message: 'If that email is registered, a reset link is on its way. It expires in 1 hour.' });
}));

r.post('/reset-password', limiter, wrap(async (req, res) => {
  const { token, password } = req.body;
  if (!pwOk(password)) return bad(res, 'Password must be 8 to 72 characters');
  const user = await User.findOne({ resetTokenHash: sha(String(token || '')), resetExpires: { $gt: new Date() } });
  if (!user) return bad(res, 'This reset link is invalid or has expired');
  user.passwordHash = await bcrypt.hash(password, 12);
  user.resetTokenHash = user.resetExpires = undefined;
  await user.save();
  res.json({ message: 'Password updated. You can log in now.' });
}));

r.patch('/profile', requireAuth, wrap(async (req, res) => {
  const user = await User.findById(req.userId);
  const { name, email, theme } = req.body;
  if (name !== undefined) { if (!name.trim()) return bad(res, 'Name is required'); user.name = name; }
  if (theme !== undefined) user.theme = theme;
  if (email !== undefined && norm(email) !== user.email) {
    if (!emailOk(email)) return bad(res, 'Enter a valid email address');
    if (await User.exists({ email: norm(email) })) return bad(res, 'That email is already in use', 409);
    user.email = email;
  }
  await user.save();
  res.json(pub(user));
}));

r.patch('/password', requireAuth, limiter, wrap(async (req, res) => {
  const user = await User.findById(req.userId).select('+passwordHash');
  if (!(await bcrypt.compare(String(req.body.currentPassword || ''), user.passwordHash))) return bad(res, 'Current password is incorrect');
  if (!pwOk(req.body.newPassword)) return bad(res, 'New password must be 8 to 72 characters');
  user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  await user.save();
  res.json({ message: 'Password changed' });
}));

export default r;
