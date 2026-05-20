import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Save } from 'lucide-react';

const MOODS = [
  { emoji: '😄', label: 'Great' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😟', label: 'Bad' },
  { emoji: '😭', label: 'Awful' },
];

function dateOffset(base, days) {
  const d = new Date(base + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatDisplayDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

export default function Journal() {
  const today = new Date().toISOString().split('T')[0];
  const [currentDate, setCurrentDate] = useState(today);
  const [text, setText] = useState('');
  const [mood, setMood] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved
  const [pastEntries, setPastEntries] = useState([]);
  const debounceRef = useRef(null);

  // Load entry for currentDate
  useEffect(() => {
    setSaveStatus('idle');
    fetch(`/api/journal/${currentDate}`)
      .then(r => r.json())
      .then(entry => {
        setText(entry.text || '');
        setMood(entry.mood || '');
      })
      .catch(() => { setText(''); setMood(''); });
  }, [currentDate]);

  // Load past entries for sidebar
  useEffect(() => {
    fetch('/api/journal')
      .then(r => r.json())
      .then(data => setPastEntries(data.slice(0, 7)))
      .catch(() => {});
  }, [saveStatus]);

  // Debounced auto-save
  const save = useCallback((dateStr, t, m) => {
    setSaveStatus('saving');
    fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dateStr, text: t, mood: m }),
    }).then(() => setSaveStatus('saved'))
      .catch(() => setSaveStatus('idle'));
  }, []);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    setSaveStatus('idle');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(currentDate, val, mood), 1500);
  };

  const handleMoodChange = (m) => {
    setMood(m);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(currentDate, text, m), 500);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1><span style={{ marginRight: '0.5rem' }}><BookOpen size={26} style={{ display: 'inline', verticalAlign: 'middle', color: 'var(--color-primary-light)' }} /></span>Daily Journal</h1>
          <p className="page-header-subtitle">{formatDisplayDate(currentDate)}</p>
        </div>
        {/* Save indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: saveStatus === 'saved' ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
          <Save size={14} />
          {saveStatus === 'saving' && 'Saving…'}
          {saveStatus === 'saved' && 'Saved ✓'}
          {saveStatus === 'idle' && 'Auto-save on'}
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Editor */}
        <div>
          {/* Date nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <button className="btn-ghost" style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center' }} onClick={() => setCurrentDate(dateOffset(currentDate, -1))}>
              <ChevronLeft size={18} />
            </button>
            <span style={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>
              {currentDate === today ? '📅 Today' : formatDisplayDate(currentDate)}
            </span>
            <button className="btn-ghost" style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center' }} onClick={() => setCurrentDate(dateOffset(currentDate, 1))} disabled={currentDate >= today}>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Mood picker */}
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: '0.5rem' }}>How are you feeling?</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {MOODS.map(m => (
                <button
                  key={m.emoji}
                  onClick={() => handleMoodChange(m.emoji)}
                  title={m.label}
                  style={{
                    fontSize: '1.4rem', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-md)',
                    border: mood === m.emoji ? '2px solid var(--color-primary)' : '2px solid transparent',
                    background: mood === m.emoji ? 'rgba(155,81,224,0.15)' : 'rgba(255,255,255,0.04)',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    transform: mood === m.emoji ? 'scale(1.2)' : 'scale(1)',
                  }}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Text area */}
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="Write about your day, thoughts, plans, or anything on your mind…"
            style={{
              width: '100%', minHeight: '320px', padding: '1.25rem',
              background: 'rgba(0,0,0,0.25)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)', color: 'var(--color-text)',
              fontFamily: 'var(--font-main)', fontSize: '0.95rem', lineHeight: 1.8,
              resize: 'vertical', outline: 'none', transition: 'all 0.2s ease',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(155,81,224,0.15)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Past entries */}
        <div className="glass-panel">
          <h3><span className="h3-icon"><BookOpen size={18} /></span>Recent Entries</h3>
          {pastEntries.length === 0 ? (
            <div className="empty-state"><span className="empty-state-icon">📖</span><p className="empty-state-text">No past entries yet. Start writing!</p></div>
          ) : (
            pastEntries.map(entry => (
              <div
                key={entry.date}
                onClick={() => setCurrentDate(entry.date)}
                style={{
                  padding: '0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem',
                  background: entry.date === currentDate ? 'rgba(155,81,224,0.12)' : 'rgba(255,255,255,0.02)',
                  border: entry.date === currentDate ? '1px solid rgba(155,81,224,0.25)' : '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary-light)' }}>
                    {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  {entry.mood && <span style={{ fontSize: '1.1rem' }}>{entry.mood}</span>}
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                  {entry.text ? entry.text.slice(0, 90) + (entry.text.length > 90 ? '…' : '') : 'No content'}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
