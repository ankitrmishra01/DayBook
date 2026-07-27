import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const applyTheme = (userData) => {
    if (userData?.themePreference) {
      localStorage.setItem('theme', userData.themePreference);
      document.documentElement.setAttribute('data-theme', userData.themePreference);
    }
  };

  const checkAuth = async () => {
    try {
      const { data } = await api.get('/user/me');
      setUser(data);
      applyTheme(data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data);
    applyTheme(data);
  };

  const signup = async (name, email, password, timezone) => {
    const { data } = await api.post('/auth/signup', { name, email, password, timezone });
    setUser(data);
    applyTheme(data);
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
    localStorage.removeItem('theme'); // Optionally reset to default, or keep it. Let's keep it actually, so don't remove.
    document.documentElement.setAttribute('data-theme', 'dark'); // Default
  };

  const updateUser = async (updates) => {
    const { data } = await api.patch('/user/me', updates);
    setUser(data);
    applyTheme(data);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, signup, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
