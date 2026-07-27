import { TaskSeries } from '../models/TaskSeries.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const createSeriesSchema = z.object({
  title: z.string().min(1),
  priority: z.enum(['high', 'normal', 'low']).optional(),
  plannedMinutes: z.number().nonnegative().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const createSeries = async (req, res) => {
  try {
    const validatedData = createSeriesSchema.parse(req.body);
    const { startDate, endDate, title, priority, plannedMinutes } = validatedData;
    
    // Validate endDate is not before startDate
    if (dayjs(endDate).isBefore(dayjs(startDate))) {
      return res.status(400).json({ error: 'End date cannot be before start date.' });
    }

    // Get user timezone
    const user = await User.findById(req.user._id);
    const userTz = user.timezone || 'UTC';

    // Parse dates into user timezone to handle correct day boundaries
    const start = dayjs.tz(startDate, userTz).startOf('day');
    let end = dayjs.tz(endDate, userTz).startOf('day');

    // Cap generation to 120 days
    const maxEnd = start.add(120, 'day');
    if (end.isAfter(maxEnd)) {
      end = maxEnd;
    }

    const series = await TaskSeries.create({
      userId: req.user._id,
      title,
      priority,
      plannedMinutes,
      startDate,
      endDate
    });

    const tasksToInsert = [];
    let current = start;

    while (current.isBefore(end) || current.isSame(end, 'day')) {
      const dateStr = current.format('YYYY-MM-DD');
      tasksToInsert.push({
        userId: req.user._id,
        seriesId: series._id,
        title,
        priority,
        plannedMinutes,
        dueDate: dateStr,
        originalDate: dateStr,
        completed: false
      });
      current = current.add(1, 'day');
    }

    if (tasksToInsert.length > 0) {
      await Task.insertMany(tasksToInsert);
    }

    res.status(201).json(series);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

export const getSeries = async (req, res) => {
  try {
    const series = await TaskSeries.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(series);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteSeries = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find and delete the series
    const series = await TaskSeries.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!series) {
      return res.status(404).json({ error: 'Series not found' });
    }

    // Delete FUTURE INCOMPLETE instances
    const user = await User.findById(req.user._id);
    const today = dayjs().tz(user.timezone || 'UTC').format('YYYY-MM-DD');
    
    await Task.deleteMany({
      seriesId: id,
      userId: req.user._id,
      completed: false,
      dueDate: { $gte: today } // greater than or equal to today means today and future
    });

    res.json({ message: 'Series deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
