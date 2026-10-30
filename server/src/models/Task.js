import mongoose from 'mongoose';

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  done: { type: Boolean, default: false },
});

const taskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  subtasks: { type: [subtaskSchema], default: [], validate: [(a) => a.length <= 50, 'A task can have at most 50 subtasks'] },
  tags: { type: [String], default: [] },
  category: { type: String, trim: true, default: '' },
  startDate: Date,
  dueDate: { type: Date, required: true },
  estimatedMinutes: { type: Number, min: [1, 'Estimate must be at least 1 minute'] },
  completedAt: Date,
}, { timestamps: true });

taskSchema.pre('validate', function (next) {
  if (this.startDate && this.dueDate < this.startDate) this.invalidate('dueDate', 'Due date cannot be before the start date');
  next();
});

// Keep completedAt in sync with status
taskSchema.pre('save', function (next) {
  if (this.isModified('status')) this.completedAt = this.status === 'done' ? new Date() : undefined;
  next();
});

export default mongoose.model('Task', taskSchema);
