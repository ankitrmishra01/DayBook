import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import TaskRow from '../components/TaskRow';

const DayView = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const selectedDate = date ? dayjs(date) : dayjs();
  const dateStr = selectedDate.format('YYYY-MM-DD');

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('normal');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurUntil, setRecurUntil] = useState('');

  useEffect(() => {
    if (!date) {
      navigate(`/day/${dayjs().format('YYYY-MM-DD')}`, { replace: true });
      return;
    }
    fetchTasks();
  }, [date, dateStr]);

  const [isWakingUp, setIsWakingUp] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    setIsWakingUp(false);
    
    // If it takes more than 3 seconds, the server is probably doing a cold start
    const slowLoadTimer = setTimeout(() => {
      setIsWakingUp(true);
    }, 3000);

    try {
      const { data } = await api.get(`/tasks?date=${dateStr}`);
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
      alert('The server took too long to respond. Please refresh the page in a few seconds once it wakes up!');
    } finally {
      clearTimeout(slowLoadTimer);
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    // Save inputs
    const title = newTaskTitle.trim();
    const minutes = newTaskMinutes;
    const priority = newTaskPriority;
    const recurring = isRecurring;
    const until = recurUntil;

    if (recurring && !until) {
      alert('Please select an end date for the recurring task.');
      return;
    }

    // Instantly clear the form for a snappy UI
    setNewTaskTitle('');
    setNewTaskMinutes('');
    setNewTaskPriority('normal');
    setIsRecurring(false);
    setRecurUntil('');

    try {
      if (recurring) {
        await api.post('/series', {
          title,
          priority,
          plannedMinutes: minutes ? parseInt(minutes, 10) : 0,
          startDate: dateStr,
          endDate: until
        });
        fetchTasks();
      } else {
        // Optimistic UI for single tasks: add a fake temporary task
        const tempId = Date.now().toString();
        const fakeTask = {
          _id: tempId,
          title,
          priority,
          plannedMinutes: minutes ? parseInt(minutes, 10) : 0,
          dueDate: dateStr,
          completed: false,
          rolloverCount: 0
        };
        setTasks(prev => [...prev, fakeTask]);

        const { data } = await api.post('/tasks', {
          title,
          dueDate: dateStr,
          priority,
          plannedMinutes: minutes ? parseInt(minutes, 10) : 0
        });
        
        // Replace fake task with real task
        setTasks(prev => prev.map(t => t._id === tempId ? data : t));
      }
    } catch (err) {
      if (err.response?.data?.error) {
        alert(err.response.data.error);
      } else {
        console.error('Failed to create task', err);
      }
      // Reload on failure to revert optimistic updates
      fetchTasks();
    }
  };

  const handleTaskUpdate = (updatedTask) => {
    if (updatedTask.dueDate !== dateStr) {
      setTasks(tasks.filter(t => t._id !== updatedTask._id));
    } else {
      setTasks(tasks.map(t => t._id === updatedTask._id ? updatedTask : t));
    }
  };

  const handleTaskDelete = (id) => {
    setTasks(tasks.filter(t => t._id !== id));
  };

  // Stats calculation
  const incompleteTasks = tasks.filter(t => !t.completed);
  const totalPlanned = incompleteTasks.reduce((sum, t) => sum + (t.plannedMinutes || 0), 0);
  const hasPlannedMinutes = incompleteTasks.some(t => t.plannedMinutes && t.plannedMinutes > 0);
  const rolledOverCount = incompleteTasks.filter(t => t.rolloverCount > 0).length;
  const capacity = user?.dailyCapacityMinutes ? parseInt(user.dailyCapacityMinutes, 10) : 480;
  const capacityPct = Math.min(100, Math.max(0, (totalPlanned / capacity) * 100));
  
  // Circle math for radial dial
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (capacityPct / 100) * circumference;

  const formatHours = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const plannedDisplay = formatHours(totalPlanned) || '0m';

  return (
    <div className="flex-1 flex flex-col w-full pb-24">
      
      {/* Hero Header */}
      <div className="mb-12 mt-6">
        <div className="text-[12px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">
          {selectedDate.format('dddd')}
        </div>
        <h2 className="text-[32px] font-[700] tracking-tight leading-none text-[var(--text)] mb-6">
          {selectedDate.format('D MMMM')}
        </h2>
        
        {/* Simple Inline Stat */}
        <div className="flex flex-col space-y-3">
          <div className="text-[13px] font-medium text-[var(--text-dim)]">
            Today's load — <span className="text-[var(--text)] font-semibold">{plannedDisplay}</span> of {formatHours(capacity)} planned
          </div>
          {/* 2px progress line */}
          <div className="h-[2px] w-full max-w-sm bg-[var(--field)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-700 ease-out" 
              style={{ width: `${capacityPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col mb-12">
        {loading ? (
          <div className="py-10 flex flex-col space-y-2">
            <div className="text-[var(--text-dim)] font-medium">Loading tasks...</div>
            {isWakingUp && (
              <div className="text-[13px] text-[var(--text-faint)]">
                Server is waking up from sleep mode (this takes ~45s on the free tier). Please hang tight!
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            
            <div className="w-full border-t border-[var(--border)]">
              {tasks.length === 0 ? (
                <div className="text-[var(--text-dim)] font-medium py-16 text-[13px]">No tasks scheduled for this day.</div>
              ) : (
                tasks.map(task => (
                  <TaskRow 
                    key={task._id} 
                    task={task} 
                    onUpdate={handleTaskUpdate}
                    onDelete={handleTaskDelete}
                  />
                ))
              )}
            </div>
            
            {/* Quick Add Form */}
            <form onSubmit={handleCreateTask} className="mt-0 border-t border-[var(--border)] pt-4 pb-4">
              <div className="flex items-center space-x-3 w-full bg-[var(--field)] p-1.5 pl-3 rounded-xl border border-[var(--border)] focus-within:border-[var(--border-strong)] transition-colors">
                <select 
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  className="bg-transparent font-medium text-[13px] text-[var(--text-dim)] outline-none cursor-pointer"
                >
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
                
                <input 
                  type="text"
                  placeholder="What needs to be done?"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 bg-transparent font-medium text-[var(--text)] text-[14px] outline-none placeholder:text-[var(--text-faint)]"
                />
                
                <input 
                  type="number"
                  placeholder="mins"
                  value={newTaskMinutes}
                  onChange={(e) => setNewTaskMinutes(e.target.value)}
                  className="w-16 bg-transparent font-medium text-[13px] text-[var(--text-dim)] outline-none text-right placeholder:text-[var(--text-faint)] tabular-nums"
                  min="0"
                  step="5"
                />

                <button 
                  type="button"
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`p-1.5 rounded transition-colors ${isRecurring ? 'text-[var(--accent)] bg-[var(--surface)] shadow-sm' : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface)]'}`}
                  title="Repeat daily"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
                </button>
                
                <button 
                  type="submit"
                  className="bg-[var(--text)] text-[var(--bg)] text-[13px] font-bold px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Add
                </button>
              </div>

              {/* Recurring Options Expansion */}
              {isRecurring && (
                <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center space-x-3 pl-11">
                  <span className="text-[13px] font-medium text-[var(--text-dim)]">Repeat daily until</span>
                  <input 
                    type="date"
                    value={recurUntil}
                    onChange={(e) => setRecurUntil(e.target.value)}
                    min={dateStr}
                    className="bg-[var(--field)] border border-[var(--border)] font-medium text-[var(--text)] text-[13px] rounded-lg px-3 py-1.5 outline-none focus:border-[var(--border-strong)]"
                    required
                  />
                </div>
              )}
            </form>
          </div>
        )}
      </div>
      
      {/* Date navigation */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-[var(--surface)] p-1.5 rounded-full border border-[var(--border)] z-50">
        <button 
          onClick={() => navigate(`/day/${selectedDate.subtract(1, 'day').format('YYYY-MM-DD')}`)}
          className="p-2 text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--field)] rounded-full transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button 
          onClick={() => navigate(`/day/${dayjs().format('YYYY-MM-DD')}`)}
          className="px-5 py-2 text-[13px] font-bold text-[var(--text)] hover:bg-[var(--field)] rounded-full transition-colors"
        >
          Today
        </button>
        <button 
          onClick={() => navigate(`/day/${selectedDate.add(1, 'day').format('YYYY-MM-DD')}`)}
          className="p-2 text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--field)] rounded-full transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );
};

export default DayView;
