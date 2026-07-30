import { useState, useEffect, useRef } from 'react';
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
        <div className={`flex items-center w-full bg-[var(--field)] rounded-full px-3 h-9 border transition-colors ${isOpen ? 'border-[var(--border-strong)]' : 'border-[var(--border)]'}`}>
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
          <div className="absolute top-full mt-2 left-0 w-full bg-[var(--surface-3)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden z-50">
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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const today = dayjs().format('YYYY-MM-DD');

  const navClass = ({ isActive }) => 
    `px-4 flex items-center justify-center h-9 rounded-full text-sm font-semibold transition-colors ${
      isActive ? 'text-[var(--text)] bg-[var(--surface-3)]' : 'text-[var(--text-dim)] hover:text-[var(--text)]'
    }`;

  return (
    <div className="min-h-screen text-[var(--text)] flex flex-col">
      <header className="h-20 flex items-center justify-between gap-4 px-6 max-w-[760px] w-full mx-auto">
        
        {/* Left Group: Logo + Nav */}
        <div className="flex items-center gap-6 sm:gap-7 shrink-0">
          <div className="flex items-center">
            <img src="/icon.svg" alt="Daybook Icon" className="h-7 w-7 mr-2.5" />
            <Link to="/" className="text-xl font-extrabold tracking-tight hover:opacity-80 transition-opacity">
              Daybook
            </Link>
          </div>
          <nav className="hidden sm:flex bg-[var(--surface)] p-1 rounded-full items-center shrink-0">
            <NavLink to={`/day/${today}`} className={navClass}>Day</NavLink>
            <NavLink to="/month" className={navClass}>Month</NavLink>
            <NavLink to="/year" className={navClass}>Year</NavLink>
          </nav>
        </div>

        {/* Center Group: Search */}
        <div className="flex-1 flex justify-end sm:justify-center max-w-[280px]">
          <SearchBox />
        </div>

        {/* Right Group: Account & Settings */}
        <div className="flex items-center gap-5 shrink-0">
          <span className="text-sm font-medium text-[var(--text-dim)] hidden sm:inline-block truncate max-w-[150px]">
            {user?.name || user?.email}
          </span>
          <NavLink 
            to="/settings"
            className={({ isActive }) => `text-sm font-semibold transition-colors flex items-center justify-center h-9 ${isActive ? 'text-[var(--text)]' : 'text-[var(--text-dim)] hover:text-[var(--text)]'}`}
          >
            Settings
          </NavLink>
          <button 
            onClick={handleLogout}
            className="text-sm font-semibold text-[var(--text-dim)] hover:text-[var(--text)] transition-colors flex items-center justify-center h-9"
          >
            Logout
          </button>
        </div>
      </header>
      
      {/* Mobile nav (bottom toggle) */}
      <div className="sm:hidden bg-[var(--surface)] p-1 rounded-full flex justify-center mx-4 mb-4 shrink-0">
        <NavLink to={`/day/${today}`} className={navClass}>Day</NavLink>
        <NavLink to="/month" className={navClass}>Month</NavLink>
        <NavLink to="/year" className={navClass}>Year</NavLink>
      </div>

      <main className="flex-1 flex flex-col max-w-[760px] w-full mx-auto px-6 pt-4 pb-12 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
