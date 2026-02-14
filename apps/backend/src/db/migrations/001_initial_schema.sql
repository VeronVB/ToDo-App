-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 001: Initial Schema
-- ═══════════════════════════════════════════════════════════════════════════

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  icon TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Priorities
CREATE TABLE IF NOT EXISTS priorities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL UNIQUE,
  color TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT 0,
  priority TEXT DEFAULT 'medium',
  category_id INTEGER,
  parent_id INTEGER,
  position INTEGER DEFAULT 0,
  depth INTEGER DEFAULT 0,
  due_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER DEFAULT 1,
  site_name TEXT DEFAULT 'Todo App',
  language TEXT DEFAULT 'en',
  color_scheme TEXT DEFAULT 'nord',
  layout TEXT DEFAULT 'comfortable',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Time Entries
CREATE TABLE IF NOT EXISTS time_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  duration INTEGER,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON time_entries(task_id);
