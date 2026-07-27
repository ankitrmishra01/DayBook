import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request reset');
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
          Reset password
        </h1>
        
        <div className="text-sm text-[var(--text-dim)] font-medium mb-10 text-center">
          Enter your email to receive a reset link.
        </div>

        <div className="w-full">
          <form onSubmit={handleResetRequest} className="space-y-4">
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
            
            <div className="flex flex-col space-y-1.5">
              <label className="text-[13px] text-[var(--text-dim)] font-medium ml-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[var(--field)] border border-[var(--border)] focus:border-[var(--border-strong)] rounded-xl px-4 py-3 text-[var(--text)] outline-none transition-colors text-sm font-medium"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent)] text-[#16110D] font-semibold rounded-xl px-4 py-3 transition-opacity mt-8 text-sm flex items-center justify-center"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-[#16110D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : 'Send Reset Link'}
            </button>
            
            <div className="text-center mt-6">
              <button 
                type="button" 
                onClick={() => navigate('/login')}
                className="text-[var(--text-dim)] hover:text-[var(--accent)] text-[13px] font-semibold transition-colors"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
