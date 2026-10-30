import Category from '../models/Category.js';
import Task from '../models/Task.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const nameOf = (b) => String(b.name || '').trim().slice(0, 30);

export const listCategories = asyncHandler(async (req, res) => {
  res.json(await Category.find({ user: req.userId }).collation({ locale: 'en' }).sort('name'));
});

export const createCategory = asyncHandler(async (req, res) => {
  const name = nameOf(req.body);
  if (!name) return res.status(400).json({ message: 'Category name is required' });
  res.status(201).json(await Category.create({ user: req.userId, name }));
});

// Renaming also updates the category on that user's tasks
export const renameCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findOne({ _id: req.params.id, user: req.userId });
  const name = nameOf(req.body);
  if (!cat) return res.status(404).json({ message: 'Category not found' });
  if (!name) return res.status(400).json({ message: 'Category name is required' });
  const old = cat.name;
  cat.name = name;
  await cat.save();
  if (old !== name) await Task.updateMany({ user: req.userId, category: old }, { category: name });
  res.json(cat);
});

// Deleting a category keeps its tasks, just uncategorised
export const deleteCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (cat) await Task.updateMany({ user: req.userId, category: cat.name }, { category: '' });
  res.status(204).end();
});
