import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../api/api';

const MonthView = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);

  const startOfMonth = currentDate.startOf('month');
  const endOfMonth = currentDate.endOf('month');
  
  // To render a full grid, get start of first week and end of last week
  const startDate = startOfMonth.startOf('week');
  const endDate = endOfMonth.endOf('week');

  useEffect(() => {
    fetchTasks();
  }, [currentDate.format('YYYY-MM')]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tasks?start=${startDate.format('YYYY-MM-DD')}&end=${endDate.format('YYYY-MM-DD')}`);
      
      const grouped = {};
      data.forEach(task => {
        if (!grouped[task.dueDate]) grouped[task.dueDate] = [];
        grouped[task.dueDate].push(task);
      });
      setTasks(grouped);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => setCurrentDate(currentDate.subtract(1, 'month'));
  const handleNext = () => setCurrentDate(currentDate.add(1, 'month'));
  const handleToday = () => setCurrentDate(dayjs());

  const days = [];
  let day = startDate;
  while (day.isBefore(endDate) || day.isSame(endDate, 'day')) {
    days.push(day);
    day = day.add(1, 'day');
  }

  const priorityColors = {
    high: { bg: 'rgba(255,107,92,0.14)', text: 'var(--high)' },
    normal: { bg: 'rgba(154,155,163,0.14)', text: 'var(--normal)' },
    low: { bg: 'rgba(85,86,92,0.14)', text: 'var(--low)' }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex-1 flex flex-col w-full pb-10">
      
      <div className="flex items-center justify-between mb-8 mt-6">
        <h2 className="text-[32px] font-[700] tracking-tight leading-none text-[var(--text)]">
          {currentDate.format('MMMM YYYY')}
        </h2>
        <div className="flex items-center space-x-2">
          <button onClick={handlePrev} className="p-2 text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--field)] rounded-lg transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button onClick={handleToday} className="px-4 py-1.5 text-[13px] font-bold text-[var(--text)] hover:bg-[var(--field)] rounded-lg transition-colors">
            Today
          </button>
          <button onClick={handleNext} className="p-2 text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--field)] rounded-lg transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <div className="overflow-hidden flex flex-col flex-1 min-h-[600px] border-t border-[var(--border)]">
        {/* Header Row */}
        <div className="grid grid-cols-7 border-b border-[var(--border)]">
          {weekDays.map(d => (
            <div key={d} className="py-4 text-center text-[12px] font-bold text-[var(--text-dim)] uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>
        
        {/* Grid */}
        <div className="grid grid-cols-7 grid-rows-5 flex-1 border-l border-[var(--border)]">
          {days.map((d, i) => {
            const dateStr = d.format('YYYY-MM-DD');
            const isToday = d.isSame(dayjs(), 'day');
            const isCurrentMonth = d.isSame(currentDate, 'month');
            const dayTasks = tasks[dateStr] || [];

            return (
              <div 
                key={dateStr}
                onClick={() => navigate(`/day/${dateStr}`)}
                className={`border-r border-b border-[var(--border)] p-2 sm:p-3 flex flex-col cursor-pointer transition-colors hover:bg-[var(--field)] relative
                  ${!isCurrentMonth ? 'opacity-40' : ''}
                `}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`w-7 h-7 flex items-center justify-center rounded-[6px] text-[13px] font-bold ${
                    isToday ? 'bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--accent)]' : 'text-[var(--text)]'
                  }`}>
                    {d.format('D')}
                  </span>
                </div>
                
                <div className="flex-1 overflow-hidden space-y-1">
                  {isCurrentMonth && dayTasks.slice(0, 3).map(task => (
                    <div 
                      key={task._id} 
                      className={`text-[11px] font-bold px-2 py-0.5 rounded flex items-center truncate ${task.completed ? 'opacity-40 line-through' : ''}`}
                      style={!task.completed ? { backgroundColor: priorityColors[task.priority]?.bg || priorityColors.normal.bg, color: priorityColors[task.priority]?.text || priorityColors.normal.text } : { backgroundColor: 'var(--surface)', color: 'var(--text-dim)' }}
                    >
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                  {isCurrentMonth && dayTasks.length > 3 && (
                    <div className="text-[10px] font-bold text-[var(--text-dim)] pl-1 pt-0.5">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MonthView;
