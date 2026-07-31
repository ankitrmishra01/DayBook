import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

      <div className="sm:hidden flex items-center">
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="flex items-center justify-center h-9 w-9 rounded-full bg-[var(--field)] text-[var(--text-dim)] hover:text-[var(--text)] transition-colors border border-[var(--border)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </button>
      </div>

      {isMobileOpen && (
        <div className="fixed inset-0 bg-[var(--bg)] z-[100] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center h-16 border-b border-[var(--border)] px-4 shrink-0">
            <button onClick={() => setIsMobileOpen(false)} className="mr-3 p-2 text-[var(--text-dim)] hover:text-[var(--text)] rounded-full bg-[var(--field)] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div className="flex-1 flex items-center bg-[var(--field)] rounded-xl px-3 h-10 border border-[var(--border-strong)]">
              <input 
                type="text"
                autoFocus
                placeholder="Search tasks..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-transparent text-[14px] font-medium text-[var(--text)] outline-none flex-1 w-full"
              />
              {query && (
                <button onClick={() => setQuery('')} className="ml-2 p-1 text-[var(--text-dim)] hover:text-[var(--text)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-[var(--bg)]">
            {query.trim() ? resultsContent : (
              <div className="p-8 text-center text-[var(--text-faint)] font-medium text-[14px]">
                Search for task titles or descriptions...
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SearchBox;
