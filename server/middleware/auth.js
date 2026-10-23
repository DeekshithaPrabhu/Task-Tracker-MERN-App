import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  try {
    req.userId = jwt.verify(req.cookies.token, process.env.JWT_SECRET).sub;
    next();
  } catch (e) {
    res.clearCookie('token');
    res.status(401).json({ message: e.name === 'TokenExpiredError' ? 'Your session has expired. Please log in again.' : 'Please log in' });
  }
};
