import { Router } from 'express';
import Task from '../models/Task.js';
import { dayStart } from '../dates.js';

const r = Router();

// Reminders are computed from open tasks: overdue, due today, and due in the next two days
r.get('/', async (req, res, next) => {
  try {
    const user = req.userId, open = { status: { $ne: 'done' } };
    const start = dayStart(), tomorrow = dayStart(1), end = dayStart(3);
    const find = (due) => Task.find({ user, ...open, dueDate: due }).sort('dueDate').limit(20).select('title priority dueDate');
    const [overdue, today, soon] = await Promise.all([
      find({ $lt: start }), find({ $gte: start, $lt: tomorrow }), find({ $gte: tomorrow, $lt: end }),
    ]);
    res.json({ overdue, today, soon, count: overdue.length + today.length + soon.length });
  } catch (e) { next(e); }
});

export default r;
