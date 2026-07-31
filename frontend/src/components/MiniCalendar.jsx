import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../api/api';

const MiniCalendar = ({ activeDateStr }) => {
  const navigate = useNavigate();
  // If no activeDateStr is provided (like in Month/Year view), default to today
  const activeDate = activeDateStr ? dayjs(activeDateStr) : dayjs();
  
  const [currentMonth, setCurrentMonth] = useState(activeDate.startOf('month'));
  
  const handlePrevMonth = () => setCurrentMonth(prev => prev.subtract(1, 'month'));
  const handleNextMonth = () => setCurrentMonth(prev => prev.add(1, 'month'));

  const today = dayjs().format('YYYY-MM-DD');
  
  const [taskDates, setTaskDates] = useState(new Set());

  useEffect(() => {
    const fetchMonthTasks = async () => {
      try {
        const start = currentMonth.startOf('month').startOf('week').format('YYYY-MM-DD');
        const end = currentMonth.endOf('month').endOf('week').format('YYYY-MM-DD');
        const { data } = await api.get(`/tasks?start=${start}&end=${end}`);
        
        // Collect dates that have tasks
        const dates = new Set(data.map(t => t.date));
        setTaskDates(dates);
      } catch (err) {
        console.error('Failed to fetch mini calendar tasks:', err);
      }
    };
    fetchMonthTasks();
  }, [currentMonth]);

  // Generate days for the grid
  const startDay = currentMonth.startOf('month').day();
  const daysInMonth = currentMonth.daysInMonth();
  
  const days = [];
  
  // Padding for previous month
  const prevMonth = currentMonth.subtract(1, 'month');
  const prevMonthDays = prevMonth.daysInMonth();
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      date: prevMonth.date(prevMonthDays - i).format('YYYY-MM-DD'),
      isCurrentMonth: false
    });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: currentMonth.date(i).format('YYYY-MM-DD'),
      isCurrentMonth: true
    });
  }
  
  // Padding for next month to complete the grid (usually 42 cells total)
  const totalCells = Math.ceil(days.length / 7) * 7;
  const nextMonthPadding = totalCells - days.length;
  const nextMonth = currentMonth.add(1, 'month');
  for (let i = 1; i <= nextMonthPadding; i++) {
    days.push({
      date: nextMonth.date(i).format('YYYY-MM-DD'),
      isCurrentMonth: false
    });
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-[12px] font-bold text-[var(--text)]">
          {currentMonth.format('MMMM YYYY')}
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={handlePrevMonth} className="p-1 rounded hover:bg-[var(--field)] text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button onClick={handleNextMonth} className="p-1 rounded hover:bg-[var(--field)] text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-[10px] font-bold text-[var(--text-faint)]">
            {d}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((d, i) => {
          const isToday = d.date === today;
          const isActive = d.date === activeDateStr;
          
          let btnClass = "h-7 w-7 rounded flex items-center justify-center text-[12px] font-medium transition-colors mx-auto ";
          
          if (isActive) {
            btnClass += "bg-[var(--text)] text-[var(--bg)] font-bold shadow-sm";
          } else if (isToday) {
            btnClass += "text-[var(--accent)] bg-[var(--surface-3)] font-bold";
          } else if (d.isCurrentMonth) {
            btnClass += "text-[var(--text-dim)] hover:bg-[var(--field)] hover:text-[var(--text)]";
          } else {
            btnClass += "text-[var(--text-faint)] hover:bg-[var(--field)] opacity-50";
          }

          return (
            <button 
              key={i} 
              onClick={() => navigate(`/day/${d.date}`)}
              className={btnClass + " relative flex flex-col"}
            >
              <span>{dayjs(d.date).date()}</span>
              {taskDates.has(d.date) && (
                <div className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isActive ? 'bg-[var(--bg)]' : isToday ? 'bg-[var(--accent)]' : 'bg-[var(--done)]'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;
