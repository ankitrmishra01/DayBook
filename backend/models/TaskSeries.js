import mongoose from 'mongoose';

const taskSeriesSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  priority: { type: String, enum: ['high', 'normal', 'low'], default: 'normal' },
  plannedMinutes: { type: Number, default: 0 },
  startDate: { type: String, required: true }, // Format: YYYY-MM-DD
  endDate: { type: String, required: true }    // Format: YYYY-MM-DD
}, { timestamps: true });

export const TaskSeries = mongoose.model('TaskSeries', taskSeriesSchema);
