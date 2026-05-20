import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, PieChart, Settings, Sparkles, Bell, BookOpen, BarChart2, Flame, Cloud, CloudRain, Sun, Wind } from 'lucide-react';

const WX_CODES = {
  0: { label: 'Clear', Icon: Sun }, 1: { label: 'Mainly clear', Icon: Sun }, 2: { label: 'Partly cloudy', Icon: Cloud },
  3: { label: 'Overcast', Icon: Cloud }, 51: { label: 'Drizzle', Icon: CloudRain }, 61: { label: 'Rain', Icon: CloudRain },
  71: { label: 'Snow', Icon: Cloud }, 80: { label: 'Showers', Icon: CloudRain }, 95: { label: 'Thunderstorm', Icon: CloudRain },
};

function WeatherWidget() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const cached = sessionStorage.getItem('wx');
    const cachedAt = sessionStorage.getItem('wx_at');
    if (cached && cachedAt && Date.now() - parseInt(cachedAt) < 30 * 60 * 1000) {
      setWeather(JSON.parse(cached)); return;
    }
    navigator.geolocation?.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lon } = pos.coords;
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
        .then(r => r.json())
        .then(data => {
          const wx = { temp: Math.round(data.current_weather.temperature), code: data.current_weather.weathercode };
          sessionStorage.setItem('wx', JSON.stringify(wx));
          sessionStorage.setItem('wx_at', Date.now().toString());
          setWeather(wx);
        }).catch(() => {});
    }, () => {});
  }, []);

  if (!weather) return null;
  const meta = WX_CODES[weather.code] || { label: 'Cloudy', Icon: Cloud };
  const WIcon = meta.Icon;
  return (
    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.04)' }}>
      <WIcon size={16} color="var(--color-warning)" />
      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{weather.temp}°C · {meta.label}</span>
    </div>
  );
}

export default function Sidebar() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);

  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  const navItem = (to, Icon, label, end = false) => (
    <NavLink to={to} end={end} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
      <span className="nav-icon"><Icon size={19} /></span>
      <span>{label}</span>
    </NavLink>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon"><Sparkles size={20} color="#fff" /></div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">Keshav's</span>
          <span className="sidebar-brand-sub">Planner</span>
        </div>
      </div>

      <div className="sidebar-section-label" style={{ marginBottom: '0.75rem' }}>Navigation</div>

      <nav className="nav-links">
        {navItem('/',          LayoutDashboard, 'Dashboard',     true)}
        {navItem('/planner',   CalendarDays,    'Daily Planner'     )}
        {navItem('/finance',   PieChart,        'Financials'        )}
        {navItem('/reminders', Bell,            'Reminders'         )}
        {navItem('/habits',    Flame,           'Habits'            )}
        {navItem('/journal',   BookOpen,        'Journal'           )}
        {navItem('/analytics', BarChart2,       'Analytics'         )}
        {navItem('/settings',  Settings,        'Settings'          )}
      </nav>

      <div className="sidebar-footer">
        <WeatherWidget />
        <div className="sidebar-date">
          <strong>{timeStr}</strong>
          {dateStr}
        </div>
      </div>
    </aside>
  );
}
