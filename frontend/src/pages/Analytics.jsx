import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, BarChart2, Calendar } from 'lucide-react';

const fmt = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const CATEGORIES = [
  { name: 'Food',       keywords: ['food','lunch','dinner','breakfast','restaurant','grocery','groceries','swiggy','zomato','cafe'], color: '#06d6a0' },
  { name: 'Transport',  keywords: ['uber','ola','cab','auto','fuel','petrol','bus','metro','train','rapido'],                         color: '#9b51e0' },
  { name: 'Shopping',   keywords: ['amazon','flipkart','shop','mall','myntra','meesho','market','cloth'],                              color: '#bb86fc' },
  { name: 'Health',     keywords: ['medicine','doctor','pharmacy','hospital','clinic','gym','pharma'],                                 color: '#ff6b8a' },
  { name: 'Bills',      keywords: ['electricity','wifi','internet','recharge','bill','mobile','broadband'],                            color: '#ffd166' },
  { name: 'Other',      keywords: [],                                                                                                  color: '#64748b' },
];

function categorize(name = '') {
  const lower = name.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.keywords.some(k => lower.includes(k))) return cat.name;
  }
  return 'Other';
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
    days.push({ date: d.toISOString().split('T')[0], label: d.toLocaleDateString('en-IN', { weekday: 'short' }) });
  }
  return days;
}

export default function Analytics() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/expenses').then(r => r.json()).then(data => { setExpenses(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisWeekStart = (() => { const d = new Date(); d.setDate(d.getDate() - 6); d.setHours(0,0,0,0); return d.toISOString().split('T')[0]; })();

  const monthlyTotal = useMemo(() => expenses.filter(e => e.date?.startsWith(thisMonth)).reduce((s, e) => s + (e.amount || 0), 0), [expenses]);
  const weeklyTotal  = useMemo(() => expenses.filter(e => e.date >= thisWeekStart).reduce((s, e) => s + (e.amount || 0), 0), [expenses]);
  const dailyAvg     = useMemo(() => {
    const days = expenses.reduce((set, e) => { if (e.date) set.add(e.date); return set; }, new Set()).size;
    return days > 0 ? (expenses.reduce((s, e) => s + (e.amount || 0), 0) / days) : 0;
  }, [expenses]);

  // Bar chart data — last 7 days
  const last7 = getLast7Days();
  const barData = last7.map(day => ({
    ...day,
    total: expenses.filter(e => e.date === day.date).reduce((s, e) => s + (e.amount || 0), 0),
  }));
  const maxBar = Math.max(...barData.map(d => d.total), 1);
  const BAR_H = 140;

  // Category breakdown
  const catData = useMemo(() => {
    const totals = {};
    expenses.forEach(e => {
      const cat = categorize(e.name);
      totals[cat] = (totals[cat] || 0) + (e.amount || 0);
    });
    const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0) || 1;
    return CATEGORIES.map(cat => ({
      ...cat,
      total: totals[cat.name] || 0,
      pct: Math.round(((totals[cat.name] || 0) / grandTotal) * 100),
    })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  }, [expenses]);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Expense Analytics</h1>
          <p className="page-header-subtitle">Visual breakdown of your spending habits.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(155,81,224,0.15)' }}><Calendar size={24} color="var(--color-primary-light)" /></div>
          <div><div className="stat-card-label">This Month</div><div className="stat-card-value" style={{ fontSize: '1.2rem' }}>{fmt(monthlyTotal)}</div></div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(6,214,160,0.15)' }}><TrendingUp size={24} color="var(--color-accent)" /></div>
          <div><div className="stat-card-label">This Week</div><div className="stat-card-value" style={{ fontSize: '1.2rem' }}>{fmt(weeklyTotal)}</div></div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(255,209,102,0.15)' }}><BarChart2 size={24} color="var(--color-warning)" /></div>
          <div><div className="stat-card-label">Daily Average</div><div className="stat-card-value" style={{ fontSize: '1.2rem' }}>{fmt(dailyAvg)}</div></div>
        </div>
      </div>

      <div className="grid-2">
        {/* Bar Chart */}
        <div className="glass-panel">
          <h3><span className="h3-icon"><BarChart2 size={18} /></span>Last 7 Days</h3>
          {loading ? <div className="empty-state"><span className="empty-state-icon">⏳</span></div> : (
            <svg viewBox={`0 0 ${last7.length * 52} ${BAR_H + 52}`} width="100%" style={{ overflow: 'visible', marginTop: '1rem' }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9b51e0" />
                  <stop offset="100%" stopColor="#bb86fc" />
                </linearGradient>
              </defs>
              {barData.map((d, i) => {
                const barHeight = d.total > 0 ? Math.max((d.total / maxBar) * BAR_H, 4) : 2;
                const x = i * 52 + 10;
                const y = BAR_H - barHeight;
                return (
                  <g key={d.date}>
                    <rect x={x} y={y} width={32} height={barHeight} rx={6} fill="url(#barGrad)" opacity={d.total > 0 ? 1 : 0.2} />
                    {d.total > 0 && (
                      <text x={x + 16} y={y - 5} textAnchor="middle" fontSize="9" fill="#c084fc" fontFamily="Inter">
                        {fmt(d.total).replace('₹', '₹')}
                      </text>
                    )}
                    <text x={x + 16} y={BAR_H + 18} textAnchor="middle" fontSize="11" fill="#9d7fd4" fontFamily="Inter">
                      {d.label}
                    </text>
                  </g>
                );
              })}
              {/* Baseline */}
              <line x1={0} y1={BAR_H} x2={last7.length * 52} y2={BAR_H} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
            </svg>
          )}
          {!loading && expenses.length === 0 && (
            <div className="empty-state"><span className="empty-state-icon">📊</span><p className="empty-state-text">No expenses logged yet.</p></div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="glass-panel">
          <h3><span className="h3-icon"><TrendingUp size={18} /></span>By Category</h3>
          {catData.length === 0 ? (
            <div className="empty-state"><span className="empty-state-icon">🗂️</span><p className="empty-state-text">No data to show yet.</p></div>
          ) : (
            catData.map(cat => (
              <div key={cat.name} style={{ marginBottom: '1.1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, boxShadow: `0 0 6px ${cat.color}` }} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{cat.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{cat.pct}%</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{fmt(cat.total)}</span>
                  </div>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${cat.pct}%`, background: `linear-gradient(90deg, ${cat.color}, ${cat.color}aa)` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
