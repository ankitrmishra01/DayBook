import { User } from '../models/User.js';
import { z } from 'zod';

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      dailyCapacityMinutes: user.dailyCapacityMinutes,
      dailyDigestEnabled: user.dailyDigestEnabled,
      themePreference: user.themePreference
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateUserSchema = z.object({
  timezone: z.string().optional(),
  dailyCapacityMinutes: z.string().optional(),
  dailyDigestEnabled: z.boolean().optional(),
  themePreference: z.enum(['dark', 'light']).optional()
});

export const updateMe = async (req, res) => {
  try {
    const validatedData = updateUserSchema.parse(req.body);
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (validatedData.timezone !== undefined) user.timezone = validatedData.timezone;
    if (validatedData.dailyCapacityMinutes !== undefined) user.dailyCapacityMinutes = validatedData.dailyCapacityMinutes;
    if (validatedData.dailyDigestEnabled !== undefined) user.dailyDigestEnabled = validatedData.dailyDigestEnabled;
    if (validatedData.themePreference !== undefined) user.themePreference = validatedData.themePreference;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      dailyCapacityMinutes: user.dailyCapacityMinutes,
      dailyDigestEnabled: user.dailyDigestEnabled,
      themePreference: user.themePreference
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
};
