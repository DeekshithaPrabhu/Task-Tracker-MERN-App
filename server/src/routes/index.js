import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import authRoutes from './auth.routes.js';
import taskRoutes from './task.routes.js';
import categoryRoutes from './category.routes.js';

const r = Router();

r.use('/auth', authRoutes); // public (each route protects itself where needed)
r.use('/tasks', requireAuth, taskRoutes);
r.use('/categories', requireAuth, categoryRoutes);

export default r;
