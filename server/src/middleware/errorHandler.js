export const errorHandler = (err, _req, res, _next) => {
  if (err.code === 11000) return res.status(409).json({ message: 'That already exists' });
  if (err.name === 'CastError') return res.status(404).json({ message: 'Not found' });

  const status = err.name === 'ValidationError' ? 400 : 500;
  if (status === 500) console.error(err);

  res.status(status).json({ message: status === 500 ? 'Something went wrong' : err.message });
};
