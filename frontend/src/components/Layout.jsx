import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

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
