import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaskSeries', default: null },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  dueDate: { type: String, required: true }, // Format: YYYY-MM-DD
  priority: { type: String, enum: ['high', 'normal', 'low'], default: 'normal' },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  originalDate: { type: String, required: true }, // Format: YYYY-MM-DD
  rolloverCount: { type: Number, default: 0 },
  plannedMinutes: { type: Number, default: 0 }
}, { timestamps: true });

// Create index on userId and dueDate for fast daily/monthly lookups
taskSchema.index({ userId: 1, dueDate: 1 });

export const Task = mongoose.model('Task', taskSchema);
