import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';
import api from '../api/api';

const SearchBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/tasks/search?q=${encodeURIComponent(query)}`);
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [query]);

  const resultsContent = (
    <>
      {loading ? (
        <div className="p-4 text-[13px] text-[var(--text-dim)] font-medium">Searching...</div>
      ) : results.length === 0 ? (
        <div className="p-4 text-[13px] text-[var(--text-dim)] font-medium">No tasks found.</div>
      ) : (
        <div className="max-h-96 sm:max-h-96 overflow-y-auto">
          {results.map(task => (
            <div 
              key={task._id} 
              onClick={() => {
                navigate(`/day/${task.dueDate}`);
                setIsOpen(false);
                setIsMobileOpen(false);
                setQuery('');
              }}
              className="p-3 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--field)] cursor-pointer transition-colors"
            >
              <div className="flex justify-between items-start mb-1">
                <div className={`text-[14px] font-medium truncate pr-3 ${task.completed ? 'line-through text-[var(--text-dim)]' : 'text-[var(--text)]'}`}>
                  {task.title}
                </div>
                <div className="text-[11px] font-bold text-[var(--text-faint)] whitespace-nowrap">
                  {dayjs(task.dueDate).format('MMM D')}
                </div>
              </div>
              {task.description && (
                <div className="text-[12px] text-[var(--text-dim)] truncate">
                  {task.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <>
      <div ref={wrapperRef} className="relative hidden sm:flex items-center w-full">
        <div className={`flex items-center w-full bg-[var(--field)] rounded-xl px-3 h-10 border transition-colors ${isOpen ? 'border-[var(--border-strong)]' : 'border-[var(--border)]'}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input 
            type="text"
            placeholder="Search tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="bg-transparent text-[13px] font-medium text-[var(--text)] outline-none ml-2 flex-1 min-w-0"
          />
        </div>
        
        {isOpen && query.trim() && (
          <div className="absolute top-full mt-2 left-0 w-full sm:w-[320px] bg-[var(--surface-3)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden z-50">
            {resultsContent}
          </div>
        )}
      </div>

      <button 
        className="sm:hidden flex items-center justify-center h-9 w-9 shrink-0 rounded-full bg-[var(--field)] text-[var(--text-dim)] hover:text-[var(--text)] transition-colors border border-[var(--border)]"
        onClick={() => setIsMobileOpen(true)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </button>

      {isMobileOpen && (
        <div className="fixed inset-0 bg-[var(--bg)] z-50 flex flex-col sm:hidden">
          <div className="flex items-center px-4 h-20 border-b border-[var(--border)] gap-3">
            <button 
              onClick={() => { setIsMobileOpen(false); setQuery(''); }}
              className="flex items-center justify-center h-9 w-9 shrink-0 rounded-full text-[var(--text-dim)] hover:bg-[var(--field)] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            </button>
            <div className="flex-1 flex items-center bg-[var(--field)] rounded-full px-3 h-9 border border-[var(--border-strong)]">
              <input 
                type="text"
                autoFocus
                placeholder="Search tasks..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-transparent text-[14px] font-medium text-[var(--text)] outline-none flex-1 min-w-0"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-[var(--text-dim)] p-1 shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {query.trim() ? resultsContent : (
              <div className="p-8 text-center text-[13px] text-[var(--text-dim)] font-medium">
                Type to start searching...
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const Layout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
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

  const navClassDesktop = ({ isActive }) => 
    `flex items-center px-4 py-2.5 rounded-[10px] text-[14px] font-semibold transition-colors ${
      isActive ? 'text-[var(--text)] bg-[var(--surface-3)]' : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface)]'
    }`;

  const navClassMobile = ({ isActive }) => 
    `px-4 flex items-center justify-center h-9 rounded-full text-sm font-semibold transition-colors ${
      isActive ? 'text-[var(--text)] bg-[var(--surface-3)]' : 'text-[var(--text-dim)] hover:text-[var(--text)]'
    }`;

  return (
    <div className="min-h-screen text-[var(--text)] flex flex-col lg:flex-row overflow-x-hidden w-full bg-[var(--bg)]">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-[260px] shrink-0 border-r border-[var(--border)] bg-[var(--surface)] min-h-screen px-4 py-6 z-40 fixed inset-y-0 left-0">
        <div className="flex items-center mb-6 px-2">
          <img src="/icon.svg" alt="Daybook Icon" className="h-7 w-7 mr-2.5" />
          <Link to="/" className="text-xl font-extrabold tracking-tight hover:opacity-80 transition-opacity">
            Daybook
          </Link>
        </div>

        <div className="mb-6">
          <SearchBox />
        </div>

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

        {/* This week stats */}
        <div className="bg-[var(--bg)] border border-[var(--border)] rounded-[12px] p-4 shadow-sm mb-auto">
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

        {/* Account Bottom */}
        <div className="flex flex-col space-y-1.5 mt-6 pt-4">
          <div className="px-4 py-2 text-[13px] font-bold text-[var(--text)] truncate mb-1">
            {user?.name || user?.email}
          </div>
          <NavLink to="/settings" className={navClassDesktop}>
            <svg className="w-[18px] h-[18px] mr-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            Settings
          </NavLink>
          <button onClick={handleLogout} className="flex items-center px-4 py-2.5 rounded-[10px] text-[14px] font-semibold text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors w-full text-left">
            <svg className="w-[18px] h-[18px] mr-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* MOBILE TOP NAV */}
      <header className="lg:hidden h-16 flex items-center justify-between px-4 sm:px-6 w-full border-b border-[var(--border)] shrink-0">
        <div className="flex items-center">
          <img src="/icon.svg" alt="Daybook Icon" className="h-6 w-6 mr-2" />
          <Link to="/" className="text-lg font-extrabold tracking-tight">Daybook</Link>
        </div>
        <div className="flex items-center gap-3">
          <SearchBox />
          <button onClick={handleLogout} className="text-[13px] font-bold text-[var(--text-dim)] hover:text-[var(--text)]">
            Logout
          </button>
        </div>
      </header>

      {/* MOBILE PILL NAV */}
      <div className="lg:hidden bg-[var(--surface)] p-1 rounded-full flex justify-center mx-4 mt-4 shrink-0">
        <NavLink to={`/day/${today}`} className={navClassMobile}>Day</NavLink>
        <NavLink to="/month" className={navClassMobile}>Month</NavLink>
        <NavLink to="/year" className={navClassMobile}>Year</NavLink>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col w-full min-h-screen px-4 sm:px-6 lg:pl-[300px] lg:pr-12 pt-6 pb-12 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
