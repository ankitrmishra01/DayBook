import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/api';

const ResetPassword = () => {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, newPassword });
      setMessage(data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[360px] flex flex-col items-center">
        
        {/* Squircle Icon Badge */}
        <div className="w-14 h-14 bg-[var(--surface)] border border-[var(--border)] rounded-[16px] flex items-center justify-center mb-6">
          <img src="/icon.svg" alt="Daybook Icon" className="h-6 w-6" />
        </div>
        
        <h1 className="text-[24px] font-[700] text-[var(--text)] tracking-tight mb-2 text-center">
          Choose a new password
        </h1>
        
        <div className="text-sm text-[var(--text-dim)] font-medium mb-10 text-center">
          Must be at least 6 characters long.
        </div>

        <div className="w-full">
          <form onSubmit={handleReset} className="space-y-4">
            {error ? (
              <div className="text-[var(--high)] text-sm font-medium text-center mb-4">
                {error}
              </div>
            ) : null}
            {message ? (
              <div className="text-[var(--done)] text-sm font-medium text-center mb-4">
                {message}
              </div>
            ) : null}
            
            <div className="flex flex-col space-y-1.5 relative">
              <label className="text-[13px] text-[var(--text-dim)] font-medium ml-1">New password</label>
              <div className="relative w-full">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-[var(--field)] border border-[var(--border)] focus:border-[var(--border-strong)] rounded-xl px-4 py-3 pr-12 text-[var(--text)] outline-none transition-colors text-sm font-medium"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text)] p-1 transition-colors"
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent)] text-[#16110D] font-semibold rounded-xl px-4 py-3 transition-opacity mt-8 text-sm flex items-center justify-center"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-[#16110D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
