import { Router } from 'express';
import * as task from '../controllers/task.controller.js';

const r = Router();

// Fixed paths first, so '/stats' is not read as an :id
r.get('/stats', task.getStats);

r.get('/', task.listTasks);
r.post('/', task.createTask);
r.patch('/:id', task.updateTask);
r.patch('/:id/extend', task.extendTask);
r.delete('/:id', task.deleteTask);

export default r;
