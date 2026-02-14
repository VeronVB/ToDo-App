import { db } from './client.js';

console.log('🌱 Seeding database...');

// Clear existing data (optional - remove in production!)
db.exec('DELETE FROM time_entries');
db.exec('DELETE FROM tasks');
db.exec('DELETE FROM categories');
db.exec('DELETE FROM priorities');
db.exec('DELETE FROM settings');

// Seed Priorities
const priorities = [
  { name: 'Low', level: 1, color: '#a3be8c' },
  { name: 'Medium', level: 2, color: '#ebcb8b' },
  { name: 'High', level: 3, color: '#bf616a' }
];

const insertPriority = db.prepare('INSERT INTO priorities (name, level, color) VALUES (?, ?, ?)');
for (const p of priorities) {
  insertPriority.run(p.name, p.level, p.color);
}
console.log('✅ Seeded priorities');

// Seed Categories
const categories = [
  { name: 'Work', color: '#5e81ac', icon: '💼' },
  { name: 'Personal', color: '#b48ead', icon: '🏠' },
  { name: 'Shopping', color: '#88c0d0', icon: '🛒' },
  { name: 'Health', color: '#a3be8c', icon: '💪' }
];

const insertCategory = db.prepare('INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)');
for (const c of categories) {
  insertCategory.run(c.name, c.color, c.icon);
}
console.log('✅ Seeded categories');

// Seed Default Settings
db.prepare(`
  INSERT INTO settings (user_id, site_name, language, color_scheme, layout)
  VALUES (1, 'Todo App', 'en', 'nord', 'comfortable')
`).run();
console.log('✅ Seeded settings');

// Seed Sample Tasks
const tasks = [
  { title: 'Welcome to Todo App!', description: 'This is your first task', category_id: 2, priority: 'medium' },
  { title: 'Try dragging tasks', description: 'You can reorder and nest tasks', category_id: 2, priority: 'low' },
  { title: 'Check settings', description: 'Customize theme and layout', category_id: 2, priority: 'low' }
];

const insertTask = db.prepare(`
  INSERT INTO tasks (title, description, category_id, priority, position)
  VALUES (?, ?, ?, ?, ?)
`);

tasks.forEach((task, i) => {
  insertTask.run(task.title, task.description, task.category_id, task.priority, i);
});
console.log('✅ Seeded sample tasks');

console.log('🎉 Seeding completed!');
db.close();
