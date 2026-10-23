import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  try {
    req.userId = jwt.verify(req.cookies.token, process.env.JWT_SECRET).sub;
    next();
  } catch {
    res.status(401).json({ message: 'Please log in' });
  }
};
