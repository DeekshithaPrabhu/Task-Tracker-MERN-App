import Task from '../models/Task.js';
import Activity from '../models/Activity.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const ownsTask = (req) => Task.exists({ _id: req.params.id, user: req.userId });

export const getActivity = asyncHandler(async (req, res) => {
  if (!(await ownsTask(req))) return res.status(404).json({ message: 'Task not found' });
  res.json(await Activity.find({ task: req.params.id }).sort('-createdAt').limit(200));
});

export const addComment = asyncHandler(async (req, res) => {
  const text = String(req.body.text || '').trim().slice(0, 1000);
  if (!(await ownsTask(req))) return res.status(404).json({ message: 'Task not found' });
  if (!text) return res.status(400).json({ message: 'Comment cannot be empty' });
  res.status(201).json(await Activity.create({ task: req.params.id, user: req.userId, kind: 'comment', text }));
});

export const deleteComment = asyncHandler(async (req, res) => {
  await Activity.findOneAndDelete({ _id: req.params.cid, task: req.params.id, user: req.userId, kind: 'comment' });
  res.status(204).end();
});
