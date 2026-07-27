import cron from 'node-cron';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

// Runs every hour on the hour to catch users as their local midnight passes
export const startRolloverCron = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('Running daily rollover cron job sweep');
    try {
      const users = await User.find({});
      for (const user of users) {
        const today = dayjs().tz(user.timezone).format('YYYY-MM-DD');
        
        const pastIncompleteTasks = await Task.find({
          userId: user._id,
          completed: false,
          dueDate: { $lt: today }
        });
        
        if (pastIncompleteTasks.length > 0) {
          for (const task of pastIncompleteTasks) {
            task.dueDate = today;
            task.rolloverCount += 1;
            await task.save();
          }
          console.log(`Cron: Rolled over ${pastIncompleteTasks.length} tasks for user ${user.email}`);
        }
      }
    } catch (error) {
      console.error('Error in rollover cron job', error);
    }
  });
};
