import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';
import api from '../api/api';
import TopBar from './TopBar';
import MiniCalendar from './MiniCalendar';
import CommandPalette from './CommandPalette';

const Layout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { date } = useParams();
  const [weekStats, setWeekStats] = useState({ total: 0, completed: 0, pct: 0 });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const today = dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    const fetchWeekTasks = async () => {
      try {
        const startOfWeek = dayjs().subtract(6, 'day').format('YYYY-MM-DD');
        const { data } = await api.get(`/tasks?start=${startOfWeek}&end=${today}`);
        const total = data.length;
        const completed = data.filter(t => t.completed).length;
        setWeekStats({
          total,
          completed,
          pct: total === 0 ? 0 : Math.round((completed / total) * 100)
        });
      } catch (err) {
        console.error('Failed to fetch week tasks', err);
      }
    };
    fetchWeekTasks();
  }, [today]);

  // Global Navigation Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ignore if user is typing in an input/textarea/select
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      switch (e.key) {
        case '1':
          navigate(`/day/${today}`);
          break;
        case '2':
          navigate('/month');
          break;
        case '3':
          navigate('/year');
          break;
        case '4':
          navigate('/settings');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [navigate, today]);

  const navClassDesktop = ({ isActive }) => 
    `flex items-center px-4 py-2.5 rounded-[10px] text-[14px] font-semibold transition-colors ${
      isActive ? 'text-[var(--text)] bg-[var(--surface-3)]' : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface)]'
    }`;

  const navClassMobile = ({ isActive }) => 
    `px-4 flex items-center justify-center h-9 rounded-full text-sm font-semibold transition-colors ${
      isActive ? 'text-[var(--text)] bg-[var(--surface-3)]' : 'text-[var(--text-dim)] hover:text-[var(--text)]'
    }`;

  return (
    <div className="min-h-screen text-[var(--text)] flex flex-col w-full bg-[var(--bg)]">
      <TopBar />
      
      <div className="flex flex-1 flex-col lg:flex-row w-full">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-[260px] shrink-0 border-r border-[var(--border)] bg-[var(--surface)] h-[calc(100vh-64px)] sticky top-16 px-4 py-6 z-40">
          
          <nav className="flex flex-col space-y-1.5 mb-8">
          <NavLink to={`/day/${today}`} className={navClassDesktop}>
            <svg className="w-[18px] h-[18px] mr-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Day
          </NavLink>
          <NavLink to="/month" className={navClassDesktop}>
            <svg className="w-[18px] h-[18px] mr-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
            Month
          </NavLink>
          <NavLink to="/year" className={navClassDesktop}>
            <svg className="w-[18px] h-[18px] mr-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h8"/></svg>
            Year
          </NavLink>
        </nav>

        <MiniCalendar activeDateStr={date || today} />

        {/* This week stats */}
        <div className="bg-[var(--bg)] border border-[var(--border)] rounded-[12px] p-4 shadow-sm mt-auto mb-4">
          <h3 className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-3">This Week</h3>
          <div className="flex items-end justify-between mb-2">
            <div className="text-2xl font-extrabold text-[var(--text)] tracking-tight">
              {weekStats.completed}
              <span className="text-[14px] font-bold text-[var(--text-faint)] ml-1">/ {weekStats.total}</span>
            </div>
            {weekStats.total > 0 && (
              <div className="text-[11px] font-bold text-[var(--done)]">{weekStats.pct}%</div>
            )}
          </div>
          <div className="h-[4px] w-full bg-[var(--field)] rounded-full overflow-hidden border border-[var(--border-strong)]">
            <div 
              className="h-full bg-[var(--done)] rounded-full transition-all duration-700 ease-out" 
              style={{ width: `${weekStats.pct}%` }}
            />
          </div>
        </div>
        </aside>

        {/* MOBILE PILL NAV */}
        <div className="lg:hidden bg-[var(--surface)] p-1 rounded-full flex justify-center mx-4 mt-4 shrink-0">
          <NavLink to={`/day/${today}`} className={navClassMobile}>Day</NavLink>
          <NavLink to="/month" className={navClassMobile}>Month</NavLink>
          <NavLink to="/year" className={navClassMobile}>Year</NavLink>
        </div>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col w-full px-4 sm:px-6 lg:px-12 pt-6 pb-12 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      
      <CommandPalette />
    </div>
  );
};

export default Layout;
