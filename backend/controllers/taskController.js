import { Task } from '../models/Task.js';
import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  priority: z.enum(['high', 'normal', 'low']).optional(),
  plannedMinutes: z.number().nonnegative().optional()
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  priority: z.enum(['high', 'normal', 'low']).optional(),
  completed: z.boolean().optional(),
  plannedMinutes: z.number().nonnegative().optional(),
  rolloverCount: z.number().nonnegative().optional()
});

export const getTasks = async (req, res) => {
  try {
    const todayStr = dayjs().tz(req.user.timezone || 'UTC').format('YYYY-MM-DD');
    
    // Always do a dynamic sweep of any past incomplete tasks before returning results
    const overdueTasks = await Task.find({
      userId: req.user._id,
      completed: false,
      dueDate: { $lt: todayStr }
    });
    
    if (overdueTasks.length > 0) {
      for (const task of overdueTasks) {
        task.dueDate = todayStr;
        task.rolloverCount += 1;
        await task.save();
      }
    }

    const { date, month, start, end } = req.query;
    let query = { userId: req.user._id };

    if (date) {
      query.dueDate = date;
    } else if (month) {
      // month format YYYY-MM
      query.dueDate = { $regex: `^${month}` };
    } else if (start && end) {
      query.dueDate = { $gte: start, $lte: end };
    }

    const tasks = await Task.find(query).sort({ createdAt: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getYearTasks = async (req, res) => {
  try {
    const { year } = req.params;
    const query = {
      userId: req.user._id,
      dueDate: { $regex: `^${year}` }
    };

    const tasks = await Task.find(query, 'dueDate completed');
    
    // Aggregate completion rate by day
    const stats = {};
    tasks.forEach(t => {
      if (!stats[t.dueDate]) {
        stats[t.dueDate] = { total: 0, completed: 0 };
      }
      stats[t.dueDate].total += 1;
      if (t.completed) {
        stats[t.dueDate].completed += 1;
      }
    });

    const result = Object.keys(stats).map(date => {
      const rate = stats[date].total > 0 ? (stats[date].completed / stats[date].total) : 0;
      return {
        date,
        total: stats[date].total,
        completed: stats[date].completed,
        rate
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createTask = async (req, res) => {
  try {
    const validatedData = createTaskSchema.parse(req.body);
    
    const task = await Task.create({
      ...validatedData,
      userId: req.user._id,
      originalDate: validatedData.dueDate
    });

    res.status(201).json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateTaskSchema.parse(req.body);

    const task = await Task.findOne({ _id: id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (validatedData.completed !== undefined) {
      if (validatedData.completed && !task.completed) {
        task.completedAt = new Date();
      } else if (!validatedData.completed && task.completed) {
        task.completedAt = null;
      }
      task.completed = validatedData.completed;
    }

    if (validatedData.title) task.title = validatedData.title;
    if (validatedData.description !== undefined) task.description = validatedData.description;
    if (validatedData.dueDate) task.dueDate = validatedData.dueDate;
    if (validatedData.priority) task.priority = validatedData.priority;
    if (validatedData.plannedMinutes !== undefined) task.plannedMinutes = validatedData.plannedMinutes;
    if (validatedData.rolloverCount !== undefined) task.rolloverCount = validatedData.rolloverCount;

    await task.save();
    res.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const searchTasks = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query is required' });

    const tasks = await Task.find({
      userId: req.user._id,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    }).sort({ dueDate: -1 }).limit(50);

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const exportTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).sort({ dueDate: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
