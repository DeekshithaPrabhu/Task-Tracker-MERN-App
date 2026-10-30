import { Router } from 'express';
import * as task from '../controllers/task.controller.js';
import * as subtask from '../controllers/subtask.controller.js';
import * as comment from '../controllers/comment.controller.js';

const r = Router();

// Fixed paths first, so '/stats' and '/bulk' are not read as an :id
r.get('/stats', task.getStats);
r.get('/tags', task.getTags);
r.patch('/bulk', task.bulkUpdate);
r.post('/bulk/delete', task.bulkDelete);

r.get('/', task.listTasks);
r.post('/', task.createTask);
r.get('/:id', task.getTask);
r.patch('/:id', task.updateTask);
r.patch('/:id/extend', task.extendTask);
r.delete('/:id', task.deleteTask);

r.post('/:id/subtasks', subtask.addSubtask);
r.patch('/:id/subtasks/:sid', subtask.updateSubtask);
r.delete('/:id/subtasks/:sid', subtask.deleteSubtask);

r.get('/:id/activity', comment.getActivity);
r.post('/:id/comments', comment.addComment);
r.delete('/:id/comments/:cid', comment.deleteComment);

export default r;
