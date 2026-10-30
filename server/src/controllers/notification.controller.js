import Task from '../models/Task.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { dayStart } from '../utils/dates.js';
import { OPEN } from '../services/task.service.js';

// Reminders are computed from open tasks: overdue, due today, and due in the next two days
export const getNotifications = asyncHandler(async (req, res) => {
  const user = req.userId;
  const start = dayStart(), tomorrow = dayStart(1), end = dayStart(3);
  const find = (due) => Task.find({ user, ...OPEN, dueDate: due }).sort('dueDate').limit(20).select('title priority dueDate');
  const [overdue, today, soon] = await Promise.all([
    find({ $lt: start }), find({ $gte: start, $lt: tomorrow }), find({ $gte: tomorrow, $lt: end }),
  ]);
  res.json({ overdue, today, soon, count: overdue.length + today.length + soon.length });
});
