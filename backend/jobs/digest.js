import cron from 'node-cron';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { sendEmail } from '../utils/sendEmail.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const formatHours = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

// Run at the top of every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running morning digest cron job...');
  try {
    // Find all verified users who have opted into the digest
    const users = await User.find({ verified: true, dailyDigestEnabled: true });
    
    for (const user of users) {
      const userTime = dayjs().tz(user.timezone || 'UTC');
      
      // Send at 7:00 AM local time
      if (userTime.hour() === 7) {
        const dateStr = userTime.format('YYYY-MM-DD');
        const tasks = await Task.find({
          userId: user._id,
          completed: false,
          dueDate: dateStr
        });

        if (tasks.length === 0) continue; // Don't send empty digest

        const totalPlanned = tasks.reduce((sum, t) => {
          const mins = (t.plannedMinutes === undefined || t.plannedMinutes === 0) ? 15 : t.plannedMinutes;
          return sum + mins;
        }, 0);

        const rolledOverCount = tasks.filter(t => t.rolloverCount > 0).length;

        const capacity = user.dailyCapacityMinutes ? parseInt(user.dailyCapacityMinutes, 10) : 480;
        const capacityPct = Math.min(100, Math.max(0, (totalPlanned / capacity) * 100));

        let rolloverText = '';
        if (rolledOverCount > 0) {
          rolloverText = `<p style="color: #98999E; font-size: 14px; margin-top: 24px;">${rolledOverCount} task${rolledOverCount === 1 ? '' : 's'} carried over from yesterday</p>`;
        }

        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; background-color: #0D0E12; padding: 32px; border-radius: 22px;">
            <div style="color: #98999E; text-transform: uppercase; font-size: 12px; font-weight: bold; margin-bottom: 8px; letter-spacing: 1px;">
              ${userTime.format('dddd')}
            </div>
            <h2 style="color: #F8F9FA; font-size: 32px; margin: 0 0 32px 0; letter-spacing: -1px;">
              ${userTime.format('D MMMM')}
            </h2>
            
            <div style="background-color: #17181C; padding: 24px; border-radius: 14px; margin-bottom: 16px;">
              <span style="color: #98999E; font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">Tasks today</span>
              <span style="color: #F8F9FA; font-size: 24px; font-weight: bold;">${tasks.length}</span>
            </div>
            
            <div style="background-color: #17181C; padding: 24px; border-radius: 14px;">
              <span style="color: #98999E; font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">Planned</span>
              <span style="color: #F8F9FA; font-size: 24px; font-weight: bold;">${formatHours(totalPlanned)} <span style="font-size: 14px; color: #98999E;">(${Math.round(capacityPct)}% of capacity)</span></span>
            </div>
            
            ${rolloverText}
          </div>
        `;

        await sendEmail({
          to: user.email,
          subject: `Your day — ${userTime.format('MMM D')}`,
          html
        });
        
        console.log(`Sent morning digest to ${user.email}`);
      }
    }
  } catch (error) {
    console.error('Error in morning digest cron:', error);
  }
});
