import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Check, Clock, Repeat, Tag, StickyNote, Pill, Dumbbell, Briefcase, User, Coffee } from 'lucide-react';

const CATEGORIES = [
  { name: 'Medicine',    icon: Pill,      color: '#ff6b8a', bg: 'rgba(255,107,138,0.15)' },
  { name: 'Exercise',   icon: Dumbbell,  color: '#06d6a0', bg: 'rgba(6,214,160,0.15)' },
  { name: 'Work',       icon: Briefcase, color: '#9b51e0', bg: 'rgba(155,81,224,0.15)' },
  { name: 'Personal',   icon: User,      color: '#bb86fc', bg: 'rgba(187,134,252,0.15)' },
  { name: 'Meal',       icon: Coffee,    color: '#ffd166', bg: 'rgba(255,209,102,0.15)' },
];

const REPEAT_OPTIONS = [
  { value: 'daily',    label: 'Every Day' },
  { value: 'weekdays', label: 'Weekdays Only' },
  { value: 'once',     label: 'Once' },
];

function getCategoryMeta(name) {
  return CATEGORIES.find(c => c.name === name) || CATEGORIES[3];
}

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    time: '',
    repeat: 'daily',
    category: 'Medicine',
    notes: '',
  });

  useEffect(() => {
    fetch('/api/reminders')
      .then(res => res.json())
      .then(data => { setReminders(data); setLoading(false); })
      .catch(err => { console.error('Error fetching reminders:', err); setLoading(false); });
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.time) return;

    fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then(res => res.json())
      .then(data => {
        setReminders(prev => [...prev, data].sort((a, b) => (a.time || '').localeCompare(b.time || '')));
        setForm({ title: '', time: '', repeat: 'daily', category: 'Medicine', notes: '' });
        setShowForm(false);
      })
      .catch(err => console.error('Error adding reminder:', err));
  };

  const toggleReminder = (id) => {
    fetch(`/api/reminders/${id}/toggle`, { method: 'PUT' })
      .then(res => res.json())
      .then(updated => {
        setReminders(prev => prev.map(r => r.id === updated.id ? updated : r));
      })
      .catch(err => console.error('Error toggling reminder:', err));
  };

  const deleteReminder = (id) => {
    fetch(`/api/reminders/${id}`, { method: 'DELETE' })
      .then(() => setReminders(prev => prev.filter(r => r.id !== id)))
      .catch(err => console.error('Error deleting reminder:', err));
  };

  const doneCount = reminders.filter(r => r.done).length;
  const totalCount = reminders.length;

  // Group reminders by category
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = reminders.filter(r => r.category === cat.name);
    if (items.length > 0) acc.push({ cat, items });
    return acc;
  }, []);

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Reminders</h1>
          <p className="page-header-subtitle">Stay on top of your daily habits and health.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : <><Plus size={16} /> New Reminder</>}
        </button>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(155,81,224,0.15)' }}>
            <Bell size={24} color="var(--color-primary-light)" />
          </div>
          <div>
            <div className="stat-card-label">Total</div>
            <div className="stat-card-value">{totalCount}</div>
          </div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(6,214,160,0.15)' }}>
            <Check size={24} color="var(--color-accent)" />
          </div>
          <div>
            <div className="stat-card-label">Done Today</div>
            <div className="stat-card-value">{doneCount}</div>
          </div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(255,209,102,0.15)' }}>
            <Clock size={24} color="var(--color-warning)" />
          </div>
          <div>
            <div className="stat-card-label">Remaining</div>
            <div className="stat-card-value">{totalCount - doneCount}</div>
          </div>
        </div>
      </div>

      {/* Progress */}
      {totalCount > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Today's Completion</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-primary-light)', fontWeight: 600 }}>
              {doneCount}/{totalCount}
            </span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${Math.round((doneCount / totalCount) * 100)}%` }} />
          </div>
        </div>
      )}

      {/* Add Reminder Form */}
      {showForm && (
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <h3><span className="h3-icon"><Plus size={18} /></span>New Reminder</h3>
          <form onSubmit={handleAdd} style={{ marginTop: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <input
                type="text"
                placeholder="Reminder title (e.g. Take Vitamin D)"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                style={{ flex: '2 1 240px' }}
                required
              />
              <input
                type="time"
                value={form.time}
                onChange={e => setForm({ ...form, time: e.target.value })}
                style={{ flex: '1 1 130px' }}
                required
              />
            </div>

            {/* Category Picker */}
            <div style={{ marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>Category</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const selected = form.category === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat.name })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.4rem 0.9rem',
                        borderRadius: '99px',
                        border: selected ? `2px solid ${cat.color}` : '2px solid transparent',
                        background: selected ? cat.bg : 'rgba(255,255,255,0.04)',
                        color: selected ? cat.color : 'var(--color-text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        transition: 'all 0.2s ease',
                        fontFamily: 'var(--font-main)',
                      }}
                    >
                      <Icon size={14} /> {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Repeat Picker */}
            <div style={{ marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>Repeat</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {REPEAT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, repeat: opt.value })}
                    style={{
                      padding: '0.4rem 0.9rem',
                      borderRadius: '99px',
                      border: form.repeat === opt.value ? '2px solid var(--color-primary)' : '2px solid transparent',
                      background: form.repeat === opt.value ? 'rgba(155,81,224,0.15)' : 'rgba(255,255,255,0.04)',
                      color: form.repeat === opt.value ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                      fontFamily: 'var(--font-main)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              placeholder="Notes (optional, e.g. Take with water)"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              style={{ marginBottom: '1rem' }}
            />

            <button type="submit" className="btn-primary">
              <Plus size={16} /> Add Reminder
            </button>
          </form>
        </div>
      )}

      {/* Reminder Cards */}
      {loading && (
        <div className="empty-state" style={{ padding: '4rem' }}>
          <span className="empty-state-icon">⏳</span>
          <p className="empty-state-text">Loading reminders…</p>
        </div>
      )}

      {!loading && reminders.length === 0 && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔔</div>
          <h2 style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>No reminders yet</h2>
          <p style={{ color: 'var(--color-text-dim)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            Click "New Reminder" to create your first one — like your medicine or workout!
          </p>
        </div>
      )}

      {!loading && grouped.map(({ cat, items }) => {
        const Icon = cat.icon;
        return (
          <div key={cat.name} style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon size={15} color={cat.color} />
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: cat.color }}>{cat.name}</span>
              <span className="badge badge-purple" style={{ marginLeft: 'auto' }}>{items.length}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {items.map(reminder => (
                <div
                  key={reminder.id}
                  className="glass-panel"
                  style={{
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    opacity: reminder.done ? 0.55 : 1,
                    borderColor: reminder.done ? 'rgba(6,214,160,0.2)' : 'rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => toggleReminder(reminder.id)}
                >
                  {/* Check button */}
                  <button
                    className="task-check-btn"
                    onClick={e => { e.stopPropagation(); toggleReminder(reminder.id); }}
                    style={{ flexShrink: 0 }}
                  >
                    {reminder.done
                      ? <div style={{
                          width: 26, height: 26, borderRadius: '50%',
                          background: 'rgba(6,214,160,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Check size={16} color="var(--color-accent)" />
                        </div>
                      : <div style={{
                          width: 26, height: 26, borderRadius: '50%',
                          border: `2px solid ${cat.color}44`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }} />
                    }
                  </button>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      textDecoration: reminder.done ? 'line-through' : 'none',
                      color: reminder.done ? 'var(--color-text-muted)' : 'var(--color-text)',
                    }}>
                      {reminder.title}
                    </div>
                    {reminder.notes && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', marginTop: '0.15rem' }}>
                        {reminder.notes}
                      </div>
                    )}
                  </div>

                  {/* Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                    {reminder.time && (
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500
                      }}>
                        <Clock size={13} /> {reminder.time}
                      </span>
                    )}
                    <span className={`badge ${reminder.repeat === 'daily' ? 'badge-purple' : reminder.repeat === 'weekdays' ? 'badge-green' : 'badge-yellow'}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Repeat size={11} />
                      {REPEAT_OPTIONS.find(o => o.value === reminder.repeat)?.label || reminder.repeat}
                    </span>
                    <button
                      className="btn-icon"
                      onClick={e => { e.stopPropagation(); deleteReminder(reminder.id); }}
                      title="Delete reminder"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
