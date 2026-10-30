import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import Category from '../models/Category.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { startSession, clearSession } from '../services/token.service.js';
import { sendResetEmail } from '../services/mail.service.js';

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const bad = (res, message, code = 400) => res.status(code).json({ message });
const pwOk = (p) => typeof p === 'string' && p.length >= 8 && p.length <= 72; // bcrypt ignores bytes past 72
const emailOk = (e) => /^\S+@\S+\.\S+$/.test(e || '');
const norm = (e) => String(e || '').trim().toLowerCase();
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, theme: u.theme });

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim()) return bad(res, 'Name is required');
  if (!emailOk(email)) return bad(res, 'Enter a valid email address');
  if (!pwOk(password)) return bad(res, 'Password must be 8 to 72 characters');
  if (await User.exists({ email: norm(email) })) return bad(res, 'That email is already registered', 409);

  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
  await Category.insertMany(['Work', 'Personal', 'Study'].map((n) => ({ user: user._id, name: n })));
  startSession(res, user);
  res.status(201).json(pub(user));
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: norm(req.body.email) }).select('+passwordHash');
  const ok = user && (await bcrypt.compare(String(req.body.password || ''), user.passwordHash));
  if (!ok) return bad(res, 'Invalid email or password', 401);
  startSession(res, user);
  res.json(pub(user));
});

export const logout = (_req, res) => {
  clearSession(res);
  res.status(204).end();
};

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return bad(res, 'Please log in', 401);
  res.json(pub(user));
});

// Always answers the same way so it can't be used to discover registered emails
export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: norm(req.body.email) });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = sha(token);
    user.resetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    await sendResetEmail(user.email, `${env.clientUrls[0]}/reset-password/${token}`);
  }
  res.json({ message: 'If that email is registered, a reset link is on its way. It expires in 1 hour.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!pwOk(password)) return bad(res, 'Password must be 8 to 72 characters');
  const user = await User.findOne({ resetTokenHash: sha(String(token || '')), resetExpires: { $gt: new Date() } });
  if (!user) return bad(res, 'This reset link is invalid or has expired');
  user.passwordHash = await bcrypt.hash(password, 12);
  user.resetTokenHash = user.resetExpires = undefined;
  await user.save();
  res.json({ message: 'Password updated. You can log in now.' });
});

export const updateProfile = asyncHandler(async (req, res) => {
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
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).select('+passwordHash');
  if (!(await bcrypt.compare(String(req.body.currentPassword || ''), user.passwordHash))) return bad(res, 'Current password is incorrect');
  if (!pwOk(req.body.newPassword)) return bad(res, 'New password must be 8 to 72 characters');
  user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  await user.save();
  res.json({ message: 'Password changed' });
});
