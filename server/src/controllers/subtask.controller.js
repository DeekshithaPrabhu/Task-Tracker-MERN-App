import { asyncHandler } from '../utils/asyncHandler.js';
import { record } from '../services/activity.service.js';
import { findOwnedTask } from '../services/task.service.js';

const subLog = (task, userId, field, text) => ({ task: task._id, user: userId, kind: 'subtask', field, text });

export const addSubtask = asyncHandler(async (req, res) => {
  const task = await findOwnedTask(req.userId, req.params.id);
  const title = String(req.body.title || '').trim();
  if (!task) return res.status(404).json({ message: 'Task not found' });
  if (!title) return res.status(400).json({ message: 'Subtask title is required' });
  task.subtasks.push({ title });
  await task.save();
  await record([subLog(task, req.userId, 'added', title.slice(0, 120))]);
  res.status(201).json(task);
});

export const updateSubtask = asyncHandler(async (req, res) => {
  const task = await findOwnedTask(req.userId, req.params.id);
  const sub = task?.subtasks.id(req.params.sid);
  if (!sub) return res.status(404).json({ message: 'Subtask not found' });
  const entries = [];
  if (typeof req.body.done === 'boolean' && req.body.done !== sub.done) {
    sub.done = req.body.done;
    entries.push(subLog(task, req.userId, sub.done ? 'completed' : 'reopened', sub.title));
  }
  if (typeof req.body.title === 'string' && req.body.title.trim()) sub.title = req.body.title;
  await task.save();
  await record(entries);
  res.json(task);
});

export const deleteSubtask = asyncHandler(async (req, res) => {
  const task = await findOwnedTask(req.userId, req.params.id);
  const sub = task?.subtasks.id(req.params.sid);
  if (!sub) return res.status(404).json({ message: 'Subtask not found' });
  const title = sub.title;
  task.subtasks.pull(sub._id);
  await task.save();
  await record([subLog(task, req.userId, 'removed', title)]);
  res.json(task);
});
