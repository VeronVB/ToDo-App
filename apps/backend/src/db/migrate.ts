import { db } from './client.js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, 'migrations');

console.log('🔄 Running migrations...');

// Create migrations table
db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Get executed migrations
const executed = db.prepare('SELECT filename FROM migrations').all() as { filename: string }[];
const executedFiles = new Set(executed.map(m => m.filename));

// Get migration files
const files = readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort();

// Run pending migrations
for (const file of files) {
  if (executedFiles.has(file)) {
    console.log(`⏭️  Skipping ${file} (already executed)`);
    continue;
  }
  
  console.log(`▶️  Executing ${file}...`);
  const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
  
  try {
    db.exec(sql);
    db.prepare('INSERT INTO migrations (filename) VALUES (?)').run(file);
    console.log(`✅ ${file} executed successfully`);
  } catch (error) {
    console.error(`❌ Error executing ${file}:`, error);
    process.exit(1);
  }
}

console.log('✅ All migrations completed');
db.close();
