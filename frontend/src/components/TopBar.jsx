import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SearchBox from './SearchBox';
import { useState, useRef, useEffect } from 'react';

const TopBar = () => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 w-full border-b border-[var(--border)] shrink-0 bg-[var(--surface)] z-50 sticky top-0">
      {/* Left side: Logo */}
      <div className="flex items-center">
        <img src="/icon.svg" alt="Daybook Icon" className="h-6 w-6 mr-2.5" />
        <Link to="/" className="text-lg font-extrabold tracking-tight hover:opacity-80 transition-opacity">
          Daybook
        </Link>
      </div>

      {/* Right side: Search + Profile */}
      <div className="flex items-center gap-4">
        <SearchBox />

        <div 
          ref={profileRef}
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="relative flex items-center cursor-pointer border border-[var(--border)] rounded-full pl-1 pr-3 py-1 hover:border-[var(--border-strong)] transition-colors bg-[var(--field)]"
        >
          <div className="h-7 w-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-[var(--bg)] font-bold text-xs mr-2">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="text-[13px] font-bold text-[var(--text)] max-w-[100px] truncate hidden sm:block">
            {user?.name || 'User'}
          </div>
          <svg className={`w-3.5 h-3.5 ml-1.5 text-[var(--text-dim)] hidden sm:block transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>

          {/* Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--surface-3)] border border-[var(--border)] rounded-xl shadow-xl z-50 flex flex-col py-1 animate-in fade-in slide-in-from-top-2 duration-150">
              <Link onClick={() => setIsProfileOpen(false)} to="/settings" className="px-4 py-2.5 text-[13px] font-semibold hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors flex items-center">
                <svg className="w-4 h-4 mr-2.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                Settings
              </Link>
              <button onClick={() => { setIsProfileOpen(false); logout(); }} className="px-4 py-2.5 text-[13px] font-semibold text-[var(--text-dim)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors flex items-center text-left">
                <svg className="w-4 h-4 mr-2.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
