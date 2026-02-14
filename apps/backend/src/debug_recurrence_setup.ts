import { db } from './db/client.js';
import { addDays } from 'date-fns';

console.log('--- DEBUG RECURRENCE START ---');

try {
    // 1. Clean up test data
    db.prepare("DELETE FROM tasks WHERE title LIKE 'DEBUG%'").run();

    // 2. Create Parent
    const parent = db.prepare(`
        INSERT INTO tasks (title, position, depth) VALUES ('DEBUG Parent', 1, 0)
    `).run();
    const parentId = parent.lastInsertRowid;
    console.log('Created Parent ID:', parentId);

    // 3. Create Child (Recurring)
    const child = db.prepare(`
        INSERT INTO tasks (title, parent_id, position, depth, recurrence, due_date) 
        VALUES ('DEBUG Child', ?, 1, 1, 'daily', ?)
    `).run(parentId, new Date().toISOString());
    const childId = child.lastInsertRowid;
    console.log('Created Child ID:', childId, '(Recurring: daily)');

    // 4. Simulate PATCH (Complete Child) - Using logic similar to route
    // Note: I can't call the route handler directly easily, so I will mimic the SQL logic I wrote.
    // OR better, I will assume the route code is what runs. 
    // Since I can't execute the route, I will check the DB *after* I manually run the logic logic here?
    // No, that tests my script, not the app code.
    
    // I will write a script that connects to the RUNNING server via fetch.
} catch (e) {
    console.error(e);
}
console.log('--- DEBUG RECURRENCE END ---');
