import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [dailyCapacityMinutes, setDailyCapacityMinutes] = useState('480');
  const [dailyDigestEnabled, setDailyDigestEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [themePreference, setThemePreference] = useState('dark');
  
  // Preview theme immediately when toggled
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themePreference);
  }, [themePreference]);
  
  // Revert to saved preference if unmounted without saving
  useEffect(() => {
    return () => {
      if (user?.themePreference) {
        document.documentElement.setAttribute('data-theme', user.themePreference);
      }
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      setDailyCapacityMinutes(user.dailyCapacityMinutes || '480');
      setDailyDigestEnabled(user.dailyDigestEnabled || false);
      setThemePreference(user.themePreference || 'dark');
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    try {
      await updateUser({
        dailyCapacityMinutes,
        dailyDigestEnabled,
        themePreference
      });
      setMessage('Settings updated successfully');
    } catch (err) {
      setError('Failed to update settings');
    }
  };

  const handleExport = async () => {
    try {
      const { data } = await api.get('/tasks/export');
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `daybook-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export tasks');
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full pb-10">
      <div className="flex items-center mb-8">
        <button onClick={() => navigate(-1)} className="mr-4 p-2 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-[32px] font-[800] tracking-tight text-[var(--text)]">Settings</h2>
      </div>

      <div className="max-w-2xl border-t border-[var(--border)] pt-8">
        <form onSubmit={handleSave} className="space-y-8">
          {error && <div className="text-[var(--high)] text-sm font-bold">{error}</div>}
          {message && <div className="text-[var(--done)] text-sm font-bold">{message}</div>}

          <div>
            <label className="block text-sm font-bold text-[var(--text)] mb-2">Theme</label>
            <div className="flex p-1 bg-[var(--field)] rounded-xl w-max border border-[var(--border)]">
              <button
                type="button"
                onClick={async () => {
                  setThemePreference('dark');
                  try {
                    await updateUser({ dailyCapacityMinutes, dailyDigestEnabled, themePreference: 'dark' });
                  } catch (e) {}
                }}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${themePreference === 'dark' ? 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] shadow-sm' : 'text-[var(--text-dim)] hover:text-[var(--text)]'}`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={async () => {
                  setThemePreference('light');
                  try {
                    await updateUser({ dailyCapacityMinutes, dailyDigestEnabled, themePreference: 'light' });
                  } catch (e) {}
                }}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${themePreference === 'light' ? 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] shadow-sm' : 'text-[var(--text-dim)] hover:text-[var(--text)]'}`}
              >
                Light
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--text)] mb-2">Daily Capacity (minutes)</label>
            <p className="text-xs text-[var(--text-dim)] mb-3">How many minutes of work you plan to do each day.</p>
            <input 
              type="number"
              value={dailyCapacityMinutes}
              onChange={e => setDailyCapacityMinutes(e.target.value)}
              className="w-full max-w-[200px] bg-[var(--field)] text-[var(--text)] border border-[var(--border)] focus:border-[var(--border-strong)] rounded-xl p-3 placeholder-[var(--text-faint)] outline-none text-sm font-medium transition-colors"
            />
          </div>

          <div>
            <label className="flex items-center space-x-3 cursor-pointer group">
              <button
                type="button"
                onClick={() => setDailyDigestEnabled(!dailyDigestEnabled)}
                className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                  dailyDigestEnabled ? 'bg-[var(--accent)] border-[var(--accent)]' : 'bg-[var(--field)] border-[var(--border)] group-hover:border-[var(--text-dim)]'
                }`}
              >
                {dailyDigestEnabled && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FAF9F6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </button>
              <span className="text-sm font-bold text-[var(--text)]">Send me a morning summary</span>
            </label>
            <p className="text-xs text-[var(--text-dim)] mt-2 ml-8">Receive a daily email summarizing your planned tasks and carry-overs.</p>
          </div>

          <div className="pt-4 border-t border-[var(--border)]">
            <button 
              type="submit"
              className="bg-[var(--accent)] text-[#FAF9F6] font-semibold py-3 px-6 rounded-xl transition-opacity mt-4 text-sm"
            >
              Save Settings
            </button>
          </div>
        </form>

        <div className="pt-8 border-t border-[var(--border)] mt-8">
          <h3 className="text-sm font-bold text-[var(--text)] mb-2">Data Export</h3>
          <p className="text-xs text-[var(--text-dim)] mb-4">Download a complete backup of all your tasks in JSON format.</p>
          <button 
            type="button"
            onClick={handleExport}
            className="bg-[var(--field)] text-[var(--text)] font-semibold py-2 px-4 rounded-xl border border-[var(--border)] hover:border-[var(--text-dim)] transition-colors text-sm flex items-center w-max"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
