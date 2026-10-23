import { Router } from "express";
import mongoose from "mongoose";
import Task from "../models/Task.js";
import Activity from "../models/Activity.js";
import { applyChanges, record } from "../activity.js";
import { dayStart } from "../dates.js";

const r = Router();
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);
const esc = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const RANK = { low: 0, medium: 1, high: 2, urgent: 3 };
const SORT_FIELD = { due: "dueDate", created: "createdAt", title: "title" };
const open = { status: { $ne: "done" } };

const QUICK = {
  myday: () => [open, { dueDate: { $gte: dayStart(), $lt: dayStart(1) } }],
  upcoming: () => [open, { dueDate: { $gte: dayStart(1) } }],
  overdue: () => [open, { dueDate: { $lt: dayStart() } }],
  completed: () => [{ status: "done" }],
};

// Only these fields can be set from a request (never user or completedAt)
const FIELDS = [
  "title",
  "description",
  "category",
  "tags",
  "priority",
  "status",
  "startDate",
  "dueDate",
  "estimatedMinutes",
];
const cleanTags = (t) =>
  [
    ...new Set(
      (Array.isArray(t) ? t : [])
        .map((x) =>
          String(x).trim().toLowerCase().replace(/^#/, "").slice(0, 24),
        )
        .filter(Boolean),
    ),
  ].slice(0, 10);
const pick = (body) => {
  const out = {};
  for (const k of FIELDS) if (k in body) out[k] = body[k];
  if ("tags" in out) out.tags = cleanTags(out.tags);
  return out;
};
const mine = (req, id) => Task.findOne({ _id: id, user: req.userId });

r.get(
  "/stats",
  wrap(async (req, res) => {
    const user = req.userId;
    const uid = new mongoose.Types.ObjectId(user);
    const start = dayStart(),
      end = dayStart(1),
      week = dayStart(8);

    const [
      total,
      completed,
      overdue,
      dueToday,
      upcoming,
      recent,
      byPriority,
      byStatus,
    ] = await Promise.all([
      Task.countDocuments({ user }),
      Task.countDocuments({ user, status: "done" }),
      Task.countDocuments({ user, ...open, dueDate: { $lt: start } }),
      Task.find({ user, ...open, dueDate: { $gte: start, $lt: end } }).sort(
        "dueDate",
      ),
      Task.find({ user, ...open, dueDate: { $gte: end, $lt: week } })
        .sort("dueDate")
        .limit(8),
      Task.find({ user }).sort("-createdAt").limit(5),
      Task.aggregate([
        { $match: { user: uid } },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { user: uid } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);
    const toMap = (rows) =>
      Object.fromEntries(rows.map((x) => [x._id, x.count]));

    res.json({
      total,
      completed,
      pending: total - completed,
      overdue,
      completion: total ? Math.round((completed / total) * 100) : 0,
      dueToday,
      upcoming,
      recent,
      byPriority: toMap(byPriority),
      byStatus: toMap(byStatus),
    });
  }),
);

r.get(
  "/tags",
  wrap(async (req, res) =>
    res.json((await Task.distinct("tags", { user: req.userId })).sort()),
  ),
);

r.get(
  "/",
  wrap(async (req, res) => {
    const {
      q,
      status,
      priority,
      category,
      tag,
      dueFrom,
      dueTo,
      quick = "all",
      sort = "due",
      order = "asc",
    } = req.query;
    const filter = { user: req.userId };
    const and = [...(QUICK[quick]?.() || [])];

    if (q) {
      const re = { $regex: esc(q), $options: "i" };
      filter.$or = [{ title: re }, { description: re }];
    }
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (dueFrom)
      and.push({ dueDate: { $gte: new Date(`${dueFrom}T00:00:00`) } });
    if (dueTo)
      and.push({ dueDate: { $lte: new Date(`${dueTo}T23:59:59.999`) } });
    if (and.length) filter.$and = and;

    const dir = order === "desc" ? -1 : 1;
    const field = SORT_FIELD[sort] || "dueDate";
    const find = () => Task.find(filter).collation({ locale: "en" });
    const byPriority = (list) =>
      list.sort((a, b) => (RANK[a.priority] - RANK[b.priority]) * dir);
    const page = parseInt(req.query.page, 10);

    // No page given: return everything as an array (the board needs all tasks)
    if (!(page > 0)) {
      return res.json(
        sort === "priority"
          ? byPriority(await find().sort("dueDate"))
          : await find().sort({ [field]: dir }),
      );
    }

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      100,
    );
    const total = await Task.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / limit));
    const current = Math.min(page, pages); // e.g. the last page emptied by a delete
    const skip = (current - 1) * limit;
    const tasks =
      sort === "priority"
        ? byPriority(await find().sort("dueDate _id")).slice(skip, skip + limit)
        : await find()
            .sort({ [field]: dir, _id: 1 })
            .skip(skip)
            .limit(limit); // _id keeps page order stable
    res.json({ tasks, total, page: current, pages, limit });
  }),
);

r.post(
  "/",
  wrap(async (req, res) => {
    const task = await Task.create({ ...pick(req.body), user: req.userId });
    await record([{ task: task._id, user: req.userId, kind: "created" }]);
    res.status(201).json(task);
  }),
);

// ---- Bulk actions (must stay above the /:id routes) ----
const BULK_FIELDS = ["status", "priority", "category", "dueDate"];
const idsOf = (b) => (Array.isArray(b.ids) ? b.ids : []).slice(0, 200);

r.patch(
  "/bulk",
  wrap(async (req, res) => {
    const changes = {};
    for (const k of BULK_FIELDS)
      if (k in (req.body.update || {})) changes[k] = req.body.update[k];
    if (!Object.keys(changes).length)
      return res.status(400).json({ message: "Nothing to update" });

    const tasks = await Task.find({
      _id: { $in: idsOf(req.body) },
      user: req.userId,
    });
    const entries = tasks.flatMap((t) => applyChanges(t, changes, req.userId));
    await Promise.all(tasks.map((t) => t.validate())); // all or nothing: fail before saving anything
    await Promise.all(tasks.map((t) => t.save()));
    await record(entries);
    res.json({ updated: tasks.length });
  }),
);

r.post(
  "/bulk/delete",
  wrap(async (req, res) => {
    const found = await Task.find({
      _id: { $in: idsOf(req.body) },
      user: req.userId,
    }).select("_id");
    const ids = found.map((t) => t._id);
    await Task.deleteMany({ _id: { $in: ids } });
    await Activity.deleteMany({ task: { $in: ids } });
    res.json({ deleted: ids.length });
  }),
);

// ---- Single task ----
r.get(
  "/:id",
  wrap(async (req, res) => {
    const task = await mine(req, req.params.id);
    task ? res.json(task) : res.status(404).json({ message: "Task not found" });
  }),
);

r.patch(
  "/:id",
  wrap(async (req, res) => {
    const task = await mine(req, req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const entries = applyChanges(task, pick(req.body), req.userId);
    await task.save();
    await record(entries);
    res.json(task);
  }),
);

r.patch(
  "/:id/extend",
  wrap(async (req, res) => {
    const days = Number(req.body.days);
    if (!Number.isFinite(days) || days < 1)
      return res.status(400).json({ message: "days must be 1 or more" });
    const task = await mine(req, req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const due = new Date(
      Math.max(task.dueDate.getTime(), Date.now()) + days * 86400000,
    );
    const entries = applyChanges(task, { dueDate: due }, req.userId);
    await task.save();
    await record(entries);
    res.json(task);
  }),
);

r.delete(
  "/:id",
  wrap(async (req, res) => {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });
    if (task) await Activity.deleteMany({ task: task._id });
    res.status(204).end();
  }),
);

// ---- Subtasks ----
const subLog = (task, userId, field, text) => ({
  task: task._id,
  user: userId,
  kind: "subtask",
  field,
  text,
});

r.post(
  "/:id/subtasks",
  wrap(async (req, res) => {
    const task = await mine(req, req.params.id);
    const title = String(req.body.title || "").trim();
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!title)
      return res.status(400).json({ message: "Subtask title is required" });
    task.subtasks.push({ title });
    await task.save();
    await record([subLog(task, req.userId, "added", title.slice(0, 120))]);
    res.status(201).json(task);
  }),
);

r.patch(
  "/:id/subtasks/:sid",
  wrap(async (req, res) => {
    const task = await mine(req, req.params.id);
    const sub = task?.subtasks.id(req.params.sid);
    if (!sub) return res.status(404).json({ message: "Subtask not found" });
    const entries = [];
    if (typeof req.body.done === "boolean" && req.body.done !== sub.done) {
      sub.done = req.body.done;
      entries.push(
        subLog(
          task,
          req.userId,
          sub.done ? "completed" : "reopened",
          sub.title,
        ),
      );
    }
    if (typeof req.body.title === "string" && req.body.title.trim())
      sub.title = req.body.title;
    await task.save();
    await record(entries);
    res.json(task);
  }),
);

r.delete(
  "/:id/subtasks/:sid",
  wrap(async (req, res) => {
    const task = await mine(req, req.params.id);
    const sub = task?.subtasks.id(req.params.sid);
    if (!sub) return res.status(404).json({ message: "Subtask not found" });
    const title = sub.title;
    task.subtasks.pull(sub._id);
    await task.save();
    await record([subLog(task, req.userId, "removed", title)]);
    res.json(task);
  }),
);

// ---- Comments and activity ----
r.get(
  "/:id/activity",
  wrap(async (req, res) => {
    if (!(await Task.exists({ _id: req.params.id, user: req.userId })))
      return res.status(404).json({ message: "Task not found" });
    res.json(
      await Activity.find({ task: req.params.id })
        .sort("-createdAt")
        .limit(200),
    );
  }),
);

r.post(
  "/:id/comments",
  wrap(async (req, res) => {
    const text = String(req.body.text || "")
      .trim()
      .slice(0, 1000);
    if (!(await Task.exists({ _id: req.params.id, user: req.userId })))
      return res.status(404).json({ message: "Task not found" });
    if (!text)
      return res.status(400).json({ message: "Comment cannot be empty" });
    res
      .status(201)
      .json(
        await Activity.create({
          task: req.params.id,
          user: req.userId,
          kind: "comment",
          text,
        }),
      );
  }),
);

r.delete(
  "/:id/comments/:cid",
  wrap(async (req, res) => {
    await Activity.findOneAndDelete({
      _id: req.params.cid,
      task: req.params.id,
      user: req.userId,
      kind: "comment",
    });
    res.status(204).end();
  }),
);

export default r;
