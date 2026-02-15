-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 009: Add Habit Tracker Schema
-- ═══════════════════════════════════════════════════════════════════════════

-- Add is_habit column to tasks
ALTER TABLE tasks ADD COLUMN is_habit BOOLEAN DEFAULT 0;

-- Create habit_completions table
CREATE TABLE IF NOT EXISTS habit_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  completed_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  UNIQUE(task_id, completed_date)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_habit_completions_task_date ON habit_completions(task_id, completed_date);
CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(completed_date);
