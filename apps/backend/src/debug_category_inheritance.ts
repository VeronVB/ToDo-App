import { db } from './db/client.js';

console.log('--- DEBUG PARENT CATEGORY ---');

// 1. Create Parent with Category
const category = db.prepare("INSERT INTO categories (name, color) VALUES ('DEBUG Cat', '#000')").run();
const catId = category.lastInsertRowid;

const parent = db.prepare(`
    INSERT INTO tasks (title, category_id, position, depth) VALUES ('DEBUG Parent', ?, 1, 0)
`).run(catId);
const parentId = parent.lastInsertRowid;

// 2. Create Child (Subtask) - usually frontend sends categoryId? Or null?
// I'll assume frontend sends NULL for subtask category usually, inheriting from parent visually.
// Or explicit. Let's create one with NULL category_id to simulate the issue.
const child = db.prepare(`
    INSERT INTO tasks (title, parent_id, category_id, position, depth, recurrence, due_date) 
    VALUES ('DEBUG Child', ?, NULL, 1, 1, 'daily', ?)
`).run(parentId, new Date().toISOString());
const childId = child.lastInsertRowid;

console.log(`Setup: Category=${catId}, Parent=${parentId} (cat=${catId}), Child=${childId} (cat=NULL)`);

// 3. Simulate Logic from PATCH
// Fetch Child
const currentTask = db.prepare(`
    SELECT category_id, parent_id FROM tasks WHERE id = ?
`).get(childId) as any;

let finalCategoryId = currentTask.category_id;

// If category is null but we have parent, check parent's category
if (!finalCategoryId && currentTask.parent_id) {
    const parentTask = db.prepare('SELECT category_id FROM tasks WHERE id = ?').get(currentTask.parent_id) as any;
    if (parentTask) {
        finalCategoryId = parentTask.category_id;
        console.log('Inherited Category from Parent:', finalCategoryId);
    }
}

console.log('Final Category ID for new task:', finalCategoryId);

console.log('--- END ---');
