-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 012: Advanced Features
-- Task dependencies, templates, saved filters, activity log, reminders
-- ═══════════════════════════════════════════════════════════════════════════

-- Task Dependencies (blocked_by relationship)
CREATE TABLE IF NOT EXISTS task_dependencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  depends_on_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_id) REFERENCES tasks(id) ON DELETE CASCADE,
  UNIQUE(task_id, depends_on_id)
);
CREATE INDEX IF NOT EXISTS idx_task_deps_task ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_depends ON task_dependencies(depends_on_id);

-- Task Templates
CREATE TABLE IF NOT EXISTS task_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  category_id INTEGER,
  recurrence TEXT DEFAULT 'none',
  tags TEXT, -- JSON array of tag names
  subtasks TEXT, -- JSON array of {title, priority} objects
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Saved Filters (Smart Lists)
CREATE TABLE IF NOT EXISTS saved_filters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🔍',
  color TEXT DEFAULT '#666666',
  filter_config TEXT NOT NULL, -- JSON: {priorities:[], categories:[], tags:[], dueDateRange:string, completed:bool}
  position INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Activity Log
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER,
  action TEXT NOT NULL, -- 'created','completed','uncompleted','edited','deleted','moved','dependency_added','dependency_removed'
  details TEXT, -- JSON with change details
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_activity_task ON activity_log(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_log(created_at);

-- Reminders
CREATE TABLE IF NOT EXISTS task_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  remind_at DATETIME NOT NULL,
  reminded BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_reminders_task ON task_reminders(task_id);
CREATE INDEX IF NOT EXISTS idx_reminders_time ON task_reminders(remind_at);

-- Add notes_markdown column to tasks for rich text
ALTER TABLE tasks ADD COLUMN notes_markdown TEXT;

-- Add color to categories for color-coded projects
-- (categories already has 'color' from initial schema, so skip if exists)

-- Add auto_archive_days to settings
ALTER TABLE settings ADD COLUMN auto_archive_days INTEGER DEFAULT 0;

-- Add saved_filters_order to settings (JSON array of filter IDs)
ALTER TABLE settings ADD COLUMN saved_filters_order TEXT DEFAULT '[]';