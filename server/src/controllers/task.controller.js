import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Activity from '../models/Activity.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { dayStart } from '../utils/dates.js';
import { applyChanges, record } from '../services/activity.service.js';
import { OPEN, buildTaskFilter, findOwnedTask, pickTaskFields } from '../services/task.service.js';

const RANK = { low: 0, medium: 1, high: 2, urgent: 3 };
const SORT_FIELD = { due: 'dueDate', created: 'createdAt', title: 'title' };

export const getStats = asyncHandler(async (req, res) => {
  const user = req.userId;
  const uid = new mongoose.Types.ObjectId(user);
  const start = dayStart(), end = dayStart(1), week = dayStart(8);

  const [total, completed, overdue, dueToday, upcoming, recent, byPriority, byStatus] = await Promise.all([
    Task.countDocuments({ user }),
    Task.countDocuments({ user, status: 'done' }),
    Task.countDocuments({ user, ...OPEN, dueDate: { $lt: start } }),
    Task.find({ user, ...OPEN, dueDate: { $gte: start, $lt: end } }).sort('dueDate'),
    Task.find({ user, ...OPEN, dueDate: { $gte: end, $lt: week } }).sort('dueDate').limit(8),
    Task.find({ user }).sort('-createdAt').limit(5),
    Task.aggregate([{ $match: { user: uid } }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Task.aggregate([{ $match: { user: uid } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  const toMap = (rows) => Object.fromEntries(rows.map((x) => [x._id, x.count]));

  res.json({
    total, completed, pending: total - completed, overdue,
    completion: total ? Math.round((completed / total) * 100) : 0,
    dueToday, upcoming, recent, byPriority: toMap(byPriority), byStatus: toMap(byStatus),
  });
});

export const getTags = asyncHandler(async (req, res) => {
  res.json((await Task.distinct('tags', { user: req.userId })).sort());
});

export const listTasks = asyncHandler(async (req, res) => {
  const { sort = 'due', order = 'asc' } = req.query;
  const filter = buildTaskFilter(req.query, req.userId);

  const dir = order === 'desc' ? -1 : 1;
  const field = SORT_FIELD[sort] || 'dueDate';
  const find = () => Task.find(filter).collation({ locale: 'en' });
  const byPriority = (list) => list.sort((a, b) => (RANK[a.priority] - RANK[b.priority]) * dir);
  const page = parseInt(req.query.page, 10);

  // No page given: return everything as an array (the board needs all tasks)
  if (!(page > 0)) {
    return res.json(sort === 'priority' ? byPriority(await find().sort('dueDate')) : await find().sort({ [field]: dir }));
  }

  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const total = await Task.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / limit));
  const current = Math.min(page, pages); // e.g. the last page emptied by a delete
  const skip = (current - 1) * limit;
  const tasks = sort === 'priority'
    ? byPriority(await find().sort('dueDate _id')).slice(skip, skip + limit)
    : await find().sort({ [field]: dir, _id: 1 }).skip(skip).limit(limit); // _id keeps page order stable
  res.json({ tasks, total, page: current, pages, limit });
});

export const createTask = asyncHandler(async (req, res) => {
  const task = await Task.create({ ...pickTaskFields(req.body), user: req.userId });
  await record([{ task: task._id, user: req.userId, kind: 'created' }]);
  res.status(201).json(task);
});

// ---- Bulk actions ----
const BULK_FIELDS = ['status', 'priority', 'category', 'dueDate'];
const idsOf = (b) => (Array.isArray(b.ids) ? b.ids : []).slice(0, 200);

export const bulkUpdate = asyncHandler(async (req, res) => {
  const changes = {};
  for (const k of BULK_FIELDS) if (k in (req.body.update || {})) changes[k] = req.body.update[k];
  if (!Object.keys(changes).length) return res.status(400).json({ message: 'Nothing to update' });

  const tasks = await Task.find({ _id: { $in: idsOf(req.body) }, user: req.userId });
  const entries = tasks.flatMap((t) => applyChanges(t, changes, req.userId));
  await Promise.all(tasks.map((t) => t.validate())); // all or nothing: fail before saving anything
  await Promise.all(tasks.map((t) => t.save()));
  await record(entries);
  res.json({ updated: tasks.length });
});

export const bulkDelete = asyncHandler(async (req, res) => {
  const found = await Task.find({ _id: { $in: idsOf(req.body) }, user: req.userId }).select('_id');
  const ids = found.map((t) => t._id);
  await Task.deleteMany({ _id: { $in: ids } });
  await Activity.deleteMany({ task: { $in: ids } });
  res.json({ deleted: ids.length });
});

// ---- Single task ----
export const getTask = asyncHandler(async (req, res) => {
  const task = await findOwnedTask(req.userId, req.params.id);
  task ? res.json(task) : res.status(404).json({ message: 'Task not found' });
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await findOwnedTask(req.userId, req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  const entries = applyChanges(task, pickTaskFields(req.body), req.userId);
  await task.save();
  await record(entries);
  res.json(task);
});

export const extendTask = asyncHandler(async (req, res) => {
  const days = Number(req.body.days);
  if (!Number.isFinite(days) || days < 1) return res.status(400).json({ message: 'days must be 1 or more' });
  const task = await findOwnedTask(req.userId, req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  const due = new Date(Math.max(task.dueDate.getTime(), Date.now()) + days * 86400000);
  const entries = applyChanges(task, { dueDate: due }, req.userId);
  await task.save();
  await record(entries);
  res.json(task);
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (task) await Activity.deleteMany({ task: task._id });
  res.status(204).end();
});
