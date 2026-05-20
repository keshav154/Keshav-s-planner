import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, CalendarDays, Clock, ListChecks, Zap, Pencil, X, Check } from 'lucide-react';

const BLOCK_COLORS = ['#9b51e0', '#06d6a0', '#ffd166', '#bb86fc', '#ff6b8a', '#60a5fa', '#f97316'];

// ── Time Block Form (Add / Edit) ──────────────────────────
function TimeBlockForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { time: '', label: '', sub: '', color: '#9b51e0' });

  return (
    <div style={{
      background: 'rgba(155,81,224,0.07)',
      border: '1px solid rgba(155,81,224,0.2)',
      borderRadius: 'var(--radius-md)',
      padding: '1rem',
      marginBottom: '0.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.6rem',
    }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="time"
          value={form.time}
          onChange={e => setForm({ ...form, time: e.target.value })}
          style={{ flex: '0 0 110px' }}
          required
        />
        <input
          type="text"
          placeholder="Label (e.g. Deep Work)"
          value={form.label}
          onChange={e => setForm({ ...form, label: e.target.value })}
          style={{ flex: 1 }}
          required
        />
      </div>
      <input
        type="text"
        placeholder="Description (optional)"
        value={form.sub}
        onChange={e => setForm({ ...form, sub: e.target.value })}
      />
      {/* Color picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Color:</span>
        {BLOCK_COLORS.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => setForm({ ...form, color: c })}
            style={{
              width: 20, height: 20, borderRadius: '50%', background: c,
              border: form.color === c ? '3px solid white' : '2px solid transparent',
              cursor: 'pointer', flexShrink: 0,
              boxShadow: form.color === c ? `0 0 8px ${c}` : 'none',
              transition: 'all 0.15s ease',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          className="btn-primary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          onClick={() => form.time && form.label && onSave(form)}
        >
          <Check size={15} /> Save
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main DailyPlanner ─────────────────────────────────────
export default function DailyPlanner() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loadingTasks, setLoadingTasks] = useState(true);

  const [timeBlocks, setTimeBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState(null);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const completed = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  // Fetch tasks
  useEffect(() => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => { setTasks(data); setLoadingTasks(false); })
      .catch(() => setLoadingTasks(false));
  }, []);

  // Fetch time blocks
  useEffect(() => {
    fetch('/api/timeblocks')
      .then(res => res.json())
      .then(data => { setTimeBlocks(data); setLoadingBlocks(false); })
      .catch(() => setLoadingBlocks(false));
  }, []);

  // ── Task actions ──────────────────────────────────────────
  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newTask.trim() })
    })
      .then(res => res.json())
      .then(data => { setTasks([data, ...tasks]); setNewTask(''); })
      .catch(err => console.error('Error adding task:', err));
  };

  const toggleTask = (id) => {
    const task = tasks.find(t => t.id === id);
    fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed })
    })
      .then(() => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)))
      .catch(err => console.error('Error updating task:', err));
  };

  const deleteTask = (id) => {
    fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      .then(() => setTasks(tasks.filter(t => t.id !== id)))
      .catch(err => console.error('Error deleting task:', err));
  };

  // ── Time block actions ────────────────────────────────────
  const addTimeBlock = (form) => {
    fetch('/api/timeblocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then(res => res.json())
      .then(block => {
        setTimeBlocks(prev => [...prev, block].sort((a, b) => a.time.localeCompare(b.time)));
        setShowAddBlock(false);
      })
      .catch(err => console.error('Error adding block:', err));
  };

  const saveEditBlock = (form) => {
    fetch(`/api/timeblocks/${editingBlockId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then(res => res.json())
      .then(updated => {
        setTimeBlocks(prev =>
          prev.map(b => b.id === updated.id ? updated : b)
              .sort((a, b) => a.time.localeCompare(b.time))
        );
        setEditingBlockId(null);
      })
      .catch(err => console.error('Error updating block:', err));
  };

  const deleteTimeBlock = (id) => {
    fetch(`/api/timeblocks/${id}`, { method: 'DELETE' })
      .then(() => setTimeBlocks(prev => prev.filter(b => b.id !== id)))
      .catch(err => console.error('Error deleting block:', err));
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Daily Planner</h1>
          <p className="page-header-subtitle">
            <CalendarDays size={14} style={{ display: 'inline', marginRight: 5 }} />
            {today}
          </p>
        </div>
      </div>

      {/* Stat Row */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(155,81,224,0.15)' }}>
            <ListChecks size={24} color="var(--color-primary-light)" />
          </div>
          <div>
            <div className="stat-card-label">Total Tasks</div>
            <div className="stat-card-value">{tasks.length}</div>
          </div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(6,214,160,0.15)' }}>
            <CheckCircle2 size={24} color="var(--color-accent)" />
          </div>
          <div>
            <div className="stat-card-label">Completed</div>
            <div className="stat-card-value">{completed}</div>
          </div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(255,209,102,0.15)' }}>
            <Zap size={24} color="var(--color-warning)" />
          </div>
          <div>
            <div className="stat-card-label">Progress</div>
            <div className="stat-card-value">{progress}%</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Today's Progress</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-primary-light)', fontWeight: 600 }}>{progress}%</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid-2">
        {/* Task List */}
        <div className="glass-panel">
          <h3>
            <span className="h3-icon"><ListChecks size={18} /></span>
            Today's Tasks
          </h3>
          <form onSubmit={addTask} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <input
              type="text"
              placeholder="Add a new task…"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0.7rem 1rem', flexShrink: 0 }}>
              <Plus size={18} />
            </button>
          </form>
          <div className="task-list">
            {loadingTasks && <div className="empty-state"><span className="empty-state-icon">⏳</span><p className="empty-state-text">Loading…</p></div>}
            {!loadingTasks && tasks.length === 0 && (
              <div className="empty-state"><span className="empty-state-icon">✨</span><p className="empty-state-text">No tasks yet. Add something to get started!</p></div>
            )}
            {tasks.map(task => (
              <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`} onClick={() => toggleTask(task.id)}>
                <button className="task-check-btn" onClick={e => { e.stopPropagation(); toggleTask(task.id); }}>
                  {task.completed
                    ? <CheckCircle2 size={22} color="var(--color-accent)" />
                    : <Circle size={22} color="var(--color-text-dim)" />}
                </button>
                <span className="task-text">{task.text}</span>
                <button className="btn-icon" onClick={e => { e.stopPropagation(); deleteTask(task.id); }} title="Delete task">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Time Blocking — fully editable */}
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>
              <span className="h3-icon"><Clock size={18} /></span>
              Time Blocking
            </h3>
            <button
              className="btn-ghost"
              style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              onClick={() => { setShowAddBlock(true); setEditingBlockId(null); }}
            >
              <Plus size={14} /> Add Block
            </button>
          </div>

          {/* Add form */}
          {showAddBlock && (
            <TimeBlockForm
              onSave={addTimeBlock}
              onCancel={() => setShowAddBlock(false)}
            />
          )}

          {/* Block list */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {loadingBlocks && <div className="empty-state"><span className="empty-state-icon">⏳</span><p className="empty-state-text">Loading…</p></div>}
            {!loadingBlocks && timeBlocks.length === 0 && !showAddBlock && (
              <div className="empty-state"><span className="empty-state-icon">🕐</span><p className="empty-state-text">No time blocks yet. Click "Add Block" to build your schedule!</p></div>
            )}
            {timeBlocks.map(block => (
              <div key={block.id}>
                {editingBlockId === block.id ? (
                  <TimeBlockForm
                    initial={block}
                    onSave={saveEditBlock}
                    onCancel={() => setEditingBlockId(null)}
                  />
                ) : (
                  <div
                    className="time-block"
                    style={{ alignItems: 'center' }}
                    onMouseEnter={e => e.currentTarget.querySelector('.tb-actions').style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.querySelector('.tb-actions').style.opacity = 0}
                  >
                    <span className="time-block-time">{block.time}</span>
                    <span className="time-block-dot" style={{ background: block.color, boxShadow: `0 0 8px ${block.color}88` }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="time-block-label">{block.label}</div>
                      {block.sub && <div className="time-block-sub">{block.sub}</div>}
                    </div>
                    {/* Hover action buttons */}
                    <div className="tb-actions" style={{ display: 'flex', gap: '0.25rem', opacity: 0, transition: 'opacity 0.2s ease', flexShrink: 0 }}>
                      <button
                        className="btn-icon"
                        style={{ color: 'var(--color-text-muted)' }}
                        onClick={() => { setEditingBlockId(block.id); setShowAddBlock(false); }}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => deleteTimeBlock(block.id)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
