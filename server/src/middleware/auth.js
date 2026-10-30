import { verifyToken } from '../services/token.service.js';

export const requireAuth = (req, res, next) => {
  try {
    req.userId = verifyToken(req.cookies.token);
    next();
  } catch {
    res.status(401).json({ message: 'Please log in' });
  }
};
