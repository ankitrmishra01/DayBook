import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import TaskRow from '../components/TaskRow';
import UpcomingPanel from '../components/UpcomingPanel';

const DayView = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const selectedDate = date ? dayjs(date) : dayjs();
  const dateStr = selectedDate.format('YYYY-MM-DD');

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | high | rolled
  const [activeIndex, setActiveIndex] = useState(-1);
  
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
    fetchTasks(date);
  }, [date]);

  const [isWakingUp, setIsWakingUp] = useState(false);

  const fetchTasks = async (fetchDate = dateStr) => {
    setLoading(true);
    setIsWakingUp(false);
    
    // If it takes more than 3 seconds, the server is probably doing a cold start
    const slowLoadTimer = setTimeout(() => {
      setIsWakingUp(true);
    }, 3000);

    try {
      const { data } = await api.get(`/tasks?date=${fetchDate}`);
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

  const pendingRestoreRef = useRef(null);
  const undoTimerRef = useRef(null);
  const [toast, setToast] = useState(null);

  const handleTaskDelete = async (id) => {
    const taskToDelete = tasks.find(t => t._id === id);
    if (!taskToDelete) return;

    // Optimistically remove from UI
    setTasks(prev => prev.filter(t => t._id !== id));

    // Store for potential undo
    pendingRestoreRef.current = taskToDelete;
    setToast(taskToDelete);

    // Immediately execute backend delete
    try {
      await api.delete(`/tasks/${id}`);
    } catch (err) {
      console.error('Delete failed', err);
    }

    // Auto dismiss toast after 5s
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setToast(null);
      pendingRestoreRef.current = null;
    }, 5000);
  };

  const handleUndo = async () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    const restored = pendingRestoreRef.current;
    if (!restored) return;
    
    setToast(null);
    pendingRestoreRef.current = null;
    
    // Put back optimistically (using old ID temporarily)
    setTasks(prev => {
      const newTasks = [...prev, restored];
      return newTasks.sort((a, b) => {
        if (a.createdAt && b.createdAt) return a.createdAt > b.createdAt ? 1 : -1;
        return 0;
      });
    });

    try {
      // Re-create the full task via our new restore route (omitting old ID to let Mongo generate a new one, or keeping it depending on schema - mongoose handles the rest)
      const { _id, ...taskData } = restored;
      const { data: newRestoredTask } = await api.post('/tasks/restore', taskData);
      
      // Update with the actual restored task to sync the new ID
      setTasks(current => current.map(t => t._id === restored._id ? newRestoredTask : t).sort((a, b) => {
        if (a.createdAt && b.createdAt) return a.createdAt > b.createdAt ? 1 : -1;
        return 0;
      }));
    } catch (err) {
      console.error('Restore failed', err);
      // Rollback optimism
      setTasks(prev => prev.filter(t => t._id !== restored._id));
      alert('Failed to restore task.');
    }
  };

  useEffect(() => {
    return () => {
      if (pendingRestoreRef.current) {
        // Soft delete wasn't fully restored, actually it's already deleted in the backend immediately.
        // We do nothing on unmount now since the backend was already updated.
      }
    };
  }, []);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const filteredTasks = tasks.filter(t => {
    if (filter === 'high') return t.priority === 'high';
    if (filter === 'rolled') return t.rolloverCount > 0;
    return true;
  });

  useEffect(() => {
    const handleTaskCreated = () => {
      if (dateStr === dayjs().format('YYYY-MM-DD')) {
        fetchTasks(dateStr);
      }
    };
    window.addEventListener('taskCreated', handleTaskCreated);
    return () => window.removeEventListener('taskCreated', handleTaskCreated);
  }, [dateStr]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = async (e) => {
      // Ignore if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      if (e.key === 'j') {
        setActiveIndex(prev => Math.min(prev + 1, filteredTasks.length - 1));
      } else if (e.key === 'k') {
        setActiveIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'd') {
        if (activeIndex >= 0 && activeIndex < filteredTasks.length) {
          const task = filteredTasks[activeIndex];
          try {
            const res = await api.patch(`/tasks/${task._id}`, { completed: !task.completed });
            handleTaskUpdate(res.data);
          } catch (err) {
            console.error('Failed to toggle completion via shortcut', err);
          }
        }
      } else if (e.key === 'e') {
        if (activeIndex >= 0 && activeIndex < filteredTasks.length) {
          const task = filteredTasks[activeIndex];
          window.dispatchEvent(new CustomEvent('editTask', { detail: task._id }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, filteredTasks]);



  return (
    <div className="flex-1 flex flex-col w-full max-w-[900px] mx-auto pb-24 items-start xl:flex-row xl:gap-12">
      <div className="flex flex-col w-full min-w-0 xl:flex-1 pb-24">
      {/* Hero Header */}
      <div className="mb-10 mt-6">
        <div className="text-[12px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">
          {selectedDate.format('dddd')}
        </div>
        <h2 className="text-[32px] font-[700] tracking-tight leading-none text-[var(--text)] mb-6">
          {selectedDate.format('D MMMM')}
        </h2>
        
        {/* Quick Filters */}
        <div className="flex items-center gap-2 mb-6 mt-4">
          <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors ${filter === 'all' ? 'bg-[var(--text)] text-[var(--bg)]' : 'bg-[var(--field)] text-[var(--text-dim)] hover:text-[var(--text)]'}`}>
            All
          </button>
          <button onClick={() => setFilter('high')} className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors ${filter === 'high' ? 'bg-[var(--text)] text-[var(--bg)]' : 'bg-[var(--field)] text-[var(--text-dim)] hover:text-[var(--text)]'}`}>
            High Priority
          </button>
          <button onClick={() => setFilter('rolled')} className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors ${filter === 'rolled' ? 'bg-[var(--text)] text-[var(--bg)]' : 'bg-[var(--field)] text-[var(--text-dim)] hover:text-[var(--text)]'}`}>
            Rolled
          </button>
        </div>
        
        {/* Progress Card */}
        <div className="inline-flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-[14px] px-5 py-3.5 shadow-sm">
          {totalCount > 0 && completedCount === totalCount ? (
            <div className="flex items-center space-x-2.5 text-[var(--done)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span className="text-[15px] font-bold tracking-wide">All done</span>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <div className="text-[13px] font-bold px-2.5 py-1 rounded-[8px] tracking-wide bg-[var(--field)] text-[var(--text)] border border-[var(--border-strong)]">
                {completedCount}/{totalCount}
              </div>
              <div className="h-[8px] w-[140px] sm:w-[180px] bg-[var(--field)] rounded-full overflow-hidden border border-[var(--border-strong)]">
                <div 
                  className="h-full bg-[var(--done)] rounded-full transition-all duration-700 ease-out" 
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
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
              {loading && !isWakingUp ? (
                <div className="text-[13px] font-medium text-[var(--text-dim)] text-center py-8">Loading...</div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-[14px] font-bold text-[var(--text-dim)] mb-1">
                    {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
                  </div>
                  <div className="text-[12px] text-[var(--text-faint)]">
                    {filter === 'all' ? 'What needs to be done?' : 'Try changing your filter.'}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-[var(--border)] border-t border-[var(--border)]">
                {filteredTasks.map((task, index) => (
                  <TaskRow 
                    key={task._id} 
                    task={task} 
                    isActive={activeIndex === index}
                    onUpdate={handleTaskUpdate}
                    onDelete={handleTaskDelete}
                  />
                ))}
              </div>
              )}
            </div>
            
            {/* Quick Add Form */}
            <form onSubmit={handleCreateTask} className="mt-0 border-t border-[var(--border)] pt-4 pb-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full bg-[var(--field)] p-2 sm:p-1.5 sm:pl-3 rounded-xl border border-[var(--border)] focus-within:border-[var(--border-strong)] transition-colors">
                
                <input 
                  type="text"
                  placeholder="What needs to be done?"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full sm:flex-1 bg-transparent font-medium text-[var(--text)] text-[14px] outline-none placeholder:text-[var(--text-faint)] px-2 sm:px-0 py-1 sm:py-0"
                />
                
                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto border-t sm:border-t-0 border-[var(--border)] pt-2 sm:pt-0">
                  <select 
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="bg-transparent font-medium text-[13px] text-[var(--text-dim)] outline-none cursor-pointer"
                  >
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                  
                  <div className="flex items-center gap-2">
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
                </div>
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
      
      <UpcomingPanel activeDateStr={dateStr} />

      {/* Date navigation */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-50 pointer-events-none">
        
        {toast && (
          <div className="pointer-events-auto mb-4 flex items-center justify-between bg-[var(--surface-3)] border border-[var(--border)] shadow-lg px-4 py-2.5 rounded-xl w-64 animate-in slide-in-from-bottom-2 fade-in duration-300">
            <span className="text-[13px] font-medium text-[var(--text)] truncate mr-3">Task deleted</span>
            <button onClick={handleUndo} className="text-[13px] font-bold text-[var(--accent)] hover:opacity-80 transition-opacity">
              Undo
            </button>
          </div>
        )}

        <div className="pointer-events-auto flex items-center space-x-2 bg-[var(--surface)] p-1.5 rounded-full border border-[var(--border)]">
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
    </div>
    </div>
  );
};

export default DayView;
