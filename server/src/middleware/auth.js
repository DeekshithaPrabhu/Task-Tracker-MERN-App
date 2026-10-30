import { verifyToken, clearSession } from '../services/token.service.js';

export const requireAuth = (req, res, next) => {
  try {
    req.userId = verifyToken(req.cookies.token);
    next();
  } catch (e) {
    clearSession(res);
    res.status(401).json({ message: e.name === 'TokenExpiredError' ? 'Your session has expired. Please log in again.' : 'Please log in' });
  }
};
