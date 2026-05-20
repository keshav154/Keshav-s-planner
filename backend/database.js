const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'planner_data.json');

// Initialize JSON DB if it doesn't exist
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({ tasks: [], expenses: [], reminders: [], journal: [], habits: [] }, null, 2));
}

function readDB() {
  try {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    if (!data.reminders) data.reminders = [];
    if (!data.journal) data.journal = [];
    if (!data.habits) data.habits = [];
    if (!data.timeBlocks) {
      // Seed with defaults on first run
      data.timeBlocks = [
        { id: 1, time: '06:00', label: 'Morning Routine', sub: 'Stretch, meditate, breakfast', color: '#06d6a0' },
        { id: 2, time: '09:00', label: 'Deep Work',       sub: 'Focused coding / creative work', color: '#9b51e0' },
        { id: 3, time: '12:30', label: 'Lunch & Walk',    sub: 'Rest and recharge',              color: '#ffd166' },
        { id: 4, time: '14:00', label: 'Meetings',        sub: 'Communication & planning',       color: '#bb86fc' },
        { id: 5, time: '17:00', label: 'Learning Time',   sub: 'Courses, reading, side projects',color: '#06d6a0' },
        { id: 6, time: '20:00', label: 'Wind Down',       sub: 'Journal, relax, sleep by 11 PM', color: '#ff6b8a' },
      ];
      writeDB(data);
    }
    return data;
  } catch (err) {
    return { tasks: [], expenses: [], reminders: [], timeBlocks: [], journal: [], habits: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

const db = {
  // ── TASKS ──────────────────────────────────────────────────
  getTasks: () => {
    return readDB().tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },
  addTask: (text) => {
    const data = readDB();
    const id = Date.now();
    const newTask = { id, text, completed: 0, created_at: new Date().toISOString() };
    data.tasks.push(newTask);
    writeDB(data);
    return newTask;
  },
  updateTask: (id, completed) => {
    const data = readDB();
    const task = data.tasks.find(t => t.id === parseInt(id));
    if (task) {
      task.completed = completed ? 1 : 0;
      writeDB(data);
    }
  },
  deleteTask: (id) => {
    const data = readDB();
    data.tasks = data.tasks.filter(t => t.id !== parseInt(id));
    writeDB(data);
  },
  getTasksByDate: (dateStr) => {
    return readDB().tasks.filter(t => t.created_at.startsWith(dateStr));
  },

  // ── EXPENSES ───────────────────────────────────────────────
  getExpenses: () => {
    return readDB().expenses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },
  addExpense: (name, amount, date) => {
    const data = readDB();
    const id = Date.now();
    const newExpense = { id, name, amount, date, created_at: new Date().toISOString() };
    data.expenses.push(newExpense);
    writeDB(data);
    return newExpense;
  },
  deleteExpense: (id) => {
    const data = readDB();
    data.expenses = data.expenses.filter(e => e.id !== parseInt(id));
    writeDB(data);
  },
  getExpensesByDate: (dateStr) => {
    return readDB().expenses.filter(e => e.date === dateStr || e.created_at.startsWith(dateStr));
  },

  // ── REMINDERS ──────────────────────────────────────────────
  getReminders: () => {
    return readDB().reminders.sort((a, b) => {
      // Sort by time of day
      if (a.time && b.time) return a.time.localeCompare(b.time);
      return new Date(b.created_at) - new Date(a.created_at);
    });
  },
  addReminder: (title, time, repeat, category, notes) => {
    const data = readDB();
    const id = Date.now();
    const newReminder = {
      id,
      title,
      time,         // e.g. "08:00"
      repeat,       // e.g. "daily", "weekdays", "once"
      category,     // e.g. "Medicine", "Exercise", "Work", "Personal"
      notes,
      done: false,
      last_done: null,
      created_at: new Date().toISOString()
    };
    data.reminders.push(newReminder);
    writeDB(data);
    return newReminder;
  },
  toggleReminder: (id) => {
    const data = readDB();
    const reminder = data.reminders.find(r => r.id === parseInt(id));
    if (reminder) {
      reminder.done = !reminder.done;
      reminder.last_done = reminder.done ? new Date().toISOString() : null;
      writeDB(data);
      return reminder;
    }
    return null;
  },
  deleteReminder: (id) => {
    const data = readDB();
    data.reminders = data.reminders.filter(r => r.id !== parseInt(id));
    writeDB(data);
  },
  resetDailyReminders: () => {
    // Call this at midnight to reset "done" on daily reminders
    const data = readDB();
    data.reminders.forEach(r => {
      if (r.repeat === 'daily' || r.repeat === 'weekdays') {
        r.done = false;
      }
    });
    writeDB(data);
  },

  // ── TIME BLOCKS ────────────────────────────────────────────
  getTimeBlocks: () => {
    return readDB().timeBlocks.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  },
  addTimeBlock: (time, label, sub, color) => {
    const data = readDB();
    const id = Date.now();
    const block = { id, time, label, sub: sub || '', color: color || '#9b51e0' };
    data.timeBlocks.push(block);
    writeDB(data);
    return block;
  },
  updateTimeBlock: (id, fields) => {
    const data = readDB();
    const block = data.timeBlocks.find(b => b.id === parseInt(id));
    if (block) {
      Object.assign(block, fields);
      writeDB(data);
      return block;
    }
    return null;
  },
  deleteTimeBlock: (id) => {
    const data = readDB();
    data.timeBlocks = data.timeBlocks.filter(b => b.id !== parseInt(id));
    writeDB(data);
  },

  // ── JOURNAL ────────────────────────────────────────────────
  getJournalEntry: (dateStr) => {
    const data = readDB();
    const journal = data.journal || [];
    return journal.find(e => e.date === dateStr) || null;
  },
  saveJournalEntry: (dateStr, text, mood) => {
    const data = readDB();
    if (!data.journal) data.journal = [];
    const existing = data.journal.find(e => e.date === dateStr);
    if (existing) {
      existing.text = text;
      existing.mood = mood;
      existing.updated_at = new Date().toISOString();
      writeDB(data);
      return existing;
    } else {
      const id = Date.now();
      const entry = { id, date: dateStr, text, mood, updated_at: new Date().toISOString() };
      data.journal.push(entry);
      writeDB(data);
      return entry;
    }
  },
  getJournalEntries: () => {
    const data = readDB();
    const journal = data.journal || [];
    return journal.slice().sort((a, b) => b.date.localeCompare(a.date));
  },
  deleteJournalEntry: (dateStr) => {
    const data = readDB();
    if (!data.journal) data.journal = [];
    data.journal = data.journal.filter(e => e.date !== dateStr);
    writeDB(data);
  },

  // ── HABITS ─────────────────────────────────────────────────
  getHabits: () => {
    const data = readDB();
    return data.habits || [];
  },
  addHabit: (name, color, icon) => {
    const data = readDB();
    if (!data.habits) data.habits = [];
    const id = Date.now();
    const habit = {
      id,
      name,
      color: color || '#9b51e0',
      icon: icon || '✅',
      completions: [],
      created_at: new Date().toISOString()
    };
    data.habits.push(habit);
    writeDB(data);
    return habit;
  },
  checkHabit: (id, dateStr) => {
    const data = readDB();
    if (!data.habits) data.habits = [];
    const habit = data.habits.find(h => h.id === parseInt(id));
    if (!habit) return null;
    const idx = habit.completions.indexOf(dateStr);
    if (idx === -1) {
      habit.completions.push(dateStr);
    } else {
      habit.completions.splice(idx, 1);
    }
    writeDB(data);
    return habit;
  },
  deleteHabit: (id) => {
    const data = readDB();
    if (!data.habits) data.habits = [];
    data.habits = data.habits.filter(h => h.id !== parseInt(id));
    writeDB(data);
  },
  getHabitStreak: (id) => {
    const data = readDB();
    if (!data.habits) return 0;
    const habit = data.habits.find(h => h.id === parseInt(id));
    if (!habit || !habit.completions || habit.completions.length === 0) return 0;

    // Build a sorted unique set of completion dates
    const datesSet = new Set(habit.completions);

    // Start from today; if today is not completed, start from yesterday
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toDateStr = (d) => d.toISOString().split('T')[0];

    let streak = 0;
    let cursor = new Date(today);

    // If today is not completed, start checking from yesterday
    if (!datesSet.has(toDateStr(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }

    while (datesSet.has(toDateStr(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  },
};

module.exports = db;
