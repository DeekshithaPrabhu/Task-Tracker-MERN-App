import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  dueDate: { type: Date, required: true },
  completedAt: Date,
}, { timestamps: true });

// Keep completedAt in sync with status
taskSchema.pre('save', function (next) {
  if (this.isModified('status')) this.completedAt = this.status === 'done' ? new Date() : undefined;
  next();
});

export default mongoose.model('Task', taskSchema);
