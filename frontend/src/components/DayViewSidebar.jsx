import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import api from '../utils/api';

const DayViewSidebar = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = dayjs();
  const startOfWeek = today.subtract(6, 'day'); // 7 days including today

  useEffect(() => {
    const fetchWeekTasks = async () => {
      try {
        const res = await api.get('/tasks', {
          params: {
            start: startOfWeek.format('YYYY-MM-DD'),
            end: today.format('YYYY-MM-DD')
          }
        });
        setTasks(res.data);
      } catch (err) {
        console.error('Failed to fetch week tasks', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeekTasks();
  }, []);

  // Compute "This Week" (or rather, "Last 7 Days") totals
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const progressPct = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Compute 7-day activity strip
  // Array of 7 days:
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = startOfWeek.add(i, 'day').format('YYYY-MM-DD');
    const dayTasks = tasks.filter(t => t.dueDate === d);
    const dayTotal = dayTasks.length;
    const dayCompleted = dayTasks.filter(t => t.completed).length;
    
    // Density logic
    let intensity = 0;
    if (dayTotal > 0) {
      if (dayCompleted === 0) intensity = 1; // has tasks but 0 done
      else if (dayCompleted / dayTotal <= 0.33) intensity = 2; 
      else if (dayCompleted / dayTotal <= 0.75) intensity = 3; 
      else intensity = 4; // all done or mostly done
    }
    
    days.push({ date: d, intensity, total: dayTotal, completed: dayCompleted });
  }

  // Activity Strip Colors
  const getIntensityClass = (intensity) => {
    switch(intensity) {
      case 0: return 'bg-[var(--field)] border border-[var(--border-strong)]'; // empty
      case 1: return 'bg-[var(--border-strong)] opacity-30'; 
      case 2: return 'bg-[var(--done)] opacity-30';
      case 3: return 'bg-[var(--done)] opacity-60';
      case 4: return 'bg-[var(--done)] opacity-100';
      default: return 'bg-[var(--field)]';
    }
  };

  return (
    <div className="hidden lg:flex flex-col w-[260px] space-y-6 pt-2 shrink-0">
      {/* This Week Card */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-5 shadow-sm">
        <h3 className="text-[13px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4">Last 7 Days</h3>
        <div className="flex items-end justify-between mb-3">
          <div className="text-3xl font-extrabold text-[var(--text)] tracking-tight">
            {completedTasks}
            <span className="text-[16px] font-bold text-[var(--text-faint)] ml-1">/ {totalTasks}</span>
          </div>
          {totalTasks > 0 && (
            <div className="text-[12px] font-bold text-[var(--done)]">{progressPct}%</div>
          )}
        </div>
        <div className="h-[6px] w-full bg-[var(--field)] rounded-full overflow-hidden border border-[var(--border-strong)]">
          <div 
            className="h-full bg-[var(--done)] rounded-full transition-all duration-700 ease-out" 
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Activity Strip Card */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-5 shadow-sm">
        <h3 className="text-[13px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4">Activity</h3>
        <div className="flex justify-between items-center gap-1">
          {days.map((day, idx) => (
            <div 
              key={day.date}
              title={`${day.completed}/${day.total} on ${dayjs(day.date).format('MMM D')}`}
              className={`w-[26px] h-[26px] rounded-[6px] ${getIntensityClass(day.intensity)} transition-colors hover:ring-2 hover:ring-[var(--border-strong)] cursor-default`}
            />
          ))}
        </div>
        <div className="flex justify-between items-center mt-3 text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-wider">
          <span>{dayjs(days[0].date).format('MMM D')}</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
};

export default DayViewSidebar;
