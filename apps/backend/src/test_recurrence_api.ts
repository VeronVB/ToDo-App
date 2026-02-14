import { db } from './db/client.js';

async function run() {
    console.log('--- TEST RECURRENCE API START ---');
    
    // 1. Setup Data via DB directly to ensure clean state
    db.prepare("DELETE FROM tasks WHERE title LIKE 'DEBUG%'").run();
    
    const parent = db.prepare(`
        INSERT INTO tasks (title, position, depth) VALUES ('DEBUG Parent', 1, 0)
    `).run();
    const parentId = parent.lastInsertRowid as number;
    console.log('Created Parent ID:', parentId);

    const child = db.prepare(`
        INSERT INTO tasks (title, parent_id, position, depth, recurrence, due_date) 
        VALUES ('DEBUG Child', ?, 1, 1, 'daily', ?)
    `).run(parentId, new Date().toISOString());
    const childId = child.lastInsertRowid as number;
    console.log('Created Child ID:', childId);

    // 2. Call API to complete
    console.log('Calling PATCH /api/tasks/' + childId);
    try {
        const res = await fetch(`http://localhost:3000/api/tasks/${childId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: true })
        });
        
        console.log('PATCH Status:', res.status);
        const json = await res.json();
        console.log('PATCH Response:', json);

    } catch (e) {
        console.error('API Call Failed:', e);
    }

    // 3. Verify DB State
    // Original should be completed
    const original = db.prepare('SELECT completed FROM tasks WHERE id = ?').get(childId) as any;
    console.log('Original Completed:', !!original.completed);

    // Should be a new task
    // Same title, NO parent_id, NO completed
    const newTasks = db.prepare(`
        SELECT * FROM tasks 
        WHERE title = 'DEBUG Child' AND id != ?
    `).all(childId) as any[];

    console.log('New Task Instances found:', newTasks.length);
    newTasks.forEach(t => {
        console.log(`- ID: ${t.id}, Parent: ${t.parent_id}, Depth: ${t.depth}, Completed: ${t.completed}, Recurrence: ${t.recurrence}, Date: ${t.due_date}`);
    });

    console.log('--- TEST RECURRENCE API END ---');
}

run();
