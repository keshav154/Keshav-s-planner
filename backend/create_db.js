// Run via: node create_db.js <API_KEY> <PAGE_ID>
const apiKey = process.argv[2];
const pageId = process.argv[3];

if (!apiKey || !pageId) {
  console.error("Usage: node create_db.js <API_KEY> <PAGE_ID>");
  process.exit(1);
}

async function createDatabase() {
  try {
    const response = await fetch('https://api.notion.com/v1/databases', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: {
          type: "page_id",
          page_id: pageId
        },
        title: [
          {
            type: "text",
            text: {
              content: "Planner History API Sync",
            },
          },
        ],
        properties: {
          Name: {
            title: {},
          },
          Type: {
            select: {
              options: [
                { name: "Task", color: "blue" },
                { name: "Expense", color: "green" }
              ]
            }
          },
          Status: {
            select: {
              options: [
                { name: "Pending", color: "gray" },
                { name: "Completed", color: "green" }
              ]
            }
          },
          Amount: {
            number: {
              format: "dollar"
            }
          },
          Date: {
            date: {}
          }
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Unknown error from Notion API');
    }
    
    console.log("Database created successfully!");
    console.log("Your NOTION_DATABASE_ID is:", data.id);
  } catch (error) {
    console.error("Failed to create database:", error.message);
  }
}

createDatabase();
