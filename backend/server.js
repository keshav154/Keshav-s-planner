const express = require('express');
const cors = require('cors');
const db = require('./database');
const path = require('path');
const fs = require('fs');
const notionSync = require('./notionSync');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- Task Routes ---
app.get('/api/tasks', (req, res) => {
  const tasks = db.getTasks();
  res.json(tasks.map(row => ({ ...row, completed: row.completed === 1 })));
});

app.post('/api/tasks', (req, res) => {
  const { text } = req.body;
  const newTask = db.addTask(text);
  res.json({ ...newTask, completed: false });
});

app.put('/api/tasks/:id', (req, res) => {
  const { completed } = req.body;
  db.updateTask(req.params.id, completed);
  res.json({ success: true });
});

app.delete('/api/tasks/:id', (req, res) => {
  db.deleteTask(req.params.id);
  res.json({ success: true });
});

// --- Expense Routes ---
app.get('/api/expenses', (req, res) => {
  res.json(db.getExpenses());
});

app.post('/api/expenses', (req, res) => {
  const { name, amount, date } = req.body;
  const newExpense = db.addExpense(name, amount, date);
  res.json(newExpense);
});

app.delete('/api/expenses/:id', (req, res) => {
  db.deleteExpense(req.params.id);
  res.json({ success: true });
});

// --- Reminder Routes ---
app.get('/api/reminders', (req, res) => {
  res.json(db.getReminders());
});

app.post('/api/reminders', (req, res) => {
  const { title, time, repeat, category, notes } = req.body;
  const newReminder = db.addReminder(title, time, repeat || 'daily', category || 'Personal', notes || '');
  res.json(newReminder);
});

app.put('/api/reminders/:id/toggle', (req, res) => {
  const reminder = db.toggleReminder(req.params.id);
  if (reminder) res.json(reminder);
  else res.status(404).json({ error: 'Reminder not found' });
});

app.delete('/api/reminders/:id', (req, res) => {
  db.deleteReminder(req.params.id);
  res.json({ success: true });
});

// --- Time Block Routes ---
app.get('/api/timeblocks', (req, res) => {
  res.json(db.getTimeBlocks());
});

app.post('/api/timeblocks', (req, res) => {
  const { time, label, sub, color } = req.body;
  res.json(db.addTimeBlock(time, label, sub, color));
});

app.put('/api/timeblocks/:id', (req, res) => {
  const updated = db.updateTimeBlock(req.params.id, req.body);
  if (updated) res.json(updated);
  else res.status(404).json({ error: 'Block not found' });
});

app.delete('/api/timeblocks/:id', (req, res) => {
  db.deleteTimeBlock(req.params.id);
  res.json({ success: true });
});

// --- Test Endpoint (Manually trigger sync right now) ---
app.get('/api/test-sync', (req, res) => {
  console.log('Running manual Notion sync...');
  const today = new Date().toISOString().split('T')[0];
  
  const tasks = db.getTasksByDate(today);
  tasks.forEach(task => notionSync.syncTaskToNotion(task));

  const expenses = db.getExpensesByDate(today);
  expenses.forEach(exp => notionSync.syncExpenseToNotion(exp));

  res.send('Sync triggered! Check your terminal and Notion database.');
});

// --- Journal Routes ---
app.get('/api/journal', (req, res) => {
  res.json(db.getJournalEntries());
});

app.get('/api/journal/:date', (req, res) => {
  const entry = db.getJournalEntry(req.params.date);
  res.json(entry || {});
});

app.post('/api/journal', (req, res) => {
  const { date, text, mood } = req.body;
  if (!date) return res.status(400).json({ error: 'date is required' });
  const entry = db.saveJournalEntry(date, text || '', mood || '');
  res.json(entry);
});

app.delete('/api/journal/:date', (req, res) => {
  db.deleteJournalEntry(req.params.date);
  res.json({ success: true });
});

// --- Habit Routes ---
app.get('/api/habits', (req, res) => {
  res.json(db.getHabits());
});

app.post('/api/habits', (req, res) => {
  const { name, color, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const habit = db.addHabit(name, color, icon);
  res.json(habit);
});

app.put('/api/habits/:id/check', (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'date is required' });
  const habit = db.checkHabit(req.params.id, date);
  if (habit) res.json(habit);
  else res.status(404).json({ error: 'Habit not found' });
});

app.delete('/api/habits/:id', (req, res) => {
  db.deleteHabit(req.params.id);
  res.json({ success: true });
});

// --- Backup & Restore Routes ---
app.get('/api/backup', (req, res) => {
  const dbPath = path.resolve(__dirname, 'planner_data.json');
  try {
    const fileContent = fs.readFileSync(dbPath, 'utf8');
    res.setHeader('Content-Disposition', 'attachment; filename=planner_backup.json');
    res.setHeader('Content-Type', 'application/json');
    res.send(fileContent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read backup file' });
  }
});

app.post('/api/restore', (req, res) => {
  const backup = req.body;
  if (!backup || !Array.isArray(backup.tasks)) {
    return res.status(400).json({ error: 'Invalid backup: must contain a tasks array' });
  }
  const dbPath = path.resolve(__dirname, 'planner_data.json');
  try {
    fs.writeFileSync(dbPath, JSON.stringify(backup, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to write backup file' });
  }
});

// --- Notion Weekly Report Route ---
app.get('/api/notion/weekly-report', async (req, res) => {
  try {
    await notionSync.sendWeeklyReport(db);
    res.json({ success: true, message: 'Weekly report sent to Notion.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve frontend static files in production
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// --- Scheduled Notion Sync (Native JS, fires at 11:59 PM daily) ---
function scheduleDailySync() {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0, 0);
  if (now > target) target.setDate(target.getDate() + 1);
  const timeUntilTarget = target.getTime() - now.getTime();

  setTimeout(() => {
    console.log('Running daily Notion sync...');
    const today = new Date().toISOString().split('T')[0];
    // Sync tasks & expenses
    db.getTasksByDate(today).forEach(task => notionSync.syncTaskToNotion(task));
    db.getExpensesByDate(today).forEach(exp => notionSync.syncExpenseToNotion(exp));
    // Sync today's journal entry (if any)
    const journalEntry = db.getJournalEntry(today);
    if (journalEntry && journalEntry.text) notionSync.syncJournalToNotion(journalEntry);
    // Sync habits completed today
    const habits = db.getHabits();
    habits.filter(h => h.completions && h.completions.includes(today)).forEach(h => {
      const streak = db.getHabitStreak(h.id);
      notionSync.syncHabitToNotion(h, streak);
    });
    scheduleDailySync();
  }, timeUntilTarget);
}

// --- Midnight Reminder Reset (resets "done" on daily reminders at midnight) ---
function scheduleMidnightReset() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 30, 0);
  const timeUntilMidnight = midnight.getTime() - now.getTime();

  setTimeout(() => {
    console.log('Resetting daily reminders for new day...');
    db.resetDailyReminders();
    scheduleMidnightReset();
  }, timeUntilMidnight);
}

// --- Weekly Notion Report Scheduler (fires every Sunday at 10:00 PM) ---
function scheduleWeeklyReport() {
  // fires every Sunday at 10:00 PM
  const now = new Date();
  const daysUntilSunday = (7 - now.getDay()) % 7;
  const nextSunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday), 22, 0, 0, 0);
  const timeUntil = nextSunday.getTime() - now.getTime();
  setTimeout(() => {
    notionSync.sendWeeklyReport(db);
    scheduleWeeklyReport();
  }, timeUntil);
}

// Start schedulers
scheduleDailySync();
scheduleMidnightReset();
scheduleWeeklyReport();

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log("Backend server running on port " + PORT);
});
