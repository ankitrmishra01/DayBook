import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';
import api from '../api/api';

const SearchBox = () => {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div ref={wrapperRef} className="relative hidden sm:flex items-center ml-4">
      <div className={`flex items-center bg-[var(--field)] rounded-full px-3 py-1.5 border transition-colors ${isOpen ? 'border-[var(--border-strong)]' : 'border-[var(--border)]'}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input 
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="bg-transparent text-[13px] font-medium text-[var(--text)] outline-none ml-2 w-32 focus:w-48 transition-all"
        />
      </div>
      
      {isOpen && query.trim() && (
        <div className="absolute top-full mt-2 left-0 w-80 bg-[var(--surface-3)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden z-50">
          {loading ? (
            <div className="p-4 text-[13px] text-[var(--text-dim)] font-medium">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-[13px] text-[var(--text-dim)] font-medium">No tasks found.</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {results.map(task => (
                <div 
                  key={task._id} 
                  onClick={() => {
                    navigate(`/day/${task.dueDate}`);
                    setIsOpen(false);
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
        </div>
      )}
    </div>
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
    `px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
      isActive ? 'text-[var(--text)] bg-[var(--surface-3)]' : 'text-[var(--text-dim)] hover:text-[var(--text)]'
    }`;

  return (
    <div className="min-h-screen text-[var(--text)] flex flex-col">
      <header className="h-20 flex items-center justify-between px-6 sm:px-8 max-w-7xl w-full mx-auto">
        <div className="flex items-center space-x-12">
          <div className="flex items-center">
            <img src="/icon.svg" alt="Daybook Icon" className="h-7 w-7 mr-2.5" />
            <Link to="/" className="text-xl font-extrabold tracking-tight hover:opacity-80 transition-opacity">
              Daybook
            </Link>
          </div>
          <nav className="hidden sm:flex bg-[var(--surface)] p-1 rounded-full items-center">
            <NavLink to={`/day/${today}`} className={navClass}>Day</NavLink>
            <NavLink to="/month" className={navClass}>Month</NavLink>
            <NavLink to="/year" className={navClass}>Year</NavLink>
          </nav>
          <SearchBox />
        </div>
        <div className="flex items-center space-x-6">
          <span className="text-sm font-medium text-[var(--text-dim)] hidden sm:inline-block">
            {user?.name || user?.email}
          </span>
          <NavLink 
            to="/settings"
            className={({ isActive }) => `text-sm font-semibold transition-colors ${isActive ? 'text-[var(--text)]' : 'text-[var(--text-dim)] hover:text-[var(--text)]'}`}
          >
            Settings
          </NavLink>
          <button 
            onClick={handleLogout}
            className="text-sm font-semibold text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
          >
            Logout
          </button>
        </div>
      </header>
      
      {/* Mobile nav */}
      <div className="sm:hidden bg-[var(--surface)] p-1 rounded-full flex justify-center mx-4 mb-4">
        <NavLink to={`/day/${today}`} className={navClass}>Day</NavLink>
        <NavLink to="/month" className={navClass}>Month</NavLink>
        <NavLink to="/year" className={navClass}>Year</NavLink>
      </div>

      <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto p-4 sm:p-6 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
