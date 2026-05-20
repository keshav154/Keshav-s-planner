// Native fetch replacement for @notionhq/client
async function syncTaskToNotion(task) {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!apiKey || !databaseId) return;

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          Name: { title: [{ text: { content: task.text } }] },
          Type: { select: { name: 'Task' } },
          Status: { select: { name: task.completed ? 'Completed' : 'Pending' } },
          Date: { date: { start: new Date().toISOString().split('T')[0] } }
        }
      })
    });
    
    if (response.ok) {
      console.log(`Successfully synced task: ${task.text} to Notion.`);
    } else {
      const errorData = await response.json();
      console.error('Error syncing task to Notion:', errorData.message);
    }
  } catch (error) {
    console.error('Error syncing to Notion:', error.message);
  }
}

async function syncExpenseToNotion(expense) {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!apiKey || !databaseId) return;

  try {
    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    const validDate = isoRegex.test(expense.date) ? expense.date : new Date().toISOString().split('T')[0];

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          Name: { title: [{ text: { content: expense.name } }] },
          Type: { select: { name: 'Expense' } },
          Amount: { number: expense.amount },
          Date: { date: { start: validDate } }
        }
      })
    });

    if (response.ok) {
      console.log(`Successfully synced expense: ${expense.name} to Notion.`);
    } else {
      const errorData = await response.json();
      console.error('Error syncing expense to Notion:', errorData.message);
    }
  } catch (error) {
    console.error('Error syncing to Notion:', error.message);
  }
}

/**
 * Syncs a journal entry to the Notion database.
 * Requires a "Mood" (Text) property in the database.
 */
async function syncJournalToNotion(entry) {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!apiKey || !databaseId) return;

  try {
    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    const validDate = isoRegex.test(entry.date) ? entry.date : new Date().toISOString().split('T')[0];

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          Name:  { title: [{ text: { content: `Journal — ${validDate}` } }] },
          Type:  { select: { name: 'Journal' } },
          Mood:  { rich_text: [{ text: { content: entry.mood || '' } }] },
          Date:  { date: { start: validDate } }
        },
        // Store full journal text as the page body
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content: entry.text || '' } }]
            }
          }
        ]
      })
    });

    if (response.ok) {
      console.log(`Successfully synced journal entry for ${validDate} to Notion.`);
    } else {
      const errorData = await response.json();
      console.error('Error syncing journal to Notion:', errorData.message);
    }
  } catch (error) {
    console.error('Error syncing journal to Notion:', error.message);
  }
}

/**
 * Syncs a single habit's today check-in to the Notion database.
 * Requires a "Streak" (Number) property in the database.
 */
async function syncHabitToNotion(habit, streak) {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!apiKey || !databaseId) return;

  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          Name:   { title: [{ text: { content: `${habit.icon || ''} ${habit.name} — ${today}` } }] },
          Type:   { select: { name: 'Habit' } },
          Status: { select: { name: 'Completed' } },
          Streak: { number: streak || 0 },
          Date:   { date: { start: today } }
        }
      })
    });

    if (response.ok) {
      console.log(`Successfully synced habit "${habit.name}" to Notion.`);
    } else {
      const errorData = await response.json();
      console.error('Error syncing habit to Notion:', errorData.message);
    }
  } catch (error) {
    console.error('Error syncing habit to Notion:', error.message);
  }
}

/**
 * Sends a weekly summary report as a new Notion page under NOTION_PARENT_PAGE_ID.
 * @param {object} db - the database module
 */
async function sendWeeklyReport(db) {
  const apiKey = process.env.NOTION_API_KEY;
  const parentPageId = process.env.NOTION_PARENT_PAGE_ID;

  if (!apiKey || !parentPageId) {
    console.log('Weekly report skipped: NOTION_API_KEY or NOTION_PARENT_PAGE_ID not set.');
    return;
  }

  try {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    // Tasks
    const allTasks = db.getTasks();
    const weekTasks = allTasks.filter(t => {
      const d = t.created_at ? t.created_at.split('T')[0] : '';
      return d >= weekStartStr && d <= todayStr;
    });
    const completedThisWeek = weekTasks.filter(t => t.completed === 1 || t.completed === true).length;

    // Expenses
    const allExpenses = db.getExpenses();
    const weekExpenses = allExpenses.filter(e => {
      const d = e.date || (e.created_at ? e.created_at.split('T')[0] : '');
      return d >= weekStartStr && d <= todayStr;
    });
    const weekTotal = weekExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const topExpenses = weekExpenses.slice().sort((a, b) => b.amount - a.amount).slice(0, 5);

    // Reminders
    const allReminders = db.getReminders();
    const doneReminders = allReminders.filter(r => r.done).length;

    // Habits
    const allHabits = db.getHabits();

    // Journal moods this week
    const allJournal = db.getJournalEntries();
    const weekJournal = allJournal.filter(e => e.date >= weekStartStr && e.date <= todayStr);
    const moodSummary = weekJournal.map(e => `${e.date}: ${e.mood || '—'}`).join(', ') || 'No entries this week';

    const pageTitle = `Weekly Report — Week of ${weekStartStr}`;

    const children = [
      { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: '📋 Task Summary' } }] } },
      { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: `Completed ${completedThisWeek} out of ${weekTasks.length} tasks this week.` } }] } },

      { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: '💰 Top Expenses This Week' } }] } },
      { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: `Total spent: ₹${weekTotal.toFixed(0)}` } }] } },
      ...(topExpenses.length > 0
        ? topExpenses.map(e => ({
            object: 'block', type: 'bulleted_list_item',
            bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `${e.name}: ₹${Number(e.amount).toFixed(0)} (${e.date || 'N/A'})` } }] }
          }))
        : [{ object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: 'No expenses recorded this week.' } }] } }]
      ),

      { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: '🔔 Reminder Completion' } }] } },
      { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: `${doneReminders} out of ${allReminders.length} reminders marked done.` } }] } },

      { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: '🔥 Habit Check-ins' } }] } },
      ...(allHabits.length > 0
        ? allHabits.map(h => {
            const completionsThisWeek = (h.completions || []).filter(d => d >= weekStartStr && d <= todayStr).length;
            return {
              object: 'block', type: 'bulleted_list_item',
              bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `${h.icon || ''} ${h.name}: ${completionsThisWeek}/7 days` } }] }
            };
          })
        : [{ object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: 'No habits tracked yet.' } }] } }]
      ),

      { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: '📓 Journal Moods' } }] } },
      { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: moodSummary } }] } },
    ];

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { page_id: parentPageId },
        properties: { title: { title: [{ type: 'text', text: { content: pageTitle } }] } },
        children
      })
    });

    if (response.ok) {
      console.log(`Weekly report sent to Notion: "${pageTitle}"`);
    } else {
      const errorData = await response.json();
      console.error('Error sending weekly report to Notion:', errorData.message);
    }
  } catch (error) {
    console.error('Error in sendWeeklyReport:', error.message);
    throw error;
  }
}

module.exports = {
  syncTaskToNotion,
  syncExpenseToNotion,
  syncJournalToNotion,
  syncHabitToNotion,
  sendWeeklyReport
};
