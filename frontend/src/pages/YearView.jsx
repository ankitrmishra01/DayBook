import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../api/api';

const YearView = () => {
  const navigate = useNavigate();
  const [currentYear, setCurrentYear] = useState(dayjs().year());
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });

  const startOfYear = dayjs(`${currentYear}-01-01`).startOf('year');
  const endOfYear = dayjs(`${currentYear}-12-31`).endOf('year');

  useEffect(() => {
    fetchYearStats();
  }, [currentYear]);

  const fetchYearStats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tasks?start=${startOfYear.format('YYYY-MM-DD')}&end=${endOfYear.format('YYYY-MM-DD')}`);
      
      const dayStats = {};
      data.forEach(task => {
        if (!dayStats[task.dueDate]) {
          dayStats[task.dueDate] = { total: 0, completed: 0 };
        }
        dayStats[task.dueDate].total += 1;
        if (task.completed) {
          dayStats[task.dueDate].completed += 1;
        }
      });
      setStats(dayStats);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setLoading(false);
    }
  };

  const getHeatmapColor = (dateStr) => {
    const stat = stats[dateStr];
    if (!stat || stat.total === 0) return 'bg-[var(--field)]';
    
    const pct = stat.completed / stat.total;
    
    if (pct === 0) return 'bg-[var(--field)] border border-[#FF6B47] border-opacity-30'; // Visually distinct but empty
    if (pct < 0.33) return 'bg-[#FF6B47] opacity-25'; 
    if (pct < 0.66) return 'bg-[#FF6B47] opacity-50'; 
    if (pct < 1) return 'bg-[#FF6B47] opacity-75';    
    return 'bg-[var(--accent)]'; 
  };

  const handleMouseEnter = (e, dateStr, d) => {
    const stat = stats[dateStr];
    const rect = e.target.getBoundingClientRect();
    const text = stat 
      ? `${d.format('MMM D')} — ${stat.completed}/${stat.total} tasks done`
      : `${d.format('MMM D')} — No tasks`;
      
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      text
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, text: '' });
  };

  const months = [];
  for (let m = 0; m < 12; m++) {
    const startOfMonth = dayjs(`${currentYear}-${m + 1}-01`);
    const daysInMonth = startOfMonth.daysInMonth();
    const days = [];
    
    for (let i = 0; i < startOfMonth.day(); i++) {
      days.push(null);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(startOfMonth.date(d));
    }
    
    months.push({
      name: startOfMonth.format('MMMM'),
      days
    });
  }

  return (
    <div className="flex-1 flex flex-col w-full max-w-[900px] mx-auto pb-10 relative">
      <div className="flex items-center justify-between mb-8 mt-6">
        <h2 className="text-[32px] font-[700] tracking-tight leading-none text-[var(--text)]">
          {currentYear}
        </h2>
        <div className="flex items-center space-x-2">
          <button onClick={() => setCurrentYear(y => y - 1)} className="p-2 text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--field)] rounded-lg transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button onClick={() => setCurrentYear(dayjs().year())} className="px-4 py-1.5 text-[13px] font-bold text-[var(--text)] hover:bg-[var(--field)] rounded-lg transition-colors">
            Current
          </button>
          <button onClick={() => setCurrentYear(y => y + 1)} className="p-2 text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--field)] rounded-lg transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <div className="border-t border-[var(--border)] pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-12 gap-y-12">
          {months.map(month => (
            <div key={month.name} className="flex flex-col">
              <h3 className="text-[13px] font-bold text-[var(--text)] mb-4 tracking-tight">{month.name}</h3>
              <div className="grid grid-cols-7 gap-1.5">
                {['S','M','T','W','T','F','S'].map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-bold text-[var(--text-faint)] mb-1">{d}</div>
                ))}
                
                {month.days.map((d, i) => {
                  if (!d) return <div key={`empty-${i}`} className="aspect-square"></div>;
                  
                  const dateStr = d.format('YYYY-MM-DD');
                  const isToday = d.isSame(dayjs(), 'day');
                  
                  return (
                    <div 
                      key={dateStr}
                      onClick={() => navigate(`/day/${dateStr}`)}
                      onMouseEnter={(e) => handleMouseEnter(e, dateStr, d)}
                      onMouseLeave={handleMouseLeave}
                      className={`aspect-square rounded-[3px] cursor-pointer transition-transform hover:scale-110
                        ${getHeatmapColor(dateStr)}
                        ${isToday ? 'ring-1 ring-[var(--text)] ring-offset-2 ring-offset-[var(--bg)]' : ''}
                      `}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Tooltip */}
      {tooltip.visible && (
        <div 
          className="fixed z-50 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-[12px] font-bold rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
          {/* Arrow */}
          <div className="absolute left-1/2 bottom-[1px] transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-[var(--surface)] border-r border-b border-[var(--border)]"></div>
        </div>
      )}
    </div>
  );
};

export default YearView;
