import { useState } from 'react';
import dayjs from 'dayjs';
import api from '../api/api';

const TaskRow = ({ task, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editMinutes, setEditMinutes] = useState(task.plannedMinutes || '');
  const [editPriority, setEditPriority] = useState(task.priority);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [customRescheduleDate, setCustomRescheduleDate] = useState('');

  const toggleComplete = async () => {
    const prevCompleted = task.completed;
    onUpdate({ ...task, completed: !prevCompleted }); // Optimistic update
    try {
      await api.patch(`/tasks/${task._id}`, { completed: !prevCompleted });
    } catch (err) {
      console.error(err);
      onUpdate({ ...task, completed: prevCompleted }); // Revert on error
    }
  };

  const handleSaveEdit = async () => {
    try {
      const res = await api.patch(`/tasks/${task._id}`, {
        title: editTitle,
        plannedMinutes: editMinutes ? parseInt(editMinutes, 10) : 0,
        priority: editPriority
      });
      onUpdate(res.data);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = () => {
    onDelete(task._id);
  };

  const handleReschedule = async (days) => {
    try {
      const newDate = dayjs(task.dueDate).add(days, 'day').format('YYYY-MM-DD');
      const res = await api.patch(`/tasks/${task._id}`, { dueDate: newDate, rolloverCount: 0 }); 
      onUpdate(res.data);
      setIsRescheduling(false);
      setExpanded(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCustomReschedule = async () => {
    if (!customRescheduleDate) return;
    try {
      const res = await api.patch(`/tasks/${task._id}`, { dueDate: customRescheduleDate, rolloverCount: 0 });
      onUpdate(res.data);
      setIsRescheduling(false);
      setExpanded(false);
    } catch (err) {
      console.error(err);
    }
  };

  const priorityColors = {
    high: { bg: 'rgba(255,107,92,0.14)', text: 'var(--high)', label: 'High' },
    normal: { bg: 'rgba(154,155,163,0.14)', text: 'var(--normal)', label: 'Normal' },
    low: { bg: 'rgba(85,86,92,0.14)', text: 'var(--low)', label: 'Low' }
  };

  const isRolledOver = task.rolloverCount > 0;
  const needsNudge = task.rolloverCount >= 3;

  const formatBadgeTime = (mins) => {
    if (mins >= 60 && mins % 60 === 0) return `${mins/60}H`;
    if (mins > 60) return `${Math.floor(mins/60)}H ${mins%60}M`;
    return `${mins}M`;
  };

  if (isEditing) {
    return (
      <div className="border-b border-[var(--border)] last:border-b-0 py-3.5 px-3 bg-[var(--field)] transition-colors">
        <div className="flex items-center space-x-3 w-full">
          <select 
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value)}
            className="bg-transparent font-medium text-[13px] text-[var(--text-dim)] outline-none cursor-pointer"
          >
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
          
          <input 
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="flex-1 bg-transparent font-medium text-[var(--text)] text-[14px] outline-none placeholder:text-[var(--text-faint)]"
            autoFocus
          />
          
          <input 
            type="number"
            placeholder="mins"
            value={editMinutes}
            onChange={(e) => setEditMinutes(e.target.value)}
            className="w-16 bg-transparent font-medium text-[13px] text-[var(--text-dim)] outline-none text-right placeholder:text-[var(--text-faint)] tabular-nums"
            min="0"
            step="5"
          />

          <div className="flex space-x-2 ml-2">
            <button onClick={() => setIsEditing(false)} className="text-[12px] font-bold text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">Cancel</button>
            <button onClick={handleSaveEdit} className="bg-[var(--accent)] text-[#FAF9F6] text-[12px] font-bold px-3 py-1 rounded transition-opacity hover:opacity-90">Save</button>
          </div>
        </div>
      </div>
    );
  }

  if (isRescheduling) {
    return (
      <div className="border-b border-[var(--border)] last:border-b-0 py-3.5 px-3 bg-[var(--field)] transition-colors">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => handleReschedule(1)}
              className="text-xs font-semibold px-3 py-1.5 rounded-md bg-[var(--surface)] text-[var(--text)] hover:text-[var(--accent)] transition-colors border border-[var(--border)] shadow-sm"
            >
              Move to tomorrow
            </button>
            <span className="text-[12px] font-medium text-[var(--text-faint)]">or pick date:</span>
            <input 
              type="date"
              value={customRescheduleDate}
              onChange={(e) => setCustomRescheduleDate(e.target.value)}
              className="bg-transparent border border-[var(--border)] font-medium text-[var(--text)] text-[12px] rounded-md px-2 py-1 outline-none focus:border-[var(--border-strong)]"
            />
            {customRescheduleDate && (
              <button 
                onClick={handleCustomReschedule}
                className="bg-[var(--accent)] text-[#FAF9F6] text-[12px] font-bold px-3 py-1 rounded transition-opacity hover:opacity-90"
              >
                Move
              </button>
            )}
          </div>
          <button onClick={() => setIsRescheduling(false)} className="text-[12px] font-bold text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group border-b border-[var(--border)] last:border-b-0 py-3.5 px-3 transition-colors">
      <div className="flex items-center w-full">
        <button 
          onClick={toggleComplete}
          className={`flex-shrink-0 w-5 h-5 rounded-[6px] border-[1.5px] flex items-center justify-center mr-3.5 transition-colors ${task.completed ? 'border-[var(--done)] bg-[var(--done)]' : 'border-[var(--border-strong)] hover:border-[var(--text-dim)]'}`}
        >
          {task.completed && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 6.5L5 9L9.5 3" stroke="#16110D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0 flex items-center flex-wrap gap-2">
          <h3 className={`text-[14px] font-medium truncate transition-all ${task.completed === true ? 'line-through opacity-50 text-[var(--text-faint)]' : 'text-[var(--text)]'}`}>
            {task.title}
          </h3>
          
          {/* Tags */}
          {!task.completed && (
            <div className="flex items-center space-x-2">
              <span 
                className="text-[11px] font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-wide"
                style={{ backgroundColor: priorityColors[task.priority].bg, color: priorityColors[task.priority].text }}
              >
                {priorityColors[task.priority].label}
              </span>
              
              {isRolledOver && (
                <span 
                  onClick={() => needsNudge && setExpanded(!expanded)}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-wide ${needsNudge ? 'cursor-pointer hover:opacity-80' : ''}`}
                  style={{ backgroundColor: 'rgba(255,107,71,0.14)', color: 'var(--accent)' }}
                >
                  {needsNudge ? `Rolled ${task.rolloverCount}× · Act now` : `Rolled ${task.rolloverCount}×`}
                </span>
              )}

              {task.plannedMinutes > 0 && (
                <span 
                  className="text-[11px] font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-wide"
                  style={{ backgroundColor: 'rgba(154,155,163,0.14)', color: 'var(--normal)' }}
                >
                  {formatBadgeTime(task.plannedMinutes)}
                </span>
              )}
            </div>
          )}
        </div>


        
        <div className="opacity-30 group-hover:opacity-100 flex items-center space-x-1 ml-4 transition-all focus-within:opacity-100">
          <button 
            onClick={() => setIsRescheduling(true)}
            className="p-1.5 flex-shrink-0 text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface)] rounded transition-colors"
            title="Reschedule Task"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          </button>
          <button 
            onClick={() => setIsEditing(true)}
            className="p-1.5 flex-shrink-0 text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface)] rounded transition-colors"
            title="Edit Task"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </button>
          <button 
            onClick={handleDelete}
            className="p-1.5 flex-shrink-0 text-[var(--text-dim)] hover:text-[var(--high)] hover:bg-[var(--surface)] rounded transition-colors"
            title="Delete Task"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>

      {expanded && needsNudge && !task.completed && (
        <div className="pl-[34px] pr-2 mt-3 flex space-x-2">
          <button onClick={() => handleReschedule(1)} className="text-xs font-semibold px-3 py-1.5 rounded-md bg-[var(--field)] text-[var(--text)] hover:bg-[var(--accent)] hover:text-[#16110D] transition-colors border border-[var(--border)]">Reschedule Tomorrow</button>
          <button className="text-xs font-semibold px-3 py-1.5 rounded-md bg-[var(--field)] text-[var(--text)] hover:bg-[var(--accent)] hover:text-[#16110D] transition-colors border border-[var(--border)]">Split (Manual)</button>
          <button onClick={handleDelete} className="text-xs font-semibold px-3 py-1.5 rounded-md bg-[var(--field)] text-[var(--high)] hover:bg-[var(--high)] hover:text-[#16110D] transition-colors border border-[var(--border)]">Drop Task</button>
        </div>
      )}
    </div>
  );
};

export default TaskRow;
