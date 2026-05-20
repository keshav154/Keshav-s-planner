import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import DailyPlanner from './pages/DailyPlanner';
import FinancialPlanner from './pages/FinancialPlanner';
import Reminders from './pages/Reminders';
import HabitTracker from './pages/HabitTracker';
import Journal from './pages/Journal';
import Analytics from './pages/Analytics';
import { Database, Bell, Moon, Download, Upload } from 'lucide-react';

function Settings() {
  const handleBackup = () => { window.open('/api/backup', '_blank'); };

  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (!window.confirm('This will overwrite ALL your planner data. Are you sure?')) return;
          fetch('/api/restore', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          }).then(r => r.json()).then(res => {
            if (res.success) alert('Restore successful! Please refresh the page.');
            else alert('Restore failed: ' + res.error);
          });
        } catch { alert('Invalid backup file.'); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="page-header-subtitle">Configure your planner preferences.</p>
        </div>
      </div>
      <div className="grid-2">
        <div className="glass-panel">
          <h3><span className="h3-icon"><Database size={18} /></span>Data & Sync</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
            Your data is stored locally in <code style={{ background: 'rgba(155,81,224,0.15)', padding: '0.1rem 0.4rem', borderRadius: 4, fontSize: '0.85rem' }}>planner_data.json</code> on your device.
          </p>
          <div className="divider" />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
            Every night at <strong style={{ color: 'var(--color-primary-light)' }}>11:59 PM</strong>, your daily data is archived to Notion. Every Sunday at <strong style={{ color: 'var(--color-primary-light)' }}>10 PM</strong>, a weekly report is generated.
          </p>
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a href="http://localhost:5000/api/test-sync" target="_blank" rel="noopener noreferrer">
              <button className="btn-ghost">Trigger Daily Sync</button>
            </a>
            <a href="http://localhost:5000/api/notion/weekly-report" target="_blank" rel="noopener noreferrer">
              <button className="btn-ghost">Send Weekly Report</button>
            </a>
          </div>
        </div>

        <div className="glass-panel">
          <h3><span className="h3-icon"><Download size={18} /></span>Backup & Restore</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
            Download a full backup of all your tasks, expenses, reminders, habits and journal entries as a single JSON file.
          </p>
          <div className="divider" />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
            To restore, upload a previously downloaded backup file.
          </p>
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={handleBackup}>
              <Download size={16} /> Download Backup
            </button>
            <button className="btn-ghost" onClick={handleRestore}>
              <Upload size={16} /> Restore from Backup
            </button>
          </div>
        </div>

        <div className="glass-panel">
          <h3><span className="h3-icon"><Bell size={18} /></span>PWA Installation</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
            Install this app on your Android phone via Chrome for a native app experience. Make sure your phone and Raspberry Pi are on the same Wi-Fi network, then open Chrome and tap "Add to Home Screen".
          </p>
        </div>

        <div className="glass-panel">
          <h3><span className="h3-icon"><Moon size={18} /></span>Theme</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
            Currently using the <strong style={{ color: 'var(--color-primary-light)' }}>Deep Purple</strong> dark glassmorphism theme.
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            {['#9b51e0','#06d6a0','#ff6b8a','#ffd166'].map(c => (
              <div key={c} style={{ width: 28, height: 28, borderRadius: '50%', background: c, boxShadow: `0 0 10px ${c}66`, cursor: 'pointer' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/planner"   element={<DailyPlanner />} />
            <Route path="/finance"   element={<FinancialPlanner />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/habits"    element={<HabitTracker />} />
            <Route path="/journal"   element={<Journal />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings"  element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
