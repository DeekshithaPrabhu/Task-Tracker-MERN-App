import { Router } from 'express';
import taskRoutes from './task.routes.js';

const r = Router();

r.use('/tasks', taskRoutes);

export default r;
