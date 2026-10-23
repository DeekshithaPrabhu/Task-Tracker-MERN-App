import mongoose from 'mongoose';

// One timeline entry for a task: a comment, or a recorded change
const activitySchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  kind: { type: String, enum: ['created', 'change', 'subtask', 'comment'], required: true },
  field: String,                       // change: which field. subtask: added | completed | reopened | removed
  from: mongoose.Schema.Types.Mixed,
  to: mongoose.Schema.Types.Mixed,
  text: { type: String, maxlength: 1000 }, // comment body, or subtask title
}, { timestamps: { createdAt: true, updatedAt: false } });
activitySchema.index({ task: 1, createdAt: -1 });

export default mongoose.model('Activity', activitySchema);
