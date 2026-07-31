import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../api/api';

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('normal');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt + K or Cmd/Ctrl + Shift + K
      if ((e.altKey && e.key === 'k') || ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setIsOpen(true);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || loading) return;
    
    setLoading(true);
    try {
      const today = dayjs().format('YYYY-MM-DD');
      await api.post('/tasks', {
        title,
        priority,
        dueDate: today,
        originalDate: today
      });
      setTitle('');
      setPriority('normal');
      setIsOpen(false);
      // Optional: Navigate to today to see the new task
      navigate(`/day/${today}`);
      // A small page reload to ensure DayView fetches it if we are already there
      // or we can rely on context/global state, but since DayView fetches on mount, navigation might not re-fetch if we're already on today.
      // Easiest hack is window.location.reload() or we just let user refresh if they are on today.
      // But Daybook is SPA, better to just dispatch a custom event.
      window.dispatchEvent(new CustomEvent('taskCreated'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-[600px] mx-4 bg-[var(--bg)] border border-[var(--border-strong)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        <form onSubmit={handleSubmit} className="flex items-center p-3 border-b border-[var(--border)] bg-[var(--surface)]">
          <svg className="w-5 h-5 mx-2 text-[var(--text-dim)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
          <input 
            ref={inputRef}
            type="text"
            placeholder="Quick Add for Today... (Alt+K)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-transparent text-[16px] font-medium text-[var(--text)] outline-none px-2 py-2 placeholder:text-[var(--text-faint)]"
          />
          
          <select 
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="ml-2 bg-[var(--field)] border border-[var(--border)] font-medium text-[13px] text-[var(--text)] outline-none cursor-pointer rounded-lg px-2 py-1.5"
          >
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
          
          <button 
            type="submit"
            disabled={!title.trim() || loading}
            className="ml-3 bg-[var(--text)] text-[var(--bg)] text-[13px] font-bold px-4 py-2 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </form>
        
        <div className="p-2 bg-[var(--bg)] flex items-center justify-between text-[11px] font-bold text-[var(--text-faint)] px-4">
          <div className="flex gap-4">
            <span><kbd className="font-sans border border-[var(--border)] rounded px-1.5 py-0.5 shadow-sm mr-1">Enter</kbd> to add</span>
            <span><kbd className="font-sans border border-[var(--border)] rounded px-1.5 py-0.5 shadow-sm mr-1">Esc</kbd> to close</span>
          </div>
          <div>Added to Today</div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
