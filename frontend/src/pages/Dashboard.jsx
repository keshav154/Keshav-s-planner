import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Sunset, Moon, CheckCircle2, Circle, DollarSign, Bell, Flame, ListChecks, ArrowRight } from 'lucide-react';

const QUOTES = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "It does not matter how slowly you go as long as you do not stop. — Confucius",
  "Small daily improvements are the key to staggering long-term results.",
  "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
  "Success is the sum of small efforts repeated day in and day out.",
  "Your future is created by what you do today, not tomorrow.",
  "Discipline is choosing between what you want now and what you want most.",
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', Icon: Sun, color: '#ffd166' };
  if (h < 17) return { text: 'Good afternoon', Icon: Sunset, color: '#f97316' };
  return { text: 'Good evening', Icon: Moon, color: '#9b51e0' };
}

const fmt = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export default function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  const { text: greeting, Icon: GreetIcon, color: greetColor } = getGreeting();
  const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const quote = QUOTES[new Date().getDay()];

  useEffect(() => {
    Promise.all([
      fetch('/api/tasks').then(r => r.json()),
      fetch('/api/reminders').then(r => r.json()),
      fetch('/api/expenses').then(r => r.json()),
      fetch('/api/habits').then(r => r.json()),
    ]).then(([t, r, e, h]) => {
      setTasks(t); setReminders(r); setExpenses(e); setHabits(h); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const toggleTask = (id) => {
    const task = tasks.find(t => t.id === id);
    fetch(`/api/tasks/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed }),
    }).then(() => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const completedTasks = tasks.filter(t => t.completed).length;
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthlySpend = expenses.filter(e => e.date?.startsWith(thisMonth)).reduce((s, e) => s + (e.amount || 0), 0);
  const doneReminders = reminders.filter(r => r.done).length;
  const bestStreak = habits.reduce((max, h) => {
    const completions = new Set(h.completions || []);
    let streak = 0;
    const cursor = new Date(); cursor.setHours(0,0,0,0);
    const toStr = (d) => d.toISOString().split('T')[0];
    if (!completions.has(toStr(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (completions.has(toStr(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }
    return Math.max(max, streak);
  }, 0);

  const upcomingReminders = reminders.filter(r => !r.done).slice(0, 5);
  const pendingTasks = tasks.filter(t => !t.completed).slice(0, 6);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <GreetIcon size={28} color={greetColor} style={{ filter: `drop-shadow(0 0 8px ${greetColor})` }} />
            {greeting}, Keshav!
          </h1>
          <p className="page-header-subtitle">{todayStr}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-3" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="glass-panel stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/planner')}>
          <div className="stat-card-icon" style={{ background: 'rgba(155,81,224,0.15)' }}><ListChecks size={24} color="var(--color-primary-light)" /></div>
          <div>
            <div className="stat-card-label">Tasks Today</div>
            <div className="stat-card-value">{completedTasks}/{tasks.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              {tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}% done
            </div>
          </div>
        </div>
        <div className="glass-panel stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/finance')}>
          <div className="stat-card-icon" style={{ background: 'rgba(255,107,138,0.15)' }}><DollarSign size={24} color="var(--color-danger)" /></div>
          <div>
            <div className="stat-card-label">This Month</div>
            <div className="stat-card-value" style={{ fontSize: '1.2rem' }}>{fmt(monthlySpend)}</div>
          </div>
        </div>
        <div className="glass-panel stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/reminders')}>
          <div className="stat-card-icon" style={{ background: 'rgba(6,214,160,0.15)' }}><Bell size={24} color="var(--color-accent)" /></div>
          <div>
            <div className="stat-card-label">Reminders</div>
            <div className="stat-card-value">{doneReminders}/{reminders.length}</div>
          </div>
        </div>
        <div className="glass-panel stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/habits')}>
          <div className="stat-card-icon" style={{ background: 'rgba(255,209,102,0.15)' }}><Flame size={24} color="var(--color-warning)" /></div>
          <div>
            <div className="stat-card-label">Best Streak</div>
            <div className="stat-card-value">{bestStreak} {bestStreak > 0 ? '🔥' : '—'}</div>
          </div>
        </div>
      </div>

      {/* Main panels */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}><span className="h3-icon"><Bell size={18} /></span>Upcoming Reminders</h3>
            <button className="btn-ghost" style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => navigate('/reminders')}>
              View all <ArrowRight size={13} />
            </button>
          </div>
          {upcomingReminders.length === 0
            ? <div className="empty-state"><span className="empty-state-icon">✅</span><p className="empty-state-text">All caught up!</p></div>
            : upcomingReminders.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: r.category === 'Medicine' ? '#ff6b8a' : r.category === 'Exercise' ? '#06d6a0' : '#9b51e0' }} />
                <span style={{ flex: 1, fontSize: '0.9rem' }}>{r.title}</span>
                {r.time && <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{r.time}</span>}
              </div>
            ))}
        </div>

        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}><span className="h3-icon"><ListChecks size={18} /></span>Pending Tasks</h3>
            <button className="btn-ghost" style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => navigate('/planner')}>
              View all <ArrowRight size={13} />
            </button>
          </div>
          {pendingTasks.length === 0
            ? <div className="empty-state"><span className="empty-state-icon">🎉</span><p className="empty-state-text">All tasks complete!</p></div>
            : pendingTasks.map(task => (
              <div key={task.id} onClick={() => toggleTask(task.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0, flexShrink: 0 }}>
                  {task.completed ? <CheckCircle2 size={20} color="var(--color-accent)" /> : <Circle size={20} color="var(--color-text-dim)" />}
                </button>
                <span style={{ fontSize: '0.9rem' }}>{task.text}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Quote */}
      <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem', borderColor: 'rgba(155,81,224,0.15)' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>💡</div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', fontStyle: 'italic', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto' }}>"{quote}"</p>
      </div>
    </div>
  );
}
