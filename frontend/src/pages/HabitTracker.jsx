import React, { useState, useEffect } from 'react';
import { Flame, Plus, Trash2, Check } from 'lucide-react';

const COLORS = ['#9b51e0','#06d6a0','#ffd166','#bb86fc','#ff6b8a','#60a5fa','#f97316'];
const ICONS  = ['💪','📚','💧','🧘','😴','❤️','🎯','🏃','✍️','🍎'];

function computeStreak(completions = []) {
  const set = new Set(completions);
  const toStr = (d) => d.toISOString().split('T')[0];
  let streak = 0;
  const cursor = new Date(); cursor.setHours(0,0,0,0);
  if (!set.has(toStr(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (set.has(toStr(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}

function Heatmap({ completions = [], color }) {
  const cells = [];
  const today = new Date(); today.setHours(0,0,0,0);
  const set = new Set(completions);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const done = set.has(dateStr);
    cells.push(
      <div
        key={dateStr}
        title={dateStr}
        style={{
          width: 14, height: 14, borderRadius: 3,
          background: done ? color : 'rgba(255,255,255,0.07)',
          boxShadow: done ? `0 0 6px ${color}88` : 'none',
          transition: 'all 0.2s ease',
        }}
      />
    );
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: '0.75rem' }}>
      {cells}
    </div>
  );
}

export default function HabitTracker() {
  const [habits, setHabits] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', color: '#9b51e0', icon: '💪' });
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetch('/api/habits').then(r => r.json()).then(setHabits).catch(console.error);
  }, []);

  const addHabit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    fetch('/api/habits', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(r => r.json()).then(h => {
      setHabits(prev => [...prev, h]);
      setForm({ name: '', color: '#9b51e0', icon: '💪' });
      setShowForm(false);
    });
  };

  const checkHabit = (id) => {
    fetch(`/api/habits/${id}/check`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today }),
    }).then(r => r.json()).then(updated => setHabits(prev => prev.map(h => h.id === updated.id ? updated : h)));
  };

  const deleteHabit = (id) => {
    fetch(`/api/habits/${id}`, { method: 'DELETE' })
      .then(() => setHabits(prev => prev.filter(h => h.id !== id)));
  };

  const totalStreak = habits.reduce((s, h) => s + computeStreak(h.completions), 0);
  const doneToday = habits.filter(h => h.completions?.includes(today)).length;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Habit Tracker</h1>
          <p className="page-header-subtitle">Build consistency, one day at a time.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : <><Plus size={16} /> New Habit</>}
        </button>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(255,209,102,0.15)' }}><Flame size={24} color="var(--color-warning)" /></div>
          <div><div className="stat-card-label">Total Streak Days</div><div className="stat-card-value">{totalStreak}</div></div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(6,214,160,0.15)' }}><Check size={24} color="var(--color-accent)" /></div>
          <div><div className="stat-card-label">Done Today</div><div className="stat-card-value">{doneToday}/{habits.length}</div></div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(155,81,224,0.15)' }}><Plus size={24} color="var(--color-primary-light)" /></div>
          <div><div className="stat-card-label">Habits Tracked</div><div className="stat-card-value">{habits.length}</div></div>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <h3><span className="h3-icon"><Plus size={18} /></span>New Habit</h3>
          <form onSubmit={addHabit} style={{ marginTop: '0.75rem' }}>
            <input type="text" placeholder="Habit name (e.g. Drink 8 glasses of water)" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} style={{ marginBottom: '0.75rem' }} required />

            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: '0.5rem' }}>Pick an icon</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setForm({ ...form, icon: ic })}
                  style={{ fontSize: '1.3rem', padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-sm)', border: form.icon === ic ? '2px solid var(--color-primary)' : '2px solid transparent', background: form.icon === ic ? 'rgba(155,81,224,0.15)' : 'rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                  {ic}
                </button>
              ))}
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: '0.5rem' }}>Pick a color</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                  style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '2px solid transparent', cursor: 'pointer', boxShadow: form.color === c ? `0 0 10px ${c}` : 'none', transition: 'all 0.15s ease' }} />
              ))}
            </div>
            <button type="submit" className="btn-primary"><Plus size={16} /> Add Habit</button>
          </form>
        </div>
      )}

      {/* Habit Cards */}
      {habits.length === 0 && !showForm && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🏆</div>
          <h2 style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>No habits yet</h2>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Click "New Habit" to start tracking your daily habits!</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {habits.map(habit => {
          const streak = computeStreak(habit.completions);
          const doneNow = habit.completions?.includes(today);
          return (
            <div key={habit.id} className="glass-panel" style={{ borderColor: doneNow ? `${habit.color}33` : 'rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                {/* Icon */}
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: `${habit.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                  {habit.icon}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{habit.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-warning)', fontWeight: 700 }}>
                        🔥 {streak} day{streak !== 1 ? 's' : ''}
                      </span>
                      <button className="btn-icon" onClick={() => deleteHabit(habit.id)} title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  {/* 30-day heatmap */}
                  <Heatmap completions={habit.completions} color={habit.color} />
                </div>
              </div>
              {/* Check button */}
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => checkHabit(habit.id)}
                  className={doneNow ? 'btn-ghost' : 'btn-primary'}
                  style={doneNow ? { borderColor: habit.color, color: habit.color } : {}}
                >
                  {doneNow ? <><Check size={16} /> Done Today!</> : 'Mark Done Today'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
