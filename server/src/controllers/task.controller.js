import Task from '../models/Task.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { dayStart } from '../utils/dates.js';
import { OPEN, buildTaskFilter, pickTaskFields } from '../services/task.service.js';

const RANK = { low: 0, medium: 1, high: 2, urgent: 3 };
const SORT_FIELD = { due: 'dueDate', created: 'createdAt', title: 'title' };

export const getStats = asyncHandler(async (_req, res) => {
  const start = dayStart(), end = dayStart(1), week = dayStart(8);

  const [total, completed, overdue, dueToday, upcoming, recent, byPriority, byStatus] = await Promise.all([
    Task.countDocuments(),
    Task.countDocuments({ status: 'done' }),
    Task.countDocuments({ ...OPEN, dueDate: { $lt: start } }),
    Task.find({ ...OPEN, dueDate: { $gte: start, $lt: end } }).sort('dueDate'),
    Task.find({ ...OPEN, dueDate: { $gte: end, $lt: week } }).sort('dueDate').limit(8),
    Task.find().sort('-createdAt').limit(5),
    Task.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  const toMap = (rows) => Object.fromEntries(rows.map((x) => [x._id, x.count]));

  res.json({
    total, completed, pending: total - completed, overdue,
    completion: total ? Math.round((completed / total) * 100) : 0,
    dueToday, upcoming, recent, byPriority: toMap(byPriority), byStatus: toMap(byStatus),
  });
});

export const getCategories = asyncHandler(async (_req, res) => {
  res.json((await Task.distinct('category')).filter(Boolean).sort((a, b) => a.localeCompare(b)));
});

export const listTasks = asyncHandler(async (req, res) => {
  const { sort = 'due', order = 'asc' } = req.query;
  const filter = buildTaskFilter(req.query);

  const dir = order === 'desc' ? -1 : 1;
  const field = SORT_FIELD[sort] || 'dueDate';
  const find = () => Task.find(filter).collation({ locale: 'en' });
  const byPriority = (list) => list.sort((a, b) => (RANK[a.priority] - RANK[b.priority]) * dir);
  res.json(sort === 'priority' ? byPriority(await find().sort('dueDate')) : await find().sort({ [field]: dir }));
});

export const createTask = asyncHandler(async (req, res) => {
  res.status(201).json(await Task.create(pickTaskFields(req.body)));
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  Object.assign(task, pickTaskFields(req.body));
  res.json(await task.save());
});

export const extendTask = asyncHandler(async (req, res) => {
  const days = Number(req.body.days);
  if (!Number.isFinite(days) || days < 1) return res.status(400).json({ message: 'days must be 1 or more' });
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  task.dueDate = new Date(Math.max(task.dueDate.getTime(), Date.now()) + days * 86400000);
  res.json(await task.save());
});

export const deleteTask = asyncHandler(async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.status(204).end();
});
