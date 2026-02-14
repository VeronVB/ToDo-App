import { db } from './db/client.js';

console.log('--- DEBUG START ---');

// 1. Sprawdź czy tagi istnieją
const tags = db.prepare('SELECT * FROM tags WHERE name LIKE ?').all('%sest%');
console.log('TAGI:', tags);

// 2. Sprawdź powiązania
if (tags.length > 0) {
    const tagIds = tags.map((t: any) => t.id).join(',');
    const taskTags = db.prepare(`SELECT * FROM task_tags WHERE tag_id IN (${tagIds})`).all();
    console.log('POWIAZANIA (task_tags):', taskTags);
}

// 3. Symulacja zapytania z tasks.ts
const searchTerm = 'sest';
const term = searchTerm.trim();
const tagTerm = term.startsWith('#') ? term.slice(1) : term;

console.log(`Szukam: term="${term}", tagTerm="${tagTerm}"`);

const sql = `
      SELECT 
        id, title
      FROM tasks 
      WHERE (
        title LIKE ? OR 
        description LIKE ? OR 
        id IN (
            SELECT tt.task_id 
            FROM task_tags tt
            JOIN tags t ON tt.tag_id = t.id
            WHERE t.name LIKE ?
        )
      )
`;

const results = db.prepare(sql).all(`%${term}%`, `%${term}%`, `%${tagTerm}%`);
console.log('WYNIKI ZAPYTANIA SQL:', results);

console.log('--- DEBUG END ---');
