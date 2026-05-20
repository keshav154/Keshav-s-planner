import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard, Plus, Trash2, PieChart, Wallet } from 'lucide-react';

const CATEGORY_COLORS = {
  Food: '#06d6a0',
  Transport: '#9b51e0',
  Entertainment: '#ffd166',
  Shopping: '#bb86fc',
  Health: '#ff6b8a',
  Other: '#64748b',
};

export default function FinancialPlanner() {
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newExpense, setNewExpense] = useState({ name: '', amount: '', date: '', category: 'Other' });

  useEffect(() => {
    fetch('/api/expenses')
      .then(res => res.json())
      .then(data => setExpenses(data))
      .catch(err => console.error('Error fetching expenses:', err));
  }, []);

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpense.name || !newExpense.amount || !newExpense.date) return;

    fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newExpense.name,
        amount: parseFloat(newExpense.amount),
        date: newExpense.date,
      })
    })
      .then(res => res.json())
      .then(data => {
        setExpenses([data, ...expenses]);
        setNewExpense({ name: '', amount: '', date: '', category: 'Other' });
        setShowForm(false);
      })
      .catch(err => console.error('Error adding expense:', err));
  };

  const deleteExpense = (id) => {
    fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      .then(() => setExpenses(expenses.filter(e => e.id !== id)))
      .catch(err => console.error('Error deleting expense:', err));
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  // Group expenses by month for the budget overview
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthlyExpenses = expenses.filter(e => e.date && e.date.startsWith(thisMonth));
  const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Financial Dashboard</h1>
          <p className="page-header-subtitle">Track, analyze and control your spending.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : <><Plus size={16} /> Add Expense</>}
        </button>
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <h3><span className="h3-icon"><Plus size={18} /></span>New Expense</h3>
          <form onSubmit={handleAddExpense} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <input
              type="text"
              placeholder="Expense name (e.g. Groceries)"
              value={newExpense.name}
              onChange={e => setNewExpense({ ...newExpense, name: e.target.value })}
              style={{ flex: '2 1 200px' }}
            />
            <input
              type="number"
              placeholder="Amount (₹)"
              step="0.01"
              min="0"
              value={newExpense.amount}
              onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
              style={{ flex: '1 1 130px' }}
            />
            <input
              type="date"
              value={newExpense.date}
              onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
              style={{ flex: '1 1 150px' }}
            />
            <button type="submit" className="btn-primary" style={{ flexShrink: 0 }}>
              <Plus size={18} /> Save
            </button>
          </form>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(6,214,160,0.15)' }}>
            <Wallet size={24} color="var(--color-accent)" />
          </div>
          <div>
            <div className="stat-card-label">Total Logged</div>
            <div className="stat-card-value" style={{ fontSize: '1.3rem' }}>{formatCurrency(totalExpenses)}</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(155,81,224,0.15)' }}>
            <TrendingUp size={24} color="var(--color-primary-light)" />
          </div>
          <div>
            <div className="stat-card-label">This Month</div>
            <div className="stat-card-value" style={{ fontSize: '1.3rem' }}>{formatCurrency(monthlyTotal)}</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(255,107,138,0.15)' }}>
            <CreditCard size={24} color="var(--color-danger)" />
          </div>
          <div>
            <div className="stat-card-label">Transactions</div>
            <div className="stat-card-value">{expenses.length}</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Transaction List */}
        <div className="glass-panel">
          <h3><span className="h3-icon"><CreditCard size={18} /></span>All Transactions</h3>
          {expenses.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">💸</span>
              <p className="empty-state-text">No expenses logged yet. Add your first one!</p>
            </div>
          ) : (
            <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {expenses.map(exp => (
                <div key={exp.id} className="expense-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                      background: 'rgba(155,81,224,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <DollarSign size={16} color="var(--color-primary-light)" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="expense-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.name}</div>
                      <div className="expense-date">{exp.date}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="expense-amount">-{formatCurrency(exp.amount)}</span>
                    <button className="btn-icon" onClick={() => deleteExpense(exp.id)} title="Delete expense">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Budget Overview */}
        <div className="glass-panel">
          <h3><span className="h3-icon"><PieChart size={18} /></span>Monthly Overview</h3>
          <div style={{ marginTop: '0.5rem' }}>
            {[
              { label: 'Food & Dining', budget: 5000, spent: monthlyExpenses.filter(e => e.name?.toLowerCase().includes('food') || e.name?.toLowerCase().includes('lunch') || e.name?.toLowerCase().includes('dinner')).reduce((s, e) => s + e.amount, 0) || 0 },
              { label: 'Transport', budget: 2000, spent: monthlyExpenses.filter(e => e.name?.toLowerCase().includes('cab') || e.name?.toLowerCase().includes('fuel') || e.name?.toLowerCase().includes('auto')).reduce((s, e) => s + e.amount, 0) || 0 },
              { label: 'Shopping', budget: 8000, spent: monthlyExpenses.filter(e => e.name?.toLowerCase().includes('amazon') || e.name?.toLowerCase().includes('shop')).reduce((s, e) => s + e.amount, 0) || 0 },
              { label: 'Other', budget: 3000, spent: monthlyTotal },
            ].map((item, i) => {
              const pct = Math.min(100, item.budget > 0 ? Math.round((item.spent / item.budget) * 100) : 0);
              const isOver = pct >= 90;
              const colors = ['var(--color-primary)', 'var(--color-accent)', 'var(--color-secondary)', 'var(--color-warning)'];
              return (
                <div key={i} style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{item.label}</span>
                    <span style={{ fontSize: '0.8rem', color: isOver ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                      {formatCurrency(item.spent)} / {formatCurrency(item.budget)}
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{
                      width: `${pct}%`,
                      background: isOver
                        ? 'linear-gradient(90deg, var(--color-danger), #ff9fb4)'
                        : `linear-gradient(90deg, ${colors[i]}, ${colors[(i + 1) % colors.length]})`,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>This month's total</span>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-danger)' }}>{formatCurrency(monthlyTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
