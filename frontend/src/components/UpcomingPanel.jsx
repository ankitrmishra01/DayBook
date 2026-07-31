import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import api from '../api/api';

const UpcomingPanel = ({ activeDateStr }) => {
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcoming = async () => {
      setLoading(true);
      try {
        const nextDays = [
          dayjs(activeDateStr).add(1, 'day').format('YYYY-MM-DD'),
          dayjs(activeDateStr).add(2, 'day').format('YYYY-MM-DD'),
          dayjs(activeDateStr).add(3, 'day').format('YYYY-MM-DD')
        ];

        // Fetch counts in parallel
        const promises = nextDays.map(date => api.get(`/tasks?date=${date}`));
        const responses = await Promise.all(promises);

        setCounts(responses.map((res, i) => ({
          date: nextDays[i],
          count: res.data.length, // Or filter by not completed: res.data.filter(t => !t.completed).length
          plannedMinutes: res.data.reduce((acc, t) => acc + (t.plannedMinutes || 0), 0)
        })));
      } catch (err) {
        console.error('Failed to fetch upcoming tasks', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (activeDateStr) fetchUpcoming();
  }, [activeDateStr]);

  if (loading) {
    return (
      <div className="w-[200px] shrink-0 xl:block hidden opacity-50">
        <h3 className="text-[12px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4">Upcoming</h3>
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 h-[60px] animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-[200px] shrink-0 xl:block hidden">
      <h3 className="text-[12px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4">Upcoming</h3>
      <div className="space-y-3">
        {counts.map((c, i) => {
          const dateObj = dayjs(c.date);
          const isTomorrow = i === 0;
          return (
            <div key={c.date} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 shadow-sm hover:border-[var(--border-strong)] transition-colors">
              <div className="text-[13px] font-bold text-[var(--text)] mb-1">
                {isTomorrow ? 'Tomorrow' : dateObj.format('dddd')}
              </div>
              <div className="flex items-end justify-between">
                <div className="text-[20px] font-extrabold text-[var(--text)] leading-none tracking-tight">
                  {c.count}
                </div>
                {c.plannedMinutes > 0 && (
                  <div className="text-[11px] font-bold text-[var(--text-dim)]">
                    {c.plannedMinutes}m
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingPanel;
